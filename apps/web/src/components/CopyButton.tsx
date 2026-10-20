'use client';

import clsx from 'clsx';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useAnnounce } from './LiveAnnouncer';

interface CopyButtonProps {
  /** Visible label, e.g. "Copy issue" */
  label: string;
  /** Extra context for assistive tech, appended to the accessible name */
  srContext?: string;
  /** Builds the text lazily so large payloads are only formatted on click */
  getText: () => string;
  className?: string;
}

const ANNOUNCEMENTS = {
  copied: 'Copied to clipboard',
  error: 'Could not copy to the clipboard',
} as const;

export function CopyButton({
  label,
  srContext,
  getText,
  className,
}: CopyButtonProps) {
  const { status, copy } = useCopyToClipboard();
  const announce = useAnnounce();

  const handleClick = async () => {
    const outcome = await copy(getText());
    if (outcome) announce(ANNOUNCEMENTS[outcome]);
  };

  return (
    <span className={clsx('inline-flex items-center gap-2', className)}>
      {/* The accessible name stays constant; feedback goes through the page live region */}
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1 rounded font-medium text-primary-600 transition-colors hover:text-accent-600 focus-ring dark:text-primary-400"
      >
        {status === 'copied' ? (
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
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
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
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        )}
        {label}
        {srContext && <span className="sr-only"> {srContext}</span>}
      </button>
      {status !== 'idle' && (
        <span
          aria-hidden="true"
          className={clsx(
            'font-medium',
            status === 'copied'
              ? 'text-green-700 dark:text-green-400'
              : 'text-red-700 dark:text-red-400'
          )}
        >
          {status === 'copied' ? 'Copied' : 'Copy failed'}
        </span>
      )}
    </span>
  );
}
