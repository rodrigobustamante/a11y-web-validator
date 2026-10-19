import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPublicAddress, assertPublicUrl, UnsafeUrlError } from '../src/security/url-guard';

test('isPublicAddress rejects private and reserved IPv4', () => {
  for (const ip of [
    '0.0.0.0', '10.1.2.3', '100.64.0.1', '127.0.0.1', '169.254.169.254',
    '172.16.0.1', '172.31.255.255', '192.0.0.1', '192.0.2.1', '192.168.1.1',
    '198.18.0.1', '198.51.100.1', '203.0.113.1', '224.0.0.1', '255.255.255.255',
  ]) {
    assert.equal(isPublicAddress(ip), false, ip);
  }
});

test('isPublicAddress rejects private and reserved IPv6', () => {
  for (const ip of ['::', '::1', 'fc00::1', 'fd12::1', 'fe80::1', 'ff02::1', '2001:db8::1', '64:ff9b::1']) {
    assert.equal(isPublicAddress(ip), false, ip);
  }
});

test('isPublicAddress unwraps IPv4-mapped IPv6', () => {
  assert.equal(isPublicAddress('::ffff:127.0.0.1'), false);
  assert.equal(isPublicAddress('::ffff:7f00:1'), false);
  assert.equal(isPublicAddress('::ffff:10.0.0.1'), false);
  assert.equal(isPublicAddress('::ffff:a9fe:a9fe'), false);
  assert.equal(isPublicAddress('::ffff:1.1.1.1'), true);
  assert.equal(isPublicAddress('::ffff:101:101'), true);
});

test('isPublicAddress accepts public addresses and rejects non-IPs', () => {
  assert.equal(isPublicAddress('1.1.1.1'), true);
  assert.equal(isPublicAddress('8.8.8.8'), true);
  assert.equal(isPublicAddress('2606:4700:4700::1111'), true);
  assert.equal(isPublicAddress('example.com'), false);
  assert.equal(isPublicAddress(''), false);
  assert.equal(isPublicAddress('999.1.1.1'), false);
});

test('assertPublicUrl rejects unsafe URLs without DNS', async () => {
  for (const url of [
    'http://localhost/',
    'http://foo.localhost/',
    'http://127.0.0.1/',
    'http://169.254.169.254/latest/meta-data/',
    'http://[::1]/',
    'http://[::ffff:127.0.0.1]/',
    'http://0.0.0.0/',
    'http://foo.internal/',
    'http://printer.local/',
    'http://intranet/',
    'ftp://example.com/',
    'file:///etc/passwd',
    'http://user:pass@example.com/',
    'http://example.com:22/',
    'not a url',
  ]) {
    await assert.rejects(assertPublicUrl(url), UnsafeUrlError, url);
  }
});

test('assertPublicUrl accepts a public IP literal with allowed port', async () => {
  await assertPublicUrl('https://1.1.1.1/');
  await assertPublicUrl('http://1.1.1.1:8080/');
});

test('isPublicAddress blocks additional IPv6 ranges', () => {
  for (const ip of ['::2', '::ffff:0:1', '64:ff9b:1::1', '2002::1', '2001::1', 'fec0::1', '100::1']) {
    assert.equal(isPublicAddress(ip), false, ip);
  }
});

test('assertPublicUrl rejects hex, decimal and octal IPv4 forms', async () => {
  for (const url of [
    'http://0x7f.0.0.1/',
    'http://0x7f000001/',
    'http://2130706433/',
    'http://017700000001/',
    'http://0177.0.0.1/',
    'http://127.1/',
  ]) {
    await assert.rejects(assertPublicUrl(url), UnsafeUrlError, url);
  }
});
