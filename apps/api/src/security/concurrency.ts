import { config } from '../config';

/**
 * Error thrown when all browser slots are in use
 */
export class ServiceBusyError extends Error {
  constructor(message = 'Service is busy. Please try again in a few seconds.') {
    super(message);
    this.name = 'ServiceBusyError';
  }
}

/**
 * Simple counting limiter for concurrent Chromium instances
 */
export class ConcurrencyLimiter {
  private active = 0;

  constructor(private readonly max: number) {}

  /**
   * Try to take a slot
   * @returns true if a slot was acquired
   */
  tryAcquire(): boolean {
    if (this.active >= this.max) return false;
    this.active++;
    return true;
  }

  /**
   * Release a previously acquired slot
   */
  release(): void {
    if (this.active > 0) this.active--;
  }
}

/** Limiter shared by audits and PDF generation */
export const browserLimiter = new ConcurrencyLimiter(config.maxConcurrentScans);
