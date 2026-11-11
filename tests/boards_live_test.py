"""Forka Boards signed in (live mode): several people in separate browsers, against server/Boards.gs run locally. python3 tests/boards_live_test.py"""
import asyncio, os, pathlib, subprocess, sys, time, json, urllib.request
from playwright.async_api import async_playwright
ROOT = str(pathlib.Path(__file__).resolve().parent.parent); OUT = ROOT + '/tests/shots'
WEB, API = 8790, 8791; URL = f'http://erp.test:{WEB}/boards/'
CFG = "window.FORKA_APPS={MODE:'live',BOARDS_URL:'http://127.0.0.1:%d/exec',ERP_HOME:'http://erp.test:%d/'};" % (API, WEB)
TOK = {'ceo': 'TOKCEO-00000000000000000000', 'ruby': 'TOKRUBY-0000000000000000000', 'tah': 'TOKTAH-00000000000000000000', 'des': 'TOKDES-00000000000000000000'}
res = []
def check(n, ok, info=''):
    res.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' - ' + str(info)[:300]))

async def main():
    web = subprocess.Popen([sys.executable, '-m', 'http.server', str(WEB), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    api = subprocess.Popen(['node', ROOT + '/tests/boards_fake_server.js', str(API)]); time.sleep(1.2)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path=os.environ.get('PW_CHROMIUM') or None, args=[f'--host-resolver-rules=MAP erp.test 127.0.0.1'])
            errs = []
            async def person(who):
                ctx = await b.new_context(viewport={'width': 1440, 'height': 900})
                await ctx.route('**/config.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body=CFG))
                if who: await ctx.add_init_script(f"try{{localStorage.setItem('fa-token','{TOK[who]}')}}catch(e){{}}")
                pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(who + ': ' + str(e)))
                await pg.goto(URL); await pg.wait_for_timeout(900); return pg
            async def saved(pg):
                await pg.wait_for_function("SV.ready&&!SV.busy&&!Object.keys(SV.pend).length", timeout=8000); await pg.wait_for_timeout(100)
            async def refresh(pg):
                await pg.evaluate('pull(true)'); await pg.wait_for_timeout(300)

            anon = await person(None)
            check('Not signed in: asked to sign in at Forka Apps first', 'sign in at Forka Apps' in await anon.inner_text('body') and await anon.locator('a.btn[href="http://erp.test:%d/"]' % WEB).count() == 1)
            await anon.screenshot(path=OUT + '/boards_live_signin.png')

            ceo = await person('ceo')
            check('Signed in: opens with real data, no "View as", shows Saved', await ceo.locator('#viewas').count() == 0 and 'Saved' in await ceo.inner_text('#sync') and 'Company progress' in await ceo.inner_text('.page'))
            await ceo.click('.side [data-a=go][data-v=people]'); await ceo.wait_for_timeout(100)
            check('People come from Forka Apps accounts (new people: not in a department yet)', 'Ruby Ann Margate' in await ceo.inner_text('.page') and 'Not in a department yet' in await ceo.inner_text('.page'))
            for name, dep, role in [('Ruby Ann Margate', 'adm', 'head'), ('Tahani Alamer', 'mkt', 'head'), ('Sara Designer', 'mkt', 'staff')]:
                await ceo.click(f'.pcard:has-text("{name}")'); await ceo.select_option(f'.prd[data-d={dep}]', role); await ceo.wait_for_timeout(100)
                await ceo.keyboard.press('Escape')
            await saved(ceo)
            check('The CEO sets departments and heads on the People page (saved to the server)', 'Executive & Administration' in await ceo.inner_text('.page') and 'Department head' in await ceo.inner_text('.pcard:has-text("Ruby Ann Margate")'))
            await ceo.screenshot(path=OUT + '/boards_live_people.png')

            ruby = await person('ruby')
            ids = await ruby.eval_on_selector_all('.side [data-a=dept]', 'e=>e.map(x=>x.dataset.id)')
            check('Ruby signs in as head of Executive & Administration', ids == ['adm'], ids)
            await ruby.click('.side [data-a=spnew]'); await ruby.fill('#sp-en', 'Events'); await ruby.click('[data-a=spsave]'); await saved(ruby)
            ids = await ruby.eval_on_selector_all('.side [data-a=dept]', 'e=>e.map(x=>x.dataset.id)')
            check('Ruby creates her own space "Events" (saved on the server) and becomes its head', len(ids) == 2 and 'Events' in await ruby.inner_text('.side') and await ruby.evaluate("isHd(meP(),dlist(meP()).find(d=>d!=='adm'))"), ids)
            await refresh(ceo); await ceo.click('.side [data-a=go][data-v=people]')
            check('The CEO sees the new space', 'Events' in await ceo.inner_text('.page'))
            await ruby.click('.side [data-a=dept][data-id=adm]')
            await ruby.click('.side [data-a=dept][data-id=adm]'); await ruby.click('[data-a=bnew-open]'); await ruby.fill('#newb', 'Admin Weekly'); await ruby.click('[data-a=bnew]'); await ruby.wait_for_timeout(200)
            await ruby.click('[data-a=newtask]'); await ruby.fill('#nt-title', 'Book the quarterly review'); await ruby.click('.ntf [data-a=ntm][data-v="admin@forka.com"]'); await ruby.fill('#nt-due', '2026-12-01'); await ruby.click('[data-a=ntgo]'); await ruby.wait_for_timeout(200)
            await ruby.click('.card:has-text("Book the quarterly review")')
            png = bytes.fromhex('89504e470d0a1a0a0000000d4948445200000002000000020802000000fdd49a730000001549444154789c63f8cfc0f01f0418c0c0000004000affffd52d2b4e0000000049454e44ae426082')
            await ruby.set_input_files('#fileup', files=[{'name': 'agenda.png', 'mimeType': 'image/png', 'buffer': png}]); await ruby.wait_for_timeout(1200)
            await ruby.keyboard.press('Escape'); await saved(ruby)
            check('Ruby creates a board and a task, and attaches a photo (to the private Drive folder)', await ruby.locator('.card:has-text("Book the quarterly review") img.cover').count() == 1)

            await refresh(ceo)
            await ceo.click('.side [data-a=dept][data-id=adm]'); await ceo.wait_for_timeout(100)
            check('The CEO sees Ruby\'s new board without reloading', 'Admin Weekly' in await ceo.inner_text('.page'))
            await ceo.click('.tile:has(h3:text-is("Admin Weekly"))'); await ceo.click('.card:has-text("Book the quarterly review")'); await ceo.wait_for_timeout(1500)
            src = await ceo.get_attribute('.att img.th', 'src')
            check('...and opens the photo Ruby attached', (src or '').startswith('blob:'), src)
            await ceo.fill('#cmt', 'Please invite all heads.'); await ceo.click('[data-a=cmt]'); await ceo.keyboard.press('Escape'); await saved(ceo)
            await ceo.click('[data-a=newtask]'); await ceo.fill('#nt-title', 'Prepare the board pack'); await ceo.click('.ntf [data-a=ntm][data-v="admin@forka.com"]'); await ceo.fill('#nt-due', '2026-12-03'); await ceo.click('[data-a=ntgo]'); await saved(ceo)
            mails = json.loads(urllib.request.urlopen(f'http://127.0.0.1:{API}/mails').read())
            check('Ruby gets an email when the CEO gives her a task', any(m['to'] == 'admin@forka.com' and 'Prepare the board pack' in m['subject'] for m in mails), mails)
            await refresh(ruby)
            await ruby.click('[data-a=bell]'); al = await ruby.inner_text('#pop')
            check('...and an alert in Boards (plus the comment)', 'gave you a card' in al and 'commented' in al, al[:200]); await ruby.keyboard.press('Escape')

            des = await person('des')
            check('A Marketing staff member does not see the Executive board', await des.locator('.side [data-a=dept][data-id=adm]').count() == 0 and 'Admin Weekly' not in await des.inner_text('body'))
            await des.click('.side [data-a=go][data-v=chat]'); await des.click('[data-a=chopen][data-v=mkt]'); await des.fill('#chin', 'The December drafts are ready.'); await des.press('#chin', 'Enter'); await saved(des)
            tah = await person('tah')
            await tah.click('.side [data-a=go][data-v=chat]')
            check('Chat: Tahani (Marketing head) sees an unread message in the Marketing channel', await tah.locator('[data-a=chopen][data-v=mkt] .cnt').count() == 1)
            await tah.click('[data-a=chopen][data-v=mkt]')
            check('...and reads it', 'The December drafts are ready.' in await tah.inner_text('.chs'))
            await tah.screenshot(path=OUT + '/boards_live_chat.png')

            await ruby.reload(); await ruby.wait_for_timeout(1200)
            await ruby.click('.side [data-a=dept][data-id=adm]')
            check('After a reload everything is still there (kept on the server)', 'Admin Weekly' in await ruby.inner_text('.page'))
            await ruby.click('.tile:has(h3:text-is("Admin Weekly"))')
            await ruby.evaluate("SV.tok='TOKDES-00000000000000000000'")   # pretend to be someone else
            await ruby.evaluate("B().name='Hijacked';save()"); await ruby.wait_for_timeout(1500)
            await ruby.evaluate("SV.tok='TOKRUBY-0000000000000000000'"); await ruby.evaluate('pull(false)'); await ruby.wait_for_timeout(400)
            names = await ruby.evaluate("Object.values(D.boards).map(b=>b.name)")
            check('The server refuses changes someone may not make, and the page puts it back', 'Admin Weekly' in names and 'Hijacked' not in names, names)
            check('No page errors', not errs, errs[:3])
            await b.close()
    finally:
        web.terminate(); api.terminate()
    print(f'{sum(res)}/{len(res)} live boards checks passed'); sys.exit(0 if all(res) else 1)
asyncio.run(main())
