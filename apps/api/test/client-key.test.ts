import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { rateLimitKey } from '../src/security/client-key';

describe('rateLimitKey', () => {
  it('keeps IPv4 addresses as-is', () => {
    assert.equal(rateLimitKey('203.0.113.7'), '203.0.113.7');
  });

  it('keys IPv4-mapped IPv6 addresses as IPv4', () => {
    assert.equal(rateLimitKey('::ffff:203.0.113.7'), '203.0.113.7');
    assert.equal(rateLimitKey('::ffff:cb00:7107'), '203.0.113.7');
  });

  it('groups IPv6 addresses by their /56 prefix', () => {
    const a = rateLimitKey('2001:db8:abcd:1200::1');
    const b = rateLimitKey('2001:db8:abcd:12ff:ffff:ffff:ffff:ffff');
    assert.equal(a, '2001:db8:abcd:1200::/56');
    assert.equal(a, b);
  });

  it('separates different /56 prefixes', () => {
    assert.notEqual(
      rateLimitKey('2001:db8:abcd:1200::1'),
      rateLimitKey('2001:db8:abcd:1300::1')
    );
  });

  it('expands compressed and zone-scoped addresses', () => {
    assert.equal(rateLimitKey('2001:db8::1'), '2001:db8:0:0::/56');
    assert.equal(rateLimitKey('fe80::1%eth0'), 'fe80:0:0:0::/56');
  });

  it('falls back for missing or unparseable input', () => {
    assert.equal(rateLimitKey(undefined), 'unknown');
    assert.equal(rateLimitKey('not-an-ip'), 'not-an-ip');
  });
});
