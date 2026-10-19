import http from 'node:http';
import net, { isIP } from 'node:net';
import { promises as dns } from 'node:dns';
import type { Duplex } from 'node:stream';
import { ALLOWED_PORTS, isPublicAddress } from './url-guard';

const IDLE_TIMEOUT_MS = 30000;

const HOP_BY_HOP_HEADERS = [
  'proxy-connection',
  'proxy-authorization',
  'connection',
  'keep-alive',
  'te',
  'trailer',
  'upgrade',
];

export interface EgressProxyOptions {
  /** Decide whether a resolved destination may be connected to */
  isAllowed?: (ip: string, port: number) => boolean;
}

export interface EgressProxy {
  /** Proxy URL to hand to the browser (http://127.0.0.1:PORT) */
  url: string;
  /** Number of destinations blocked so far */
  blockedCount(): number;
  close(): Promise<void>;
}

/**
 * Split "host:port" (IPv6 in brackets supported)
 */
function parseHostPort(
  value: string,
  defaultPort?: number
): { host: string; port: number } | null {
  let host: string;
  let portText: string | undefined;

  if (value.startsWith('[')) {
    const end = value.indexOf(']');
    if (end === -1) return null;
    host = value.slice(1, end);
    const rest = value.slice(end + 1);
    if (rest) {
      if (!rest.startsWith(':')) return null;
      portText = rest.slice(1);
    }
  } else {
    const idx = value.lastIndexOf(':');
    if (idx === -1) {
      host = value;
    } else {
      host = value.slice(0, idx);
      portText = value.slice(idx + 1);
    }
  }

  const port =
    portText === undefined || portText === '' ? defaultPort : Number(portText);
  if (
    !host ||
    port === undefined ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    return null;
  }
  return { host, port };
}

/**
 * Start a local forward proxy that only connects to destinations allowed by
 * the policy. The IP that is validated is the IP that is connected to, so
 * DNS rebinding and redirects to internal hosts cannot bypass the check.
 * @returns The proxy URL and a close function
 */
export async function startEgressProxy(
  opts: EgressProxyOptions = {}
): Promise<EgressProxy> {
  const isAllowed =
    opts.isAllowed ??
    ((ip: string, port: number) =>
      isPublicAddress(ip) && ALLOWED_PORTS.has(port));

  /**
   * Resolve a host and return the first address if every address is allowed
   */
  let blocked = 0;

  const vet = async (host: string, port: number): Promise<string | null> => {
    let addresses: string[];
    if (isIP(host)) {
      addresses = [host];
    } else {
      try {
        addresses = (await dns.lookup(host, { all: true, verbatim: true })).map(
          (a) => a.address
        );
      } catch {
        return null;
      }
    }

    if (
      addresses.length === 0 ||
      addresses.some((ip) => !isAllowed(ip, port))
    ) {
      blocked++;
      console.warn(`🚫 Egress proxy blocked destination: ${host}:${port}`);
      return null;
    }
    return addresses[0];
  };

  const server = http.createServer(async (req, res) => {
    let target: URL;
    try {
      target = new URL(req.url || '');
    } catch {
      res.writeHead(400).end('Bad Request');
      return;
    }

    if (target.protocol !== 'http:') {
      res.writeHead(400).end('Bad Request');
      return;
    }

    const port = Number(target.port || 80);
    const host = target.hostname.replace(/^\[|\]$/g, '');
    const ip = await vet(host, port);
    if (!ip) {
      res.writeHead(403, { 'x-egress-blocked': '1' }).end('Forbidden');
      return;
    }

    const headers = { ...req.headers };
    for (const name of HOP_BY_HOP_HEADERS) delete headers[name];

    const upstream = http.request(
      {
        host: ip,
        port,
        method: req.method,
        path: target.pathname + target.search,
        headers,
        timeout: IDLE_TIMEOUT_MS,
      },
      (upstreamRes) => {
        res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
        upstreamRes.pipe(res);
      }
    );

    upstream.on('timeout', () => upstream.destroy());
    upstream.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(502).end('Bad Gateway');
      } else {
        res.destroy();
      }
    });
    res.on('close', () => upstream.destroy());
    req.pipe(upstream);
  });

  server.on('connect', async (req, clientSocket: Duplex, head: Buffer) => {
    clientSocket.on('error', () => clientSocket.destroy());

    const parsed = parseHostPort(req.url || '');
    if (!parsed) {
      clientSocket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      return;
    }

    const ip = await vet(parsed.host, parsed.port);
    if (!ip) {
      clientSocket.end('HTTP/1.1 403 Forbidden\r\n\r\n');
      return;
    }

    const upstream = net.connect({ host: ip, port: parsed.port });
    upstream.setTimeout(IDLE_TIMEOUT_MS, () => upstream.destroy());
    (clientSocket as net.Socket).setTimeout(IDLE_TIMEOUT_MS, () => clientSocket.destroy());

    let established = false;
    upstream.once('connect', () => {
      established = true;
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      if (head.length > 0) upstream.write(head);
      upstream.pipe(clientSocket);
      clientSocket.pipe(upstream);
    });

    upstream.on('error', () => {
      if (established) {
        clientSocket.destroy();
      } else {
        clientSocket.end('HTTP/1.1 502 Bad Gateway\r\n\r\n');
      }
      upstream.destroy();
    });
    clientSocket.on('close', () => upstream.destroy());
    upstream.on('close', () => clientSocket.destroy());
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address() as net.AddressInfo;

  return {
    url: `http://127.0.0.1:${address.port}`,
    blockedCount: () => blocked,
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
        server.closeAllConnections?.();
      }),
  };
}
