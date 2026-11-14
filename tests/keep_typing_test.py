"""Typed text is never wiped by a redraw (Board, Hire, Forka App home). python3 tests/keep_typing_test.py"""
import asyncio, os, pathlib, subprocess, sys, time
from playwright.async_api import async_playwright

ROOT = str(pathlib.Path(__file__).resolve().parent.parent)
PORT = 8797; BASE = f'http://127.0.0.1:{PORT}/'
res = []
def check(n, ok, info=''):
    res.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' - ' + str(info)[:300]))

async def main():
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path=os.environ.get('PW_CHROMIUM') or None)
            for f in ['index.html', 'boards/index.html', 'hiring/index.html']:
                check(f'{f}: has the keep-what-is-typed guard', 'window.__fkKeep' in (pathlib.Path(ROOT) / f).read_text())

            # ---------- Board ----------
            ctx = await b.new_context(viewport={'width': 1440, 'height': 900}); pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await ctx.route('**/config.js*', lambda r: r.fulfill(body='', content_type='application/javascript'))
            await pg.goto(BASE + 'boards/'); await pg.wait_for_timeout(1200)
            await pg.click('.side [data-a=dept][data-id=adm]'); await pg.wait_for_timeout(100)
            await pg.click('.tile:has(h3:text-is("Executive Admin Task Board"))'); await pg.wait_for_timeout(150)
            await pg.click('.list .card >> nth=0'); await pg.wait_for_timeout(250)
            await pg.click('#cmt'); await pg.keyboard.type('Half-written comment')
            tgt = await pg.eval_on_selector('#cmove', 'e=>[...e.options].find(o=>!o.selected).value')
            await pg.select_option('#cmove', tgt); await pg.wait_for_timeout(200)
            check('Board: moving the card to another list keeps the unposted comment', await pg.input_value('#cmt') == 'Half-written comment', await pg.input_value('#cmt'))
            await pg.click('#cmt'); await pg.keyboard.type(' more')
            pri = await pg.eval_on_selector('#cpri', 'e=>[...e.options].find(o=>!o.selected).value')
            await pg.select_option('#cpri', pri); await pg.wait_for_timeout(200)
            check('Board: changing the priority keeps it too', await pg.input_value('#cmt') == 'Half-written comment more', await pg.input_value('#cmt'))
            await pg.click('#cmt'); await pg.evaluate("render()"); await pg.wait_for_timeout(100)
            check('Board: a redraw while typing keeps the text and the cursor in the box', await pg.input_value('#cmt') == 'Half-written comment more' and await pg.evaluate("document.activeElement.id") == 'cmt', [await pg.input_value('#cmt'), await pg.evaluate("document.activeElement.tagName+'#'+document.activeElement.id+'.'+document.activeElement.className")])
            await pg.click('[data-a=cmt]'); await pg.wait_for_timeout(200)
            check('Board: posting the comment empties the box (it is not put back)', await pg.input_value('#cmt') == '' and 'Half-written comment more' in await pg.inner_text('.md'))
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(150)
            check('Board: no page errors', not errs, errs)
            await ctx.close()

            # ---------- Forka App home: request-access form survives a language switch ----------
            ctx = await b.new_context(viewport={'width': 1280, 'height': 900}); pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await ctx.route('**/config.js', lambda r: r.fulfill(body='', content_type='application/javascript'))
            await pg.goto(BASE); await pg.wait_for_timeout(2400)
            await pg.click('[data-a=g-open]'); await pg.fill('#gmail', 'new.person@forka.com'); await pg.click('[data-a=g-go]'); await pg.wait_for_timeout(200)
            await pg.fill('#rq [name=why]', 'Need Procurement for the store')
            await pg.click('[data-lang=ar]'); await pg.wait_for_timeout(150)
            check('Home: switching language keeps the half-filled request', await pg.input_value('#rq [name=why]') == 'Need Procurement for the store')
            check('Home: no page errors', not errs, errs)
            await ctx.close()

            # ---------- Hire: a note typed in a candidate's file survives a redraw (refresh, clicks elsewhere) ----------
            ctx = await b.new_context(viewport={'width': 1280, 'height': 900}); pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await ctx.route('**/config.js*', lambda r: r.fulfill(body='', content_type='application/javascript'))
            await pg.goto(BASE + 'hiring/'); await pg.wait_for_timeout(1500)
            await pg.evaluate("openCand('c3')"); await pg.wait_for_timeout(900)
            tid = await pg.evaluate("""()=>{const e=document.getElementById('noteIn');if(!e)return null;e.setAttribute('data-kt','1');return e.id||e.className||'textarea'}""")
            check('Hire: a candidate file has a box to type in', tid is not None)
            if tid:
                await pg.click('[data-kt="1"]'); await pg.keyboard.type('Called her, interested')
                await pg.evaluate("render()"); await pg.wait_for_timeout(200)
                v = await pg.evaluate("""()=>{const e=document.getElementById('noteIn');return e?e.value:null}""")
                check('Hire: a redraw keeps the half-typed note', v == 'Called her, interested', [tid, v])
            check('Hire: no page errors', not errs, errs)
            await ctx.close()
            await b.close()
    finally:
        srv.terminate()
    print(f'\n{sum(res)}/{len(res)} keep-typing checks passed'); sys.exit(0 if all(res) else 1)

asyncio.run(main())
