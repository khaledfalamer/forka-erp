"""Live-mode checks: the page talking to an accounts server (simulated here), with a stand-in for Google's button.
Run: python3 tests/live_test.py"""
import asyncio, json, pathlib, re, sys
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = 'file://' + str(ROOT / 'index.html')
CFG = "window.FORKA_APPS={MODE:'live',ACCOUNTS_URL:'https://accounts.test/exec',GOOGLE_CLIENT_ID:'CID.apps.googleusercontent.com',PROCUREMENT_URL:'https://khaledfalamer.github.io/Forka-Procurment/'};"
GIS = """window.google={accounts:{id:{_cb:null,initialize(o){this._cb=o.callback;window.__cid=o.client_id},
 renderButton(el){el.innerHTML='<button id="gsi" type="button">Google</button>';el.querySelector('#gsi').onclick=()=>this._cb({credential:'tok:'+(window.__as||'')})}}}};"""

PEOPLE = {
  'ceo@forka.com': dict(email='ceo@forka.com', name='Khaled Alamer', title='CEO', level='ceo', status='active', apps=dict(proc=1, hire=1, branch=1), sides=['plan', 'ops', 'fin', 'dept', 'ceo'], method='google'),
  'store@kuwaitikitchen.com': dict(email='store@kuwaitikitchen.com', name='Hamim', title='Store', level='staff', status='pending', apps=dict(proc=1, hire=0, branch=0), sides=['plan'], method='google'),
}
REQ, ACT, SESS, CALLS = {}, [], {}, []

def bundle(me, tok=None):
    o = {'ok': True, 'me': PEOPLE[me]}
    if tok: o['token'] = tok
    if PEOPLE[me]['level'] == 'ceo':
        o['people'] = list(PEOPLE.values()); o['requests'] = list(REQ.values()); o['activity'] = list(reversed(ACT))
    return o

def log(by, verb, target='', extra=''):
    ACT.append({'at': '2026-11-06T18:00:00Z', 'by': by, 'verb': verb, 'target': target, 'extra': extra})

def handle(b):
    a = b.get('action'); CALLS.append(a)
    if a == 'google':
        email = b['idToken'].split(':', 1)[1]
        p = PEOPLE.get(email)
        if p:
            if p['status'] == 'active':
                tok = 'S' + str(len(SESS)); SESS[tok] = email; log(email, 'signin'); return bundle(email, tok)
            return {'ok': False, 'status': p['status'], 'email': email}
        r = REQ.get(email)
        if r: return {'ok': False, 'status': r['state'] if r['state'] != 'waiting' else 'waiting', 'email': email, 'reason': r.get('reason', '')}
        return {'ok': False, 'status': 'unknown', 'email': email, 'name': ''}
    if a == 'request':
        email = b['idToken'].split(':', 1)[1]
        if not b.get('name') or not b.get('why'): return {'ok': False, 'error': 'need'}
        REQ[email] = {'email': email, 'name': b['name'], 'title': b.get('title', ''), 'why': b['why'], 'at': '2026-11-06T18:00:00Z', 'state': 'waiting'}
        log(email, 'req'); return {'ok': True, 'status': 'waiting'}
    me = SESS.get(b.get('token'))
    if not me or PEOPLE[me]['status'] != 'active': return {'ok': False, 'error': 'session'}
    if a == 'me': return bundle(me)
    if a == 'signout': SESS.pop(b['token'], None); return {'ok': True}
    if a == 'open': log(me, 'open', '', b.get('app', '')); return {'ok': True}
    if PEOPLE[me]['level'] != 'ceo': return {'ok': False, 'error': 'role'}
    if a == 'setStatus':
        PEOPLE[b['id']]['status'] = b['status']; log(me, 'confirm' if b['status'] == 'active' else 'block', b['id']); return bundle(me)
    if a == 'savePerson':
        x = b['person']
        if not x.get('name'): return {'ok': False, 'error': 'need', 'fields': ['name']}
        if x['method'] == 'pin' and not re.fullmatch(r'\d{4,8}', x.get('pinNew', '')) and not b['id']: return {'ok': False, 'error': 'pinBad'}
        email = b['id'] or x['email'] or 'pin-1'
        if not b['id'] and email in PEOPLE: return {'ok': False, 'error': 'dupe'}
        p = dict(email=email, name=x['name'], title=x.get('title', ''), level=x['level'], status=x['status'], apps=x['apps'], sides=x['sides'] if x['apps'].get('proc') else [], method=x['method'])
        if 'pinNew' in p: del p['pinNew']
        PEOPLE[email] = p
        if b.get('fromReq'): REQ[b['fromReq']]['state'] = 'approved'; log(me, 'allow', email)
        else: log(me, 'edit' if b['id'] else 'add', email)
        return bundle(me)
    if a == 'reject':
        REQ[b['id']]['state'] = 'rejected'; REQ[b['id']]['reason'] = b.get('reason', ''); log(me, 'reject', b['id'], b.get('reason', '')); return bundle(me)
    return {'ok': False, 'error': 'action'}

res = []
def check(n, ok, info=''):
    res.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' - ' + str(info)))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1280, 'height': 900})
        await ctx.route('**/config.js', lambda r: r.fulfill(body=CFG, content_type='application/javascript'))
        await ctx.route('**/accounts.google.com/gsi/client', lambda r: r.fulfill(body=GIS, content_type='application/javascript'))
        await ctx.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
        await ctx.route('https://accounts.test/**', lambda r: r.fulfill(json=handle(json.loads(r.request.post_data or '{}'))))
        await ctx.route('**/khaledfalamer.github.io/**', lambda r: r.fulfill(body='<title>p</title>', content_type='text/html'))
        await ctx.route('**/claude.ai/**', lambda r: r.fulfill(body='<title>x</title>', content_type='text/html'))
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_selector('#gsi', timeout=5000)
        async def as_(email):
            await pg.evaluate(f"window.__as='{email}'"); await pg.click('#gsi'); await pg.wait_for_timeout(300)
        check('Real Google button shown (no preview account picker)', await pg.locator('#gsi').count() == 1 and await pg.locator('#gpick').count() == 0)
        check('Google button uses the configured client id', await pg.evaluate('window.__cid') == 'CID.apps.googleusercontent.com')
        await as_('ceo@forka.com')
        check('CEO signs in through the server', await pg.is_visible('#ceobox'))
        check('Session kept in this browser', bool(await pg.evaluate("localStorage.getItem('fa-token')")))
        await pg.reload(); await pg.wait_for_timeout(600)
        check('Reload keeps you signed in', await pg.is_visible('#ceobox'))
        await pg.click('[data-a=v-people]')
        check('No "Reset preview data" on the live site', await pg.locator('[data-a=reset]').count() == 0)
        await pg.click('tr.row[data-pid="store@kuwaitikitchen.com"] [data-a=p-confirm]'); await pg.wait_for_timeout(300)
        check('Confirm access saved on the server', PEOPLE['store@kuwaitikitchen.com']['status'] == 'active')
        await pg.click('[data-a=p-add]'); await pg.fill('#pm [data-k=name]', 'Chef Ali'); await pg.fill('#pm [data-k=email]', 'chef@kuwaitikitchen.com')
        await pg.click('#pm [data-a=d-app][data-v=proc]'); await pg.click('#pm [data-a=p-save]'); await pg.wait_for_timeout(300)
        check('Add person saved on the server', PEOPLE.get('chef@kuwaitikitchen.com', {}).get('sides') == ['dept'], PEOPLE.get('chef@kuwaitikitchen.com'))
        await pg.click('[data-a=out]'); await pg.wait_for_selector('#gsi')
        check('Sign out clears the session', not await pg.evaluate("localStorage.getItem('fa-token')") and 'signout' in CALLS)
        await as_('store@kuwaitikitchen.com')
        check('Hamim signs in, no CEO box', await pg.is_visible('[data-app=proc]') and await pg.locator('#ceobox').count() == 0)
        async with ctx.expect_page() as np:
            await pg.click('[data-app=proc]')
        newp = await np.value
        check('Procurement opens and the visit is logged', 'Forka-Procurment' in newp.url and any(a['verb'] == 'open' for a in ACT))
        await newp.close()
        await pg.click('[data-a=out]'); await pg.wait_for_selector('#gsi')
        await as_('new.person@forka.com')
        check('Unknown email gets the request form', await pg.is_visible('#rq'))
        await pg.fill('#rq [name=name]', 'Sara Ali'); await pg.fill('#rq [name=why]', 'Supplier payments'); await pg.click('[data-a=r-send]'); await pg.wait_for_timeout(300)
        check('Request reaches the server', REQ.get('new.person@forka.com', {}).get('state') == 'waiting')
        await pg.click('[data-a=g-start]'); await pg.wait_for_selector('#gsi'); await as_('ceo@forka.com')
        await pg.click('[data-a=v-people]'); await pg.click('[data-a=r-allow][data-id="new.person@forka.com"]')
        await pg.click('#pm [data-a=d-app][data-v=proc]'); await pg.click('#pm [data-a=d-side][data-v=fin]'); await pg.click('#pm [data-a=p-save]'); await pg.wait_for_timeout(300)
        check('Allow request creates the person', PEOPLE.get('new.person@forka.com', {}).get('status') == 'active' and REQ['new.person@forka.com']['state'] == 'approved')
        PEOPLE['store@kuwaitikitchen.com']['status'] = 'blocked'
        tok = await pg.evaluate("localStorage.getItem('fa-token')")
        SESS.clear(); await pg.reload(); await pg.wait_for_timeout(600)
        check('Expired session goes back to sign-in', await pg.locator('#gsi').count() == 1)
        await pg.click('[data-lang=ar]'); await pg.wait_for_timeout(200)
        check('Arabic works on the live sign-in', (await pg.get_attribute('html', 'dir')) == 'rtl')
        check('No page errors', not errs, errs[:2])
        # site must not fall back to preview when not configured
        ctx2 = await b.new_context()
        await ctx2.route('**/config.js', lambda r: r.fulfill(body="window.FORKA_APPS={MODE:'live',ACCOUNTS_URL:'',GOOGLE_CLIENT_ID:''};", content_type='application/javascript'))
        await ctx2.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
        p2 = await ctx2.new_page(); await p2.goto(URL); await p2.wait_for_timeout(500)
        txt = await p2.inner_text('body')
        check('Not configured yet -> "being set up", no sign-in at all', 'being set up' in txt and await p2.locator('[data-a=g-open]').count() == 0)
        await b.close()
    print(f'{sum(res)}/{len(res)} live checks passed'); sys.exit(0 if all(res) else 1)

asyncio.run(main())
