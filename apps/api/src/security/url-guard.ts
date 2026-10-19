import { BlockList, isIP } from 'node:net';
import { promises as dns } from 'node:dns';

/**
 * Error thrown when a URL targets a private, reserved or otherwise unsafe destination
 */
export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafeUrlError';
  }
}

const PRIVATE_RANGES_MESSAGE = 'URL points to a private or reserved address';
/** Ports the audited sites may use */
export const ALLOWED_PORTS: ReadonlySet<number> = new Set([
  80, 443, 8080, 8443,
]);

/**
 * Block list with every non-public IPv4 / IPv6 range
 */
// Separate lists: node maps IPv4 into ::ffff:0:0/96 when checking against IPv6 rules
const blockListV4 = new BlockList();
const blockListV6 = new BlockList();

const IPV4_RANGES: Array<[string, number]> = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];

const IPV6_RANGES: Array<[string, number]> = [
  ['::', 128],
  ['::1', 128],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
  ['2001:db8::', 32],
  ['64:ff9b::', 96],
  ['::', 96],
  ['::ffff:0:0', 96],
  ['64:ff9b:1::', 48],
  ['2002::', 16],
  ['2001::', 32],
  ['fec0::', 10],
  ['100::', 64],
];

IPV4_RANGES.forEach(([addr, prefix]) =>
  blockListV4.addSubnet(addr, prefix, 'ipv4')
);
IPV6_RANGES.forEach(([addr, prefix]) =>
  blockListV6.addSubnet(addr, prefix, 'ipv6')
);

/**
 * Extract the embedded IPv4 address from an IPv4-mapped IPv6 address
 * (::ffff:a.b.c.d or ::ffff:7f00:1), or null if it is not a mapped address
 */
function unwrapMappedIpv4(ip: string): string | null {
  const lower = ip.toLowerCase();

  const dotted = lower.match(
    /^(?:0{0,4}:){0,5}:?ffff:(\d{1,3}(?:\.\d{1,3}){3})$/
  );
  if (dotted) return dotted[1];

  const hex = lower.match(
    /^(?:0{0,4}:){0,5}:?ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/
  );
  if (hex) {
    const high = parseInt(hex[1], 16);
    const low = parseInt(hex[2], 16);
    return `${high >> 8}.${high & 0xff}.${low >> 8}.${low & 0xff}`;
  }

  return null;
}

/**
 * Check whether an IP address is publicly routable
 * @param ip - IPv4 or IPv6 address
 * @returns true only for valid, public addresses
 */
export function isPublicAddress(ip: string): boolean {
  const version = isIP(ip);
  if (version === 0) return false;

  if (version === 6) {
    const mapped = unwrapMappedIpv4(ip);
    if (mapped) {
      return isIP(mapped) === 4 && !blockListV4.check(mapped, 'ipv4');
    }
    return !blockListV6.check(ip, 'ipv6');
  }

  return !blockListV4.check(ip, 'ipv4');
}

/**
 * Ensure a URL is http(s), has no credentials, uses an allowed port and
 * resolves only to public addresses
 * @param rawUrl - URL to validate
 * @throws UnsafeUrlError when the URL is not safe to fetch
 */
export async function assertPublicUrl(rawUrl: string): Promise<void> {
  const { hostname, isIpLiteral } = assertSafeUrlSyntax(rawUrl);
  if (isIpLiteral) return;

  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new UnsafeUrlError('Could not resolve the URL hostname');
  }

  if (
    addresses.length === 0 ||
    addresses.some((a) => !isPublicAddress(a.address))
  ) {
    throw new UnsafeUrlError(PRIVATE_RANGES_MESSAGE);
  }
}

/**
 * Run every URL check that needs no DNS lookup (scheme, credentials, port,
 * IP literals and reserved hostnames)
 * @param rawUrl - URL to validate
 * @returns The normalized hostname and whether it was an (already vetted) IP literal
 * @throws UnsafeUrlError when the URL is not safe to fetch
 */
export function assertSafeUrlSyntax(rawUrl: string): {
  hostname: string;
  isIpLiteral: boolean;
} {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError('Invalid URL format');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new UnsafeUrlError('URL must use HTTP or HTTPS protocol');
  }

  if (parsed.username || parsed.password) {
    throw new UnsafeUrlError('URLs with credentials are not allowed');
  }

  if (parsed.port && !ALLOWED_PORTS.has(Number(parsed.port))) {
    throw new UnsafeUrlError('URL port is not allowed');
  }

  const host = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();

  if (isIP(host)) {
    if (!isPublicAddress(host)) {
      throw new UnsafeUrlError(PRIVATE_RANGES_MESSAGE);
    }
    return { hostname: host, isIpLiteral: true };
  }

  const hostname = host.replace(/\.$/, '');
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    !hostname.includes('.')
  ) {
    throw new UnsafeUrlError(PRIVATE_RANGES_MESSAGE);
  }

  return { hostname, isIpLiteral: false };
}
