'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

type Announce = (message: string) => void;

const LiveAnnouncerContext = createContext<Announce>(() => {});

/** Delay between clearing and setting the message so repeats are re-read */
const ANNOUNCE_DELAY_MS = 50;

/**
 * Single polite live region for the whole page, so transient feedback
 * (e.g. "Copied to clipboard") does not need a live region per control
 */
export function LiveAnnouncerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [message, setMessage] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const announce = useCallback<Announce>((next) => {
    clearTimeout(timeoutRef.current);
    // Clearing first changes the DOM even when the same message repeats
    setMessage('');
    timeoutRef.current = setTimeout(() => setMessage(next), ANNOUNCE_DELAY_MS);
  }, []);

  return (
    <LiveAnnouncerContext.Provider value={announce}>
      {children}
      <div role="status" aria-live="polite" className="sr-only">
        {message}
      </div>
    </LiveAnnouncerContext.Provider>
  );
}

export function useAnnounce(): Announce {
  return useContext(LiveAnnouncerContext);
}
