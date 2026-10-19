import { chromium, Browser, Page } from 'playwright';
import type { A11yAuditResult, A11yIssue } from '@a11y-web-validator/types';
import { config } from '../config';
import AxeBuilder from '@axe-core/playwright';
import {
  assertPublicUrl,
  assertSafeUrlSyntax,
  UnsafeUrlError,
} from '../security/url-guard';
import { startEgressProxy, EgressProxy } from '../security/egress-proxy';
import { PDF_LIMITS } from '../validators/pdf.validator';
import { browserLimiter, ServiceBusyError } from '../security/concurrency';

const BLOCKED_URL_MESSAGE = 'URL points to a private or reserved address';

/**
 * Cut a string to a maximum length, ending with an ellipsis when truncated
 */
export function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

type AxeViolations = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'];

/**
 * Map axe violations to the internal format, capped to the PDF export limits
 * @param violations - Raw axe-core violations
 */
export function buildIssues(violations: AxeViolations): A11yIssue[] {
  return violations.slice(0, PDF_LIMITS.issues).map((violation) => {
    return {
      id: truncate(violation.id, PDF_LIMITS.id),
      impact: (violation.impact || 'minor') as A11yIssue['impact'],
      description: truncate(violation.description, PDF_LIMITS.description),
      help: truncate(violation.help, PDF_LIMITS.help),
      helpUrl: violation.helpUrl,
      tags: violation.tags
        .slice(0, PDF_LIMITS.tags)
        .map((t) => truncate(t, PDF_LIMITS.tag)),
      nodes: violation.nodes.slice(0, PDF_LIMITS.nodes).map((node) => {
        // Convert target to string array (handle complex selectors)
        let target: string[];
        if (Array.isArray(node.target)) {
          target = node.target.map((t) => String(t));
        } else {
          target = [String(node.target)];
        }

        return {
          html: truncate(node.html, PDF_LIMITS.html),
          target: target
            .slice(0, PDF_LIMITS.targets)
            .map((t) => truncate(t, PDF_LIMITS.target)),
          failureSummary: truncate(
            node.failureSummary || '',
            PDF_LIMITS.failureSummary
          ),
        };
      }),
    };
  });
}

export class A11yAuditService {
  /**
   * Run accessibility audit on the provided URL
   * @param url - The URL to audit
   * @returns Audit results with violations and health score
   */
  async runAudit(url: string): Promise<A11yAuditResult> {
    let browser: Browser | null = null;
    let page: Page | null = null;
    let context = null;
    let acquired = false;
    let proxy: EgressProxy | null = null;

    try {
      // Reject private/reserved destinations before doing any work
      await assertPublicUrl(url);

      // Limit concurrent Chromium instances (shared with PDF generation)
      if (!browserLimiter.tryAcquire()) {
        throw new ServiceBusyError();
      }
      acquired = true;

      // Egress proxy enforces the policy at connect time (covers redirects and DNS rebinding).
      // Playwright launches Chromium with <-loopback> in the bypass list, so loopback is proxied too.
      proxy = await startEgressProxy();

      // Launch browser
      browser = await chromium.launch({
        headless: true,
        proxy: { server: proxy.url },
        args: [
          '--disable-blink-features=AutomationControlled', // Hide automation
          '--force-webrtc-ip-handling-policy=disable_non_proxied_udp', // No UDP outside the proxy
        ],
      });

      // Create a browser context (required by AxeBuilder)
      context = await browser.newContext({
        // Set a reasonable viewport
        viewport: { width: 1280, height: 720 },
        // Use a real user agent
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        // Service workers could bypass request interception
        serviceWorkers: 'block',
        // Add common headers
        extraHTTPHeaders: {
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
        },
      });

      // Create a new page from the context
      page = await context.newPage();

      // Set timeout
      page.setDefaultTimeout(config.browserTimeout);

      // Block images, fonts, and media for faster scanning
      // Note: Keep stylesheets to avoid triggering bot detection
      // Every request (including redirects and subresources) must target a public address
      const originCache = new Map<string, Promise<boolean>>();
      const isAllowedOrigin = (requestUrl: string): Promise<boolean> => {
        const origin = new URL(requestUrl).origin;
        let cached = originCache.get(origin);
        if (!cached) {
          cached = assertPublicUrl(requestUrl).then(
            () => true,
            () => false
          );
          originCache.set(origin, cached);
        }
        return cached;
      };

      await page.route('**/*', async (route) => {
        try {
          const request = route.request();
          const requestUrl = request.url();

          let protocol: string;
          try {
            protocol = new URL(requestUrl).protocol;
          } catch {
            await route.abort('blockedbyclient');
            return;
          }

          if (protocol === 'data:' || protocol === 'blob:') {
            await route.continue();
            return;
          }

          if (protocol !== 'http:' && protocol !== 'https:') {
            await route.abort('blockedbyclient');
            return;
          }

          if (!(await isAllowedOrigin(requestUrl))) {
            console.warn(
              `🚫 Blocked request to non-public address: ${requestUrl}`
            );
            await route.abort('blockedbyclient');
            return;
          }

          if (['image', 'font', 'media'].includes(request.resourceType())) {
            await route.abort();
          } else {
            await route.continue();
          }
        } catch {
          // Route may already be handled or the page closed
        }
      });

      // Close every WebSocket, they are not needed for an audit
      await page.routeWebSocket('**/*', (ws) => {
        ws.close().catch(() => undefined);
      });

      console.log(`📊 Navigating to: ${url}`);

      // Navigate to the URL
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: config.browserTimeout,
      });

      // Defense in depth: every redirect hop must pass the static URL checks
      for (
        let hop = response?.request().redirectedFrom() ?? null;
        hop;
        hop = hop.redirectedFrom()
      ) {
        assertSafeUrlSyntax(hop.url());
      }

      // Destination blocked by the egress proxy
      if (response && response.headers()['x-egress-blocked']) {
        throw new UnsafeUrlError(BLOCKED_URL_MESSAGE);
      }

      // Check if the page loaded successfully
      if (!response || response.status() >= 400) {
        const status = response?.status();
        let errorMessage = `HTTP ${status || 'unknown'}`;

        if (status === 403) {
          errorMessage =
            'Site blocked automated access (HTTP 403). This site has anti-bot protection. Try a different URL.';
        } else if (status === 404) {
          errorMessage = 'Page not found (HTTP 404). Check the URL is correct.';
        } else if (status && status >= 500) {
          errorMessage = `Server error (HTTP ${status}). The site may be down.`;
        } else if (status && status >= 400) {
          errorMessage = `Access denied (HTTP ${status}). Check the URL is accessible.`;
        }

        throw new Error(errorMessage);
      }

      // Check for common bot-blocking indicators
      const pageContent = await page.content();
      if (
        (pageContent.includes('security') && pageContent.includes('blocked')) ||
        pageContent.includes('access denied') ||
        pageContent.includes('captcha')
      ) {
        throw new Error(
          'Site blocked automated access. Try a different URL or the site may have anti-bot protection.'
        );
      }

      console.log(`⚡ Running accessibility checks with Axe-core...`);

      // Run axe accessibility scan with enhanced color contrast checks
      const axeResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
        .analyze();

      console.log(`✅ Found ${axeResults.violations.length} violation types`);

      // Transform violations to our internal format
      // Results are capped so they always pass the PDF export schema
      const issues = buildIssues(axeResults.violations);

      // Calculate health score (0-100)
      const healthScore = this.calculateHealthScore(issues);

      // Group issues by impact level
      const issuesByImpact = this.groupIssuesByImpact(issues);

      return {
        url,
        timestamp: new Date().toISOString(),
        healthScore,
        totalIssues: issues.length,
        issues,
        issuesByImpact,
      };
    } catch (error) {
      console.error('❌ Audit failed:', error);

      if (
        error instanceof UnsafeUrlError ||
        error instanceof ServiceBusyError
      ) {
        throw error;
      }

      if (
        error instanceof Error &&
        (error.message.includes('net::ERR_BLOCKED_BY_CLIENT') ||
          (proxy &&
            proxy.blockedCount() > 0 &&
            /net::ERR_(TUNNEL|PROXY)_/.test(error.message)))
      ) {
        throw new UnsafeUrlError(BLOCKED_URL_MESSAGE);
      }

      if (error instanceof Error) {
        // Provide more helpful error messages
        let errorMessage = error.message;

        if (error.message.includes('net::ERR_')) {
          errorMessage =
            'Network error: Could not reach the URL. Check if the site is accessible.';
        } else if (error.message.includes('Timeout')) {
          errorMessage =
            'Timeout: The site took too long to load. Try again later.';
        } else if (
          error.message.includes('blocked') ||
          error.message.includes('captcha')
        ) {
          errorMessage =
            'This site blocks automated access. Try testing a different URL.';
        }

        throw new Error(`Failed to audit URL: ${errorMessage}`);
      }

      throw new Error('Failed to audit URL: Unknown error');
    } finally {
      // Always close browser, context and page
      if (page) {
        await page.close().catch(console.error);
      }

      if (context) {
        await context.close().catch(console.error);
      }

      if (browser) {
        await browser.close().catch(console.error);
      }

      if (proxy) {
        await proxy.close().catch(console.error);
      }

      if (acquired) {
        browserLimiter.release();
      }
    }
  }

  /**
   * Calculate a health score based on the severity and count of issues
   * @param issues - Array of accessibility issues
   * @returns Score from 0-100 (100 being perfect)
   */
  private calculateHealthScore(issues: A11yIssue[]): number {
    if (issues.length === 0) return 100;

    // Weight penalties by impact level
    const penalties = {
      critical: 10,
      serious: 5,
      moderate: 2,
      minor: 1,
    };

    let totalPenalty = 0;

    issues.forEach((issue) => {
      const nodeCount = issue.nodes.length;
      const penalty = penalties[issue.impact] || 1;
      totalPenalty += penalty * nodeCount;
    });

    // Cap the penalty at 100 and convert to a score
    const cappedPenalty = Math.min(totalPenalty, 100);
    return Math.round(100 - cappedPenalty);
  }

  /**
   * Group issues by their impact level
   * @param issues - Array of accessibility issues
   * @returns Object with issues grouped by impact
   */
  private groupIssuesByImpact(issues: A11yIssue[]) {
    return {
      critical: issues.filter((i) => i.impact === 'critical').length,
      serious: issues.filter((i) => i.impact === 'serious').length,
      moderate: issues.filter((i) => i.impact === 'moderate').length,
      minor: issues.filter((i) => i.impact === 'minor').length,
    };
  }
}
