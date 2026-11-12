"""Forka Apps hub - automated checks (CI). Run: python3 ci_test.py"""
import asyncio, os, re, sys, pathlib
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = 'file://' + str(ROOT / 'index.html')
# Snapshot of the app cards (outerHTML of every .apps grid) and their computed look, taken from the launcher
# before the suite header was added (12 Nov 2026). Khaled: the cards stay exactly as they are (brief 2.2).
APPS_SNAPSHOT = {
 "ceo_en": [
  "<div class=\"apps\"><button class=\"app\" style=\"--c:#a8703d\" data-app=\"proc\"><div class=\"ic\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5.5 8h13l-1.2 12H6.7L5.5 8z\"></path><path d=\"M9 8V6.5a3 3 0 0 1 6 0V8\"></path></svg></div><h3>Procurement</h3><p>Purchase plan, requests, LPOs, receiving and supplier payments.</p><div class=\"meta\">Purchasing · Operations · Finance · Requests · CEO approvals · Oman store</div><span class=\"go\">Open <i>→</i></span></button><button class=\"app\" style=\"--c:#2c7a76\" data-app=\"hire\"><div class=\"ic\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"9\" cy=\"8.5\" r=\"3.2\"></circle><path d=\"M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6\"></path><path d=\"M15.5 5.3a3.2 3.2 0 0 1 0 6.4\"></path><path d=\"M17.5 14.4c2.1.8 3.5 2.9 3.5 5.6\"></path></svg></div><h3>Hiring</h3><p>Job openings, candidates and interviews.</p><span class=\"soon gold\">Current version - only you can open it until it moves here</span><span class=\"go\">Open <i>→</i></span></button><button class=\"app\" style=\"--c:#5f8a45\" data-app=\"branch\"><div class=\"ic\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"5\" y=\"4.5\" width=\"14\" height=\"16.5\" rx=\"2.2\"></rect><path d=\"M9 4.5h6V7H9z\"></path><path d=\"M8.8 13.6l2.2 2.2 4.3-4.3\"></path></svg></div><h3>Branch Check</h3><p>Daily branch checks and follow-ups.</p><span class=\"soon gold\">Current version - only you can open it until it moves here</span><span class=\"go\">Open <i>→</i></span></button></div>",
  "<div class=\"apps\"><button class=\"app adm\" style=\"--c:#7b4e6e\" data-a=\"v-people\"><div class=\"ic\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 3.2l7 3v5.2c0 4.4-2.9 8.3-7 9.6-4.1-1.3-7-5.2-7-9.6V6.2l7-3z\"></path><path d=\"M9.3 12.2l2 2 3.6-3.6\"></path></svg></div><h3>People and access</h3><p>Add people, set clearance and apps, approve requests.</p><span class=\"badge\">9</span></button><button class=\"app adm\" style=\"--c:#3e5c8a\" data-a=\"v-act\"><div class=\"ic\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 12.5h4l2.6-7 4.6 14 2.6-7H21\"></path></svg></div><h3>Activity</h3><p>Who did what, and when.</p></button></div>"
 ],
 "ceo_ar": [
  "<div class=\"apps\"><button class=\"app\" style=\"--c:#a8703d\" data-app=\"proc\"><div class=\"ic\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5.5 8h13l-1.2 12H6.7L5.5 8z\"></path><path d=\"M9 8V6.5a3 3 0 0 1 6 0V8\"></path></svg></div><h3>المشتريات</h3><p>خطة الشراء والطلبات وأوامر الشراء والاستلام ودفعات الموردين.</p><div class=\"meta\">المشتريات · العمليات · المالية · الطلبات · موافقات الرئيس التنفيذي · مخزن عُمان</div><span class=\"go\">فتح <i>→</i></span></button><button class=\"app\" style=\"--c:#2c7a76\" data-app=\"hire\"><div class=\"ic\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"9\" cy=\"8.5\" r=\"3.2\"></circle><path d=\"M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6\"></path><path d=\"M15.5 5.3a3.2 3.2 0 0 1 0 6.4\"></path><path d=\"M17.5 14.4c2.1.8 3.5 2.9 3.5 5.6\"></path></svg></div><h3>التوظيف</h3><p>الوظائف الشاغرة والمرشحون والمقابلات.</p><span class=\"soon gold\">النسخة الحالية - تفتح لك فقط حتى تنقل هنا</span><span class=\"go\">فتح <i>→</i></span></button><button class=\"app\" style=\"--c:#5f8a45\" data-app=\"branch\"><div class=\"ic\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"5\" y=\"4.5\" width=\"14\" height=\"16.5\" rx=\"2.2\"></rect><path d=\"M9 4.5h6V7H9z\"></path><path d=\"M8.8 13.6l2.2 2.2 4.3-4.3\"></path></svg></div><h3>متابعة الفروع</h3><p>فحص الفروع اليومي والمتابعة.</p><span class=\"soon gold\">النسخة الحالية - تفتح لك فقط حتى تنقل هنا</span><span class=\"go\">فتح <i>→</i></span></button></div>",
  "<div class=\"apps\"><button class=\"app adm\" style=\"--c:#7b4e6e\" data-a=\"v-people\"><div class=\"ic\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 3.2l7 3v5.2c0 4.4-2.9 8.3-7 9.6-4.1-1.3-7-5.2-7-9.6V6.2l7-3z\"></path><path d=\"M9.3 12.2l2 2 3.6-3.6\"></path></svg></div><h3>الأشخاص والصلاحيات</h3><p>إضافة الأشخاص وتحديد الصلاحيات والتطبيقات والموافقة على الطلبات.</p><span class=\"badge\">9</span></button><button class=\"app adm\" style=\"--c:#3e5c8a\" data-a=\"v-act\"><div class=\"ic\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M3 12.5h4l2.6-7 4.6 14 2.6-7H21\"></path></svg></div><h3>سجل النشاط</h3><p>من فعل ماذا ومتى.</p></button></div>"
 ],
 "staff_en": [
  "<div class=\"apps\"><button class=\"app\" style=\"--c:#a8703d\" data-app=\"proc\"><div class=\"ic\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5.5 8h13l-1.2 12H6.7L5.5 8z\"></path><path d=\"M9 8V6.5a3 3 0 0 1 6 0V8\"></path></svg></div><h3>Procurement</h3><p>Purchase plan, requests, LPOs, receiving and supplier payments.</p><div class=\"meta\">Purchasing</div><span class=\"go\">Open <i>→</i></span></button></div>"
 ]
}
CARD_STYLE_SNAPSHOT = [{"card": {"width": "272.5px", "height": "289.5px", "backgroundImage": "radial-gradient(420px 160px at 100% 0%, color(srgb 0.658824 0.439216 0.239216 / 0.12), rgba(0, 0, 0, 0) 70%), linear-gradient(170deg, rgb(255, 255, 255), rgb(253, 250, 245))", "borderTopColor": "rgb(235, 225, 211)", "borderRadius": "20px", "boxShadow": "rgba(60, 40, 20, 0.5) 0px 14px 34px -26px"}, "h3": {"fontFamily": "\"EB Garamond\", \"IBM Plex Sans Arabic\", serif", "fontSize": "23px", "color": "rgb(35, 33, 31)", "fontWeight": "600"}, "p": {"fontFamily": "\"Inter Tight\", \"IBM Plex Sans Arabic\", system-ui, sans-serif", "fontSize": "13.5px", "color": "rgb(92, 88, 82)"}, "ic": {"width": "56px", "height": "56px", "backgroundImage": "linear-gradient(145deg, color(srgb 0.727059 0.551373 0.391373), rgb(168, 112, 61) 55%, color(srgb 0.461176 0.307451 0.167451))", "borderRadius": "16px"}}, {"card": {"width": "272.5px", "height": "289.5px", "backgroundImage": "radial-gradient(420px 160px at 100% 0%, color(srgb 0.172549 0.478431 0.462745 / 0.12), rgba(0, 0, 0, 0) 70%), linear-gradient(170deg, rgb(255, 255, 255), rgb(253, 250, 245))", "borderTopColor": "rgb(235, 225, 211)", "borderRadius": "20px", "boxShadow": "rgba(60, 40, 20, 0.5) 0px 14px 34px -26px"}, "h3": {"fontFamily": "\"EB Garamond\", \"IBM Plex Sans Arabic\", serif", "fontSize": "23px", "color": "rgb(35, 33, 31)", "fontWeight": "600"}, "p": {"fontFamily": "\"Inter Tight\", \"IBM Plex Sans Arabic\", system-ui, sans-serif", "fontSize": "13.5px", "color": "rgb(92, 88, 82)"}, "ic": {"width": "56px", "height": "56px", "backgroundImage": "linear-gradient(145deg, color(srgb 0.338039 0.582745 0.570196), rgb(44, 122, 118) 55%, color(srgb 0.120784 0.334902 0.323922))", "borderRadius": "16px"}}, {"card": {"width": "272.5px", "height": "289.5px", "backgroundImage": "radial-gradient(420px 160px at 100% 0%, color(srgb 0.372549 0.541176 0.270588 / 0.12), rgba(0, 0, 0, 0) 70%), linear-gradient(170deg, rgb(255, 255, 255), rgb(253, 250, 245))", "borderTopColor": "rgb(235, 225, 211)", "borderRadius": "20px", "boxShadow": "rgba(60, 40, 20, 0.5) 0px 14px 34px -26px"}, "h3": {"fontFamily": "\"EB Garamond\", \"IBM Plex Sans Arabic\", serif", "fontSize": "23px", "color": "rgb(35, 33, 31)", "fontWeight": "600"}, "p": {"fontFamily": "\"Inter Tight\", \"IBM Plex Sans Arabic\", system-ui, sans-serif", "fontSize": "13.5px", "color": "rgb(92, 88, 82)"}, "ic": {"width": "56px", "height": "56px", "backgroundImage": "linear-gradient(145deg, color(srgb 0.498039 0.632941 0.416471), rgb(95, 138, 69) 55%, color(srgb 0.260784 0.378824 0.189412))", "borderRadius": "16px"}}, {"card": {"width": "272.5px", "height": "210px", "backgroundImage": "radial-gradient(420px 160px at 100% 0%, color(srgb 0.482353 0.305882 0.431373 / 0.12), rgba(0, 0, 0, 0) 70%), linear-gradient(170deg, rgb(255, 255, 255), rgb(253, 250, 245))", "borderTopColor": "rgb(235, 225, 211)", "borderRadius": "20px", "boxShadow": "rgba(60, 40, 20, 0.5) 0px 14px 34px -26px"}, "h3": {"fontFamily": "\"EB Garamond\", \"IBM Plex Sans Arabic\", serif", "fontSize": "23px", "color": "rgb(35, 33, 31)", "fontWeight": "600"}, "p": {"fontFamily": "\"Inter Tight\", \"IBM Plex Sans Arabic\", system-ui, sans-serif", "fontSize": "13.5px", "color": "rgb(92, 88, 82)"}, "ic": {"width": "56px", "height": "56px", "backgroundImage": "linear-gradient(145deg, color(srgb 0.585882 0.444706 0.545098), rgb(123, 78, 110) 55%, color(srgb 0.337647 0.214118 0.301961))", "borderRadius": "16px"}}, {"card": {"width": "272.5px", "height": "210px", "backgroundImage": "radial-gradient(420px 160px at 100% 0%, color(srgb 0.243137 0.360784 0.541176 / 0.12), rgba(0, 0, 0, 0) 70%), linear-gradient(170deg, rgb(255, 255, 255), rgb(253, 250, 245))", "borderTopColor": "rgb(235, 225, 211)", "borderRadius": "20px", "boxShadow": "rgba(60, 40, 20, 0.5) 0px 14px 34px -26px"}, "h3": {"fontFamily": "\"EB Garamond\", \"IBM Plex Sans Arabic\", serif", "fontSize": "23px", "color": "rgb(35, 33, 31)", "fontWeight": "600"}, "p": {"fontFamily": "\"Inter Tight\", \"IBM Plex Sans Arabic\", system-ui, sans-serif", "fontSize": "13.5px", "color": "rgb(92, 88, 82)"}, "ic": {"width": "56px", "height": "56px", "backgroundImage": "linear-gradient(145deg, color(srgb 0.39451 0.488627 0.632941), rgb(62, 92, 138) 55%, color(srgb 0.170196 0.252549 0.378824))", "borderRadius": "16px"}}]
CARDS_HTML = "[...document.querySelectorAll('.apps')].map(e=>e.outerHTML)"
CARDS_STYLE = """()=>[...document.querySelectorAll('.apps .app')].map(e=>{const s=getComputedStyle(e);const g=(el,ks)=>el?Object.fromEntries(ks.map(k=>[k,getComputedStyle(el)[k]])):null;
 return {card:g(e,['width','height','backgroundImage','borderTopColor','borderRadius','boxShadow']),h3:g(e.querySelector('h3'),['fontFamily','fontSize','color','fontWeight']),
 p:g(e.querySelector('p'),['fontFamily','fontSize','color']),ic:g(e.querySelector('.ic'),['width','height','backgroundImage','borderRadius'])}})"""
SIZES = [(390, 844), (768, 1024), (1024, 768), (1366, 900)]
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
    await ctx.route('**/procurement.forka.com/**', lambda r: r.fulfill(body='<html><title>Procurement</title></html>', content_type='text/html'))
    await pg.goto(URL); await pg.wait_for_timeout(2300)
    return ctx, pg, errs

async def google(pg, email):
    await pg.click('[data-a=g-open]'); await pg.fill('#gmail', email); await pg.click('[data-a=g-go]'); await pg.wait_for_timeout(150)

# Signed in, Sign out now lives in the suite header's user menu (it replaced the old top bar's [data-a=out] button).
async def signout(pg):
    await pg.click('[data-fs=user]'); await pg.click('[data-fs=signout]'); await pg.wait_for_timeout(100)

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
        check('App cards unchanged: CEO cards and admin tiles, same markup and text as before the header', await pg.evaluate(CARDS_HTML) == APPS_SNAPSHOT['ceo_en'])
        who = await pg.inner_text('.fs-head .fs-who') if await pg.is_visible('.fs-head .fs-who') else ''
        check('Suite header shows the name and the level in words', 'Khaled Alamer' in who and 'CEO' in who, who)
        check('Old top bar replaced by the suite header', await pg.locator('.top').count() == 0 and await pg.locator('.fs-head').count() == 1)
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
        await signout(pg); await google(pg, 'store@kuwaitikitchen.com')
        check('Hamim signs in', await pg.is_visible('[data-app=proc]'))
        check('Hamim does NOT see CEO box', await pg.locator('#ceobox').count() == 0)
        check('Hamim does NOT see People/Activity', await pg.locator('[data-a=v-people]').count() == 0)
        check('Hamim sees only Procurement', await pg.locator('[data-app]').count() == 1)
        check('App cards unchanged: staff card same markup and text as before the header', await pg.evaluate(CARDS_HTML) == APPS_SNAPSHOT['staff_en'])
        check('Staff header shows name and level', 'Hamim' in (await pg.inner_text('.fs-who')) and 'Staff' in (await pg.inner_text('.fs-who')))
        await pg.screenshot(path=str(ROOT/'tests'/'shots'/'s_staff_home.png'), full_page=True)
        # 6b staff with Hiring sees it but cannot open until it moves
        await signout(pg); await google(pg, 'ceo@forka.com'); await pg.click('[data-a=v-people]')
        await pg.click('tr.row[data-pid="hr@kuwaitikitchen.com"] [data-a=p-confirm]')
        await signout(pg); await google(pg, 'hr@kuwaitikitchen.com')
        check('Non-CEO sees Hiring as Moving here soon (not clickable)', 'off' in (await pg.get_attribute('[data-app=hire]', 'class')) and 'Moving here soon' in (await pg.inner_text('[data-app=hire]')))
        # 7 pending person blocked from entering
        await signout(pg); await google(pg, 'jennifer@forka.com')
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
        await signout(pg); await google(pg, 'new.person@forka.com')
        check('Approved person can sign in and sees Finance', 'Finance' in (await pg.inner_text('[data-app=proc]')))
        await signout(pg); await google(pg, 'other.person@forka.com')
        check('Rejected person sees reason', 'Not part of the team' in (await pg.inner_text('.gcard')))
        await pg.click('[data-a=g-start]'); await google(pg, 'chef@kuwaitikitchen.com')
        check('Blocked person cannot enter', 'not allowed' in (await pg.inner_text('.gcard')))
        await pg.click('[data-a=g-start]'); await pg.click('[data-a=g-pin]'); await pg.fill('#gpin', '0000'); await pg.click('[data-a=p-go]')
        check('Wrong PIN refused', 'not right' in (await pg.inner_text('.gcard')))
        await pg.fill('#gpin', '482916'); await pg.click('[data-a=p-go]')
        check('PIN person signs in, sees Branch Check only', await pg.locator('[data-app]').count() == 1 and await pg.locator('[data-app=branch]').count() == 1)
        # 11 Procurement tile opens the live app
        await signout(pg); await google(pg, 'store@kuwaitikitchen.com')
        async with ctx.expect_page() as np:
            await pg.click('[data-app=proc]')
        newp = await np.value
        check('Procurement tile opens the current procurement app', 'procurement.forka.com' in newp.url, newp.url)
        await newp.close()
        # 12 Arabic
        await pg.wait_for_timeout(2000)
        check('Saved message goes away by itself', await pg.locator('.toast').count() == 0)
        await pg.click('[data-fs-lang=ar]')   # signed in: the suite header's EN/AR switch replaced the old [data-lang] one
        check('Arabic switches to right-to-left', (await pg.get_attribute('html', 'dir')) == 'rtl' and 'المشتريات' in (await pg.inner_text('body')))
        await pg.screenshot(path=str(ROOT/'tests'/'shots'/'s_arabic.png'), full_page=True)
        await pg.click('[data-fs-lang=en]')
        async def pos(sel='.lang button'):
            return await pg.evaluate("[...document.querySelectorAll('" + sel + "')].map(b=>Math.round(b.getBoundingClientRect().x))")
        # home: the suite header mirrors fully in Arabic (brief 1.4), so the switch moves with it; it must stay whole and inside the header
        async def lang_box():
            return await pg.evaluate("(()=>{const h=document.querySelector('.fs-head').getBoundingClientRect(),l=document.querySelector('.fs-lang').getBoundingClientRect(),m=document.querySelector('.fs-mark').getBoundingClientRect();return {inside:l.left>=h.left&&l.right<=h.right,w:Math.round(l.width),markRight:m.left>h.width/2}})()")
        b_en = await lang_box(); await pg.click('[data-fs-lang=ar]'); b_ar = await lang_box(); await pg.click('[data-fs-lang=en]')
        check('Language switch whole and inside the header in EN and AR; header mirrors in Arabic (home)', b_en['inside'] and b_ar['inside'] and b_en['w'] == b_ar['w'] and not b_en['markRight'] and b_ar['markRight'], f'{b_en} vs {b_ar}')
        await signout(pg)
        p_en = await pos(); await pg.click('[data-lang=ar]'); p_ar = await pos(); await pg.click('[data-lang=en]')
        check('Language switch stays in the same place (sign-in)', p_en == p_ar, f'{p_en} vs {p_ar}')
        # Hire / Boards / Procurement sign out through erp.forka.com/#signout
        await google(pg, 'ceo@forka.com')
        n_out = "Object.values(DATA.activity).filter(x=>x.verb==='signout'&&x.by==='ceo@forka.com').length"
        lg0 = await pg.evaluate(n_out)
        await pg.evaluate("location.hash='#signout'"); await pg.wait_for_timeout(200)
        lg_out = await pg.evaluate(n_out) - lg0
        check('#signout signs out like the Sign out button and clears the hash', await pg.is_visible('[data-a=g-open]') and await pg.evaluate('location.hash') == ''
              and await pg.evaluate("sessionStorage.getItem('fa-me')") is None and lg_out == 1, str(lg_out))
        check('No page errors (desktop)', not errs, '; '.join(errs[:3]))
        await ctx.close()
        ctx, pg, errs = await fresh(b)
        await pg.goto(URL + '#signout'); await pg.wait_for_timeout(600)
        check('Opening erp.forka.com/#signout shows the sign-in screen and clears the hash', await pg.is_visible('[data-a=g-open]') and await pg.evaluate('location.hash') == '')
        await ctx.close()
        # 12b cards look the same (computed size and colours), Arabic markup, no sideways scroll at 4 sizes in EN and AR
        for (w, h) in SIZES:
            ctx, pg, errs = await fresh(b, w, h)
            await google(pg, 'ceo@forka.com')
            if (w, h) == (1366, 900):
                # sizes in pixels depend on the machine's fonts (GitHub's runner differs from a laptop), so compare colours, borders,
                # corners, shadows and fonts only; the markup check above already proves the cards' content and structure are unchanged
                def no_size(v):
                    if isinstance(v, dict): return {k: no_size(x) for k, x in v.items() if k not in ('width', 'height')}
                    if isinstance(v, list): return [no_size(x) for x in v]
                    return v
                check('App cards unchanged: colours, borders, corners and fonts (1366)', no_size(await pg.evaluate(CARDS_STYLE)) == no_size(CARD_STYLE_SNAPSHOT))
            for lg in ['en', 'ar']:
                await pg.click(f'[data-fs-lang={lg}]'); await pg.wait_for_timeout(100)
                if lg == 'ar' and (w, h) == (1366, 900):
                    check('App cards unchanged in Arabic (markup and text)', await pg.evaluate(CARDS_HTML) == APPS_SNAPSHOT['ceo_ar'])
                bad = []
                for v in ['home', 'v-people', 'v-act']:
                    if v != 'home': await pg.click(f'[data-a={v}]'); await pg.wait_for_timeout(100)
                    sw = await pg.evaluate('document.documentElement.scrollWidth')
                    hd = await pg.evaluate("(h=>[h.scrollWidth,h.clientWidth,h.getBoundingClientRect().height])(document.querySelector('.fs-head'))")
                    if sw > w or hd[0] > hd[1] + 1: bad.append(f'{v}: page {sw}, header {hd[0]}/{hd[1]}')
                    if v != 'home': await pg.click('.back[data-a=home]'); await pg.wait_for_timeout(100)
                check(f'No sideways scroll, header fits ({w}x{h} {lg.upper()}, home/people/activity)', not bad, '; '.join(bad))
                lw = await pg.evaluate("(g=>[g.scrollWidth,g.clientWidth])(document.querySelector('.fs-lang'))")
                await pg.click('[data-fs=user]'); await pg.wait_for_timeout(50)
                um = await pg.evaluate("(r=>[r.left,r.right])(document.querySelector('[data-fs-pop=user]').getBoundingClientRect())")
                await pg.keyboard.press('Escape')
                check(f'EN/AR switch not squeezed and user menu inside the screen ({w}x{h} {lg.upper()})', lw[0] <= lw[1] and um[0] >= 0 and um[1] <= w, f'{lw} {um}')
                if w < 640: check(f'Phone header under 70px ({lg.upper()})', hd[2] < 70, str(hd[2]))
            check(f'No page errors ({w}x{h})', not errs, '; '.join(errs[:3]))
            await ctx.close()
        # 13 mobile
        ctx, pg, errs = await fresh(b, 390, 844)
        await google(pg, 'ceo@forka.com')
        sw = await pg.evaluate('document.documentElement.scrollWidth')
        check('Phone: no sideways scrolling on home', sw <= 391, str(sw))
        tb = await pg.evaluate("document.querySelector('.fs-head').getBoundingClientRect().height")   # the suite header replaced .top
        check('Phone: top bar stays on one line', tb < 70, str(tb))
        await pg.screenshot(path=str(ROOT/'tests'/'shots'/'s_mobile.png'), full_page=True)
        await pg.click('[data-a=v-people]')
        sw = await pg.evaluate('document.documentElement.scrollWidth')
        check('Phone: no sideways scrolling on People', sw <= 391, str(sw))
        check('No page errors (phone)', not errs, '; '.join(errs[:3]))
        await ctx.close(); await b.close()
    # 14 secret scan
    src = (ROOT / 'index.html').read_text() + (ROOT / 'config.js').read_text()
    bad = [m for m in re.findall(r'(AIza[0-9A-Za-z_\-]{20,}|"pin"\s*:\s*"\d+"|pin:\s*\'\d+\'|GOCSPX-[0-9A-Za-z_\-]+)', src)]
    check('No PINs, keys or secrets in the code', not bad, str(bad))
    check('No emojis in the page', not re.search('[\U0001F300-\U0001FAFF☀-➿]', src))
    # the shared suite files are identical in forka-erp and Forka-Procurment: both repos check them against suite/SUITE_SHA256
    import hashlib
    want = dict(l.split()[::-1] for l in open(os.path.join(ROOT, 'suite', 'SUITE_SHA256')).read().split('\n') if l.strip())
    got = {n: hashlib.sha256(open(os.path.join(ROOT, 'suite', n), 'rb').read()).hexdigest() for n in want}
    check('Suite files match suite/SUITE_SHA256 (same copy as in Procurement)', want == got and set(want) == {'suite.js', 'suite.css'}, got)
    suite_src = open(os.path.join(ROOT, 'suite', 'suite.js'), encoding='utf-8').read() + open(os.path.join(ROOT, 'suite', 'suite.css'), encoding='utf-8').read()
    check('No emojis in the suite files', not re.search('[\U0001F300-\U0001FAFF☀-➿]', suite_src))
    failed = [r for r in results if not r[1]]
    print(f'\n{len(results) - len(failed)}/{len(results)} checks passed')
    sys.exit(1 if failed else 0)

asyncio.run(main())
