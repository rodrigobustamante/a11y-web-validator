import { chromium, Browser, Page } from 'playwright';
import { injectAxe, getViolations } from '@axe-core/playwright';
import type { A11yAuditResult, A11yIssue } from '@a11y-web-validator/types';
import { config } from '../config';

export class A11yAuditService {
  private browser: Browser | null = null;

  /**
   * Run accessibility audit on the provided URL
   * @param url - The URL to audit
   * @returns Audit results with violations and health score
   */
  async runAudit(url: string): Promise<A11yAuditResult> {
    let page: Page | null = null;

    try {
      // Launch browser
      this.browser = await chromium.launch({
        headless: true,
      });

      // Create a new page with optimizations for faster scanning
      page = await this.browser.newPage({
        // Block unnecessary resources for faster scanning
        javaScriptEnabled: true, // Keep JS enabled for dynamic content
      });

      // Set timeout
      page.setDefaultTimeout(config.browserTimeout);

      // Block images, fonts, and media for faster scanning
      await page.route('**/*', (route) => {
        const resourceType = route.request().resourceType();
        if (['image', 'font', 'media', 'stylesheet'].includes(resourceType)) {
          route.abort();
        } else {
          route.continue();
        }
      });

      console.log(`📊 Navigating to: ${url}`);
      
      // Navigate to the URL
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: config.browserTimeout,
      });

      console.log(`🔍 Injecting Axe-core...`);
      
      // Inject axe-core
      await injectAxe(page);

      console.log(`⚡ Running accessibility checks...`);
      
      // Get violations
      const violations = await getViolations(page);

      console.log(`✅ Found ${violations.length} violation types`);

      // Transform violations to our internal format
      const issues: A11yIssue[] = violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact as A11yIssue['impact'],
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        tags: violation.tags,
        nodes: violation.nodes.map((node) => ({
          html: node.html,
          target: node.target,
          failureSummary: node.failureSummary || '',
        })),
      }));

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
        throw new Error(`Failed to audit URL: ${error.message}`);
      }
      
      throw new Error('Failed to audit URL: Unknown error');
    } finally {
      // Always close browser and page
      if (page) {
        await page.close().catch(console.error);
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

