/**
 * Dev / preview server endpoint for live Lighthouse audits of the playground
 * (`npm run dev`, `npm run preview`). Never part of a production build.
 *
 *   GET /__k3-lighthouse/ping                    → { ok, mode }
 *   GET /__k3-lighthouse/run?form=mobile&path=/  → LighthouseSummary
 *   GET /__k3-lighthouse/report/<form>.html      → last full HTML report
 *
 * Only answers loopback clients with a localhost Host header (the dev server
 * listens on every interface) and only audits pages of this server.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { runLighthouse, type LighthouseFormFactor } from '../scripts/lighthouse-runner.mjs';

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

export function isLocalRequest(remote: string | undefined, host: string | undefined): boolean {
  return !!remote && LOOPBACK.has(remote) && !!host && LOCAL_HOST.test(host);
}

/** Same-origin path only: `/`, `/foo?x#y` — never `//host` or a scheme. */
export function safeAuditPath(raw: string | null): string | null {
  const p = raw ?? '/';
  return /^\/(?!\/)[^\s\\]*$/.test(p) ? p : null;
}

export function lighthouseLive(): Plugin {
  const reports = new Map<LighthouseFormFactor, string>();
  let busy = false;

  const send = (res: ServerResponse, status: number, body: unknown, type = 'application/json') => {
    res.statusCode = status;
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'no-store');
    res.end(type === 'application/json' ? JSON.stringify(body) : String(body));
  };

  const handler = (mode: 'dev' | 'preview') => async (req: IncomingMessage, res: ServerResponse) => {
    if (!isLocalRequest(req.socket.remoteAddress, req.headers.host)) return send(res, 403, { error: 'local only' });
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const report = /^\/report\/(desktop|mobile)\.html$/.exec(url.pathname);
    if (url.pathname === '/ping') return send(res, 200, { ok: true, mode, busy });
    if (report) {
      const html = reports.get(report[1] as LighthouseFormFactor);
      return html ? send(res, 200, html, 'text/html; charset=utf-8') : send(res, 404, { error: 'no report yet' });
    }
    if (url.pathname !== '/run') return send(res, 404, { error: 'not found' });
    const form = url.searchParams.get('form') === 'mobile' ? 'mobile' : 'desktop';
    const path = safeAuditPath(url.searchParams.get('path'));
    if (!path) return send(res, 400, { error: 'bad path' });
    if (busy) return send(res, 409, { error: 'an audit is already running' });
    busy = true;
    try {
      const { summary, html } = await runLighthouse(`http://${req.headers.host}${path}`, form);
      reports.set(form, html);
      send(res, 200, { ...summary, form, mode, report: `/__k3-lighthouse/report/${form}.html` });
    } catch (e) {
      send(res, 500, { error: String((e as Error).message ?? e).slice(0, 2000) });
    } finally {
      busy = false;
    }
  };

  return {
    name: 'k3-lighthouse-live',
    configureServer(server) {
      server.middlewares.use('/__k3-lighthouse', handler('dev'));
    },
    configurePreviewServer(server) {
      server.middlewares.use('/__k3-lighthouse', handler('preview'));
    },
  };
}
