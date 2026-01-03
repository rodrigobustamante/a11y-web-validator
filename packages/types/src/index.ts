/**
 * Shared TypeScript types for A11yScan
 */

/**
 * Represents the impact level of an accessibility issue
 */
export type ImpactLevel = 'minor' | 'moderate' | 'serious' | 'critical';

/**
 * Represents a single accessibility issue node
 */
export interface A11yIssueNode {
  /** The HTML of the element that has the issue */
  html: string;
  /** CSS selector path to the element */
  target: string[];
  /** Human-readable summary of what failed */
  failureSummary: string;
}

/**
 * Represents a single accessibility issue found during audit
 */
export interface A11yIssue {
  /** Unique identifier for the issue type (e.g., 'color-contrast') */
  id: string;
  /** Severity level of the issue */
  impact: ImpactLevel;
  /** Detailed description of what the issue is */
  description: string;
  /** Human-readable help text */
  help: string;
  /** URL to documentation about the issue */
  helpUrl: string;
  /** WCAG tags and categories */
  tags: string[];
  /** Array of DOM nodes that have this issue */
  nodes: A11yIssueNode[];
}

/**
 * Breakdown of issues grouped by impact level
 */
export interface IssuesByImpact {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
}

/**
 * Complete result of an accessibility audit
 */
export interface A11yAuditResult {
  /** The URL that was audited */
  url: string;
  /** ISO timestamp of when the audit was run */
  timestamp: string;
  /** Overall health score (0-100, where 100 is perfect) */
  healthScore: number;
  /** Total number of unique issue types found */
  totalIssues: number;
  /** Detailed list of all issues */
  issues: A11yIssue[];
  /** Count of issues grouped by severity */
  issuesByImpact: IssuesByImpact;
}

/**
 * API response wrapper for successful responses
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

/**
 * API response wrapper for error responses
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

/**
 * Generic API response type
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Request body for audit endpoint
 */
export interface AuditRequest {
  url: string;
}

