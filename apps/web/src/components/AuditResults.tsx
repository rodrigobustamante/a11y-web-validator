'use client';

import { useMemo, useRef, useState } from 'react';
import type { A11yAuditResult, ImpactLevel } from '@a11y-web-validator/types';
import { exportToPdf } from '@/lib/pdf';
import {
  IMPACT_ORDER,
  countAffectedNodes,
  filterIssues,
  groupIssuesByImpact,
  pluralize,
} from '@/lib/issues';
import { HealthScoreCard } from './results/HealthScoreCard';
import { ImpactFilter } from './results/ImpactFilter';
import { IssueGroups } from './results/IssueGroups';

interface AuditResultsProps {
  result: A11yAuditResult;
}

export function AuditResults({ result }: AuditResultsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [selectedImpacts, setSelectedImpacts] = useState<Set<ImpactLevel>>(
    () => new Set(IMPACT_ORDER)
  );
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredIssues = useMemo(
    () => filterIssues(result.issues, { impacts: selectedImpacts, query }),
    [result.issues, selectedImpacts, query]
  );
  const groups = useMemo(
    () => groupIssuesByImpact(filteredIssues),
    [filteredIssues]
  );
  const shareContext = useMemo(
    () => ({ pageUrl: result.url, scannedAt: result.timestamp }),
    [result.url, result.timestamp]
  );
  const isFiltered =
    query.trim() !== '' || selectedImpacts.size !== IMPACT_ORDER.length;

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

  const toggleImpact = (impact: ImpactLevel) => {
    setSelectedImpacts((current) => {
      const next = new Set(current);
      if (next.has(impact)) {
        next.delete(impact);
      } else {
        next.add(impact);
      }
      return next;
    });
  };

  const resetFilters = () => {
    setSelectedImpacts(new Set(IMPACT_ORDER));
    setQuery('');
    // Both "Clear filters" buttons unmount once filters reset; keep focus in place
    searchInputRef.current?.focus();
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

      <HealthScoreCard
        score={result.healthScore}
        url={result.url}
        timestamp={result.timestamp}
        affectedNodes={countAffectedNodes(result.issues)}
      />

      {result.issues.length > 0 ? (
        <section className="space-y-4" aria-labelledby="issues-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2
              id="issues-heading"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              Issues Found ({result.totalIssues})
            </h2>
            {isFiltered && (
              <button
                type="button"
                onClick={resetFilters}
                className="btn-tertiary rounded text-sm focus-ring"
              >
                Clear filters
              </button>
            )}
          </div>

          <ImpactFilter
            counts={result.issuesByImpact}
            selected={selectedImpacts}
            onToggle={toggleImpact}
          />

          <div>
            <label
              htmlFor="issue-search"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Search issues
            </label>
            <input
              id="issue-search"
              ref={searchInputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. contrast, alt text, landmark"
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg focus-ring bg-white dark:bg-dark-bg text-gray-900 dark:text-[#e5ecf6] placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          <p
            className="text-sm text-gray-600 dark:text-gray-400"
            role="status"
            aria-live="polite"
          >
            Showing {filteredIssues.length} of{' '}
            {pluralize(result.issues.length, 'issue')}
          </p>

          {groups.length > 0 ? (
            <IssueGroups groups={groups} shareContext={shareContext} />
          ) : (
            <div className="card text-center py-8">
              <p className="text-gray-700 dark:text-gray-300">
                No issues match the current filters.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="btn-secondary mt-4"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>
      ) : (
        <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="text-center py-8">
            <div className="text-5xl mb-4" aria-hidden="true">
              ✅
            </div>
            <h2 className="text-2xl font-bold text-green-700 dark:text-green-500 mb-2">
              No accessibility issues found!
            </h2>
            <p className="text-green-700 dark:text-green-500">
              This page meets all automated WCAG accessibility checks.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
