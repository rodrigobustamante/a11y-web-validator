import { isIPv4, isIPv6 } from 'node:net';

/** IPv6 prefix length treated as one client (a typical end-user allocation) */
export const IPV6_SUBNET_BITS = 56;

/**
 * Expand an IPv6 address into its 8 hextets, resolving "::" and an
 * embedded IPv4 tail (e.g. ::ffff:192.0.2.1)
 */
function expandIPv6(address: string): number[] {
  let text = address.split('%')[0]; // Drop zone index

  const ipv4Tail = /(\d+\.\d+\.\d+\.\d+)$/.exec(text);
  if (ipv4Tail) {
    const [a, b, c, d] = ipv4Tail[1].split('.').map(Number);
    text =
      text.slice(0, ipv4Tail.index) +
      `${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }

  const [head, tail] = text.split('::');
  const headParts = head ? head.split(':') : [];
  const tailParts = tail !== undefined && tail !== '' ? tail.split(':') : [];
  const missing = 8 - headParts.length - tailParts.length;
  const parts =
    tail === undefined
      ? headParts
      : [...headParts, ...Array<string>(missing).fill('0'), ...tailParts];

  return parts.map((part) => parseInt(part, 16));
}

/**
 * Rate-limit key for a client IP. IPv4 addresses are used as-is; IPv6
 * addresses are reduced to their /56 prefix, because a single client usually
 * controls a whole /64 (or larger) and could otherwise rotate addresses to
 * evade the limit. IPv4-mapped IPv6 addresses are keyed as IPv4.
 */
export function rateLimitKey(ip: string | undefined): string {
  if (!ip) return 'unknown';
  if (isIPv4(ip)) return ip;
  if (!isIPv6(ip)) return ip;

  const hextets = expandIPv6(ip);

  // ::ffff:a.b.c.d is an IPv4 client seen through a dual-stack socket
  const isMapped =
    hextets.slice(0, 5).every((h) => h === 0) && hextets[5] === 0xffff;
  if (isMapped) {
    return [
      hextets[6] >> 8,
      hextets[6] & 0xff,
      hextets[7] >> 8,
      hextets[7] & 0xff,
    ].join('.');
  }

  const fullHextets = Math.floor(IPV6_SUBNET_BITS / 16);
  const remainingBits = IPV6_SUBNET_BITS % 16;
  const prefix = hextets.slice(0, fullHextets);
  if (remainingBits > 0) {
    const mask = (0xffff << (16 - remainingBits)) & 0xffff;
    prefix.push(hextets[fullHextets] & mask);
  }

  return `${prefix.map((h) => h.toString(16)).join(':')}::/${IPV6_SUBNET_BITS}`;
}
