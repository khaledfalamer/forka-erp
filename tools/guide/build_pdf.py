"""Build the team guide PDFs (one per role, English and Arabic) from help/index.html and the screenshots.
Run: python3 tools/guide/capture.py SHOTS   then   python3 tools/guide/build_pdf.py SHOTS OUTDIR"""
import asyncio, os, pathlib, subprocess, sys, time
from playwright.async_api import async_playwright

ERP = pathlib.Path(__file__).resolve().parents[2]
SHOTS = pathlib.Path(sys.argv[1]); OUT = pathlib.Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
# pictures shown under each section of the guide
PICS = {
  'start': ['hub_signin', 'hub_request', 'hub_home_head'],
  'head-proc': ['proc_newreq_form'],
  'head-hire': ['hire_newreq', 'hire_scorecard'],
  'buy': ['proc_inventory', 'proc_lpo_new', 'proc_suppliers'],
  'store': ['proc_grn_new', 'proc_bill_new'],
  'fin': ['proc_pay'],
  'hr': ['hire_jd', 'hire_guidance', 'hire_candidates', 'hire_aisum', 'hire_invite'],
  'ceo': ['hub_home_ceo', 'hub_people', 'proc_approvals'],
}
CAP = {'en': {'hub_signin': 'Forka Apps sign-in', 'hub_request': 'Request access (first time)', 'hub_home_head': 'Your apps after signing in',
  'proc_newreq_form': 'Procurement > Requests > New request', 'hire_newreq': 'Forka Hire > Hiring requests > New hiring request',
  'hire_scorecard': 'Interview scorecard: score on your own, then submit', 'proc_inventory': 'Purchasing > Inventory: stock count and To buy',
  'proc_lpo_new': 'Purchasing > Purchase orders > New LPO', 'proc_suppliers': 'Purchasing > Suppliers (red = missing details)',
  'proc_grn_new': 'Operations > Receiving (GRN) > New GRN', 'proc_bill_new': 'Operations > Branch bills > New bill', 'proc_pay': 'Payments',
  'hire_jd': 'Job description and ads, with the AI button', 'hire_guidance': 'Careers page > Guidance for AI', 'hire_candidates': 'Candidates board',
  'hire_aisum': 'Summarise CV: AI suggestion, checked by a person', 'hire_invite': 'Invite to interview: pick times, the candidate chooses',
  'hub_home_ceo': 'CEO home: requests and people to confirm', 'hub_people': 'People and access', 'proc_approvals': 'Procurement > CEO > Approvals'},
 'ar': {'hub_signin': 'تسجيل الدخول إلى تطبيقات فوركا', 'hub_request': 'طلب صلاحية دخول (أول مرة)', 'hub_home_head': 'تطبيقاتك بعد تسجيل الدخول',
  'proc_newreq_form': 'المشتريات ← الطلبات ← طلب جديد', 'hire_newreq': 'فوركا للتوظيف ← طلبات التوظيف ← طلب توظيف جديد',
  'hire_scorecard': 'بطاقة تقييم المقابلة: قيّم بنفسك ثم أرسل', 'proc_inventory': 'الشراء ← المخزون: الجرد وكمية الشراء',
  'proc_lpo_new': 'الشراء ← أوامر الشراء ← أمر شراء جديد', 'proc_suppliers': 'الشراء ← الموردون (الأحمر = بيانات ناقصة)',
  'proc_grn_new': 'العمليات ← الاستلام ← إذن استلام جديد', 'proc_bill_new': 'العمليات ← فواتير الفروع ← فاتورة جديدة', 'proc_pay': 'المدفوعات',
  'hire_jd': 'الوصف الوظيفي والإعلانات مع زر الذكاء الاصطناعي', 'hire_guidance': 'صفحة الوظائف ← إرشادات للذكاء الاصطناعي', 'hire_candidates': 'لوحة المرشحين',
  'hire_aisum': 'تلخيص السيرة: اقتراح من الذكاء الاصطناعي يراجعه شخص', 'hire_invite': 'دعوة للمقابلة: اختر الأوقات ويختار المرشح',
  'hub_home_ceo': 'الصفحة الرئيسية للرئيس التنفيذي', 'hub_people': 'الأشخاص والصلاحيات', 'proc_approvals': 'المشتريات ← الرئيس التنفيذي ← الموافقات'}}
ROLES = ['staff', 'head', 'store', 'hr', 'ceo']
FILE = {'staff': 'Staff', 'head': 'Department heads', 'store': 'Purchasing store finance', 'hr': 'HR', 'ceo': 'CEO'}
COVER = {'en': ('How to use Forka Apps', 'Guide for', 'erp.forka.com · English · November 2026', 'Steps and screens for your role. The pictures show sample data.'),
         'ar': ('دليل استخدام تطبيقات فوركا', 'دليل لـ', 'erp.forka.com · العربية · نوفمبر 2026', 'خطوات وشاشات خاصة بدورك. الصور تعرض بيانات تجريبية.')}

CSS = """@page{size:A4;margin:16mm 15mm}
body{font-family:'Inter Tight','IBM Plex Sans Arabic',sans-serif;color:#23211f;font-size:11pt;line-height:1.5;margin:0}
html[dir=rtl] body{font-family:'IBM Plex Sans Arabic','Inter Tight',sans-serif}
.cover{height:250mm;display:flex;flex-direction:column;justify-content:center;page-break-after:always}
.cover .b{font-family:'EB Garamond',serif;letter-spacing:.35em;font-size:26pt;font-weight:600}
.cover h1{font-family:'EB Garamond',serif;font-size:34pt;margin:18mm 0 4mm;line-height:1.15}
.cover .role{display:inline-block;background:#9a6b3f;color:#fff;font-weight:700;font-size:14pt;padding:3mm 6mm;border-radius:3mm}
.cover p{color:#6b655c;margin-top:6mm}
section{page-break-before:always}
section:first-of-type{page-break-before:auto}
h2{font-family:'EB Garamond',serif;font-size:21pt;margin:0 0 3mm;border-bottom:.6mm solid #9a6b3f;padding-bottom:2mm}
h3{font-size:12pt;margin:5mm 0 1.5mm}
.ui{font-weight:700;background:#f1ece4;border-radius:1mm;padding:0 1.2mm}
.tip{border-inline-start:1mm solid #9a6b3f;background:#faf6ef;padding:2.5mm 3.5mm;margin:3mm 0}
.rule{border-inline-start:1mm solid #a33a2c;background:#fbf0ed;padding:2.5mm 3.5mm;margin:3mm 0}
table{width:100%;border-collapse:collapse;margin:2mm 0;font-size:10pt}th,td{text-align:start;border-bottom:.3mm solid #e5dfd5;padding:1.8mm 2mm;vertical-align:top}th{color:#6b655c;font-size:9pt}
figure{margin:5mm 0;page-break-inside:avoid}figure img{width:100%;border:.3mm solid #d9d1c4;border-radius:2mm;display:block}
figcaption{font-size:9pt;color:#6b655c;margin-top:1.5mm}
.for{display:none}
"""

async def main():
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8814', '--bind', '127.0.0.1'], cwd=ERP, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path=os.environ.get('PW_CHROMIUM') or None)
            pg = await b.new_page()
            await pg.goto('http://127.0.0.1:8814/help/'); await pg.wait_for_timeout(400)
            S = await pg.evaluate('S'); R = await pg.evaluate('R')
            for lang in ['en', 'ar']:
                for role in ROLES:
                    secs = [s for s in S if 'all' in s['roles'] or role in s['roles']]
                    body = ''
                    for s in secs:
                        figs = ''.join(f'<figure><img src="file://{SHOTS}/{lang}_{n}.jpg"><figcaption>{CAP[lang][n]}</figcaption></figure>'
                                       for n in PICS.get(s['id'], []) if (SHOTS / f'{lang}_{n}.jpg').exists())
                        body += f'<section><h2>{s[lang]["h"]}</h2>{s[lang]["b"]}{figs}</section>'
                    c = COVER[lang]
                    html = f"""<!DOCTYPE html><html lang="{lang}" dir="{'rtl' if lang == 'ar' else 'ltr'}"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@500;600&family=Inter+Tight:wght@400;600;700&family=IBM+Plex+Sans+Arabic:wght@400;600;700&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body><div class="cover"><div class="b">FORKA</div><h1>{c[0]}</h1><div>{c[1]} <span class="role">{R[lang][role]}</span></div><p>{c[2]}<br>{c[3]}</p></div>{body}</body></html>"""
                    f = OUT / f'tmp_{lang}_{role}.html'; f.write_text(html, encoding='utf-8')
                    q = await b.new_page(); await q.goto('file://' + str(f)); await q.wait_for_timeout(800)
                    await q.evaluate('document.fonts.ready')
                    name = f"Forka Apps guide - {FILE[role]}{' (Arabic)' if lang == 'ar' else ''}.pdf"
                    await q.pdf(path=str(OUT / name), format='A4', print_background=True, margin={'top': '16mm', 'bottom': '16mm', 'left': '15mm', 'right': '15mm'})
                    await q.close(); f.unlink(); print('pdf', name)
            await b.close()
    finally: srv.terminate()
asyncio.run(main())
