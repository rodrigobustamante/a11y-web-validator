import { test } from 'node:test';
import assert from 'node:assert/strict';
import { auditResultSchema } from '../src/validators/pdf.validator';
import { buildIssues } from '../src/services/a11y-audit.service';
import { PdfGeneratorService } from '../src/services/pdf-generator.service';

const validResult = () => ({
  url: 'https://example.com/',
  timestamp: '2025-01-01T00:00:00.000Z',
  healthScore: 90,
  totalIssues: 1,
  issuesByImpact: { critical: 0, serious: 1, moderate: 0, minor: 0 },
  issues: [
    {
      id: 'color-contrast',
      impact: 'serious',
      description: 'desc',
      help: 'help',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/color-contrast',
      tags: ['wcag2aa'],
      nodes: [{ html: '<p>x</p>', target: ['p'], failureSummary: 'fix it' }],
    },
  ],
});

test('pdf schema accepts a valid result', () => {
  assert.equal(auditResultSchema.safeParse(validResult()).success, true);
});

test('pdf schema rejects javascript: helpUrl', () => {
  const data = validResult();
  data.issues[0].helpUrl = 'javascript:alert(1)';
  assert.equal(auditResultSchema.safeParse(data).success, false);
});

test('pdf schema rejects non-http url', () => {
  const data = validResult();
  data.url = 'file:///etc/passwd';
  assert.equal(auditResultSchema.safeParse(data).success, false);
});

test('pdf schema rejects oversized arrays', () => {
  const tooManyIssues = validResult();
  tooManyIssues.issues = Array.from({ length: 201 }, () => validResult().issues[0]);
  assert.equal(auditResultSchema.safeParse(tooManyIssues).success, false);

  const tooManyNodes = validResult();
  tooManyNodes.issues[0].nodes = Array.from({ length: 101 }, () => validResult().issues[0].nodes[0]);
  assert.equal(auditResultSchema.safeParse(tooManyNodes).success, false);

  const tooManyTags = validResult();
  tooManyTags.issues[0].tags = Array.from({ length: 51 }, () => 'a');
  assert.equal(auditResultSchema.safeParse(tooManyTags).success, false);
});

test('generateReportHtml escapes malicious values', () => {
  const payload = '"><script>alert(1)</script><iframe src=x></iframe>';
  const html = new PdfGeneratorService().generateReportHtml({
    url: `https://example.com/${payload}`,
    timestamp: '2025-01-01T00:00:00.000Z',
    healthScore: 50,
    totalIssues: 1,
    issuesByImpact: { critical: 1, serious: 0, moderate: 0, minor: 0 },
    issues: [
      {
        id: payload,
        impact: 'critical',
        description: payload,
        help: payload,
        helpUrl: `https://example.com/${payload}`,
        tags: [payload],
        nodes: [{ html: payload, target: [payload], failureSummary: payload }],
      },
    ],
  });
  assert.ok(!/<script/i.test(html), 'raw <script found');
  assert.ok(!/<iframe/i.test(html), 'raw <iframe found');
  assert.ok(html.includes('&lt;script&gt;'));
});

test('pdf schema rejects markup characters in url', () => {
  const data = validResult();
  data.url = 'https://a.com/"><script>x</script>';
  assert.equal(auditResultSchema.safeParse(data).success, false);
});

test('buildIssues output stays valid under the PDF schema', () => {
  const big = 'x'.repeat(10000);
  const violation = {
    id: big, impact: null, description: big, help: big,
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.8/color-contrast',
    tags: Array.from({ length: 80 }, () => big),
    nodes: Array.from({ length: 150 }, () => ({
      html: big, target: Array.from({ length: 30 }, () => big), failureSummary: big,
    })),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const issues = buildIssues(Array.from({ length: 250 }, () => violation) as any);
  const result = {
    url: 'https://example.com/', timestamp: new Date().toISOString(), healthScore: 0,
    totalIssues: issues.length,
    issuesByImpact: { critical: 0, serious: 0, moderate: 0, minor: issues.length },
    issues,
  };
  const parsed = auditResultSchema.safeParse(result);
  assert.equal(parsed.success, true, parsed.success ? '' : JSON.stringify(parsed.error.errors.slice(0, 3)));
  assert.ok(issues[0].description.endsWith('…'));
});
