import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import { chromium } from 'playwright';
import { startEgressProxy } from '../src/security/egress-proxy';

function listen(handler: http.RequestListener): Promise<{ server: http.Server; port: number }> {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: (server.address() as net.AddressInfo).port });
    });
  });
}

test('egress proxy blocks redirects to internal destinations', async () => {
  let internalHits = 0;
  const internal = await listen((_req, res) => {
    internalHits++;
    res.end('<html><body>secret</body></html>');
  });
  const pub = await listen((_req, res) => {
    res.writeHead(302, { Location: `http://127.0.0.1:${internal.port}/secret` }).end();
  });
  const proxy = await startEgressProxy({ isAllowed: (_ip, port) => port === pub.port });

  try {
    // Raw CONNECT to the internal port is refused
    const status = await new Promise<string>((resolve, reject) => {
      const proxyPort = Number(new URL(proxy.url).port);
      const socket = net.connect(proxyPort, '127.0.0.1', () => {
        socket.write(`CONNECT 127.0.0.1:${internal.port} HTTP/1.1\r\nHost: 127.0.0.1:${internal.port}\r\n\r\n`);
      });
      socket.once('data', (d) => {
        socket.destroy();
        resolve(d.toString().split('\r\n')[0]);
      });
      socket.on('error', reject);
    });
    assert.match(status, /^HTTP\/1\.1 403/);

    // Chromium following a redirect through the proxy never reaches the internal server
    const browser = await chromium.launch({ headless: true, proxy: { server: proxy.url } });
    try {
      const page = await browser.newPage();
      let content = '';
      try {
        await page.goto(`http://127.0.0.1:${pub.port}/`, { timeout: 15000 });
        content = await page.content();
      } catch {
        // navigation failure is an acceptable outcome
      }
      assert.ok(!content.includes('secret'), 'internal content leaked');
    } finally {
      await browser.close();
    }

    assert.equal(internalHits, 0);
  } finally {
    await proxy.close();
    pub.server.close();
    internal.server.close();
  }
});
