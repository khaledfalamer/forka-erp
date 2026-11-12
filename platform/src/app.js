// The Forka Apps server. Each app keeps its own address (/accounts, later /hiring, /boards, /procurement)
// and the same "POST one JSON body, get one JSON answer" style the websites already use with Apps Script.
import Fastify from 'fastify';
import { makeAccounts } from './accounts.js';

export function buildApp({ accounts = makeAccounts(), logger = true } = {}) {
  const app = Fastify({ logger, bodyLimit: 1_000_000, trustProxy: true });

  // The websites send JSON as text/plain (no CORS preflight, like Apps Script). Accept both.
  app.addContentTypeParser(['text/plain', 'application/json'], { parseAs: 'string' }, (_req, body, done) => {
    try { done(null, body ? JSON.parse(body) : {}); } catch { done(null, { __bad: true }); }
  });
  // Tokens travel in the body, never in cookies, so any page may call (as with Apps Script).
  app.addHook('onSend', async (_req, reply, payload) => {
    reply.header('access-control-allow-origin', '*');
    reply.header('cache-control', 'no-store');
    return payload;
  });
  app.options('/*', async (_req, reply) => reply.header('access-control-allow-methods', 'GET, POST').header('access-control-allow-headers', 'content-type').code(204).send());

  app.get('/', async () => ({ ok: true, service: 'forka-platform' }));
  app.get('/health', async () => ({ ok: true }));   // (Cloud Run keeps /healthz for itself)

  const mount = (path, service, handle) => {
    app.get(path, async () => ({ ok: true, service }));
    app.post(path, async (req) => {
      if (!req.body || req.body.__bad) return { ok: false, error: 'bad' };
      try { return await handle(req.body); }
      catch (err) { req.log.error(err); return { ok: false, error: 'server' }; } // no internal details to the browser
    });
  };
  mount('/accounts', 'forka-apps-accounts', accounts);
  return app;
}
