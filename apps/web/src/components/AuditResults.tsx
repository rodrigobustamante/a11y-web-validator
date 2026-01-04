'use client';

import { useState } from 'react';
import type { A11yAuditResult } from '@a11y-web-validator/types';
import { exportToPdf } from '@/lib/pdf';

interface AuditResultsProps {
  result: A11yAuditResult;
}

export function AuditResults({ result }: AuditResultsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const handleExportPdf = async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      await exportToPdf(result);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      setExportError('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'serious':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'minor':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
      {/* Export Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleExportPdf}
          disabled={isExporting}
          className="btn-primary flex items-center gap-2"
          aria-label="Export report to PDF"
        >
          {isExporting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Generating PDF...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export to PDF
            </>
          )}
        </button>
      </div>

      {exportError && (
        <div
          className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300 text-sm"
          role="alert"
        >
          {exportError}
        </div>
      )}

      {/* Health Score */}
      <div className={`card border-2 ${getScoreColor(result.healthScore)}`}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 dark:text-white">
            Accessibility Health Score
          </h2>
          <div className="text-6xl font-bold mb-4">
            {result.healthScore}
            <span className="text-3xl">/100</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Scanned:{' '}
            <span className="font-mono text-gray-800 dark:text-gray-200">
              {result.url}
            </span>
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {new Date(result.timestamp).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Issues Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-500 dark:text-red-400">
              {result.issuesByImpact.critical}
            </div>
            <div className="text-sm text-red-600 dark:text-red-400 font-medium">
              Critical
            </div>
          </div>
        </div>

        <div className="card bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-800">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-500 dark:text-orange-400">
              {result.issuesByImpact.serious}
            </div>
            <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">
              Serious
            </div>
          </div>
        </div>

        <div className="card bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-800">
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-500 dark:text-amber-400">
              {result.issuesByImpact.moderate}
            </div>
            <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              Moderate
            </div>
          </div>
        </div>

        <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-500 dark:text-blue-400">
              {result.issuesByImpact.minor}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              Minor
            </div>
          </div>
        </div>
      </div>

      {/* Issues List */}
      {result.issues.length > 0 ? (
        <div className="card">
          <h3 className="text-xl font-bold mb-4 dark:text-white">
            Issues Found ({result.totalIssues})
          </h3>
          <div className="space-y-4">
            {result.issues.map((issue) => {
              const isExpanded = expandedNodes.has(issue.id);
              const displayNodes = isExpanded
                ? issue.nodes
                : issue.nodes.slice(0, 3);
              const hasMore = issue.nodes.length > 3;

              return (
                <details
                  key={issue.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-md p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <summary className="cursor-pointer font-medium flex items-center gap-3 dark:text-white">
                    <span
                      className={`px-2 py-1 text-xs rounded border ${getImpactColor(
                        issue.impact
                      )}`}
                    >
                      {issue.impact.toUpperCase()}
                    </span>
                    <span className="flex-1">{issue.help}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {issue.nodes.length} instance
                      {issue.nodes.length !== 1 ? 's' : ''}
                    </span>
                  </summary>

                  <div className="mt-4 pl-4 space-y-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {issue.description}
                    </p>

                    <a
                      href={issue.helpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:text-accent-600 inline-flex items-center gap-1 transition-colors"
                    >
                      Learn more
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>

                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold dark:text-gray-200">
                        Affected elements ({issue.nodes.length}):
                      </h4>
                      {displayNodes.map((node, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded border border-gray-200 dark:border-gray-700"
                        >
                          <code className="text-xs text-gray-800 dark:text-gray-200 break-all">
                            {node.html}
                          </code>
                          {node.failureSummary && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                              {node.failureSummary}
                            </p>
                          )}
                        </div>
                      ))}
                      {hasMore && (
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedNodes);
                            if (isExpanded) {
                              newExpanded.delete(issue.id);
                            } else {
                              newExpanded.add(issue.id);
                            }
                            setExpandedNodes(newExpanded);
                          }}
                          className="text-sm text-primary-600 hover:text-accent-600 font-medium flex items-center gap-1 mt-2 transition-colors"
                        >
                          {isExpanded ? (
                            <>
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 15l7-7 7 7"
                                />
                              </svg>
                              Show less
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                              Show {issue.nodes.length - 3} more
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-green-600 dark:text-green-500 mb-2">
              No accessibility issues found!
            </h3>
            <p className="text-green-600 dark:text-green-500">
              This page meets all automated WCAG accessibility checks.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
