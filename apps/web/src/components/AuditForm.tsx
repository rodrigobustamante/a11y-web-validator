'use client';

import { useState, FormEvent } from 'react';
import { useAudit } from '@/hooks/useAudit';
import { AuditResults } from './AuditResults';

export function AuditForm() {
  const [url, setUrl] = useState('');
  const audit = useAudit();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    audit.mutate(url);
  };

  const isValidUrl = (value: string) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white dark:bg-dark-card rounded-xl shadow-xl p-8 transition-colors border border-gray-200 dark:border-dark-border">
        <div className="mb-6">
          <label
            htmlFor="url-input"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Enter URL to audit
          </label>
          <input
            id="url-input"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-3 border border-gray-300 dark:border-dark-border rounded-lg focus-ring bg-white dark:bg-dark-bg text-gray-900 dark:text-[#e5ecf6] placeholder-gray-400 dark:placeholder-gray-500"
            aria-describedby="url-help"
            disabled={audit.isPending}
            required
          />
          <p id="url-help" className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Enter a valid URL to scan for accessibility issues
          </p>
        </div>

        <button
          type="submit"
          className="btn-primary w-full py-3 text-lg"
          disabled={audit.isPending || !isValidUrl(url)}
          aria-label="Start accessibility scan"
        >
          {audit.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
              Scanning...
            </span>
          ) : (
            'Scan Website'
          )}
        </button>

        {audit.isError && (
          <div
            className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md"
            role="alert"
          >
            <h3 className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">
              Error scanning website
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300">
              {audit.error instanceof Error ? audit.error.message : 'An error occurred'}
            </p>
          </div>
        )}
      </form>

      {audit.isSuccess && audit.data && (
        <AuditResults result={audit.data} />
      )}
    </div>
  );
}
