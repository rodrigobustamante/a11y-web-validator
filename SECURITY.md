# Security Policy

## Reporting a vulnerability

Please report vulnerabilities by email to **rbustamantejelvez@gmail.com**. Do not open a public issue. Include steps to reproduce and the potential impact.

## Hardening

The API audits user-supplied URLs with a headless browser, so it applies these protections:

- Egress proxy: each audit starts a local forward proxy and Chromium can only reach the network through it. The proxy resolves the destination, rejects it if any address is private, loopback, link-local (including cloud metadata), CGNAT, multicast or otherwise reserved (IPv4, IPv6 and IPv4-mapped IPv6) or if the port is not 80, 443, 8080 or 8443, and then connects to the vetted IP itself. The IP that is checked is the IP that is connected to, so DNS rebinding cannot bypass the check for HTTP, HTTPS and WebSocket traffic.
- Redirects are re-checked hop by hop, because Chromium issues a new proxied request for each hop. Loopback is not bypassed by the browser proxy settings.
- WebRTC non-proxied UDP is disabled.
- Defense in depth: the submitted URL is validated before launching the browser (scheme, no credentials, allowed ports, IP literals, reserved hostnames, DNS resolution); a request route guard re-checks every request and blocks non-http(s) schemes, service workers and WebSockets; and the redirect chain of the main navigation is checked after loading.
- PDF export validates the submitted audit result with strict zod schemas and size limits, escapes every value interpolated into the report HTML, and renders it with JavaScript disabled and all network requests aborted. Audit results the API produces are truncated to the same limits.
- Browser concurrency is capped (`maxConcurrentScans`), shared by audits and PDF generation; excess requests get `503` with `Retry-After`.
- `trust proxy` is configured (`TRUST_PROXY`, default 1 hop in production) so rate limiting uses the real client IP.
- JSON request bodies are limited to 1 MB.

## Known residual risks

- Anyone can submit arbitrary text to the PDF export and get it rendered in a PDF under the tool's branding.
- The concurrency limit is per process, not shared across replicas.

Even with the egress proxy, deploy the API on an isolated network without access to internal services or cloud metadata endpoints.
