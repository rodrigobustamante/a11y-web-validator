import type { A11yAuditResult } from '@a11y-web-validator/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Export audit results to PDF
 */
export async function exportToPdf(result: A11yAuditResult): Promise<void> {
  const response = await fetch(`${API_URL}/api/audit/export-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(result),
  });

  if (!response.ok) {
    throw new Error('Failed to generate PDF');
  }

  // Get the PDF blob
  const blob = await response.blob();

  // Create download link
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  // Generate filename
  const urlHostname = new URL(result.url).hostname;
  const timestamp = new Date(result.timestamp).toISOString().split('T')[0];
  a.download = `a11y-report-${urlHostname}-${timestamp}.pdf`;

  // Trigger download
  document.body.appendChild(a);
  a.click();

  // Cleanup
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
