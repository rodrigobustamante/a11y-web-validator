import type { A11yAuditResult, AuditRequest } from '@a11y-web-validator/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Run an accessibility audit on a URL
 */
export async function runAudit(url: string): Promise<A11yAuditResult> {
  const response = await fetch(`${API_URL}/api/audit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url } as AuditRequest),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to audit URL' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}
