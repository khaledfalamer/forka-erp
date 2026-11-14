"""Board side of "Open in Board" for purchase requests (Khaled, 14 Nov 2026): the board "Purchase requests" (Procurement),
its lists Needs info / In progress / Done in English and Arabic, the label "Purchase request", and on the card a small
"From Procurement: <request no>" link back to the request (only to procurement.forka.com, only when the card has it).
Sample-data preview on 127.0.0.1. python3 tests/board_proc_test.py   (SHOTS=dir also saves screenshots)"""
import asyncio, os, pathlib, re, subprocess, sys, time
from playwright.async_api import async_playwright
ROOT = str(pathlib.Path(__file__).resolve().parent.parent); PORT = 8783; URL = f'http://127.0.0.1:{PORT}/boards/?demo'
SHOTS = os.environ.get('SHOTS')
EMOJI = re.compile('[\U0001F000-\U0001FAFF☀-⛿✀-➿⭐⭕]')
res = []
def check(n, ok, info=''):
    res.append(bool(ok)); print(('PASS ' if ok else 'FAIL ') + n + ('' if ok else ' - ' + str(info)[:300]))

SEED = """(()=>{const L=[['lPR1','Needs info','needinfo'],['lPR2','In progress','doing'],['lPR3','Done','done']];
  L.forEach(([id,name,sys])=>{D.lists[id]={id,name,sys,cards:[],col:false}});
  D.boards.bPR={id:'bPR',dept:'proc',name:'Purchase requests',procReq:true,allDept:true,members:[],status:null,lists:L.map(x=>x[0]),
    labels:[{id:'preq',color:'#BD5038'},{id:'fin',color:'#4f8a3c'},{id:'proc',color:'#9a6b3f'},{id:'mnt',color:'#3e6aa1'},{id:'hr',color:'#7a5aa6'},{id:'urg',color:'#b8432f'},{id:'mkt',color:'#2f8a85'}]};
  D.order.push('bPR');
  const mk=(id,title,proc)=>{D.cards[id]={id,l:'lPR1',title,desc:'Purchase request from Procurement.\\n\\nWhat: '+title,labels:['preq'],members:['pb'],owner:'pb',due:null,done:false,doneAt:null,repeat:'',check:[],
    log:[{at:Date.now()-3600e3,by:'ph',k:'l_added',a:'Needs info'}],by:'ph',proc};D.lists.lPR1.cards.push(id)};
  mk('cPR1','PRQ-261114-01 · Menu board logo',{id:'R-1',no:'PRQ-261114-01',url:'https://procurement.forka.com/#rq=R-1'});
  mk('cPR2','PRQ-261114-02 · Bad link',{id:'R-2',no:'PRQ-261114-02',url:'javascript:alert(1)'});
  mk('cPR3','Ordinary task',null);
  save();render()})()"""

async def main():
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path=os.environ.get('PW_CHROMIUM') or None)
            ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=2)
            await ctx.route('**/config.js*', lambda r: r.fulfill(body='', content_type='application/javascript'))
            await ctx.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.evaluate("localStorage.clear()"); await pg.goto(URL); await pg.wait_for_timeout(1000)
            await pg.evaluate(SEED); await pg.wait_for_timeout(150)
            async def open_board():
                await pg.keyboard.press('Escape')
                await pg.click('.side [data-a=dept][data-id=proc]'); await pg.wait_for_timeout(120)
                await pg.click('.tile:has(h3:text-is("%s"))' % (await pg.evaluate("t('procBoard')"))); await pg.wait_for_timeout(150)
            async def open_card(cid):
                await pg.click(f'.card[data-id={cid}]'); await pg.wait_for_timeout(150)
            await open_board()
            titles = await pg.eval_on_selector_all('.list .ltitle', 'e=>e.map(x=>x.textContent.trim())')
            check('Board "Purchase requests" in Procurement with lists Needs info / In progress / Done', titles[:3] == ['Needs info', 'In progress', 'Done'], titles)
            check('The card carries the label "Purchase request"', await pg.evaluate("lname(labelsOf(D.boards.bPR).find(l=>l.id==='preq'))") == 'Purchase request')
            await open_card('cPR1')
            href = await pg.get_attribute('#procl', 'href'); txt = (await pg.inner_text('#procl')).strip()
            check('Card shows "From Procurement: <request no>" linking back to the request', href == 'https://procurement.forka.com/#rq=R-1' and txt == 'From Procurement: PRQ-261114-01', (href, txt))
            check('The link opens in the same window (like other app links)', await pg.get_attribute('#procl', 'target') is None)
            if SHOTS: await pg.screenshot(path=os.path.join(SHOTS, 'board_card_from_procurement.png'))
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(100)
            await open_card('cPR2')
            check('A link that is not to procurement.forka.com is never shown', await pg.locator('#procl').count() == 0)
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(100)
            await open_card('cPR3')
            check('Ordinary cards have no Procurement link', await pg.locator('#procl').count() == 0)
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(100)
            await pg.evaluate("lang='ar';render()"); await pg.wait_for_timeout(150)
            await open_board()
            titles = await pg.eval_on_selector_all('.list .ltitle', 'e=>e.map(x=>x.textContent.trim())')
            check('Arabic: board name and lists in Arabic', titles[:3] == ['بحاجة لمعلومات', 'قيد التنفيذ', 'منجز'] and (await pg.inner_text('.bname')).strip() == 'طلبات الشراء', titles)
            await open_card('cPR1')
            txt = (await pg.inner_text('#procl')).strip()
            check('Arabic: "من المشتريات: <request no>", page right to left', txt == 'من المشتريات: PRQ-261114-01' and await pg.evaluate("document.documentElement.dir") == 'rtl', txt)
            if SHOTS: await pg.screenshot(path=os.path.join(SHOTS, 'board_card_from_procurement_ar.png'))
            body = await pg.inner_text('body')
            check('No emojis', not EMOJI.search(body), EMOJI.findall(body)[:5])
            check('No page errors', not errs, errs)
            await b.close()
    finally:
        srv.terminate()
    print(f'{sum(res)}/{len(res)} Board purchase-request checks passed'); sys.exit(0 if all(res) else 1)

asyncio.run(main())
