"""Forka Hire left menu: every item opens its page, the menu stays on the LEFT in Arabic, collapses to icons,
becomes a drawer on phones, and keeps the role rules. python3 tests/hire_sidebar_test.py"""
import asyncio, pathlib, subprocess, sys, time
ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.argv = [sys.argv[0]]
src = (ROOT / 'tests' / 'hiring_test.py').read_text().replace('asyncio.run(main())', '')
ht = {'__file__': str(ROOT / 'tests' / 'hiring_test.py')}; exec(compile(src, 'ht', 'exec'), ht)
from playwright.async_api import async_playwright
res = []
def check(n, ok, info=''):
    res.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' - ' + str(info)[:300]))
async def main():
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(ht['PORT']), '--bind', '127.0.0.1'], cwd=str(ROOT), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path=__import__('os').environ.get('PW_CHROMIUM') or None)
            async def page(w, h, lang='en', tok='TOKCEO-0000000000000000000', side='full'):
                ctx, pg, errs = await ht['ctx_for'](b, ht['CFG'], w, h, token=tok)
                await ctx.add_init_script(f"try{{localStorage.setItem('forkaHireLang','{lang}');localStorage.setItem('forkaHireSide','{side}')}}catch(e){{}}")
                await pg.goto(ht['BASE'] + '/hiring/'); await pg.wait_for_timeout(1300); return ctx, pg, errs
            ctx, pg, errs = await page(1440, 900)
            check('The menu is a left sidebar, not a top bar', await pg.locator('#side #nav a').count() >= 6 and await pg.locator('header #nav').count() == 0)
            labels = [x.strip() for x in await pg.locator('#nav .lb').all_inner_texts()]
            check('Same items, same names, same order', labels[:7] == ['Dashboard', 'CEO approvals', 'Hiring requests', 'Candidates', 'Talent pool & compliance', 'Careers page', 'Team & access'], labels)
            ok = True
            for i, pid in enumerate(await pg.evaluate('V.pages')):
                await pg.locator('#nav a').nth(i).click(); await pg.wait_for_timeout(150)
                if await pg.evaluate('V.page') != pid or 'on' not in (await pg.locator('#nav a').nth(i).get_attribute('class') or ''): ok = False
            check('Every item opens its own page and is marked as the current one', ok)
            check('Breadcrumb shows the page', 'Team & access' in await pg.inner_text('#crumb'))
            check('Header keeps language, role and View as; no Forka Apps duplicate there', await pg.locator('header #langSw').count() == 1 and await pg.locator('header .role').count() == 1 and await pg.locator('header select').count() == 1 and await pg.locator('header a[href]').count() == 0)
            check('Forka Apps is at the bottom of the menu', await pg.locator('#sideFoot a.sd-apps').count() == 1)
            w0 = (await pg.locator('#side').bounding_box())['width']
            await pg.click('#sdMini'); await pg.wait_for_timeout(300)
            w1 = (await pg.locator('#side').bounding_box())['width']; m1 = (await pg.locator('#shell').bounding_box())['width']
            check('Collapse: icons only, and the page grows to fill the space', w0 > 200 and w1 < 90 and m1 > 1300, (w0, w1, m1))
            check('Collapsed state is remembered', await pg.evaluate("localStorage.getItem('forkaHireSide')") == 'mini')
            await pg.click('#sdMini'); await ctx.close()
            ctx, pg, errs2 = await page(1440, 900, 'ar')
            sb = await pg.locator('#side').bounding_box(); sh = await pg.locator('#shell').bounding_box()
            check('Arabic: the menu stays on the LEFT and the page is right-to-left', sb['x'] < 5 and sh['x'] > 200 and await pg.evaluate("getComputedStyle(document.querySelector('#main')).direction") == 'rtl', (sb, sh))
            check('Arabic: menu items are translated', 'المرشحون' in await pg.inner_text('#nav'))
            await pg.evaluate("setLang('en')"); await pg.wait_for_timeout(200)
            check('Language switch still works', 'Candidates' in await pg.inner_text('#nav')); await ctx.close()
            ctx, pg, e3 = await page(1440, 900, tok='TOKCHEF-000000000000000000')
            check('Department head: no CEO approvals or Team & access in the menu', 'CEO approvals' not in await pg.inner_text('#nav') and 'Team & access' not in await pg.inner_text('#nav')); await ctx.close()
            ctx, pg, e4 = await page(390, 844)
            vis = (await pg.locator('#side').bounding_box())['x']
            check('Phone: the menu is hidden behind a menu button', vis < -100 and await pg.locator('.sd-burger').is_visible(), vis)
            await pg.click('.sd-burger'); await pg.wait_for_timeout(350)
            check('Phone: the button slides the menu out', (await pg.locator('#side').bounding_box())['x'] > -5)
            await pg.locator('#nav a').nth(3).click(); await pg.wait_for_timeout(350)
            check('Phone: choosing a page opens it and closes the menu', await pg.evaluate('V.page') == 'pipeline' and (await pg.locator('#side').bounding_box())['x'] < -100)
            check('No page errors', not (errs + errs2 + e3 + e4), (errs + errs2 + e3 + e4)[:3])
            await ctx.close(); await b.close()
    finally:
        srv.terminate()
    print(f'{sum(res)}/{len(res)} Hire menu checks passed'); sys.exit(0 if all(res) else 1)
asyncio.run(main())
