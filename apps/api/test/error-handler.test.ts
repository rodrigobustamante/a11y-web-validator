import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../src/middleware/error-handler';
import { UnsafeUrlError } from '../src/security/url-guard';
import { ServiceBusyError } from '../src/security/concurrency';

function run(error: Error) {
  const out: { status?: number; body?: unknown; headers: Record<string, string> } = { headers: {} };
  const res = {
    statusCode: 200,
    setHeader: (k: string, v: string) => { out.headers[k] = v; },
    status(code: number) { out.status = code; return this; },
    json(body: unknown) { out.body = body; return this; },
  } as unknown as Response;
  const original = console.error;
  console.error = () => undefined;
  try {
    errorHandler(error, {} as Request, res, (() => undefined) as NextFunction);
  } finally {
    console.error = original;
  }
  return out;
}

test('error handler keeps 4xx status from middleware', () => {
  const err = Object.assign(new Error('too large'), { status: 413 });
  assert.equal(run(err).status, 413);
});

test('error handler maps UnsafeUrlError to 400 and ServiceBusyError to 503', () => {
  assert.equal(run(new UnsafeUrlError('x')).status, 400);
  const busy = run(new ServiceBusyError());
  assert.equal(busy.status, 503);
  assert.equal(busy.headers['Retry-After'], '30');
  assert.equal(run(new Error('boom')).status, 500);
});
