import { chromium } from 'playwright';
import type { A11yAuditResult } from '@a11y-web-validator/types';
import { config } from '../config';

export class PdfGeneratorService {
  /**
   * Escape HTML characters to prevent rendering issues
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Generate a PDF report from audit results
   */
  async generatePdf(result: A11yAuditResult): Promise<Buffer> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Generate HTML for the report
      const html = this.generateReportHtml(result);

      // Set content and wait for it to render
      await page.setContent(html, {
        waitUntil: 'networkidle',
        timeout: config.browserTimeout,
      });

      // Generate PDF
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          bottom: '20px',
          left: '20px',
          right: '20px',
        },
      });

      return Buffer.from(pdf);
    } finally {
      await page.close();
      await context.close();
      await browser.close();
    }
  }

  /**
   * Generate HTML template for the PDF report
   */
  private generateReportHtml(result: A11yAuditResult): string {
    const { url, timestamp, healthScore, totalIssues, issuesByImpact, issues } =
      result;

    const getScoreColor = (score: number) => {
      if (score >= 90) return '#10b981';
      if (score >= 70) return '#f59e0b';
      if (score >= 50) return '#f97316';
      return '#ef4444';
    };

    const getImpactColor = (impact: string) => {
      switch (impact) {
        case 'critical':
          return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
        case 'serious':
          return { bg: '#fed7aa', text: '#9a3412', border: '#fdba74' };
        case 'moderate':
          return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
        case 'minor':
          return { bg: '#dbeafe', text: '#1e3a8a', border: '#93c5fd' };
        default:
          return { bg: '#f3f4f6', text: '#1f2937', border: '#d1d5db' };
      }
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>A11yScan Report - ${url}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      padding: 20px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .header h1 {
      font-size: 32px;
      color: #0ea5e9;
      margin-bottom: 10px;
    }
    
    .header p {
      color: #6b7280;
      font-size: 14px;
    }
    
    .score-section {
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
      color: white;
      padding: 30px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 30px;
    }
    
    .score-value {
      font-size: 72px;
      font-weight: bold;
      color: ${getScoreColor(healthScore)};
      background: white;
      display: inline-block;
      padding: 20px 40px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .score-label {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 10px;
    }
    
    .url-info {
      background: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 13px;
    }
    
    .url-info strong {
      color: #374151;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    
    .summary-card {
      padding: 20px;
      border-radius: 6px;
      text-align: center;
      border: 2px solid;
    }
    
    .summary-card.critical {
      background: #fee2e2;
      border-color: #fca5a5;
      color: #991b1b;
    }
    
    .summary-card.serious {
      background: #fed7aa;
      border-color: #fdba74;
      color: #9a3412;
    }
    
    .summary-card.moderate {
      background: #fef3c7;
      border-color: #fde68a;
      color: #92400e;
    }
    
    .summary-card.minor {
      background: #dbeafe;
      border-color: #93c5fd;
      color: #1e3a8a;
    }
    
    .summary-card .count {
      font-size: 36px;
      font-weight: bold;
      display: block;
      margin-bottom: 5px;
    }
    
    .summary-card .label {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .issues-section {
      margin-top: 30px;
    }
    
    .section-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
      color: #111827;
    }
    
    .issue {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 20px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    
    .issue-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .impact-badge {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      border: 1px solid;
    }
    
    .issue-title {
      font-size: 16px;
      font-weight: 600;
      flex: 1;
      color: #111827;
    }
    
    .issue-description {
      color: #4b5563;
      font-size: 13px;
      margin-bottom: 10px;
      line-height: 1.6;
    }
    
    .issue-help-url {
      font-size: 12px;
      color: #0ea5e9;
      text-decoration: none;
      display: block;
      margin-bottom: 15px;
    }
    
    .issue-nodes {
      background: #f9fafb;
      padding: 15px;
      border-radius: 4px;
      margin-top: 15px;
    }
    
    .node-title {
      font-size: 12px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 10px;
    }
    
    .node {
      background: white;
      border: 1px solid #e5e7eb;
      padding: 10px;
      margin-bottom: 10px;
      border-radius: 4px;
    }
    
    .node-html {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #1f2937;
      word-break: break-all;
      margin-bottom: 8px;
    }
    
    .node-summary {
      font-size: 11px;
      color: #6b7280;
      font-style: italic;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
    
    .no-issues {
      background: #d1fae5;
      border: 2px solid #6ee7b7;
      color: #065f46;
      padding: 40px;
      text-align: center;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .no-issues-icon {
      font-size: 48px;
      margin-bottom: 15px;
    }
    
    .no-issues-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>A11yScan</h1>
    <p>Web Accessibility Audit Report</p>
  </div>

  <div class="score-section">
    <div class="score-label">Accessibility Health Score</div>
    <div class="score-value">${healthScore}/100</div>
  </div>

  <div class="url-info">
    <div><strong>URL:</strong> ${url}</div>
    <div><strong>Scan Date:</strong> ${new Date(timestamp).toLocaleString()}</div>
    <div><strong>Total Issues:</strong> ${totalIssues}</div>
  </div>

  <div class="summary-grid">
    <div class="summary-card critical">
      <span class="count">${issuesByImpact.critical}</span>
      <span class="label">Critical</span>
    </div>
    <div class="summary-card serious">
      <span class="count">${issuesByImpact.serious}</span>
      <span class="label">Serious</span>
    </div>
    <div class="summary-card moderate">
      <span class="count">${issuesByImpact.moderate}</span>
      <span class="label">Moderate</span>
    </div>
    <div class="summary-card minor">
      <span class="count">${issuesByImpact.minor}</span>
      <span class="label">Minor</span>
    </div>
  </div>

  ${
    issues.length > 0
      ? `
  <div class="issues-section">
    <h2 class="section-title">Issues Found (${totalIssues})</h2>
    ${issues
      .map((issue) => {
        const colors = getImpactColor(issue.impact);
        return `
      <div class="issue">
        <div class="issue-header">
          <span class="impact-badge" style="background: ${colors.bg}; color: ${colors.text}; border-color: ${colors.border}">
            ${issue.impact}
          </span>
          <span class="issue-title">${this.escapeHtml(issue.help)}</span>
        </div>
        <p class="issue-description">${this.escapeHtml(issue.description)}</p>
        <a href="${issue.helpUrl}" class="issue-help-url">${issue.helpUrl}</a>
        
        <div class="issue-nodes">
          <div class="node-title">Affected Elements (${issue.nodes.length}):</div>
          ${issue.nodes
            .map(
              (node) => `
            <div class="node">
              <div class="node-html">${this.escapeHtml(node.html)}</div>
              ${node.failureSummary ? `<div class="node-summary">${this.escapeHtml(node.failureSummary)}</div>` : ''}
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
      })
      .join('')}
  </div>
  `
      : `
  <div class="no-issues">
    <div class="no-issues-icon">✅</div>
    <div class="no-issues-title">No Accessibility Issues Found!</div>
    <p>This page meets all automated WCAG accessibility checks.</p>
  </div>
  `
  }

  <div class="footer">
    <p>Generated by A11yScan - Web Accessibility Validator</p>
    <p>Powered by Playwright and Axe-core</p>
  </div>
</body>
</html>
    `;
  }
}
