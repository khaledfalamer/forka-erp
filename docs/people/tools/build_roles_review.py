#!/usr/bin/env python3
"""Builds the department-head review of Forka People:
- docs/people/12-roles-review.html      (web page, English/Arabic switch)
- docs/people/12-roles-review-doc.html  (plain version, uploaded as a Google Doc for comments)
Content lives in this file: roles, what each role can do, the module matrix, gaps found in other products, questions.
"""
import html, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
e = html.escape

ROLES = [
 ('staff', 'Staff', 'الموظف', 'Every employee: waiters, cooks, baristas, drivers, office staff.', 'كل موظف: النادل والطاهي والباريستا والسائق وموظفو المكتب.'),
 ('manager', 'Managers', 'المدراء', 'Supervisors, branch managers and head office department heads, for their own team or branch only.', 'المشرفون ومدراء الفروع ورؤساء الأقسام في الإدارة العامة، لفريقهم أو فرعهم فقط.'),
 ('hr', 'HR', 'الموارد البشرية', 'HR officer and HR manager, for the companies they look after.', 'موظف الموارد البشرية ومدير الموارد البشرية، للشركات المسؤولين عنها.'),
 ('payroll', 'Payroll and Finance', 'الرواتب والمالية', 'The people who prepare and approve pay.', 'من يجهز الرواتب ويعتمدها.'),
 ('ceo', 'CEO', 'الرئيس التنفيذي', 'Sees and approves everything across the group.', 'يرى كل شيء ويعتمد على مستوى المجموعة.'),
]

CAN = {
 'staff': [
  ('Sign in on their phone and see their profile, job, branch and manager', 'تسجيل الدخول من الجوال ورؤية ملفه ووظيفته وفرعه ومديره'),
  ('Update phone, address and emergency contact (HR checks the change)', 'تحديث رقم الجوال والعنوان وجهة الطوارئ (تتحقق الموارد البشرية من التغيير)'),
  ('Clock in and out on their phone at the branch, or on the branch tablet', 'تسجيل الحضور والانصراف من الجوال في الفرع أو من جهاز الفرع اللوحي'),
  ('See their shifts for this week and next week', 'رؤية ورديات هذا الأسبوع والأسبوع القادم'),
  ('See leave balances and request leave, with days and balance shown before sending', 'رؤية أرصدة الإجازات وطلب إجازة مع عرض الأيام والرصيد قبل الإرسال'),
  ('Ask for letters (salary certificate, NOC, experience letter)', 'طلب الخطابات (شهادة راتب، عدم ممانعة، شهادة خبرة)'),
  ('Ask to correct a missed clock-in or clock-out, and ask for a shift change', 'طلب تصحيح بصمة ناقصة وطلب تغيير وردية'),
  ('Use request forms made by HR (uniform, transport, salary advance…)', 'استخدام نماذج الطلبات التي تعدها الموارد البشرية (زي موحد، مواصلات، سلفة…)'),
  ('Follow every request and see who must approve it now', 'متابعة كل طلب ومعرفة من يجب أن يوافق عليه الآن'),
  ('See their payslips', 'رؤية قسائم الراتب'),
  ('Upload a renewed passport, ID or health card', 'رفع جواز سفر أو هوية أو بطاقة صحية مجددة'),
  ('Read news and policies and confirm "I have read and understood"', 'قراءة الأخبار والسياسات وتأكيد "قرأت وفهمت"'),
  ('Ask HR a question, or raise a private complaint only HR can see', 'سؤال الموارد البشرية أو تقديم شكوى خاصة لا يراها إلا الموارد البشرية'),
  ('See their training and its renewal dates, and their own reviews', 'رؤية تدريبه ومواعيد تجديده وتقييماته'),
  ('See who looked at their personal and pay details', 'معرفة من اطّلع على بياناته الشخصية وراتبه'),
  ('New joiners: follow a welcome checklist for their first weeks', 'الموظف الجديد: اتباع قائمة ترحيب لأسابيعه الأولى'),
 ],
 'manager': [
  ('Everything staff can do, for themselves', 'كل ما يستطيعه الموظف، لنفسه'),
  ('See their team: job, branch, start date, probation date, documents expiring', 'رؤية فريقه: الوظيفة والفرع وتاريخ الالتحاق وانتهاء التجربة والمستندات التي تقترب من الانتهاء'),
  ('Approve or reject team requests (reason needed to reject), from their phone', 'الموافقة على طلبات الفريق أو رفضها (السبب مطلوب عند الرفض) من الجوال'),
  ('Ask for leave or a correction on behalf of a staff member without a phone', 'تقديم طلب إجازة أو تصحيح نيابة عن موظف ليس لديه جوال'),
  ('Build the weekly roster, see warnings (rest time, leave, cover) and publish it', 'إعداد جدول الورديات الأسبوعي ورؤية التنبيهات (الراحة والإجازات والتغطية) ونشره'),
  ('Review late arrivals, missed punches and absences, and accept or correct them', 'مراجعة التأخير والبصمات الناقصة والغياب وقبولها أو تصحيحها'),
  ('See the team leave calendar', 'رؤية تقويم إجازات الفريق'),
  ('Complete probation and quarterly reviews with the role scorecard', 'إكمال تقييمات فترة التجربة والتقييمات الربعية بنموذج تقييم الوظيفة'),
  ('Tick onboarding and exit checklist steps they own (uniform, handover, keys)', 'إكمال خطوات الانضمام والمغادرة المسؤول عنها (الزي، التسليم، المفاتيح)'),
  ('Post news and welcome posts to the team feed', 'نشر الأخبار ومنشورات الترحيب في صفحة أخبار الفريق'),
  ('See team reports (headcount, attendance, documents, hours)', 'رؤية تقارير الفريق (العدد، الحضور، المستندات، الساعات)'),
  ('Cannot see salaries or personal details (date of birth, ID numbers)', 'لا يرى الرواتب ولا البيانات الشخصية (تاريخ الميلاد، أرقام الهويات)'),
 ],
 'hr': [
  ('See and update employee records for their companies, with full history', 'رؤية وتحديث ملفات الموظفين لشركاتهم مع السجل الكامل'),
  ('Record transfers, promotions and job changes with an effective date', 'تسجيل النقل والترقيات وتغيير الوظائف بتاريخ سريان'),
  ('See personal details (HR officer) and salaries (HR manager only)', 'رؤية البيانات الشخصية (موظف الموارد البشرية) والرواتب (مدير الموارد البشرية فقط)'),
  ('Check and accept uploaded documents; get reminders before documents expire', 'التحقق من المستندات المرفوعة وقبولها، واستلام التذكيرات قبل انتهائها'),
  ('Approve the HR step of requests; issue letters from approved templates', 'الموافقة على خطوة الموارد البشرية في الطلبات وإصدار الخطابات من نماذج معتمدة'),
  ('Build request forms: questions, who approves, what happens automatically', 'إعداد نماذج الطلبات: الأسئلة ومن يوافق وما يحدث تلقائياً'),
  ('Run onboarding, probation and exit checklists', 'إدارة قوائم الانضمام وفترة التجربة والمغادرة'),
  ('Handle the HR desk; only the HR manager sees private cases', 'إدارة مكتب الموارد البشرية؛ مدير الموارد البشرية فقط يرى الحالات الخاصة'),
  ('Publish policies and track who confirmed them', 'نشر السياسات ومتابعة من أكّدها'),
  ('Lock the month for payroll and move it through the month-end steps', 'إقفال الشهر للرواتب وتمريره عبر خطوات نهاية الشهر'),
  ('Set leave types, approval routes, holidays, shift templates and roles', 'ضبط أنواع الإجازات ومسارات الموافقة والعطل ونماذج الورديات والصلاحيات'),
  ('See the change log and access log; import staff from templates', 'رؤية سجل التغييرات وسجل الاطلاع، واستيراد الموظفين من القوالب'),
 ],
 'payroll': [
  ('See pay details for the pay groups they look after', 'رؤية بيانات الرواتب لمجموعات الرواتب المسؤولين عنها'),
  ('Review payroll inputs and changes since last month', 'مراجعة مدخلات الرواتب والتغييرات منذ الشهر الماضي'),
  ('Approve the Finance step of salary advances and pay changes', 'الموافقة على خطوة المالية في السلف وتغييرات الرواتب'),
  ('Create export files for the payroll provider, WPS and accounting (after formats are confirmed)', 'إنشاء ملفات التصدير لمزوّد الرواتب ونظام حماية الأجور والمحاسبة (بعد تأكيد الصيغ)'),
  ('Cannot approve the same payroll they prepared', 'لا يعتمد الرواتب التي جهّزها بنفسه'),
 ],
 'ceo': [
  ('Sees everyone in every company, UAE and Oman, automatically', 'يرى جميع الموظفين في كل الشركات، الإمارات وعُمان، تلقائياً'),
  ('Gives the final payroll approval each month', 'يعطي الاعتماد النهائي للرواتب كل شهر'),
  ('Approves any request when needed, and any step marked "CEO"', 'يوافق على أي طلب عند الحاجة وعلى أي خطوة محددة له'),
  ('Sees all reports and the change log for the whole group', 'يرى جميع التقارير وسجل التغييرات للمجموعة كلها'),
  ('Gives roles to HR managers and others', 'يمنح الصلاحيات لمدراء الموارد البشرية وغيرهم'),
 ],
}

# Matrix: module -> per role: 'do' (does it), 'see' (view only / own only), '' (no)
MATRIX = [
 ('Employee records', 'ملفات الموظفين', 'see', 'see', 'do', 'see', 'do'),
 ('Salaries and bank details', 'الرواتب والبيانات البنكية', 'see', '', 'do', 'do', 'do'),
 ('Documents and reminders', 'المستندات والتذكيرات', 'do', 'see', 'do', '', 'do'),
 ('Leave', 'الإجازات', 'do', 'do', 'do', 'see', 'do'),
 ('Requests and approvals', 'الطلبات والموافقات', 'do', 'do', 'do', 'do', 'do'),
 ('Request forms by HR', 'نماذج الطلبات', 'do', 'do', 'do', 'see', 'do'),
 ('Roster and shifts', 'جدول الورديات', 'see', 'do', 'see', 'see', 'do'),
 ('Clock-in and attendance', 'الحضور والانصراف', 'do', 'do', 'do', 'see', 'do'),
 ('Payslips', 'قسائم الراتب', 'see', '', 'see', 'do', 'do'),
 ('Payroll month-end', 'رواتب نهاية الشهر', '', '', 'do', 'do', 'do'),
 ('Onboarding and exits', 'الانضمام والمغادرة', 'do', 'do', 'do', 'see', 'do'),
 ('Performance reviews', 'تقييم الأداء', 'see', 'do', 'do', '', 'do'),
 ('Learning', 'التدريب', 'see', 'see', 'do', '', 'do'),
 ('HR desk and private cases', 'مكتب الموارد البشرية والحالات الخاصة', 'do', '', 'do', '', 'do'),
 ('Team feed and policies', 'أخبار الفريق والسياسات', 'see', 'do', 'do', 'see', 'do'),
 ('Reports', 'التقارير', '', 'see', 'do', 'see', 'do'),
 ('Settings and roles', 'الإعدادات والصلاحيات', '', '', 'do', '', 'do'),
]

# Gaps found by comparing with other people systems (public feature descriptions, Nov 2026).
GAPS = [
 ('Expenses and petty cash claims', 'المصاريف وطلبات النثرية', 'Staff claim fuel, small purchases and petty cash with a receipt photo; manager and Finance approve; paid with salary.', 'يطالب الموظف بالوقود والمشتريات الصغيرة والنثرية بصورة الإيصال، ويوافق المدير والمالية، وتُدفع مع الراتب.', 'Zoho, Odoo, SAP', '2'),
 ('Shift swaps, open shifts and availability', 'تبديل الورديات والورديات المفتوحة والتفرغ', 'Staff swap shifts with a colleague (manager approves), pick up open shifts, and tell managers which days they can work.', 'يتبادل الموظفون الورديات (بموافقة المدير)، ويأخذون الورديات المفتوحة، ويحددون الأيام المتاحة لهم.', 'Odoo Planning, 7shifts', '1B'),
 ('Labour cost against sales', 'تكلفة العمالة مقارنة بالمبيعات', 'Rosters show labour cost as a share of forecast sales from the POS, so managers do not over-staff quiet days.', 'تعرض الجداول تكلفة العمالة كنسبة من المبيعات المتوقعة من نظام نقاط البيع، حتى لا يزيد عدد الموظفين في الأيام الهادئة.', '7shifts, restaurant tools', '3'),
 ('Service charge or tips sharing', 'توزيع رسوم الخدمة أو الإكراميات', 'If branches collect service charge or tips, share them by agreed rules and show it on the payslip.', 'إذا كانت الفروع تجمع رسوم خدمة أو إكراميات، توزع حسب قواعد متفق عليها وتظهر في قسيمة الراتب.', '7shifts', '?'),
 ('Staff accommodation and transport', 'سكن الموظفين والمواصلات', 'Rooms, beds and buses: who lives where, capacity, costs, and moving staff between rooms.', 'الغرف والأسرّة والحافلات: من يسكن أين، والسعة، والتكاليف، ونقل الموظفين بين الغرف.', 'common need in UAE F&B', '2'),
 ('Company assets and vehicles', 'أصول الشركة والمركبات', 'Uniforms, keys, phones, tablets and delivery motorbikes: who has what, licence and insurance expiry, return when leaving.', 'الزي والمفاتيح والهواتف والأجهزة اللوحية ودراجات التوصيل: من يحمل ماذا، وانتهاء الرخص والتأمين، والإرجاع عند المغادرة.', 'Zoho, Odoo Fleet', '2'),
 ('Visa and government steps', 'الإقامات والمعاملات الحكومية', 'Track each work permit, medical test, Emirates ID and renewal as steps with dates and costs, not only the expiry date.', 'متابعة كل تصريح عمل وفحص طبي وهوية وتجديد كخطوات بتواريخ وتكاليف، وليس تاريخ الانتهاء فقط.', 'Bayzat (expiries)', '2'),
 ('End-of-service estimate', 'تقدير مكافأة نهاية الخدمة', 'Show each person\'s end-of-service amount to date and the monthly provision for Finance (after adviser approval).', 'عرض مكافأة نهاية الخدمة لكل موظف حتى تاريخه والمخصص الشهري للمالية (بعد اعتماد المستشار).', 'Bayzat', '3'),
 ('Air ticket entitlement', 'استحقاق تذاكر السفر', 'Your leave policy gives leave passage: track who is due a ticket, when, and its value.', 'سياسة الإجازات تمنح تذكرة سفر: متابعة من يستحق التذكرة ومتى وقيمتها.', 'your leave policy (HRP04)', '2'),
 ('Medical insurance', 'التأمين الطبي', 'Who is insured, dependants, card numbers and renewal, and adding or removing people when they join or leave.', 'من هو مؤمّن والمعالون وأرقام البطاقات والتجديد، وإضافة أو حذف الموظفين عند الانضمام أو المغادرة.', 'Bayzat', '2'),
 ('Loans and advance repayments', 'القروض وسداد السلف', 'After an advance is approved, a repayment plan that deducts each month automatically and shows what is left.', 'بعد اعتماد السلفة، خطة سداد تُخصم شهرياً تلقائياً وتعرض المتبقي.', 'Odoo', '2'),
 ('Incentives and bonuses', 'الحوافز والمكافآت', 'Branch incentive and bonus calculation from sales, attendance, ratings and warnings, within the 30% cap HR discussed.', 'حساب حوافز الفروع والمكافآت من المبيعات والحضور والتقييمات والإنذارات، ضمن سقف 30% الذي ناقشته الموارد البشرية.', 'SAP Variable Pay; your HR notes', '4'),
 ('Workforce planning', 'تخطيط القوى العاملة', 'Approved headcount and cost per branch each quarter, compared with actual staff and open positions.', 'العدد المعتمد والتكلفة لكل فرع كل ربع سنة، مقارنة بالموظفين الفعليين والوظائف الشاغرة.', 'SAP; your HR notes', '3'),
 ('Succession and key people', 'التعاقب والموظفون الرئيسيون', 'Who could step up if a branch manager or head chef leaves; development plans for them.', 'من يمكنه تولي المسؤولية إذا غادر مدير فرع أو رئيس طهاة، وخطط تطويرهم.', 'SAP Succession', 'later'),
 ('E-signature', 'التوقيع الإلكتروني', 'Sign contracts, letters, warnings and policy confirmations in the app instead of on paper.', 'توقيع العقود والخطابات والإنذارات وتأكيد السياسات داخل التطبيق بدلاً من الورق.', 'Zoho, Odoo', '2'),
 ('Warnings and disciplinary register', 'الإنذارات وسجل التأديب', 'Manager starts, HR checks, letter issued and signed, kept in the private register (your disciplinary policy).', 'يبدأ المدير، وتتحقق الموارد البشرية، ويصدر الخطاب ويُوقّع، ويُحفظ في السجل الخاص (سياسة التأديب).', 'your HR policy HRP02', '2'),
 ('Exit interviews and reasons', 'مقابلات المغادرة والأسباب', 'Record why people leave and see the main reasons by branch and job.', 'تسجيل أسباب المغادرة ورؤية الأسباب الرئيسية حسب الفرع والوظيفة.', 'SAP, Zoho', '2'),
 ('Anonymous suggestions', 'الاقتراحات المجهولة', 'A digital version of the locked suggestion box HR proposed for branches.', 'نسخة رقمية من صندوق الاقتراحات المقفل الذي اقترحته الموارد البشرية للفروع.', 'your HR notes', '2'),
 ('Birthdays and work anniversaries', 'أعياد الميلاد وذكرى العمل', 'Shown in the team feed (only if the person agrees).', 'تظهر في أخبار الفريق (بموافقة الشخص فقط).', 'Zoho', '2'),
 ('Overtime pre-approval', 'الموافقة المسبقة على العمل الإضافي', 'Managers approve overtime before it happens, not only after.', 'يوافق المدير على العمل الإضافي قبل حدوثه وليس بعده فقط.', 'SAP Time', '1B'),
 ('Org chart picture', 'مخطط الهيكل التنظيمي', 'A visual chart of who reports to whom, from your org structure file.', 'مخطط مرئي لمن يتبع لمن، من ملف الهيكل التنظيمي.', 'Zoho, Odoo', '1A'),
]

# For each idea (same order as GAPS): what we mean, and an example at Forka. (EN meaning, EN example, AR meaning, AR example)
# Khaled's decisions on the ideas (12 Nov 2026, from review comments). Phase shown, then a note.
DECIDED = {
    'Expenses and petty cash claims': ('Later', 'Khaled: not needed now. Another program handles expenses today. Kept on the list for later.', 'خالد: غير مطلوب حالياً، يوجد برنامج آخر للمصاريف. يبقى في القائمة لوقت لاحق.'),
    'Shift swaps, open shifts and availability': ('1B', 'Khaled: agreed. Added to the plan with the rosters (Phase 1B).', 'خالد: موافق. أُضيف إلى الخطة مع جداول الورديات (المرحلة 1ب).'),
    'Labour cost against sales': ('No', 'Khaled: not needed. Labour cost is fixed; we save money by moving people between branches.', 'خالد: غير مطلوب. تكلفة العمالة ثابتة، ونوفّر بنقل الموظفين بين الفروع.'),
    'Service charge or tips sharing': ('Later', 'Khaled: maybe later.', 'خالد: ربما لاحقاً.'),
    'Staff accommodation and transport': ('Later', 'Khaled: good idea, for a later stage.', 'خالد: فكرة جيدة، لمرحلة لاحقة.'),
    'Company assets and vehicles': ('2', 'Khaled: agreed. Added to the plan (Phase 2).', 'خالد: موافق. أُضيف إلى الخطة (المرحلة 2).'),
    'Visa and government steps': ('2', 'Khaled: agreed. Added to the plan (Phase 2).', 'خالد: موافق. أُضيف إلى الخطة (المرحلة 2).'),
    'End-of-service estimate': ('3', 'Khaled: agreed. Added to the plan (Phase 3).', 'خالد: موافق. أُضيف إلى الخطة (المرحلة 3).'),
    'Air ticket entitlement': ('Later', 'Khaled: keep it for later.', 'خالد: يبقى لوقت لاحق.'),
    'Medical insurance': ('2', 'Khaled: agreed. Added to the plan (Phase 2).', 'خالد: موافق. أُضيف إلى الخطة (المرحلة 2).'),
    'Loans and advance repayments': ('2', 'Khaled: agreed. Added to the plan (Phase 2).', 'خالد: موافق. أُضيف إلى الخطة (المرحلة 2).'),
    'Incentives and bonuses': ('Last', 'Khaled: keep it for the last stage.', 'خالد: يبقى للمرحلة الأخيرة.'),
    'Workforce planning': ('Last', 'Khaled: good idea, we will do it last.', 'خالد: فكرة جيدة، سننفذها في المرحلة الأخيرة.'),
    'Succession and key people': ('3', 'Khaled: agreed. Added to the plan with performance reviews (Phase 3).', 'خالد: موافق. أُضيف إلى الخطة مع تقييم الأداء (المرحلة 3).'),
    'E-signature': ('2', 'Khaled: agreed. Added to the plan (Phase 2).', 'خالد: موافق. أُضيف إلى الخطة (المرحلة 2).'),
    'Warnings and disciplinary register': ('2', 'Khaled: agreed. Added to the plan (Phase 2).', 'خالد: موافق. أُضيف إلى الخطة (المرحلة 2).'),
    'Exit interviews and reasons': ('2', 'Khaled: agreed. Added to the plan (Phase 2).', 'خالد: موافق. أُضيف إلى الخطة (المرحلة 2).'),
    'Anonymous suggestions': ('2', 'Khaled: agreed. Added to the plan (Phase 2).', 'خالد: موافق. أُضيف إلى الخطة (المرحلة 2).'),
    'Birthdays and work anniversaries': ('2', 'Khaled: agreed. Added to the plan (Phase 2).', 'خالد: موافق. أُضيف إلى الخطة (المرحلة 2).'),
    'Overtime pre-approval': ('1B', 'Khaled: agreed. Added to the plan with rosters (Phase 1B).', 'خالد: موافق. أُضيف إلى الخطة مع جداول الورديات (المرحلة 1ب).'),
    'Org chart picture': ('1A', 'Khaled: agreed. Added to the plan (Phase 1A). A first version is already in the app preview.', 'خالد: موافق. أُضيف إلى الخطة (المرحلة 1أ). توجد نسخة أولى في معاينة التطبيق.'),
}
GAPS = [g[:5] + (DECIDED[g[0]][0],) if g[0] in DECIDED else g for g in GAPS]
PHASE_AR = {'Later': 'لاحقاً', 'Last': 'الأخيرة', 'No': 'غير مطلوب', 'later': 'لاحقاً'}
def phase_ar(ph): return PHASE_AR.get(ph, ph)
def decision(en): return DECIDED.get(en, (None, '', ''))[1:]

EXPLAIN = [
 ('Today staff pay small costs themselves (fuel, a missing ingredient, a taxi) and wait for cash back. In the app they photograph the receipt, the manager and Finance approve, and the amount is added to the next salary or paid from petty cash with a clear record.',
  'A driver fills the delivery bike with fuel for 40 AED, sends the receipt photo from his phone, and sees it approved and added to his November pay.',
  'اليوم يدفع الموظفون مصاريف صغيرة من جيبهم (وقود، مكوّن ناقص، تاكسي) وينتظرون استردادها. في التطبيق يصوّر الموظف الإيصال، ويوافق المدير والمالية، ويُضاف المبلغ إلى الراتب القادم أو يُدفع من النثرية مع سجل واضح.',
  'سائق يعبّئ دراجة التوصيل بوقود بقيمة 40 درهماً، ويرسل صورة الإيصال من هاتفه، ويرى الموافقة وإضافتها إلى راتب نوفمبر.'),
 ('Staff can offer a shift to a colleague and swap, but the change only counts after the manager approves. Managers can post an "open shift" that any trained person can take, and staff can mark days they cannot work before the roster is made.',
  'A waiter in Sharjah has a family event on Friday. He offers his evening shift, a colleague accepts in the app, and the branch manager approves with one tap. No phone calls.',
  'يستطيع الموظف عرض ورديته على زميل والتبديل، ولا يُعتمد التغيير إلا بعد موافقة المدير. ويمكن للمدير نشر "وردية مفتوحة" يأخذها أي موظف مدرّب، ويحدد الموظفون الأيام التي لا يستطيعون العمل فيها قبل إعداد الجدول.',
  'نادل في الشارقة لديه مناسبة عائلية يوم الجمعة. يعرض ورديته المسائية، يقبلها زميل في التطبيق، ويوافق مدير الفرع بضغطة واحدة دون مكالمات.'),
 ('When the manager builds the roster, the app shows the cost of the hours planned compared with the sales expected for that day, taken from the till system (POS). It helps match staff numbers to how busy the branch will be.',
  'Tuesday sales in Fujairah are usually low. The roster shows labour at 38% of expected sales, so the manager moves one person to Friday when it is busy.',
  'عند إعداد الجدول، يعرض التطبيق تكلفة الساعات المخطط لها مقارنة بالمبيعات المتوقعة لذلك اليوم من نظام نقاط البيع. يساعد ذلك على مطابقة عدد الموظفين مع ازدحام الفرع.',
  'مبيعات الثلاثاء في الفجيرة منخفضة عادة. يُظهر الجدول أن العمالة 38% من المبيعات المتوقعة، فينقل المدير موظفاً إلى يوم الجمعة المزدحم.'),
 ('Only if branches collect a service charge or tips for staff. The app would split the total by rules you set (for example by hours worked or role) and show each person\'s share on the payslip, so it is fair and visible.',
  'If Mayar collected 3,000 AED in tips in a month, each barista and waiter would see their share based on the hours they worked.',
  'فقط إذا كانت الفروع تجمع رسوم خدمة أو إكراميات للموظفين. يقسم التطبيق المبلغ حسب قواعد تحددونها (مثل ساعات العمل أو الوظيفة) ويظهر نصيب كل شخص في قسيمة الراتب، ليكون عادلاً وواضحاً.',
  'إذا جمع مقهى ميار 3,000 درهم إكراميات في شهر، يرى كل باريستا ونادل نصيبه حسب ساعات عمله.'),
 ('A record of staff housing and transport: each building, room and bed, who lives where, how many beds are free, the monthly cost, and which bus or driver takes which staff to which branch.',
  'HR hires two cooks for Umm Al Quwain and immediately sees which room has free beds and which bus route passes that branch.',
  'سجل لسكن الموظفين والمواصلات: كل مبنى وغرفة وسرير، ومن يسكن أين، وعدد الأسرّة الشاغرة، والتكلفة الشهرية، وأي حافلة أو سائق ينقل أي موظفين إلى أي فرع.',
  'توظّف الموارد البشرية طاهيين لأم القيوين، وترى فوراً أي غرفة فيها أسرّة شاغرة وأي خط حافلات يمر بذلك الفرع.'),
 ('A list of company items given to staff: uniforms, keys, phones, tablets and delivery motorbikes. It shows who has what, the condition, and for vehicles the registration and insurance dates. When someone leaves, the exit checklist lists exactly what they must return.',
  'When a driver resigns, his exit checklist shows the motorbike, its key, the delivery box and two uniforms. Nothing is missed.',
  'قائمة بأغراض الشركة المسلّمة للموظفين: الزي والمفاتيح والهواتف والأجهزة اللوحية ودراجات التوصيل. تبين من يحمل ماذا وحالته، وللمركبات تواريخ التسجيل والتأمين. وعند مغادرة الموظف تعرض قائمة المغادرة بالضبط ما يجب إرجاعه.',
  'عندما يستقيل سائق، تظهر قائمة مغادرته الدراجة ومفتاحها وصندوق التوصيل وزيين. لا يُنسى شيء.'),
 ('Not only the expiry date of a visa, but every step in getting or renewing it: entry permit, medical test, Emirates ID, work permit, labour contract. Each step has a date, an owner, a cost and a status, so HR and the PRO know what is stuck.',
  'A new waiter started work but his medical test is not booked yet. The app shows the visa is stuck at the medical step for 9 days and reminds the Government Relations Officer.',
  'ليس فقط تاريخ انتهاء الإقامة، بل كل خطوة في استخراجها أو تجديدها: تصريح الدخول، الفحص الطبي، الهوية، تصريح العمل، عقد العمل. لكل خطوة تاريخ ومسؤول وتكلفة وحالة، فتعرف الموارد البشرية ومندوب العلاقات الحكومية ما المتوقف.',
  'نادل جديد بدأ العمل لكن فحصه الطبي لم يُحجز. يُظهر التطبيق أن الإقامة متوقفة عند خطوة الفحص منذ 9 أيام ويذكّر موظف العلاقات الحكومية.'),
 ('A running estimate of how much end-of-service each person would receive if they left today, and the total the company should set aside each month. It is only switched on after a qualified adviser confirms the calculation.',
  'Finance sees the total end-of-service the group owes across all UAE staff at month end, and HR can tell a leaving employee their estimate before the final settlement.',
  'تقدير مستمر لمكافأة نهاية الخدمة التي سيحصل عليها كل موظف لو غادر اليوم، والمبلغ الإجمالي الذي يجب أن تخصصه الشركة كل شهر. لا يُفعّل إلا بعد تأكيد مستشار مختص للحساب.',
  'ترى المالية إجمالي مكافآت نهاية الخدمة المستحقة على المجموعة لكل موظفي الإمارات في نهاية الشهر، ويمكن للموارد البشرية إخبار الموظف المغادر بتقديره قبل المخالصة.'),
 ('Your leave policy gives some staff a ticket home (for example every two years). The app tracks who is due a ticket, from when, its value, and whether it was used or paid, so it is planned with their annual leave.',
  'A cook\'s ticket becomes due in March. HR sees it three months ahead (as the policy asks) and plans it with his annual leave.',
  'تمنح سياسة الإجازات بعض الموظفين تذكرة سفر (مثلاً كل سنتين). يتابع التطبيق من يستحق التذكرة ومنذ متى وقيمتها وهل استُخدمت أو صُرفت، لتُخطط مع الإجازة السنوية.',
  'تستحق تذكرة طاهٍ في مارس. تراها الموارد البشرية قبل ثلاثة أشهر (كما تطلب السياسة) وتخطط لها مع إجازته السنوية.'),
 ('Who is covered by health insurance, their policy and card numbers, dependants, and renewal dates. New joiners are added and leavers removed as part of onboarding and exit, so nobody is left uninsured or paid for after leaving.',
  'When a new barista joins, the onboarding checklist includes "add to medical insurance", and her card number is saved in her record.',
  'من هو مشمول بالتأمين الصحي، وأرقام الوثيقة والبطاقة، والمعالون، وتواريخ التجديد. يُضاف المنضمون ويُحذف المغادرون ضمن خطوات الانضمام والمغادرة، حتى لا يبقى أحد بلا تأمين أو يُدفع عنه بعد مغادرته.',
  'عندما تنضم باريستا جديدة، تتضمن قائمة الانضمام "إضافة إلى التأمين الطبي"، ويُحفظ رقم بطاقتها في ملفها.'),
 ('When a salary advance or loan is approved, the app creates a repayment plan: how much is deducted each month and how much is left. Payroll gets the deduction automatically every month until it is paid.',
  'A cashier takes a 1,500 AED advance over 3 months. Each month 500 AED is sent to payroll as a deduction, and she can see what remains.',
  'عند اعتماد سلفة أو قرض، ينشئ التطبيق خطة سداد: المبلغ المخصوم كل شهر والمتبقي. تصل الخصومات إلى الرواتب تلقائياً كل شهر حتى السداد.',
  'كاشيرة تأخذ سلفة 1,500 درهم على 3 أشهر. كل شهر تُرسل 500 درهم للرواتب كخصم، وترى المتبقي.'),
 ('Calculate branch incentives and staff bonuses from clear numbers: branch sales against target, attendance, review ratings and any warnings. Rules and the 30% cap are set once, and everyone sees how their share was worked out.',
  'Sharjah beats its monthly target by 8%. The incentive pool is shared by role and attendance, and a waiter with a warning that month gets a reduced share by rule, not by opinion.',
  'حساب حوافز الفروع ومكافآت الموظفين من أرقام واضحة: مبيعات الفرع مقابل الهدف، والحضور، وتقييمات الأداء، وأي إنذارات. تُضبط القواعد وسقف 30% مرة واحدة، ويرى الجميع كيف حُسب نصيبه.',
  'يتجاوز فرع الشارقة هدفه الشهري بنسبة 8%. يُوزّع صندوق الحوافز حسب الوظيفة والحضور، ويحصل نادل لديه إنذار ذلك الشهر على نصيب أقل وفق القاعدة لا حسب الرأي.'),
 ('Each quarter, agree how many people and how much salary each branch should have, then compare with the actual team and open positions. It is the quarterly manpower planning HR described, kept in one place.',
  'Oman is approved for 26 people and has 26 plus 3 vacancies. The CEO sees the gap and the cost before approving new hiring requests.',
  'كل ربع سنة، الاتفاق على عدد الموظفين والرواتب لكل فرع، ثم المقارنة مع الفريق الفعلي والوظائف الشاغرة. هو تخطيط القوى العاملة الربعي الذي وصفته الموارد البشرية في مكان واحد.',
  'عُمان معتمد لها 26 موظفاً ولديها 26 و3 وظائف شاغرة. يرى الرئيس التنفيذي الفرق والتكلفة قبل الموافقة على طلبات توظيف جديدة.'),
 ('For key roles (branch manager, head chef, supervisor), note who could take over if the person leaves, how ready they are, and what training they need. It protects branches from sudden gaps.',
  'If the Fujairah supervisor resigns, HR already knows the senior waiter is ready in 3 months with a short leadership course.',
  'للوظائف الرئيسية (مدير فرع، رئيس طهاة، مشرف)، تسجيل من يمكنه تولي المسؤولية إذا غادر صاحبها، ومدى جاهزيته، والتدريب الذي يحتاجه. يحمي الفروع من الفراغ المفاجئ.',
  'إذا استقال مشرف الفجيرة، تعرف الموارد البشرية مسبقاً أن النادل الأقدم جاهز خلال 3 أشهر بدورة قيادية قصيرة.'),
 ('Staff sign documents on their phone instead of paper: contracts, offer letters, warnings and policy confirmations. The signed copy is saved in their record with the date and time.',
  'A new cook signs his contract and the handbook confirmation on his phone on day one. HR does not chase paper signatures.',
  'يوقّع الموظفون المستندات من هواتفهم بدلاً من الورق: العقود وخطابات العرض والإنذارات وتأكيد السياسات. تُحفظ النسخة الموقّعة في ملفهم مع التاريخ والوقت.',
  'طاهٍ جديد يوقّع عقده وتأكيد دليل الموظف من هاتفه في يومه الأول، دون أن تلاحق الموارد البشرية التوقيعات الورقية.'),
 ('A clear, private process for warnings, following your disciplinary policy: the manager records what happened, HR checks it, the letter is issued and signed, and it is kept in a register only HR and the CEO can see.',
  'A branch manager reports repeated lateness. HR reviews the attendance record, issues a first written warning, and the register shows it if it happens again.',
  'إجراء واضح وخاص للإنذارات وفق سياسة التأديب: يسجل المدير ما حدث، وتتحقق الموارد البشرية، ويصدر الخطاب ويُوقّع، ويُحفظ في سجل لا يراه إلا الموارد البشرية والرئيس التنفيذي.',
  'يبلّغ مدير فرع عن تأخير متكرر. تراجع الموارد البشرية سجل الحضور وتصدر إنذاراً كتابياً أول، ويظهر في السجل إذا تكرر.'),
 ('A short set of questions when someone leaves (why, what we could do better) and a report of the main reasons by branch, job and manager, so we fix the causes of people leaving.',
  'Three cooks left Sharjah in two months, all mentioning split shifts. The report makes the pattern visible.',
  'مجموعة أسئلة قصيرة عند مغادرة الموظف (لماذا، وماذا يمكن أن نحسّن) وتقرير بالأسباب الرئيسية حسب الفرع والوظيفة والمدير، لمعالجة أسباب المغادرة.',
  'غادر ثلاثة طهاة فرع الشارقة خلال شهرين وكلهم ذكروا الورديات المقسّمة. يجعل التقرير هذا النمط واضحاً.'),
 ('Staff can send an idea or a concern without their name, from their phone. HR reads them, groups them, and can reply publicly in the team feed. A digital version of the locked suggestion boxes HR proposed.',
  'A kitchen helper suggests changing the cleaning rota after closing. The idea reaches HR and the head chef without anyone knowing who sent it.',
  'يستطيع الموظف إرسال فكرة أو ملاحظة دون اسمه من هاتفه. تقرأها الموارد البشرية وتصنفها ويمكنها الرد علناً في أخبار الفريق. نسخة رقمية من صناديق الاقتراحات المقفلة التي اقترحتها الموارد البشرية.',
  'مساعد مطبخ يقترح تغيير جدول التنظيف بعد الإغلاق. تصل الفكرة إلى الموارد البشرية ورئيس الطهاة دون معرفة المرسل.'),
 ('The team feed shows birthdays and work anniversaries so colleagues can congratulate each other. Only for people who agree to show it.',
  'On Grace\'s first anniversary at Mayar, the feed shows a post and colleagues add their congratulations.',
  'تعرض أخبار الفريق أعياد الميلاد وذكرى العمل ليهنئ الزملاء بعضهم. فقط لمن يوافق على إظهارها.',
  'في الذكرى الأولى لغريس في مقهى ميار، يظهر منشور في الأخبار ويضيف الزملاء تهانيهم.'),
 ('Managers approve overtime before it is worked, with the reason and the expected hours. Overtime that was not approved in advance is flagged when the attendance is reviewed.',
  'A catering order needs two cooks to stay 3 extra hours on Thursday. The manager approves it on Wednesday, so payroll already expects it.',
  'يوافق المدير على العمل الإضافي قبل حدوثه مع السبب والساعات المتوقعة. ويُنبّه على أي عمل إضافي غير معتمد مسبقاً عند مراجعة الحضور.',
  'طلب تموين يحتاج إلى طاهيين يبقيان 3 ساعات إضافية يوم الخميس. يوافق المدير يوم الأربعاء فتعرف الرواتب ذلك مسبقاً.'),
 ('A picture of the organisation: who reports to whom in each branch and at head office, with photos and vacant positions, built from the org structure file your HR team already made.',
  'A new supervisor opens the chart and sees her team, her manager and the two vacant positions in her branch.',
  'صورة للمؤسسة: من يتبع لمن في كل فرع وفي الإدارة العامة، مع الصور والوظائف الشاغرة، مبنية من ملف الهيكل التنظيمي الذي أعدّه فريق الموارد البشرية.',
  'مشرفة جديدة تفتح المخطط وترى فريقها ومديرها والوظيفتين الشاغرتين في فرعها.'),
]
assert len(EXPLAIN) == len(GAPS)

QUESTIONS = [
 ('Who approves leave in your department today? Is "manager, then HR for more than 5 days" right?', 'من يوافق على الإجازات في قسمك حالياً؟ هل "المدير ثم الموارد البشرية لأكثر من 5 أيام" صحيح؟'),
 ('What do your staff ask HR for most often?', 'ما أكثر ما يطلبه موظفوك من الموارد البشرية؟'),
 ('Should managers ever see salaries? (The plan says no.)', 'هل يجب أن يرى المدراء الرواتب؟ (الخطة تقول لا.)'),
 ('Which documents must we track for your team (for example driving licences for delivery riders)?', 'ما المستندات التي يجب متابعتها لفريقك (مثل رخص القيادة لسائقي التوصيل)؟'),
 ('How many of your staff have their own smartphone?', 'كم من موظفيك لديه هاتف ذكي خاص؟'),
 ('Which request forms should HR build first?', 'ما نماذج الطلبات التي يجب أن تعدها الموارد البشرية أولاً؟'),
 ('Which reports do you need every week?', 'ما التقارير التي تحتاجها كل أسبوع؟'),
 ('From the "might be missing" list, which three matter most to you?', 'من قائمة "ما قد ينقصنا"، ما أهم ثلاثة بالنسبة لك؟'),
 ('Is anything else missing, or anything we should remove?', 'هل هناك شيء آخر ناقص أو شيء يجب حذفه؟'),
]
SYM = {'do': '✓', 'see': '◐', '': '—'}
WORD = {'do': ('Does', 'ينفّذ'), 'see': ('Sees', 'يرى'), '': ('—', '—')}

def page(lang_switch=True):
    t = lambda en, ar: (f'<span class="en">{e(en)}</span><span class="ar" lang="ar" dir="rtl">{e(ar)}</span>' if lang_switch else e(en))
    out = []
    out.append(f'<h1>{t("Forka People: who can do what", "Forka People: من يستطيع ماذا")}</h1>')
    out.append(f'<p class="lead">{t("This is a draft for department heads. Please read what each role can do, then answer the questions at the end. Add your comments anywhere. Nothing is final.", "هذه مسودة لرؤساء الأقسام. يرجى قراءة ما يستطيعه كل دور ثم الإجابة عن الأسئلة في النهاية. أضف ملاحظاتك في أي مكان. لا شيء نهائي.")}</p>')
    out.append(f'<h2>{t("1. What each role can do", "1. ما يستطيعه كل دور")}</h2>')
    for key, en, ar, den, dar in ROLES:
        out.append(f'<section class="role role-{key}"><h3>{t(en, ar)}</h3><p class="muted">{t(den, dar)}</p><ul>')
        out += [f'<li>{t(a, b)}</li>' for a, b in CAN[key]]
        out.append('</ul></section>')
    out.append(f'<h2>{t("2. All modules at a glance", "2. كل الأقسام في نظرة واحدة")}</h2>')
    out.append(f'<p class="muted">{t("Does = can do it · Sees = can only see it, or only their own · — = no access", "ينفّذ = يستطيع القيام به · يرى = يرى فقط أو ما يخصه فقط · — = لا صلاحية")}</p>')
    out.append('<table class="matrix"><thead><tr><th></th>' + ''.join(f'<th>{t(en, ar)}</th>' for _, en, ar, _, _ in ROLES) + '</tr></thead><tbody>')
    for row in MATRIX:
        out.append(f'<tr><th>{t(row[0], row[1])}</th>' + ''.join(f'<td class="c-{v or "no"}">{t(*WORD[v])}</td>' for v in row[2:]) + '</tr>')
    out.append('</tbody></table>')
    out.append(f'<h2>{t("3. What we might be missing", "3. ما قد ينقصنا")}</h2>')
    out.append(f'<p class="muted">{t("We compared our plan with Zoho People, Odoo HR, SAP SuccessFactors, Bayzat (UAE) and restaurant scheduling tools such as 7shifts, using their public feature descriptions. These are ideas to discuss. Khaled's first decisions (12 Nov) are shown under each idea.", "قارنّا خطتنا مع Zoho People وOdoo HR وSAP SuccessFactors وBayzat (الإمارات) وأدوات جدولة المطاعم مثل 7shifts، بناءً على وصف خصائصها المنشور. هذه أفكار للنقاش. قرارات خالد الأولى (12 نوفمبر) تظهر تحت كل فكرة.")}</p>')
    out.append('<table class="gaps"><thead><tr><th>' + t('Idea', 'الفكرة') + '</th><th>' + t('What it does', 'ماذا يفعل') + '</th><th>' + t('Seen in', 'موجود في') + '</th><th>' + t('Phase', 'المرحلة') + '</th></tr></thead><tbody>')
    for (en, ar, den, dar, src, ph), (me, xe, ma, xa) in zip(GAPS, EXPLAIN):
        out.append(f'<tr><td><strong>{t(en, ar)}</strong></td><td>{t(den, dar)}<div class="ex"><b>{t("What we mean:", "ما نقصده:")}</b> {t(me, ma)}</div><div class="ex eg"><b>{t("Example at Forka:", "مثال في فوركا:")}</b> {t(xe, xa)}</div>{f'<div class="ex dec"><b>{t("Decision:", "القرار:")}</b> {t(*decision(en))}</div>' if en in DECIDED else ''}</td><td class="src">{e(src)}</td><td class="ph">{t(ph, phase_ar(ph))}</td></tr>')
    out.append('</tbody></table>')
    out.append(f'<h2>{t("4. Questions for you", "4. أسئلة لك")}</h2><ol class="qs">')
    out += [f'<li>{t(a, b)}</li>' for a, b in QUESTIONS]
    out.append('</ol>')
    return '\n'.join(out)

CSS = """:root{color-scheme:light}body{margin:0;background:#F6F3EE;color:#2B2B2B;font:15.5px/1.6 'Inter Tight',system-ui,sans-serif}
main{max-width:1100px;margin:0 auto;padding:24px 20px 60px}h1,h2,h3{font-family:'EB Garamond',Georgia,serif;font-weight:600;margin:0 0 6px}
h1{font-size:32px}h2{font-size:24px;margin-top:32px}h3{font-size:20px}.lead{font-size:16.5px}.muted{color:#5E5A54}
html[lang=ar] body{font-family:'IBM Plex Sans Arabic','Inter Tight',sans-serif}html[lang=ar] h1,html[lang=ar] h2,html[lang=ar] h3{font-family:'IBM Plex Sans Arabic',serif}
.ar{display:none}html[lang=ar] .ar{display:inline}html[lang=ar] .en{display:none}
.bar{position:sticky;top:0;background:#2B2B2B;color:#F6F3EE;padding:10px 20px;display:flex;justify-content:space-between;align-items:center;z-index:2}
.bar b{font-family:'EB Garamond',serif;font-size:20px}.bar b span{color:#C9A877}.bar button{background:#F6F3EE;color:#2B2B2B;border:0;border-radius:8px;padding:8px 14px;font:inherit;cursor:pointer}
.roles{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:12px}
.role{background:#fff;border:1px solid #E3DCD1;border-top:5px solid #3D7C8C;border-radius:12px;padding:14px 18px}.role ul{margin:6px 0 0;padding-inline-start:20px}.role li{margin:4px 0}
.role-manager{border-top-color:#7C9A7E}.role-hr{border-top-color:#C8553D}.role-payroll{border-top-color:#E3A33B}.role-ceo{border-top-color:#8C6A3F}
table{border-collapse:collapse;width:100%;background:#fff;border:1px solid #E3DCD1;border-radius:12px;overflow:hidden;font-size:14.5px}
th,td{padding:9px 12px;border-bottom:1px solid #EEE9E1;text-align:start;vertical-align:top}thead th{background:#FAF8F4;color:#5E5A54;font-size:13.5px}
.matrix td{text-align:center;font-weight:600;font-size:14px}.c-do{color:#2F6B3F;background:#EEF6EF}.c-see{color:#245A63;background:#EDF4F5}.c-no{color:#9A938A}
.ex{margin-top:6px;font-size:14px;line-height:1.5}.ex b{color:#3D7C8C}.eg{background:#FAF8F4;border-inline-start:3px solid #E3A33B;padding:6px 10px;border-radius:6px}.eg b{color:#8E6210}.dec{background:#EEF3EE;border-inline-start:3px solid #7C9A7E;padding:6px 10px;border-radius:6px}.dec b{color:#4B6A4E}.src{color:#5E5A54;font-size:13px;white-space:nowrap}.ph{font-weight:700;text-align:center}.qs li{margin:8px 0}.wrap{overflow-x:auto}"""

body = page(True).replace('<section class="role role-staff">', '<div class="roles"><section class="role role-staff">').replace(
    '</section>\n<h2><span class="en">2.', '</section></div>\n<h2><span class="en">2.').replace('<table', '<div class="wrap"><table').replace('</table>', '</table></div>')
web = f"""<!DOCTYPE html><html lang="en" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Forka People: who can do what</title>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@600&family=IBM+Plex+Sans+Arabic:wght@400;600&family=Inter+Tight:wght@400;600;700&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body>
<div class="bar"><b>Forka <span>People</span></b><button id="lang" type="button">العربية</button></div>
<main>{body}<p class="muted" style="margin-top:28px"><span class="en">Draft, 12 November 2026. Prepared for Forka department heads.</span><span class="ar" lang="ar">مسودة، 12 نوفمبر 2026. أُعدّت لرؤساء الأقسام في فوركا.</span></p></main>
<script>
const b=document.getElementById('lang');const set=l=>{{document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr';b.textContent=l==='ar'?'English':'العربية';try{{localStorage.setItem('fp_review_lang',l)}}catch(e){{}}}};
b.onclick=()=>set(document.documentElement.lang==='ar'?'en':'ar');try{{const l=localStorage.getItem('fp_review_lang');if(l)set(l)}}catch(e){{}}
</script></body></html>"""
(ROOT / '12-roles-review.html').write_text(web)

# Plain version for Google Docs: English part, then Arabic part (right to left).
def plain(ar=False):
    pick = (lambda en, a: a) if ar else (lambda en, a: en)
    d = 'rtl' if ar else 'ltr'; al = 'right' if ar else 'left'
    o = [f'<div dir="{d}" style="text-align:{al}">']
    o.append(f'<h1>{e(pick("Forka People: who can do what", "Forka People: من يستطيع ماذا"))}</h1>')
    o.append(f'<p>{e(pick("Draft for department heads. Please read what each role can do and answer the questions at the end. Use Insert → Comment anywhere to give your thoughts.", "مسودة لرؤساء الأقسام. يرجى قراءة ما يستطيعه كل دور والإجابة عن الأسئلة في النهاية. استخدم إدراج ← تعليق في أي مكان لإضافة ملاحظاتك."))}</p>')
    o.append(f'<h2>{e(pick("1. What each role can do", "1. ما يستطيعه كل دور"))}</h2>')
    for key, en, a, den, dar in ROLES:
        o.append(f'<h3>{e(pick(en, a))}</h3><p><i>{e(pick(den, dar))}</i></p><ul>' + ''.join(f'<li>{e(pick(x, y))}</li>' for x, y in CAN[key]) + '</ul>')
    o.append(f'<h2>{e(pick("2. All modules at a glance", "2. كل الأقسام في نظرة واحدة"))}</h2><p>{e(pick("Does = can do it · Sees = can only see it, or only their own · — = no access", "ينفّذ = يستطيع القيام به · يرى = يرى فقط أو ما يخصه فقط · — = لا صلاحية"))}</p>')
    o.append('<table border="1" cellpadding="5" style="border-collapse:collapse"><tr><th></th>' + ''.join(f'<th>{e(pick(en, a))}</th>' for _, en, a, _, _ in ROLES) + '</tr>')
    for row in MATRIX: o.append(f'<tr><td><b>{e(pick(row[0], row[1]))}</b></td>' + ''.join(f'<td style="text-align:center">{e(pick(*WORD[v]))}</td>' for v in row[2:]) + '</tr>')
    o.append('</table>')
    o.append(f'<h2>{e(pick("3. What we might be missing", "3. ما قد ينقصنا"))}</h2><p>{e(pick("Compared with Zoho People, Odoo HR, SAP SuccessFactors, Bayzat (UAE) and restaurant scheduling tools such as 7shifts, from their public feature descriptions. Ideas to discuss, not decisions. Please mark the three that matter most to you.", "مقارنة مع Zoho People وOdoo HR وSAP SuccessFactors وBayzat (الإمارات) وأدوات جدولة المطاعم مثل 7shifts، من وصف خصائصها المنشور. أفكار للنقاش وليست قرارات. يرجى تحديد أهم ثلاثة بالنسبة لك."))}</p>')
    o.append('<table border="1" cellpadding="5" style="border-collapse:collapse"><tr>' + ''.join(f'<th>{e(pick(x, y))}</th>' for x, y in [('Idea', 'الفكرة'), ('What it does', 'ماذا يفعل'), ('Seen in', 'موجود في'), ('Phase', 'المرحلة'), ('Your view', 'رأيك')]) + '</tr>')
    for (en, a, den, dar, src, ph), (me, xe, ma, xa) in zip(GAPS, EXPLAIN): o.append(f'<tr><td><b>{e(pick(en, a))}</b></td><td>{e(pick(den, dar))}<br><br><b>{e(pick("What we mean:", "ما نقصده:"))}</b> {e(pick(me, ma))}<br><br><b>{e(pick("Example at Forka:", "مثال في فوركا:"))}</b> <i>{e(pick(xe, xa))}</i>{f'<br><br><b>{e(pick("Decision:", "القرار:"))}</b> {e(pick(*decision(en)))}' if en in DECIDED else ''}</td><td>{e(src)}</td><td>{e(pick(ph, phase_ar(ph)))}</td><td></td></tr>')
    o.append('</table>')
    o.append(f'<h2>{e(pick("4. Questions for you", "4. أسئلة لك"))}</h2><ol>' + ''.join(f'<li>{e(pick(x, y))}<br><br></li>' for x, y in QUESTIONS) + '</ol></div>')
    return ''.join(o)
doc = '<html><head><meta charset="utf-8"></head><body>' + plain(False) + '<hr>' + plain(True) + '</body></html>'
(ROOT / '12-roles-review-doc.html').write_text(doc)
print('roles review built:', len(GAPS), 'ideas,', len(QUESTIONS), 'questions')
