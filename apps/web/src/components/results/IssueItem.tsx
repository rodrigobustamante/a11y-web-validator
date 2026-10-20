import { useState } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import clsx from 'clsx';
import type { A11yIssue } from '@a11y-web-validator/types';
import { getWcagCriteria, pluralize } from '@/lib/issues';
import { CodeSnippet } from './CodeSnippet';
import { IMPACT_STYLES } from './impact-styles';

const VISIBLE_NODES = 3;

interface IssueItemProps {
  issue: A11yIssue;
}

export function IssueItem({ issue }: IssueItemProps) {
  const [showAll, setShowAll] = useState(false);
  const style = IMPACT_STYLES[issue.impact];
  const criteria = getWcagCriteria(issue.tags);
  const nodes = showAll ? issue.nodes : issue.nodes.slice(0, VISIBLE_NODES);
  const hiddenCount = issue.nodes.length - VISIBLE_NODES;
  const nodesListId = `${issue.id}-nodes`;

  return (
    <Accordion.Item
      value={issue.id}
      className="rounded-md border border-gray-200 dark:border-dark-border"
    >
      <Accordion.Header asChild>
        <h4>
          <Accordion.Trigger className="group flex w-full items-center gap-3 rounded-md p-4 text-left font-medium text-gray-900 hover:bg-gray-50 focus-ring dark:text-white dark:hover:bg-white/5">
            <span
              className={clsx(
                'shrink-0 rounded border px-2 py-0.5 text-xs font-semibold uppercase',
                style.badge
              )}
            >
              {style.label}
            </span>
            <span className="flex-1">{issue.help}</span>
            <span className="shrink-0 text-sm text-gray-600 dark:text-gray-400">
              {pluralize(issue.nodes.length, 'element')}
            </span>
            <svg
              className="h-5 w-5 shrink-0 text-gray-500 transition-transform group-data-[state=open]:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </Accordion.Trigger>
        </h4>
      </Accordion.Header>

      <Accordion.Content className="space-y-4 px-4 pb-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {issue.description}
        </p>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <code className="rounded bg-gray-100 px-2 py-0.5 text-gray-800 dark:bg-white/10 dark:text-gray-200">
            {issue.id}
          </code>
          {criteria.map((criterion) => (
            <span
              key={criterion}
              className="rounded-full border border-gray-300 px-2 py-0.5 text-gray-700 dark:border-dark-border dark:text-gray-300"
            >
              WCAG {criterion}
            </span>
          ))}
          <a
            href={issue.helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-sm text-primary-600 hover:text-accent-600 focus-ring rounded dark:text-primary-400"
          >
            How to fix
            <span className="sr-only">{issue.help} (opens in a new tab)</span>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>

        <div>
          <h5 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Affected elements ({issue.nodes.length})
          </h5>
          <ul id={nodesListId} className="space-y-3">
            {nodes.map((node, index) => (
              <li
                key={`${node.target.join(' ')}-${index}`}
                className="space-y-2 rounded border border-gray-200 bg-gray-50 p-3 dark:border-dark-border dark:bg-dark-bg"
              >
                {node.target.length > 0 && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Selector:{' '}
                    <code className="break-all text-gray-800 dark:text-gray-200">
                      {node.target.join(' ')}
                    </code>
                  </p>
                )}
                <CodeSnippet code={node.html} />
                {node.failureSummary && (
                  <p className="whitespace-pre-line text-xs text-gray-700 dark:text-gray-300">
                    {node.failureSummary}
                  </p>
                )}
              </li>
            ))}
          </ul>
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              aria-expanded={showAll}
              aria-controls={nodesListId}
              className="mt-3 rounded text-sm font-medium text-primary-600 hover:text-accent-600 focus-ring dark:text-primary-400"
            >
              {showAll
                ? 'Show fewer elements'
                : `Show ${pluralize(hiddenCount, 'more element')}`}
            </button>
          )}
        </div>
      </Accordion.Content>
    </Accordion.Item>
  );
}
