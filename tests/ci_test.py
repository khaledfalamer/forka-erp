"""Forka Apps hub - automated checks (CI). Run: python3 ci_test.py"""
import asyncio, re, sys, pathlib
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = 'file://' + str(ROOT / 'index.html')
results = []
def check(name, ok, info=''):
    results.append((name, bool(ok), info)); print(('PASS ' if ok else 'FAIL ') + name + (' - ' + info if info and not ok else ''))

async def fresh(browser, w=1280, h=900):
    ctx = await browser.new_context(viewport={'width': w, 'height': h})
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'fonts' not in m.text else None)
    await pg.route('**/config.js', lambda r: r.fulfill(body='', content_type='application/javascript'))  # preview mode
    await pg.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    await ctx.route('**/claude.ai/**', lambda r: r.fulfill(body='<html><title>x</title></html>', content_type='text/html'))
    await ctx.route('**/khaledfalamer.github.io/**', lambda r: r.fulfill(body='<html><title>Procurement</title></html>', content_type='text/html'))
    await pg.goto(URL); await pg.wait_for_timeout(2300)
    return ctx, pg, errs

async def google(pg, email):
    await pg.click('[data-a=g-open]'); await pg.fill('#gmail', email); await pg.click('[data-a=g-go]'); await pg.wait_for_timeout(150)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx, pg, errs = await fresh(b)
        # 1 nothing private before sign-in
        body = await pg.inner_text('body')
        await pg.screenshot(path=str(ROOT/'tests'/'shots'/'s_gate.png'))
        check('Sign-in screen shows first', await pg.is_visible('[data-a=g-open]'))
        check('No app names or CEO numbers before sign-in', not any(w in body for w in ['Procurement', 'Today', 'Mohammad', 'Activity']))
        # 2 CEO sign in
        await google(pg, 'ceo@forka.com')
        check('CEO signs in', await pg.is_visible('#ceobox'))
        check('CEO sees Procurement tile', await pg.is_visible('[data-app=proc]'))
        check('CEO sees People and access', await pg.is_visible('[data-a=v-people]'))
        check('CEO can open Hiring (current page)', 'off' not in (await pg.get_attribute('[data-app=hire]', 'class')))
        async with ctx.expect_page() as np0:
            await pg.click('[data-app=hire]')
        hp = await np0.value
        check('Hiring tile opens the current Hiring page', 'claude.ai/artifact/Bn6y2FWinUhxH9AyVsu7BY' in hp.url, hp.url)
        await hp.close()
        await pg.screenshot(path=str(ROOT/'tests'/'shots'/'s_ceo_home.png'), full_page=True)
        # 3 people page, confirm Hamim
        await pg.click('[data-a=v-people]')
        rows = await pg.locator('tr.row').count()
        check('Team list has 10 people from the Sheet (incl. Hamim, Arman)', rows == 10, str(rows))
        t = await pg.inner_text('table')
        check('Hamim and Arman listed', 'store@kuwaitikitchen.com' in t and 'arman@kuwaitikitchen.com' in t)
        await pg.click('tr.row[data-pid="store@kuwaitikitchen.com"] [data-a=p-confirm]')
        st = await pg.inner_text('tr.row[data-pid="store@kuwaitikitchen.com"]')
        check('Confirm access makes Hamim active', 'Active' in st)
        await pg.screenshot(path=str(ROOT/'tests'/'shots'/'s_people.png'), full_page=True)
        # 4 change clearance for Arman: manager + add Branch Check + Finance side
        await pg.click('tr.row[data-pid="arman@kuwaitikitchen.com"] td >> nth=0')
        check('Edit panel opens', await pg.is_visible('#pm'))
        await pg.click('#pm [data-a=d-level][data-v=manager]')
        await pg.click('#pm [data-a=d-status][data-v=active]')
        await pg.click('#pm [data-a=d-app][data-v=branch]')
        await pg.click('#pm [data-a=d-side][data-v=fin]')
        await pg.screenshot(path=str(ROOT/'tests'/'shots'/'s_edit.png'))
        await pg.click('#pm [data-a=p-save]')
        row = await pg.inner_text('tr.row[data-pid="arman@kuwaitikitchen.com"]')
        check('Clearance change saved (Manager, Active, Branch Check, Finance)', all(x in row for x in ['Manager', 'Active', 'Branch Check', 'Finance']), row)
        await pg.screenshot(path=str(ROOT/'tests'/'shots'/'s_people.png'), full_page=True)
        # 5 add a person with missing fields -> red
        await pg.click('[data-a=p-add]'); await pg.click('#pm [data-a=p-save]')
        check('Empty add shows red fields', await pg.locator('#pm .miss').count() >= 2)
        await pg.fill('#pm [data-k=name]', 'Test Chef'); await pg.fill('#pm [data-k=email]', 'chef@kuwaitikitchen.com')
        await pg.click('#pm [data-a=d-app][data-v=proc]')
        sides = await pg.locator('#sides input:checked').count()
        check('Ticking Procurement defaults to Requests section', sides == 1)
        await pg.click('#pm [data-a=p-save]')
        check('New person added', await pg.locator('tr.row[data-pid="chef@kuwaitikitchen.com"]').count() == 1)
        # duplicate email
        await pg.click('[data-a=p-add]'); await pg.fill('#pm [data-k=name]', 'X'); await pg.fill('#pm [data-k=email]', 'chef@kuwaitikitchen.com'); await pg.click('#pm [data-a=p-save]')
        check('Duplicate email is refused', 'already' in (await pg.inner_text('#pm')))
        await pg.click('#pm [data-a=m-close]')
        # PIN person
        await pg.click('[data-a=p-add]'); await pg.fill('#pm [data-k=name]', 'Store Helper'); await pg.click('#pm [data-a=d-method][data-v=pin]')
        await pg.fill('#pm [data-k=pinNew]', '12'); await pg.click('#pm [data-a=p-save]')
        check('Short PIN refused', 'digits' in (await pg.inner_text('#pm')))
        await pg.fill('#pm [data-k=pinNew]', '482916'); await pg.click('#pm [data-a=d-app][data-v=branch]'); await pg.click('#pm [data-a=p-save]')
        check('PIN person added', 'Store Helper' in (await pg.inner_text('table')))
        # last CEO protection
        await pg.click('tr.row[data-pid="ceo@forka.com"] td >> nth=0'); await pg.click('#pm [data-a=d-level][data-v=staff]'); await pg.click('#pm [data-a=p-save]')
        check('Cannot remove the last CEO', 'at least one active CEO' in (await pg.inner_text('#pm')))
        await pg.click('#pm [data-a=m-close]')
        # 6 Hamim signs in: sees procurement only, no CEO box
        await pg.click('[data-a=out]'); await google(pg, 'store@kuwaitikitchen.com')
        check('Hamim signs in', await pg.is_visible('[data-app=proc]'))
        check('Hamim does NOT see CEO box', await pg.locator('#ceobox').count() == 0)
        check('Hamim does NOT see People/Activity', await pg.locator('[data-a=v-people]').count() == 0)
        check('Hamim sees only Procurement', await pg.locator('[data-app]').count() == 1)
        await pg.screenshot(path=str(ROOT/'tests'/'shots'/'s_staff_home.png'), full_page=True)
        # 6b staff with Hiring sees it but cannot open until it moves
        await pg.click('[data-a=out]'); await google(pg, 'ceo@forka.com'); await pg.click('[data-a=v-people]')
        await pg.click('tr.row[data-pid="hr@kuwaitikitchen.com"] [data-a=p-confirm]')
        await pg.click('[data-a=out]'); await google(pg, 'hr@kuwaitikitchen.com')
        check('Non-CEO sees Hiring as Moving here soon (not clickable)', 'off' in (await pg.get_attribute('[data-app=hire]', 'class')) and 'Moving here soon' in (await pg.inner_text('[data-app=hire]')))
        # 7 pending person blocked from entering
        await pg.click('[data-a=out]'); await google(pg, 'jennifer@forka.com')
        check('To-confirm person cannot enter yet', 'being confirmed' in (await pg.inner_text('.gcard')))
        # 8 unknown email requests access
        await pg.click('[data-a=g-start]'); await google(pg, 'new.person@forka.com')
        check('Unknown email gets request form', await pg.is_visible('#rq'))
        await pg.click('[data-a=r-send]')
        check('Request needs name and reason', await pg.locator('#rq .miss').count() == 2)
        await pg.fill('#rq [name=name]', 'Sara Ali'); await pg.fill('#rq [name=title]', 'Accountant'); await pg.fill('#rq [name=why]', 'Supplier payments')
        await pg.evaluate('render()')
        check('Typing survives a background redraw', (await pg.input_value('#rq [name=why]')) == 'Supplier payments')
        await pg.click('[data-a=r-send]')
        check('Request sent screen', 'Request sent' in (await pg.inner_text('.gcard')))
        await pg.click('[data-a=g-start]'); await google(pg, 'other.person@forka.com')
        await pg.fill('#rq [name=name]', 'Omar'); await pg.fill('#rq [name=why]', 'Test'); await pg.click('[data-a=r-send]')
        # 9 CEO approves one, rejects other
        await pg.click('[data-a=g-start]'); await google(pg, 'ceo@forka.com')
        kp = await pg.inner_text('#ceobox')
        check('CEO box counts the 2 waiting requests', re.search(r'\b2\s*\n\s*Access requests waiting', kp) is not None, kp)
        await pg.click('[data-a=v-people]')
        check('Waiting requests shown', await pg.locator('.req').count() == 2)
        await pg.click('[data-a=r-allow][data-id="new.person@forka.com"]')
        await pg.click('#pm [data-a=d-app][data-v=proc]'); await pg.click('#pm [data-a=d-side][data-v=dept]'); await pg.click('#pm [data-a=d-side][data-v=fin]')
        await pg.click('#pm [data-a=p-save]')
        check('Approved person is now active', 'Active' in (await pg.inner_text('tr.row[data-pid="new.person@forka.com"]')))
        await pg.click('[data-a=r-rej][data-id="other.person@forka.com"]'); await pg.fill('#rjw', 'Not part of the team'); await pg.click('[data-a=r-rejgo]')
        check('Rejected request removed from waiting', await pg.locator('.req').count() == 0)
        # block someone
        await pg.click('tr.row[data-pid="chef@kuwaitikitchen.com"] td >> nth=0'); await pg.click('#pm [data-a=d-block]')
        check('Block works', 'Blocked' in (await pg.inner_text('tr.row[data-pid="chef@kuwaitikitchen.com"]')))
        # activity
        await pg.click('[data-a=home]'); await pg.click('[data-a=v-act]')
        lg = await pg.inner_text('.log')
        check('Activity log records sign-ins, changes, approvals and rejections', all(x in lg for x in ['signed in', 'changed access for', 'allowed access for', 'rejected the request from', 'blocked', 'confirmed access for']), lg[:300])
        await pg.screenshot(path=str(ROOT/'tests'/'shots'/'s_activity.png'), full_page=True)
        # 10 approved / rejected / blocked / PIN sign-in flows
        await pg.click('[data-a=out]'); await google(pg, 'new.person@forka.com')
        check('Approved person can sign in and sees Finance', 'Finance' in (await pg.inner_text('[data-app=proc]')))
        await pg.click('[data-a=out]'); await google(pg, 'other.person@forka.com')
        check('Rejected person sees reason', 'Not part of the team' in (await pg.inner_text('.gcard')))
        await pg.click('[data-a=g-start]'); await google(pg, 'chef@kuwaitikitchen.com')
        check('Blocked person cannot enter', 'not allowed' in (await pg.inner_text('.gcard')))
        await pg.click('[data-a=g-start]'); await pg.click('[data-a=g-pin]'); await pg.fill('#gpin', '0000'); await pg.click('[data-a=p-go]')
        check('Wrong PIN refused', 'not right' in (await pg.inner_text('.gcard')))
        await pg.fill('#gpin', '482916'); await pg.click('[data-a=p-go]')
        check('PIN person signs in, sees Branch Check only', await pg.locator('[data-app]').count() == 1 and await pg.locator('[data-app=branch]').count() == 1)
        # 11 Procurement tile opens the live app
        await pg.click('[data-a=out]'); await google(pg, 'store@kuwaitikitchen.com')
        async with ctx.expect_page() as np:
            await pg.click('[data-app=proc]')
        newp = await np.value
        check('Procurement tile opens the current procurement app', 'khaledfalamer.github.io/Forka-Procurment' in newp.url, newp.url)
        await newp.close()
        # 12 Arabic
        await pg.wait_for_timeout(2000)
        check('Saved message goes away by itself', await pg.locator('.toast').count() == 0)
        await pg.click('[data-lang=ar]')
        check('Arabic switches to right-to-left', (await pg.get_attribute('html', 'dir')) == 'rtl' and 'المشتريات' in (await pg.inner_text('body')))
        await pg.screenshot(path=str(ROOT/'tests'/'shots'/'s_arabic.png'), full_page=True)
        await pg.click('[data-lang=en]')
        async def pos():
            return await pg.evaluate("[...document.querySelectorAll('.lang button')].map(b=>Math.round(b.getBoundingClientRect().x))")
        p_en = await pos(); await pg.click('[data-lang=ar]'); p_ar = await pos(); await pg.click('[data-lang=en]')
        check('Language switch stays in the same place (home)', p_en == p_ar, f'{p_en} vs {p_ar}')
        await pg.click('[data-a=out]')
        p_en = await pos(); await pg.click('[data-lang=ar]'); p_ar = await pos(); await pg.click('[data-lang=en]')
        check('Language switch stays in the same place (sign-in)', p_en == p_ar, f'{p_en} vs {p_ar}')
        check('No page errors (desktop)', not errs, '; '.join(errs[:3]))
        await ctx.close()
        # 13 mobile
        ctx, pg, errs = await fresh(b, 390, 844)
        await google(pg, 'ceo@forka.com')
        sw = await pg.evaluate('document.documentElement.scrollWidth')
        check('Phone: no sideways scrolling on home', sw <= 391, str(sw))
        tb = await pg.evaluate("document.querySelector('.top').getBoundingClientRect().height")
        check('Phone: top bar stays on one line', tb < 70, str(tb))
        await pg.screenshot(path=str(ROOT/'tests'/'shots'/'s_mobile.png'), full_page=True)
        await pg.click('[data-a=v-people]')
        sw = await pg.evaluate('document.documentElement.scrollWidth')
        check('Phone: no sideways scrolling on People', sw <= 391, str(sw))
        check('No page errors (phone)', not errs, '; '.join(errs[:3]))
        await ctx.close(); await b.close()
    # 14 secret scan
    src = (ROOT / 'index.html').read_text() + (ROOT / 'config.js').read_text()
    bad = [m for m in re.findall(r'(AIza[0-9A-Za-z_\-]{20,}|AKfyc[0-9A-Za-z_\-]{20,}|"pin"\s*:\s*"\d+"|pin:\s*\'\d+\'|GOCSPX-[0-9A-Za-z_\-]+)', src)]
    check('No PINs, keys or secrets in the code', not bad, str(bad))
    check('No emojis in the page', not re.search('[\U0001F300-\U0001FAFF☀-➿]', src))
    failed = [r for r in results if not r[1]]
    print(f'\n{len(results) - len(failed)}/{len(results)} checks passed')
    sys.exit(1 if failed else 0)

asyncio.run(main())
