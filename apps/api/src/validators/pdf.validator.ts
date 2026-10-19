import { z } from 'zod';

/** Size limits for an audit result accepted by the PDF export */
export const PDF_LIMITS = {
  url: 2048,
  issues: 200,
  id: 200,
  description: 2000,
  help: 500,
  helpUrl: 2048,
  tags: 50,
  tag: 100,
  nodes: 100,
  html: 5000,
  targets: 20,
  target: 1000,
  failureSummary: 5000,
} as const;

// Reject whitespace and characters that could break out of an HTML attribute
const SAFE_URL_CHARS = /^[^\s<>"'`\\]+$/;

const httpUrl = z
  .string()
  .max(PDF_LIMITS.url)
  .url({ message: 'Invalid URL format' })
  .regex(SAFE_URL_CHARS, { message: 'URL contains invalid characters' })
  .refine(
    (url) => {
      try {
        return ['http:', 'https:'].includes(new URL(url).protocol);
      } catch {
        return false;
      }
    },
    { message: 'URL must use HTTP or HTTPS protocol' }
  );

const httpsUrl = z
  .string()
  .max(PDF_LIMITS.helpUrl)
  .url({ message: 'Invalid URL format' })
  .regex(SAFE_URL_CHARS, { message: 'URL contains invalid characters' })
  .refine(
    (url) => {
      try {
        return new URL(url).protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'URL must use HTTPS protocol' }
  );

const nodeSchema = z.object({
  html: z.string().max(PDF_LIMITS.html),
  target: z.array(z.string().max(PDF_LIMITS.target)).max(PDF_LIMITS.targets),
  failureSummary: z.string().max(PDF_LIMITS.failureSummary),
});

const issueSchema = z.object({
  id: z.string().max(PDF_LIMITS.id),
  impact: z.enum(['critical', 'serious', 'moderate', 'minor']),
  description: z.string().max(PDF_LIMITS.description),
  help: z.string().max(PDF_LIMITS.help),
  helpUrl: httpsUrl,
  tags: z.array(z.string().max(PDF_LIMITS.tag)).max(PDF_LIMITS.tags),
  nodes: z.array(nodeSchema).max(PDF_LIMITS.nodes),
});

/**
 * Validator schema for the audit result sent to the PDF export endpoint
 */
export const auditResultSchema = z.object({
  url: httpUrl,
  timestamp: z.string().datetime(),
  healthScore: z.number().int().min(0).max(100),
  totalIssues: z.number().int().min(0),
  issuesByImpact: z.object({
    critical: z.number().int().min(0),
    serious: z.number().int().min(0),
    moderate: z.number().int().min(0),
    minor: z.number().int().min(0),
  }),
  issues: z.array(issueSchema).max(PDF_LIMITS.issues),
});

export type AuditResultInput = z.infer<typeof auditResultSchema>;
