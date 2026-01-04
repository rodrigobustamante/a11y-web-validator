import { chromium, Browser, Page } from 'playwright';
import type { A11yAuditResult, A11yIssue } from '@a11y-web-validator/types';
import { config } from '../config';
import AxeBuilder from '@axe-core/playwright';

export class A11yAuditService {
  private browser: Browser | null = null;

  /**
   * Run accessibility audit on the provided URL
   * @param url - The URL to audit
   * @returns Audit results with violations and health score
   */
  async runAudit(url: string): Promise<A11yAuditResult> {
    let page: Page | null = null;
    let context = null;

    try {
      // Launch browser
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--disable-blink-features=AutomationControlled', // Hide automation
        ],
      });

      // Create a browser context (required by AxeBuilder)
      context = await this.browser.newContext({
        // Set a reasonable viewport
        viewport: { width: 1280, height: 720 },
        // Use a real user agent
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
      await page.route('**/*', (route) => {
        const resourceType = route.request().resourceType();
        if (['image', 'font', 'media'].includes(resourceType)) {
          route.abort();
        } else {
          route.continue();
        }
      });

      console.log(`📊 Navigating to: ${url}`);

      // Navigate to the URL
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: config.browserTimeout,
      });

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
      const issues: A11yIssue[] = axeResults.violations.map((violation) => {
        return {
          id: violation.id,
          impact: (violation.impact || 'minor') as A11yIssue['impact'],
          description: violation.description,
          help: violation.help,
          helpUrl: violation.helpUrl,
          tags: violation.tags,
          nodes: violation.nodes.map((node) => {
            // Convert target to string array (handle complex selectors)
            let target: string[];
            if (Array.isArray(node.target)) {
              target = node.target.map((t) => String(t));
            } else {
              target = [String(node.target)];
            }

            return {
              html: node.html,
              target,
              failureSummary: node.failureSummary || '',
            };
          }),
        };
      });

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

      if (this.browser) {
        await this.browser.close().catch(console.error);
        this.browser = null;
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
