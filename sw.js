/* Forka App - service worker for erp.forka.com (installable app + notifications).
   Pages and files from erp.forka.com always come from the internet first, so a new version
   shows at once; the saved copy is only used when there is no internet.
   Requests to the servers (accounts, Board, Hire, Procurement, Google) are never touched. */
const CACHE = 'forka-app-v1';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'logos/forka-app-192.png', 'logos/forka-app-icon.svg', 'logos/forka-app-logo.svg'];
const OFFLINE = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Forka App</title>' +
  '<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f6f3ee;color:#23211f;font-family:"Inter Tight",system-ui,sans-serif;text-align:center;padding:24px}' +
  'h1{font-family:"EB Garamond",serif;font-weight:600;margin:0 0 8px}p{margin:4px 0;color:#5c5852}.ar{font-family:"IBM Plex Sans Arabic",sans-serif;margin-top:18px}' +
  'button{margin-top:22px;background:#9a6b3f;color:#fff;border:0;border-radius:10px;padding:11px 22px;font-weight:600;font-size:15px}</style></head><body><div>' +
  '<h1>No internet</h1><p>Forka App needs the internet. Check your connection and try again.</p>' +
  '<div class="ar" dir="rtl"><h1>لا يوجد اتصال بالإنترنت</h1><p>تطبيق فوركا يحتاج إلى الإنترنت. تحقق من الاتصال وحاول مرة أخرى.</p></div>' +
  '<button onclick="location.reload()">Try again · حاول مرة أخرى</button></div></body></html>';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           // servers, Google, fonts: left alone
  if (url.pathname.endsWith('/config.js') || url.pathname.endsWith('/sw.js')) return;
  e.respondWith(fetch(req).then(res => {
    if (res && res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then(hit => hit ||
    (req.mode === 'navigate' ? new Response(OFFLINE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }) : Response.error()))));
});

/* Notifications. The Forka Apps server sends: {title, body, url, tag}.
   Kinds planned: Board mentions, CEO approvals, LPOs, new job applications. */
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : '' }; }
  const title = d.title || 'Forka App';
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || '', tag: d.tag || undefined, renotify: !!d.tag,
    icon: 'logos/forka-app-192.png', badge: 'logos/forka-app-icon.png', lang: d.lang || 'en', dir: d.lang === 'ar' ? 'rtl' : 'auto',
    data: { url: d.url || './' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  let target = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope);
  if (target.origin !== self.location.origin) target = new URL('./', self.registration.scope);   // only ever open erp.forka.com
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const w of list) { if (w.url === target.href && 'focus' in w) return w.focus(); }
    for (const w of list) { if ('navigate' in w && 'focus' in w) return w.navigate(target.href).then(c => (c || w).focus()); }
    return self.clients.openWindow(target.href);
  }));
});
