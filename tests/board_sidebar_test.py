"""Board left menu (same look as Hire): collapses to icons, stays on the LEFT in Arabic, Forka Apps at the bottom.
python3 tests/board_sidebar_test.py"""
import asyncio, os, pathlib, subprocess, sys, time
from playwright.async_api import async_playwright
ROOT = str(pathlib.Path(__file__).resolve().parent.parent); PORT = 8779; BASE = f'http://127.0.0.1:{PORT}'
res = []
def check(n, ok, info=''):
    res.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' - ' + str(info)[:300]))
async def main():
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=os.environ.get('SITE_ROOT', ROOT), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path=os.environ.get('PW_CHROMIUM') or None); errs = []
            async def page(w, h, lang='en'):
                ctx = await b.new_context(viewport={'width': w, 'height': h})
                await ctx.route('**/config.js*', lambda r: r.fulfill(body='', content_type='application/javascript'))
                await ctx.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
                await ctx.add_init_script("try{localStorage.setItem('fb-side','full')}catch(e){}")
                pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
                await pg.goto(BASE + '/boards/?demo'); await pg.wait_for_timeout(1200)
                if lang == 'ar': await pg.evaluate("lang='ar';render()")
                return ctx, pg
            ctx, pg = await page(1440, 900)
            await pg.click('[data-a=go][data-v=goals]'); await pg.wait_for_timeout(200)
            on = pg.locator('.side .nav.on')
            check('Current item is marked in the menu', await on.count() >= 1 and 'Goals' in await on.first.inner_text())
            check('Forka Apps at the bottom of the menu', await pg.locator('.side .bs-apps').count() == 1)
            nb = (await pg.locator('.side .newt').bounding_box())['height']
            check('New task button keeps its full height', nb >= 30, nb)
            w0 = (await pg.locator('.side').bounding_box())['width']; await pg.click('.bs-mini'); await pg.wait_for_timeout(200)
            w1 = (await pg.locator('.side').bounding_box())['width']
            check('Collapse to icons, remembered', w0 > 200 and w1 < 90 and await pg.evaluate("localStorage.getItem('fb-side')") == 'mini', (w0, w1))
            await pg.click('[data-a=go][data-v=projects]'); await pg.wait_for_timeout(200)
            check('Collapsed menu still opens pages', await pg.evaluate('V.view') == 'projects')
            await ctx.close()
            ctx, pg = await page(1440, 900, 'ar')
            sb = await pg.locator('.side').bounding_box()
            check('Arabic: the menu stays on the LEFT', sb['x'] < 5, sb); await ctx.close()
            ctx, pg = await page(390, 844, 'ar'); await pg.click('.menu-b'); await pg.wait_for_timeout(400)
            sb = await pg.locator('.side').bounding_box()
            check('Phone (Arabic): the drawer slides out from the left', sb['x'] < 5 and sb['width'] > 200, sb)
            check('No page errors', not errs, errs[:3]); await ctx.close(); await b.close()
    finally:
        srv.terminate()
    print(f'{sum(res)}/{len(res)} Board menu checks passed'); sys.exit(0 if all(res) else 1)
asyncio.run(main())
