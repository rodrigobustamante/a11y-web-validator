'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type CopyStatus = 'idle' | 'copied' | 'error';

/** How long the copied/error feedback stays visible */
const RESET_DELAY_MS = 2000;

/**
 * Legacy fallback for contexts without the async Clipboard API
 * (plain HTTP outside localhost, iframes without clipboard-write)
 */
function copyWithExecCommand(text: string): void {
  const previousFocus = document.activeElement as HTMLElement | null;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.setAttribute('aria-hidden', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);

  try {
    textarea.select();
    if (!document.execCommand('copy')) {
      throw new Error('execCommand copy was rejected');
    }
  } finally {
    textarea.remove();
    previousFocus?.focus();
  }
}

async function writeToClipboard(text: string): Promise<void> {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  copyWithExecCommand(text);
}

export function useCopyToClipboard() {
  const [status, setStatus] = useState<CopyStatus>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  // Only the latest request may update state; also guards against unmount
  const requestIdRef = useRef(0);

  useEffect(
    () => () => {
      requestIdRef.current += 1;
      clearTimeout(timeoutRef.current);
    },
    []
  );

  /** Resolves to the outcome, or null when a newer request superseded it */
  const copy = useCallback(async (text: string) => {
    const requestId = ++requestIdRef.current;
    clearTimeout(timeoutRef.current);

    let outcome: CopyStatus;
    try {
      await writeToClipboard(text);
      outcome = 'copied';
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      outcome = 'error';
    }

    if (requestId !== requestIdRef.current) return null;

    setStatus(outcome);
    timeoutRef.current = setTimeout(() => setStatus('idle'), RESET_DELAY_MS);
    return outcome;
  }, []);

  return { status, copy };
}
