"""Team guide (erp.forka.com/help) - browser checks. python3 tests/help_test.py"""
import asyncio, os, pathlib, re, subprocess, sys, time
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent; PORT = 8803; BASE = f'http://127.0.0.1:{PORT}'
res = []
def check(n, ok, info=''):
    res.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' - ' + str(info)[:300]))
async def main():
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path=os.environ.get('PW_CHROMIUM') or None)
            ctx = await b.new_context(viewport={'width': 1280, 'height': 900}); pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await ctx.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
            await pg.goto(BASE + '/help/'); await pg.wait_for_timeout(400)
            vis = lambda: pg.eval_on_selector_all('section:not(.hidden)', 'e=>e.map(x=>x.id)')
            check('Guide opens with every section for everyone', len(await vis()) == 11, await vis())
            await pg.click('[data-r=head]')
            check('"Department head" shows only what a head needs', await vis() == ['start', 'apps', 'head-proc', 'head-hire', 'help'], await vis())
            await pg.click('[data-r=store]')
            check('"Purchasing, store and finance" shows the three Procurement parts', await vis() == ['start', 'apps', 'buy', 'store', 'fin', 'help'], await vis())
            await pg.click('[data-l=ar]'); await pg.wait_for_timeout(150)
            h2 = await pg.locator('section:not(.hidden) h2').all_inner_texts()
            check('Arabic: right to left, headings in Arabic', await pg.get_attribute('html', 'dir') == 'rtl' and all(re.search('[؀-ۿ]', h) for h in h2), h2)
            body = await pg.inner_text('main')
            check('Arabic: no English sentences left (only names like Forka, Google, LPO, GRN)', not re.search(r'\b(the|and|your|press|open)\b', body, re.I), re.findall(r'\b(the|and|your|press|open)\b', body, re.I)[:5])
            await pg.screenshot(path=str(ROOT / 'tests' / 'shots' / 'help_ar.png'), full_page=False)
            await pg.goto(BASE + '/help/?lang=en#for-head'); await pg.wait_for_timeout(300)
            check('A link can open straight to one role (#for-head) in English', await vis() == ['start', 'apps', 'head-proc', 'head-hire', 'help'] and await pg.get_attribute('html', 'dir') == 'ltr')
            await pg.screenshot(path=str(ROOT / 'tests' / 'shots' / 'help_en.png'), full_page=False)
            check('No page errors', not errs, errs[:2]); await ctx.close()
            ctx = await b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True); pg = await ctx.new_page()
            await pg.goto(BASE + '/help/'); await pg.wait_for_timeout(300)
            check('Phone: no sideways scrolling', await pg.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
            await ctx.close()
            ctx = await b.new_context(); pg = await ctx.new_page()
            await ctx.route('**/config.js*', lambda r: r.fulfill(body='', content_type='application/javascript'))
            await pg.goto(BASE + '/'); await pg.wait_for_timeout(500)
            check('Forka Apps sign-in screen links to the guide', await pg.locator('a[href^="help/"]').count() >= 1)
            await ctx.close()
            src = (ROOT / 'help' / 'index.html').read_text(encoding='utf-8')
            check('No emojis', not re.search('[\U0001F300-\U0001FAFF☀-➿]', src))
            await b.close()
    finally: srv.terminate()
    print(f'{sum(res)}/{len(res)} guide checks passed'); sys.exit(0 if all(res) else 1)
asyncio.run(main())
