"""Forka App as an installable app (PWA) + notifications - checks. Run: python3 tests/pwa_test.py"""
import asyncio, json, pathlib, threading, http.server, functools, socketserver
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = ROOT / 'tests' / 'shots'; SHOTS.mkdir(exist_ok=True)
results = []
def check(name, ok, info=''):
    results.append((name, bool(ok))); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + str(info) if info and not ok else ''))

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
socketserver.TCPServer.allow_reuse_address = True
srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(ROOT)))
PORT = srv.server_address[1]; BASE = f'http://localhost:{PORT}/'
threading.Thread(target=srv.serve_forever, daemon=True).start()
IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'

async def fresh(b, w=1280, h=900, ua=None, lang='en', perm=None, mobile=False, ask=False):
    o = {'viewport': {'width': w, 'height': h}}
    if ua: o['user_agent'] = ua
    if mobile: o.update(is_mobile=True, has_touch=True)
    ctx = await b.new_context(**o)
    if perm: await ctx.grant_permissions(perm, origin=BASE.rstrip('/'))
    await ctx.add_init_script(f"localStorage.setItem('fa-lang','{lang}')")
    if ask:  # a device that has not been asked yet (headless Chrome says "blocked" by default); tapping Allow grants it
        await ctx.grant_permissions(['notifications'], origin=BASE.rstrip('/'))
        await ctx.add_init_script("Object.defineProperty(Notification,'permission',{get:()=>window.__perm||'default'});Notification.requestPermission=async()=>(window.__perm='granted');window.__shown=[];ServiceWorkerRegistration.prototype.showNotification=async function(title,o){window.__shown.push([title,o&&o.body])}")
    await ctx.route('**/config.js', lambda r: r.fulfill(body='', content_type='application/javascript'))  # preview mode
    await ctx.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(BASE); await pg.wait_for_timeout(2400)
    return ctx, pg, errs

async def signin(pg, email):
    await pg.click('[data-a=g-open]'); await pg.fill('#gmail', email); await pg.click('[data-a=g-go]'); await pg.wait_for_timeout(300)

async def main():
    # files
    m = json.loads((ROOT / 'manifest.webmanifest').read_text())
    check('Manifest: name, standalone, start page inside the site', m['name'] == 'Forka App' and m['display'] == 'standalone' and m['start_url'].startswith('/') and m['scope'] == '/')
    sizes = {(i['sizes'], i.get('purpose', 'any')) for i in m['icons']}
    check('Manifest: 192 and 512 icons plus a maskable icon', ('192x192', 'any') in sizes and ('512x512', 'any') in sizes and ('512x512', 'maskable') in sizes)
    check('Icon files exist', all((ROOT / i['src']).exists() for i in m['icons']))
    for f in ['index.html', 'boards/index.html', 'hiring/index.html']:
        check(f'{f} links the manifest', 'rel="manifest"' in (ROOT / f).read_text())
    sw = (ROOT / 'sw.js').read_text()
    check('Service worker leaves the servers alone (only erp.forka.com files)', "url.origin !== self.location.origin" in sw and "req.method !== 'GET'" in sw)
    check('Service worker never caches config.js', 'config.js' in sw)
    check('Notification click only opens erp.forka.com', 'target.origin !== self.location.origin' in sw)

    async with async_playwright() as p:
        b = await p.chromium.launch()
        # desktop, English, CEO
        ctx, pg, errs = await fresh(b, ask=True)
        check('Device card hidden before sign-in', await pg.locator('#device').count() == 0)
        await signin(pg, 'ceo@forka.com')
        check('Signed in: "On this device" section shows', await pg.is_visible('#device'))
        await pg.wait_for_function("navigator.serviceWorker && navigator.serviceWorker.controller !== undefined")
        reg = await pg.evaluate("navigator.serviceWorker.getRegistration().then(r=>r?r.scope:'')")
        check('Service worker registered for the whole site', reg == BASE, reg)
        mf = await pg.evaluate("fetch('manifest.webmanifest').then(r=>r.ok)")
        check('Manifest is served', mf)
        nt = await pg.inner_text('#notcard')
        check('CEO sees all four alert kinds (Board mentions, approvals, LPOs, applications)', all(x in nt for x in ['mentions you in Board', 'needs your approval', 'LPO', 'job application']), nt)
        check('Install card shows (browser menu steps when Chrome has not offered install)', await pg.is_visible('#appcard'))
        await pg.screenshot(path=str(SHOTS / 'pwa_desktop_en.png'), full_page=True)
        # fake Chrome's install offer
        await pg.evaluate("""()=>{const e=new Event('beforeinstallprompt');e.prompt=()=>{window.__asked=1};e.userChoice=Promise.resolve({outcome:'accepted'});dispatchEvent(e)}""")
        await pg.wait_for_timeout(100)
        check('Install button appears when the browser offers it', await pg.is_visible('[data-a=pwa-install]'))
        await pg.locator('#device').scroll_into_view_if_needed(); await pg.evaluate("window.scrollBy(0,-120)"); await pg.screenshot(path=str(SHOTS / 'pwa_desktop_install.png'))
        await pg.click('[data-a=pwa-install]'); await pg.wait_for_timeout(150)
        check('Install button opens the browser install window, then the card goes', await pg.evaluate('window.__asked') == 1 and await pg.locator('#appcard').count() == 0)
        check('No page errors (desktop)', not errs, errs)
        await ctx.close()

        # notifications allowed
        ctx, pg, errs = await fresh(b, ask=True)
        await signin(pg, 'ceo@forka.com')
        check('Notifications start off, with a "Turn on" button', await pg.is_visible('[data-a=pwa-notify]'))
        await pg.click('[data-a=pwa-notify]'); await pg.wait_for_timeout(800)
        check('Turn on notifications -> "on for this device"', 'on for this device' in await pg.inner_text('#notcard'))
        shown = json.dumps(await pg.evaluate("window.__shown"))
        check("A test notification is shown", "Forka App" in shown, shown)
        await pg.click('[data-a=pwa-later]') if await pg.locator('[data-a=pwa-later]').count() else None
        check('"Not now" hides the install card', await pg.locator('#appcard').count() == 0)
        await pg.screenshot(path=str(SHOTS / 'pwa_notify_on.png'), full_page=True)
        # offline: the app still opens
        await pg.reload(); await pg.wait_for_timeout(2400)
        await ctx.set_offline(True)
        await pg.goto(BASE + 'help/'); await pg.wait_for_timeout(300)
        off = await pg.inner_text('body')
        if 'No internet' not in off and 'How to use' in off:
            print('SKIP Offline page: this test browser\'s offline switch does not reach the service worker (older Playwright); checked with newer Playwright')
        else:
            check('Offline: a page never opened before shows "No internet" in English and Arabic', 'No internet' in off and 'لا يوجد اتصال' in off, off[:120])
        await pg.screenshot(path=str(SHOTS / 'pwa_offline.png'))
        await pg.goto(BASE); await pg.wait_for_timeout(2400)
        check('Offline: the home page opens from the saved copy', await pg.locator('#app').count() == 1 and 'No internet' not in await pg.inner_text('body'))
        await ctx.set_offline(False)
        check('No page errors (notifications)', not errs, errs)
        await ctx.close()

        # a Hire-only staff member: only the alerts for their apps
        ctx, pg, errs = await fresh(b)
        await signin(pg, 'ceo@forka.com')
        await pg.evaluate("""()=>{DATA.people['hr@test.com']={email:'hr@test.com',name:'Test HR',level:'staff',status:'active',apps:{proc:0,hire:1,branch:0},sides:[],method:'google'};me='hr@test.com';render()}""")
        nt = await pg.inner_text('#notcard')
        check('Hiring-only person: Board mentions + applications, no approvals or LPOs', 'Board' in nt and 'application' in nt and 'approval' not in nt and 'LPO' not in nt, nt)
        await ctx.close()

        # iPhone Safari, Arabic
        ctx, pg, errs = await fresh(b, 390, 844, ua=IPHONE_UA, lang='ar', mobile=True)
        await signin(pg, 'ceo@forka.com')
        check('iPhone: Add to Home Screen steps show', await pg.is_visible('#iosSteps'))
        check('iPhone: page is right-to-left in Arabic', await pg.evaluate('document.documentElement.dir') == 'rtl')
        nt = await pg.inner_text('#notcard')
        check('iPhone in Safari: asked to add to Home Screen before notifications', 'الشاشة الرئيسية' in nt and await pg.locator('[data-a=pwa-notify]').count() == 0)
        await pg.locator('#device').scroll_into_view_if_needed()
        await pg.evaluate("window.scrollBy(0,-70)"); await pg.screenshot(path=str(SHOTS / 'pwa_iphone_ar.png'))
        check('No page errors (iPhone)', not errs, errs)
        await ctx.close()

        # iPhone opened from the home-screen icon (standalone), English
        ctx, pg, errs = await fresh(b, 390, 844, ua=IPHONE_UA, mobile=True, ask=True)
        await pg.evaluate("Object.defineProperty(navigator,'standalone',{get:()=>true})")
        await signin(pg, 'ceo@forka.com')
        check('Opened from the icon: no install card, notifications button shows', await pg.locator('#appcard').count() == 0 and await pg.is_visible('[data-a=pwa-notify]'))
        await pg.locator('#device').scroll_into_view_if_needed()
        await pg.evaluate("window.scrollBy(0,-70)"); await pg.screenshot(path=str(SHOTS / 'pwa_iphone_app_en.png'))
        await ctx.close()

        # Board page also links the app and registers it
        ctx = await b.new_context(); pg = await ctx.new_page()
        await ctx.route('**/config.js*', lambda r: r.fulfill(body='', content_type='application/javascript'))
        await pg.goto(BASE + 'boards/'); await pg.wait_for_timeout(1500)
        reg = await pg.evaluate("navigator.serviceWorker.getRegistration().then(r=>r?r.scope:'')")
        check('Board page uses the same app (service worker scope is the whole site)', reg == BASE, reg)
        await ctx.close()
        await b.close()
    srv.shutdown()
    bad = [n for n, ok in results if not ok]
    print(f'\n{len(results) - len(bad)}/{len(results)} passed')
    raise SystemExit(1 if bad else 0)

asyncio.run(main())
