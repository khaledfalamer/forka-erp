// @ts-nocheck
/* Forka Hire - logic: data, who may do what, saving to the Hiring server, the Arabic text layer, and every action.
   Moved from hiring/index.html without changing behaviour. The screens are in ./views (React).
   Types are added step by step; until then this file is not type-checked (see app/README.md). */
import { paint, staticHtml } from './paint';
import { render, opt } from './views/shell';
import { bStat } from './views/pages';
import { pvHtml, wReview } from './views/team';
import { reqForm, openReq } from './views/request';
import { openCand, schedRender } from './views/cand';
export { render, opt };

export let LANG: any =(()=>{try{return localStorage.getItem("forkaHireLang")==="ar"?"ar":"en"}catch(e){return "en"}})();
export const AR={
"Guidance for AI":"إرشادات للذكاء الاصطناعي","Hiring":"التوظيف","Hire":"التوظيف","Work type":"نوع العمل","On site":"في الفرع","Remote":"عن بُعد","Hybrid":"مختلط (في الفرع وعن بُعد)","Remote: the branch is optional (the team it reports to)":"للعمل عن بُعد: الفرع اختياري (الفريق الذي يتبع له)","Summarise CV":"تلخيص السيرة الذاتية","Role":"الوظيفة","Years":"سنوات الخبرة","Languages":"اللغات","Visa / notice":"الإقامة / فترة الإشعار","Recent employers":"آخر جهات العمل","Must-have":"الشرط الأساسي","AI score":"درجة الذكاء الاصطناعي","Evidence in the CV":"الدليل في السيرة","Summarise again":"تلخيص مرة أخرى","Submit my scorecard":"إرسال تقييمي","AI summary":"ملخص الذكاء الاصطناعي","Suggestion — check it against the CV":"اقتراح — تحقق منه مقابل السيرة الذاتية","Check with the candidate":"تحقق مع المرشح","Questions about this CV":"أسئلة عن هذه السيرة","Summarise CV and suggest scores":"تلخيص السيرة واقتراح الدرجات","Save guidance":"حفظ الإرشادات",
"The AI follows this every time it drafts a job description or job ad. Write it like a note to a new HR assistant: tone, what to always include, what never to say.":"يلتزم الذكاء الاصطناعي بهذه الإرشادات في كل مرة يكتب فيها وصفاً وظيفياً أو إعلان وظيفة. اكتبها كأنها ملاحظة لمساعد موارد بشرية جديد: الأسلوب، وما يجب ذكره دائماً، وما لا يُذكر أبداً.",
"Notes for the AI, for this job only":"ملاحظات للذكاء الاصطناعي لهذه الوظيفة فقط","Draft JD + ads with AI":"كتابة الوصف والإعلانات بالذكاء الاصطناعي",
// nav, roles, header
"Dashboard":"الرئيسية","CEO approvals":"موافقات الرئيس","Hiring requests":"طلبات التوظيف","Candidates":"المرشحون","Talent pool & compliance":"بنك المواهب","Careers page":"صفحة الوظائف","Team & access":"الفريق","Open roles":"الوظائف المتاحة","My applications":"طلباتي",
"CEO · HR":"الرئيس التنفيذي","HR":"الموارد البشرية","Dept head":"رئيس القسم","Candidate":"مرشح","Department head":"رئيس القسم","CEO":"الرئيس التنفيذي","Dept head + HR":"رئيس القسم + الموارد البشرية",
"View as: CEO · HR":"عرض بصفة: الرئيس التنفيذي · الموارد البشرية","View as: Candidate":"عرض بصفة: مرشح","Sara (candidate)":"سارة (مرشحة)","Head Chef":"رئيس الطهاة",
"Loading…":"جارٍ التحميل…",
// stages / statuses
"Applied":"تقدّم","Screening":"الفرز","Personality":"تقييم الشخصية","Shortlist":"القائمة المختصرة","Interview":"المقابلة","References":"المراجع","Final evaluation":"التقييم النهائي","CEO approval":"موافقة الرئيس التنفيذي","Offer & documents":"العرض والمستندات","Hired":"تم التعيين","Rejected":"مرفوض","Talent pool":"بنك المواهب",
"Received":"تم الاستلام","Under review":"قيد المراجعة","Final checks":"التحقق النهائي","Offer":"العرض","Welcome to Forka":"مرحبًا بك في فوركا","Not selected this time":"لم يتم الاختيار هذه المرة","Kept in our talent pool":"محفوظ في بنك المواهب",
"Waiting for CEO":"بانتظار الرئيس التنفيذي","Scorecard being built":"جارٍ إعداد بطاقة التقييم","Head to approve scorecard":"بانتظار موافقة رئيس القسم على بطاقة التقييم","Ready to post":"جاهزة للنشر","Open":"مفتوحة","Filled":"تم شغلها","Closed":"مغلقة","Declined":"مرفوضة",
// constants
"Operations":"العمليات","Kitchen":"المطبخ","Service":"الخدمة","Marketing":"التسويق","Finance":"المالية","Procurement & Store":"المشتريات والمخزن","Administration":"الإدارة",
"Sharjah":"الشارقة","Fujairah":"الفجيرة","Umm Al Quwain":"أم القيوين","Mayar Cafe":"مقهى ميار","Oman":"عُمان","Ajman Central Store":"المخزن المركزي - عجمان","Head Office":"المكتب الرئيسي",
"Trial shift":"مناوبة تجريبية","Cooking test":"اختبار طبخ","Barista test":"اختبار باريستا","Case study":"دراسة حالة","Presentation":"عرض تقديمي","Excel exercise":"تمرين إكسل","Operations scenario":"سيناريو تشغيلي",
"Reliability and discipline":"الالتزام والانضباط","Follows SOPs, on time, finishes tasks":"يتبع الإجراءات، ملتزم بالوقت، ينجز مهامه","Calm under pressure":"الهدوء تحت الضغط","Steady in a rush, a complaint or an audit":"ثابت وقت الذروة أو الشكوى أو التدقيق","Team cooperation":"التعاون مع الفريق","Helps others, handles conflict well":"يساعد الآخرين ويتعامل مع الخلافات بحكمة","Energy with people":"الحيوية مع الناس","Warm, confident with guests and staff":"ودود وواثق مع الضيوف والموظفين","Openness to change":"الانفتاح على التغيير","Learns fast, adapts, takes on new tasks":"يتعلم بسرعة ويتأقلم ويتولى مهامًا جديدة",
"Leadership":"القيادة","Problem solving":"حل المشكلات","Accountability":"تحمّل المسؤولية","Communication":"التواصل","Teamwork":"العمل الجماعي","Commercial awareness":"الحس التجاري",
"Relevant experience":"الخبرة ذات الصلة","Reason for leaving":"سبب ترك العمل","Salary fit":"ملاءمة الراتب","Career motivation":"الدافع المهني",
"Passport copy":"نسخة جواز السفر","Visa / residency":"التأشيرة / الإقامة","Certificates":"الشهادات","Photos":"صور شخصية","Bank details":"بيانات الحساب البنكي","Signed offer letter":"خطاب العرض موقّع",
"Food first":"الطعام أولًا","Standards you can measure":"معايير قابلة للقياس","Grow with the group":"انمُ مع المجموعة","Multi-skilled teams":"فرق متعددة المهارات","Every candidate gets a reply":"كل مرشح يحصل على رد",
"We operate restaurants across the UAE and Oman — Kuwaiti Kitchen, Mayar Cafe and more — and we're building the biggest F&B group in the region. Owners should own; operators should operate. We're looking for operators.":"نشغّل مطاعم في الإمارات وعُمان — المطبخ الكويتي ومقهى ميار وغيرها — ونبني أكبر مجموعة أغذية ومشروبات في المنطقة. المُلّاك يملكون، والمشغّلون يشغّلون. ونحن نبحث عن مشغّلين.",
"Clear career paths across five businesses · training through the Forka Learning Library · a fair, scored hiring process":"مسارات مهنية واضحة عبر خمسة أعمال · تدريب من خلال مكتبة فوركا للتعلّم · عملية توظيف عادلة ومُقيّمة بالدرجات",
// generic
"OK":"موافق","Delete request":"حذف الطلب","Delete this hiring request? This cannot be undone.":"حذف طلب التوظيف هذا؟ لا يمكن التراجع.","Yes, delete":"نعم، احذف","Request deleted":"تم حذف الطلب","This request has candidates. Close the role instead of deleting it.":"لهذا الطلب مرشحون. أغلق الوظيفة بدلاً من حذفها.","Yes":"نعم","No":"لا","Add":"إضافة","Done":"تم","Save":"حفظ","Cancel":"إلغاء","Remove":"إزالة","Apply":"تقدّم الآن","Approve":"موافقة","Decline":"رفض","Request":"طلب","Reopen":"إعادة فتح","Close role":"إغلاق الوظيفة","Role":"الوظيفة","Name":"الاسم","Email":"البريد الإلكتروني","Phone":"الهاتف","Stage":"المرحلة","Status":"الحالة","Source":"المصدر","Notes":"الملاحظات","Range":"النطاق","Saved":"تم الحفظ","Copied":"تم النسخ","Added":"تمت الإضافة","Deleted":"تم الحذف","Other":"أخرى","Choose…":"اختر…","Other (write it)":"أخرى (اكتبها)","Someone":"شخص ما","Overdue":"متأخر","Waiting":"بانتظار","Intro":"المقدمة","Values":"القيم","Access":"الصلاحيات","Person":"الشخص","Editor":"محرر","Contributor":"مساهم","Scores":"الدرجات","Profile":"الملف","Location":"الموقع","Package":"الباقة","Currency":"العملة","Headcount":"العدد المطلوب","Department":"القسم","Experience":"الخبرة","Questions":"الأسئلة","Concern":"ملاحظة سلبية","Verified":"تم التحقق","Joining":"الالتحاق","Raised":"تاريخ الطلب","Posted":"تاريخ النشر","Notice":"فترة الإشعار","Consent":"الموافقة","Match":"التطابق","Screen":"فرز","Agency":"وكالة","Indeed":"Indeed","Referral":"ترشيح","Post job":"نشر الوظيفة","Duplicate":"نسخة مكررة","Confirmed":"مؤكد","Technical":"فني","Competency":"الكفاءات","Recommendation":"التوصية","Next actions":"الإجراءات التالية","Working…":"جارٍ العمل…","Uploading CV…":"جارٍ رفع السيرة الذاتية…","Result…":"النتيجة…","Very low":"منخفض جدًا","Critical":"حرج","critical":"حرج","not now":"ليس الآن","Not recorded":"غير مسجّل","not recorded":"غير مسجّل","to be chosen":"سيتم اختياره","working days":"أيام عمل","days":"أيام","yrs":"سنوات","avg":"متوسط","Req ID":"رقم الطلب","CV":"السيرة الذاتية","CV text":"نص السيرة الذاتية","CV file":"ملف السيرة الذاتية","No CV yet.":"لا توجد سيرة ذاتية بعد.","Open CV ·":"فتح السيرة الذاتية ·","(owner)":"(المالك)",
// dashboard / pages
"Good to see you":"أهلًا بك","Waiting on you":"بانتظارك","Nothing waiting.":"لا يوجد شيء بانتظارك.","Pipeline funnel":"مسار المرشحين","Where candidates come from":"مصادر المرشحين","Candidates in process":"مرشحون قيد الإجراءات","Overdue (2-day SLA)":"متأخر (مهلة يومين)","Your department's hiring at a glance.":"توظيف قسمك بلمحة سريعة.","Every Forka hire, request to offer, on one standard flow.":"كل تعيين في فوركا، من الطلب إلى العرض، في مسار واحد موحّد.","approvals and shortlist replies":"الموافقات والردود على القوائم المختصرة","request → hire (target 21–28)":"من الطلب إلى التعيين (الهدف ٢١–٢٨)","Dept head: reply on shortlist":"رئيس القسم: الرد على القائمة المختصرة",
"Two working days on each — vacancies and final candidates.":"يوما عمل لكلٍّ منهما — الشواغر والمرشحون النهائيون.","Vacancies to approve (step 2)":"شواغر بانتظار الموافقة (الخطوة ٢)","Final candidates to approve (step 14)":"مرشحون نهائيون بانتظار الموافقة (الخطوة ١٤)","No vacancies waiting.":"لا توجد شواغر بانتظار الموافقة.","No candidates waiting.":"لا يوجد مرشحون بانتظار الموافقة.","Approve vacancy":"الموافقة على الشاغر","Why is this vacancy declined?":"لماذا تم رفض هذا الشاغر؟","CEO declined:":"رفض الرئيس التنفيذي:","Renegotiate":"إعادة التفاوض",
"Department heads raise them; CEO approves; HR builds the scorecard; head approves; HR posts.":"يرفعها رؤساء الأقسام، ويوافق الرئيس التنفيذي، وتُعدّ الموارد البشرية بطاقة التقييم، ويعتمدها رئيس القسم، ثم تنشرها الموارد البشرية.","+ New hiring request":"+ طلب توظيف جديد","New hiring request":"طلب توظيف جديد","No hiring requests yet.":"لا توجد طلبات توظيف بعد.","Raise the first one.":"ارفع أول طلب.","Hiring request raised":"تم رفع طلب التوظيف","Sent to Khaled for approval":"أُرسل إلى خالد للموافقة",
"Every move is logged the same day. Every rejection names the criterion it failed.":"كل خطوة تُسجّل في اليوم نفسه، وكل رفض يذكر المعيار الذي لم يُستوفَ.","Shortlisted candidates for your roles. Score each interview on your own before discussing.":"المرشحون في القائمة المختصرة لوظائف قسمك. قيّم كل مقابلة بنفسك قبل النقاش.","Search name, email, CV text…":"ابحث بالاسم أو البريد أو نص السيرة الذاتية…","All roles":"كل الوظائف","Board view":"عرض اللوحة","List view":"عرض القائمة","No candidates.":"لا يوجد مرشحون.","No candidates yet":"لا يوجد مرشحون بعد","+ Add applicant":"+ إضافة متقدّم","Add applicant":"إضافة متقدّم","Bulk move to":"نقل جماعي إلى","Reason for all selected (criterion failed)":"السبب لجميع المحدَّدين (المعيار غير المستوفى)","rejected or in talent pool — see the list view":"مرفوضون أو في بنك المواهب — راجع عرض القائمة","new online":"جديد عبر الإنترنت","above range":"أعلى من النطاق","Applied online":"تقدّم عبر الإنترنت","Added by HR (":"أضافته الموارد البشرية (",
"Rejected candidates get a reply. Strong \"not now\" candidates stay searchable for the next opening.":"المرشحون المرفوضون يتلقون ردًا، والمرشحون الأقوياء غير المناسبين حاليًا يبقون متاحين للبحث في الفرص القادمة.","In talent pool":"في بنك المواهب","Consider for a role":"ترشيح لوظيفة","Reason on file":"السبب المسجّل","Retention check: no personality reports older than 6 months for unsuccessful candidates.":"فحص الاحتفاظ بالبيانات: لا تقارير شخصية أقدم من ٦ أشهر للمرشحين غير المقبولين.","personality report(s) past 6 months":"تقرير/تقارير شخصية تجاوزت ٦ أشهر","for unsuccessful candidates — the Hiring Guide says delete them.":"لمرشحين غير مقبولين — دليل التوظيف ينص على حذفها.","Delete those reports":"حذف هذه التقارير","Reconsidered from talent pool for":"أُعيد النظر فيه من بنك المواهب لوظيفة","Which open role?":"أي وظيفة متاحة؟","No open roles":"لا توجد وظائف متاحة",
"FORKA COLLECTIVE · CAREERS":"فوركا كولكتيف · الوظائف","Build the region's best restaurants with us":"ابنِ معنا أفضل مطاعم المنطقة","What we offer":"ما نقدّمه","Preview as candidate":"معاينة كمرشح","Careers page saved":"تم حفظ صفحة الوظائف",
"Three access levels. Anyone not listed here sees the candidate view.":"ثلاثة مستويات صلاحية. أي شخص غير مدرج هنا يرى واجهة المرشح.","+ Add HR or department head":"+ إضافة موارد بشرية أو رئيس قسم","Add HR or department head":"إضافة موارد بشرية أو رئيس قسم","Find person":"البحث عن شخص","Type a name":"اكتب اسمًا","Pick a person":"اختر شخصًا","No matches — share the app with them first.":"لا نتائج — شارك التطبيق معهم أولًا.","Search unavailable.":"البحث غير متاح.","Nobody here yet.":"لا يوجد أحد بعد.",
"Also share the app with each HR person and department head as":"شارك التطبيق أيضًا مع كل موظف موارد بشرية ورئيس قسم بصلاحية","(Share button on this page), so they can save scorecards. Staff applying internally need":"(زر المشاركة في هذه الصفحة) حتى يتمكنوا من حفظ بطاقات التقييم. الموظفون الذين يتقدمون داخليًا يحتاجون صلاحية",
"Public candidates without a Forka account apply through hr@forka.com (position in the subject). HR logs them with":"المرشحون من خارج فوركا يتقدمون عبر hr@forka.com (مع اسم الوظيفة في الموضوع)، وتسجّلهم الموارد البشرية عبر","— paste the CV and the AI fills the form. Staff and invited candidates apply right here.":"— الصق السيرة الذاتية ويملأ الذكاء الاصطناعي النموذج. الموظفون والمرشحون المدعوون يتقدمون هنا مباشرة.",
"Raises hiring requests, approves the scorecard, picks from the shortlist, scores interviews and practical tests. Sees only their department, from shortlist onwards — never salary negotiation or raw personality reports.":"يرفع طلبات التوظيف، ويعتمد بطاقة التقييم، ويختار من القائمة المختصرة، ويقيّم المقابلات والاختبارات العملية. يرى قسمه فقط ابتداءً من القائمة المختصرة — دون مفاوضات الرواتب أو تقارير الشخصية الأصلية.",
"Sees open roles and the careers page, applies with pre-screening questions, and tracks their own application status. Never sees scores or notes.":"يرى الوظائف المتاحة وصفحة الوظائف، ويتقدم مع أسئلة الفرز المبدئي، ويتابع حالة طلبه. لا يرى الدرجات أو الملاحظات أبدًا.",
"No open roles right now — check back soon.":"لا توجد وظائف متاحة حاليًا — عُد قريبًا.","View & apply":"عرض وتقدّم","Browse open roles":"تصفّح الوظائف المتاحة","See open roles":"عرض الوظائف المتاحة","You haven't applied yet.":"لم تتقدم بعد.","We reply to every applicant. You'll see each step here.":"نردّ على كل متقدّم، وسترى كل مرحلة هنا.",
"You've been invited to interview. HR will contact you with the time and the practical test (":"تمت دعوتك للمقابلة. ستتواصل معك الموارد البشرية بالموعد والاختبار العملي (","Congratulations — HR will send the offer letter and the list of documents to bring.":"مبروك — سترسل لك الموارد البشرية خطاب العرض وقائمة المستندات المطلوبة.",
"Thank you for applying. This time we've gone with candidates whose experience matched the role more closely. We'll keep your details for future roles if you agreed to that.":"شكرًا لتقدّمك. اخترنا هذه المرة مرشحين تتطابق خبراتهم مع الوظيفة بشكل أكبر، وسنحتفظ ببياناتك لفرص مستقبلية إن كنت قد وافقت على ذلك.",
// request form
"One form, about 10 minutes. From the second hire of the same role, start from the last request.":"نموذج واحد، حوالي ١٠ دقائق. من التعيين الثاني لنفس الوظيفة، ابدأ من آخر طلب.","Step 1 of the Hiring Guide · about 10 minutes · CEO approves within 2 working days":"الخطوة ١ من دليل التوظيف · حوالي ١٠ دقائق · يوافق الرئيس التنفيذي خلال يومي عمل","Start from a previous request…":"ابدأ من طلب سابق…","Role title":"المسمى الوظيفي","Dept / branch":"القسم / الفرع","Dept · branch":"القسم · الفرع","Branch / location":"الفرع / الموقع","New or replacement":"جديد أو بديل","New position":"وظيفة جديدة","Replacement":"بديل","Same role as before?":"نفس الوظيفة السابقة؟","Role purpose":"هدف الوظيفة","one or two lines":"سطر أو سطران","Key duties":"المهام الرئيسية","Top 3 must-haves":"أهم ٣ متطلبات أساسية","3 must-haves":"٣ متطلبات أساسية","one per line":"واحد في كل سطر","Practical test":"الاختبار العملي","Practical test(s)":"الاختبار/الاختبارات العملية","practical test":"الاختبار العملي","choose one or more":"اختر واحدًا أو أكثر","Other practical test (optional)":"اختبار عملي آخر (اختياري)","2–3 personality traits that matter most":"٢–٣ سمات شخصية هي الأهم","2–3 traits":"٢–٣ سمات","tick \"Critical\" on any trait where a very low result must be cleared in interview — as many as you need":"ضع علامة \"حرج\" على أي سمة يجب توضيح نتيجتها المنخفضة جدًا في المقابلة — بالعدد الذي تحتاجه","critical traits must also be ticked as traits":"السمات الحرجة يجب تحديدها كسمات أيضًا","Salary range — min (total package)":"نطاق الراتب — الحد الأدنى (الباقة الإجمالية)","Salary range — max":"نطاق الراتب — الحد الأعلى","Salary range":"نطاق الراتب","salary range":"نطاق الراتب","Salary range:":"نطاق الراتب:","Target joining date":"تاريخ الالتحاق المستهدف","Joining date":"تاريخ الالتحاق","Send to CEO for approval":"إرسال للرئيس التنفيذي للموافقة","Send for CEO approval":"إرسال لموافقة الرئيس التنفيذي","Not yet approved":"لم تتم الموافقة بعد","Waiting for CEO approval ·":"بانتظار موافقة الرئيس التنفيذي ·","Head asked for changes:":"طلب رئيس القسم تعديلات:","What should HR change?":"ما الذي يجب على الموارد البشرية تعديله؟","Ask HR for changes":"اطلب تعديلات من الموارد البشرية","Approve scorecard":"اعتماد بطاقة التقييم","Department head approved the scorecard":"اعتمد رئيس القسم بطاقة التقييم","Scorecard + JD sent to head for approval":"أُرسلت بطاقة التقييم والوصف الوظيفي لرئيس القسم للاعتماد","Send scorecard to":"إرسال بطاقة التقييم إلى","Scorecard inputs":"مدخلات بطاقة التقييم","Job description, ad & pre-screening":"الوصف الوظيفي والإعلان والفرز المبدئي","Job description":"الوصف الوظيفي","Job ad — English":"إعلان الوظيفة — بالإنجليزية","Job ad — Arabic":"إعلان الوظيفة — بالعربية","Copy English ad":"نسخ الإعلان الإنجليزي","Draft JD + ads with AI":"صياغة الوصف والإعلانات بالذكاء الاصطناعي","Write the JD first":"اكتب الوصف الوظيفي أولًا","Pre-screening knock-out questions":"أسئلة الفرز المبدئي الإقصائية","one per line — candidate must answer Yes, or is auto-rejected with the reason logged":"سؤال في كل سطر — يجب أن يجيب المرشح بنعم، وإلا يُرفض تلقائيًا مع تسجيل السبب","Knock-out questions:":"الأسئلة الإقصائية:","Job posted":"تم نشر الوظيفة","Position filled":"تم شغل الوظيفة","Role closed":"تم إغلاق الوظيفة","Filled — check it":"تم الشغل — تحقّق","Post a role first — no open roles yet":"انشر وظيفة أولًا — لا توجد وظائف متاحة بعد","Raised by":"رفعه","· raised by":"· رفعه","Applied for":"تقدّم لوظيفة",
"Duties:":"المهام:","Must-haves:":"المتطلبات الأساسية:","Traits:":"السمات:",
// application
"Answer the quick questions":"أجب عن الأسئلة السريعة","Quick questions":"أسئلة سريعة","Full name":"الاسم الكامل","Phone / WhatsApp":"الهاتف / واتساب","Current location":"الموقع الحالي","Years experience":"سنوات الخبرة","Years of relevant experience":"سنوات الخبرة ذات الصلة","Expected salary":"الراتب المتوقع","Expected monthly salary (total)":"الراتب الشهري المتوقع (إجمالي)","Expected salary:":"الراتب المتوقع:","Notice period (days)":"فترة الإشعار (أيام)","Visa status":"حالة التأشيرة","Own visa / residency":"إقامة / تأشيرة خاصة","Employer visa — transferable":"تأشيرة صاحب عمل — قابلة للتحويل","Visit visa":"تأشيرة زيارة","Needs visa":"يحتاج تأشيرة","Upload your CV":"ارفع سيرتك الذاتية","PDF or a photo of it · max 20 MB · Word files: please save as PDF first":"ملف PDF أو صورة منها · الحد الأقصى ٢٠ ميغابايت · ملفات Word: احفظها بصيغة PDF أولًا","Or paste your CV / LinkedIn link":"أو الصق سيرتك الذاتية / رابط لينكدإن","optional if you uploaded a file":"اختياري إذا رفعت ملفًا","I agree Forka may use my details for this role and keep them up to 6 months for future roles.":"أوافق على أن تستخدم فوركا بياناتي لهذه الوظيفة وتحتفظ بها حتى ٦ أشهر لفرص مستقبلية.","Submit application":"إرسال الطلب","Application sent — track it under My applications":"تم إرسال الطلب — تابعه من قسم طلباتي","Please tick the consent box":"يرجى وضع علامة على خانة الموافقة","Please upload your CV (or paste it)":"يرجى رفع سيرتك الذاتية (أو لصقها)","Name and email are needed":"الاسم والبريد الإلكتروني مطلوبان","Name needed":"الاسم مطلوب","That file is over 20 MB":"حجم الملف يتجاوز ٢٠ ميغابايت","Please upload a PDF or a photo (save Word files as PDF)":"يرجى رفع ملف PDF أو صورة (احفظ ملفات Word بصيغة PDF)","Upload failed — try again or paste the text":"فشل الرفع — حاول مجددًا أو الصق النص","File upload isn't available for your access level — paste your CV text instead":"رفع الملفات غير متاح لصلاحيتك — الصق نص سيرتك الذاتية بدلًا من ذلك","(demo: file too big to keep)":"(تجريبي: الملف كبير جدًا للاحتفاظ به)",
// add applicant
"Source":"المصدر","From hr@forka.com, LinkedIn, Indeed, referral or walk-in":"من hr@forka.com أو لينكدإن أو Indeed أو ترشيح أو حضور مباشر","LinkedIn / Indeed":"لينكدإن / Indeed","Email (hr@forka.com)":"البريد (hr@forka.com)","Walk-in":"حضور مباشر","Internal":"داخلي","PDF or photo, from the email":"PDF أو صورة، من البريد الإلكتروني","AI can fill the fields below":"يمكن للذكاء الاصطناعي تعبئة الحقول أدناه","then fill the fields":"ثم املأ الحقول","Fill fields from CV":"تعبئة الحقول من السيرة الذاتية","Candidate consented to Forka holding their data (stated in the application email or form)":"وافق المرشح على احتفاظ فوركا ببياناته (مذكور في بريد التقديم أو النموذج)","Add to pipeline":"إضافة إلى المسار",
// Phase 3 redesign: dashboard, requests table, candidates, talent pool, careers editor, request steps
"Date range":"الفترة","All time":"كل الفترات","Last 30 days":"آخر ٣٠ يومًا","Last 90 days":"آخر ٩٠ يومًا","This year":"هذا العام","Filters":"عوامل التصفية",
"Overdue approvals":"موافقات متأخرة","2-day SLA":"المهلة: يوما عمل","Median days to hire":"الوسيط: أيام حتى التعيين","target 21–28 days":"الهدف ٢١–٢٨ يومًا",
"Pipeline":"مسار المرشحين","Click a stage to see its candidates":"اضغط على مرحلة لرؤية مرشحيها","Next action":"الإجراء التالي","waiting":"بانتظار","Owner":"المسؤول","You":"أنت",
"Final approval":"الموافقة النهائية","Build the scorecard":"إعداد بطاقة التقييم","Post the job":"نشر الوظيفة","Screen the CV":"فرز السيرة الذاتية","Finish screening":"إكمال الفرز","Personality assessment":"تقييم الشخصية","Check references":"التحقق من المراجع","Reply on shortlist":"الرد على القائمة المختصرة","Pick for interview or decline":"اختر للمقابلة أو اعتذر","Score the interview":"قيّم المقابلة",
"New today":"جديد اليوم","Review":"مراجعة","Show all":"عرض الكل","Show fewer":"عرض أقل",
"Raise one to start. It goes to the CEO for approval first.":"ارفع طلبًا للبدء. يذهب أولًا إلى الرئيس التنفيذي للموافقة.","Your hiring request is not posted yet.":"طلب التوظيف الخاص بك لم يُنشر بعد.","Nobody can apply until a role is posted.":"لا يمكن لأحد التقدّم قبل نشر وظيفة.","Post a role":"انشر وظيفة",
"Nothing is waiting on you.":"لا يوجد شيء بانتظارك.","Shortlists and scorecards for your department show here.":"تظهر هنا القوائم المختصرة وبطاقات التقييم لقسمك.","New applications and approvals show here.":"تظهر هنا الطلبات الجديدة والموافقات.","See candidates":"عرض المرشحين",
"New hiring requests from department heads show here.":"تظهر هنا طلبات التوظيف الجديدة من رؤساء الأقسام.","HR sends final candidates here after the references.":"ترسل الموارد البشرية المرشحين النهائيين إلى هنا بعد التحقق من المراجع.",
"Search":"بحث","Role, request ID, department…":"الوظيفة، رقم الطلب، القسم…","All statuses":"كل الحالات","All departments":"كل الأقسام","All branches":"كل الفروع","Branch":"الفرع","Saved views":"طرق العرض المحفوظة","Choose a view":"اختر طريقة عرض","Save view":"حفظ طريقة العرض","Delete view":"حذف طريقة العرض","Clear filters":"مسح عوامل التصفية","No requests match these filters.":"لا توجد طلبات تطابق عوامل التصفية.","Name this view":"سمِّ طريقة العرض هذه","View saved":"تم حفظ طريقة العرض","View deleted":"تم حذف طريقة العرض",
"View":"العرض","Stages":"المراحل","All stages":"كل المراحل","No candidates on your shortlist yet.":"لا يوجد مرشحون في قائمتك المختصرة بعد.","HR sends shortlisted candidates for your roles here.":"ترسل الموارد البشرية المرشحين المختارين لوظائفك إلى هنا.","No open roles yet.":"لا توجد وظائف منشورة بعد.","Post a role first. Then people can apply and you can add applicants.":"انشر وظيفة أولًا، ثم يمكن للناس التقدّم ويمكنك إضافة متقدّمين.","Applications from the careers page land here. You can also add walk-ins and email CVs.":"تصل هنا الطلبات من صفحة الوظائف، ويمكنك أيضًا إضافة الحضور المباشر والسير الذاتية الواردة بالبريد.","Select all":"تحديد الكل","Select":"تحديد",
"Current stage":"المرحلة الحالية","Applicants are added to a posted role. Post one, then add walk-ins and email CVs here.":"يُضاف المتقدّمون إلى وظيفة منشورة. انشر وظيفة، ثم أضف الحضور المباشر والسير الذاتية الواردة بالبريد هنا.",
"Phone numbers and emails are hidden. Press Show to see them. Each time is recorded (who, which candidate, when).":"أرقام الهواتف والبريد الإلكتروني مخفية. اضغط \"إظهار\" لرؤيتها. يُسجَّل كل إظهار (من، وأي مرشح، ومتى).","Contact":"التواصل","Actions":"الإجراءات","Show":"إظهار","Shown":"ظاهر","HR only":"للموارد البشرية فقط","Only HR can see these details.":"هذه البيانات للموارد البشرية فقط.","Couldn't show the details — try again.":"تعذّر إظهار البيانات — حاول مرة أخرى.",
"About us":"من نحن","Why work with us":"لماذا تعمل معنا","Benefits":"المزايا","The first words every candidate reads. Two or three short sentences.":"أول كلمات يقرؤها كل مرشح. جملتان أو ثلاث جمل قصيرة.","One reason per line. Short and concrete.":"سبب واحد في كل سطر. قصير وواضح.","What people get when they join.":"ما يحصل عليه الموظف عند انضمامه.","Unsaved":"غير محفوظ","Saves this part only. The careers page changes only when you save.":"يحفظ هذا الجزء فقط. لا تتغير صفحة الوظائف إلا عند الحفظ.","Live preview":"معاينة مباشرة","Preview size":"حجم المعاينة","Desktop":"الكمبيوتر","Shows your words as you type, before you save.":"تعرض كلماتك أثناء الكتابة، قبل الحفظ.","Open the careers page":"فتح صفحة الوظائف",
"Role & location":"الوظيفة والموقع","Compensation & timing":"الراتب والموعد","Evaluation plan":"خطة التقييم","Review & submit":"المراجعة والإرسال","Progress":"التقدّم","Fields marked * are required":"الحقول المعلّمة بـ * إلزامية","Your draft is back":"تمت استعادة مسودتك","Start over":"البدء من جديد",
"e.g. Branch Supervisor":"مثال: مشرف فرع","e.g. Run the floor and the shift team so every guest gets the same standard.":"مثال: إدارة الصالة وفريق المناوبة ليحصل كل ضيف على المستوى نفسه.","e.g. Open and close the branch, lead shift briefings, handle complaints, train new staff.":"مثال: فتح الفرع وإغلاقه، وقيادة اجتماعات المناوبة، ومعالجة الشكاوى، وتدريب الموظفين الجدد.","e.g. 6000":"مثال: 6000","e.g. 8000":"مثال: 8000","e.g. 3+ years supervising in a UAE restaurant":"مثال: خبرة إشراف ٣ سنوات أو أكثر في مطعم بالإمارات","e.g. Handling a guest complaint at peak time":"مثال: التعامل مع شكوى ضيف وقت الذروة",
"Write the role title":"اكتب المسمى الوظيفي","Choose the department":"اختر القسم","Choose the branch. Only remote jobs can leave it empty.":"اختر الفرع. يمكن تركه فارغًا للوظائف عن بُعد فقط.","Write the top of the salary range":"اكتب الحد الأعلى لنطاق الراتب","Write this must-have":"اكتب هذا المتطلب الأساسي","Choose at least one practical test":"اختر اختبارًا عمليًا واحدًا على الأقل","Tick 2 or 3 traits":"حدّد سمتين أو ثلاث","A critical trait must also be ticked as a trait":"السمة الحرجة يجب تحديدها كسمة أيضًا","Please fill the fields marked in red":"يرجى تعبئة الحقول المعلّمة بالأحمر",
"The salary range is for the CEO and HR only. It never appears in the job ad.":"نطاق الراتب للرئيس التنفيذي والموارد البشرية فقط، ولا يظهر أبدًا في إعلان الوظيفة.","Check everything once. Use Edit to change a part.":"راجع كل شيء مرة واحدة. استخدم \"تعديل\" لتغيير أي جزء.","When you send it, the CEO approves or declines it within 2 working days. Nothing is posted before that.":"بعد الإرسال، يوافق الرئيس التنفيذي أو يرفض خلال يومي عمل، ولا يُنشر شيء قبل ذلك.","Edit":"تعديل","Personality traits":"السمات الشخصية","Back":"رجوع","Close":"إغلاق",
// candidate modal
"Move to next stage":"الانتقال للمرحلة التالية","Reject with reason":"رفض مع ذكر السبب","Which criterion did they fail? (required — no rejections on feeling)":"ما المعيار الذي لم يستوفه؟ (إلزامي — لا رفض بناءً على الانطباع)","Why keep them in the talent pool?":"لماذا يُحفظ في بنك المواهب؟","Talent pool note":"ملاحظة بنك المواهب","Talent pool —":"بنك المواهب —","Rejected —":"مرفوض —","Salary above range":"الراتب أعلى من النطاق","Screening score below pass mark":"درجة الفرز أقل من درجة النجاح","Interview score below pass mark":"درجة المقابلة أقل من درجة النجاح","Candidate withdrew":"انسحب المرشح","Missing must-have experience":"تنقصه خبرة أساسية","Screening scorecard":"بطاقة تقييم الفرز","Screening score":"درجة الفرز","Part 1 — CV against the must-haves (1 does not meet · 3 meets with gaps · 5 exceeds)":"الجزء ١ — السيرة الذاتية مقابل المتطلبات الأساسية (١ لا يستوفي · ٣ يستوفي مع فجوات · ٥ يتجاوز)","Part 2 — HR call, 15–30 minutes":"الجزء ٢ — مكالمة الموارد البشرية، ١٥–٣٠ دقيقة","Suggest CV scores":"اقتراح درجات السيرة الذاتية","Suggested — check each score":"مقترحة — راجع كل درجة","Call notes":"ملاحظات المكالمة","HR call:":"مكالمة الموارد البشرية:","Start screening":"بدء الفرز","Pass → personality assessment":"نجح ← تقييم الشخصية","Personality assessment":"تقييم الشخصية","mandatory · input, not pass/fail":"إلزامي · مُدخل للتقييم وليس نجاحًا/رسوبًا","Candidate consented and completed the assessment (tool:":"وافق المرشح وأكمل التقييم (الأداة:","Summary for the panel":"ملخص للجنة","3 lines — the head sees this, never the raw report":"٣ أسطر — يراها رئيس القسم، وليس التقرير الأصلي","Personality summary:":"ملخص الشخصية:","Personality follow-up":"متابعة الشخصية","Follow-up questions:":"أسئلة المتابعة:","2 follow-up questions for the interview":"سؤالا متابعة للمقابلة","A critical trait came out very low — the panel must clear it in the interview.":"ظهرت سمة حرجة بدرجة منخفضة جدًا — يجب على اللجنة توضيحها في المقابلة.","Shortlist pack":"ملف القائمة المختصرة","Send to":"إرسال إلى","head's shortlist":"القائمة المختصرة لرئيس القسم","Pick for interview or decline":"اختر للمقابلة أو ارفض","Invite to interview":"دعوة للمقابلة","Interview + practical (panel)":"المقابلة + الاختبار العملي (اللجنة)","Score the interview":"تقييم المقابلة","Interview scorecard — yours":"بطاقة تقييم المقابلة — الخاصة بك","Score on your own before discussing.":"قيّم بنفسك قبل النقاش.","Other scores stay hidden until you submit yours.":"تبقى الدرجات الأخرى مخفية حتى ترسل درجاتك.","Other panel scores:":"درجات بقية اللجنة:","Submit my scores":"إرسال درجاتي","Scores submitted":"تم إرسال الدرجات","Score every line first":"قيّم كل البنود أولًا","Interview scored by":"قيّم المقابلة","Interview questions":"أسئلة المقابلة","Test in interview:":"يُختبر في المقابلة:","Top 3 things to test in interview":"أهم ٣ أمور تُختبر في المقابلة","Opinions go here; scores stay numbers":"الآراء هنا؛ والدرجات تبقى أرقامًا","Passed → references":"نجح ← المراجع","Reference checks":"التحقق من المراجع","Referee name":"اسم المرجع","Company · relation":"الشركة · صلة المعرفة","Verified — positive":"تم التحقق — إيجابي","Verified — concerns":"تم التحقق — توجد ملاحظات","Could not reach":"تعذّر التواصل","Candidate consents to contacting the current employer (if not: check previous employers, offer conditional)":"يوافق المرشح على التواصل مع جهة عمله الحالية (وإلا: تحقق من جهات العمل السابقة، ويكون العرض مشروطًا)","References clear → final evaluation":"المراجع سليمة ← التقييم النهائي","Final evaluation report":"تقرير التقييم النهائي","Proposed total package (":"الباقة الإجمالية المقترحة (","Basic salary (30%)":"الراتب الأساسي (٣٠٪)","One more negotiation round done (HR only — the department head is not involved in salary)":"تمت جولة تفاوض إضافية (الموارد البشرية فقط — رئيس القسم لا يتدخل في الراتب)","Send to CEO for approval ":"إرسال للرئيس التنفيذي للموافقة","Offer letter signed and accepted":"تم توقيع خطاب العرض وقبوله","No one starts work without complete documentation (control approved 23 Jul).":"لا يبدأ أحد العمل دون اكتمال المستندات (ضابط معتمد في ٢٣ يوليو).","Mark hired → onboarding":"تسجيل كمعيّن ← التهيئة","Moved to":"نُقل إلى","Add note":"إضافة ملاحظة","Note":"ملاحظة","History":"السجل","Save draft":"حفظ المسودة","Close":"إغلاق","Open the file above.":"افتح الملف أعلاه.","Personality report deleted (6-month retention)":"تم حذف تقرير الشخصية (الاحتفاظ ٦ أشهر)","Reject":"رفض","Next":"التالي",
// toasts / errors / banners
"Score on your own before discussing. Other scores stay hidden until you submit yours.":"قيّم بنفسك قبل النقاش. تبقى الدرجات الأخرى مخفية حتى ترسل درجاتك.","\"tell me about a time…\"":"\"أخبرني عن موقف…\"","positive":"إيجابي","concerns":"توجد ملاحظات","Waiting for CEO approval":"بانتظار موافقة الرئيس التنفيذي",
"CEO approves":"يوافق الرئيس التنفيذي","HR scorecard":"بطاقة تقييم الموارد البشرية","Head approves":"يعتمد رئيس القسم","The role":"الوظيفة","Purpose":"الهدف","Practical":"العملي","CV screening scores against these":"تُقيّم السيرة الذاتية مقابل هذه البنود","paste it":"الصقها","then fill the fields":"ثم املأ الحقول","basic = 30%":"الأساسي = ٣٠٪","see the list view or Talent pool.":"راجع عرض القائمة أو بنك المواهب.","see the list view.":"راجع عرض القائمة.","hr":"الموارد البشرية","head":"رئيس قسم","candidate":"مرشح","Your employer brand: what every candidate sees first. Edit the words here; open roles appear automatically when HR posts them.":"علامتك كجهة عمل: أول ما يراه كل مرشح. عدّل النصوص هنا، وتظهر الوظائف المتاحة تلقائيًا عندما تنشرها الموارد البشرية.","Everything: requests, scorecards, screening, personality, references, final evaluation, offers, talent pool, careers page. Khaled (owner) also gets CEO approvals.":"كل شيء: الطلبات، بطاقات التقييم، الفرز، تقييم الشخصية، المراجع، التقييم النهائي، العروض، بنك المواهب، صفحة الوظائف. ويتولى خالد (المالك) أيضًا موافقات الرئيس التنفيذي.","CEO asked to renegotiate":"طلب الرئيس التنفيذي إعادة التفاوض","CEO approved candidate and package":"وافق الرئيس التنفيذي على المرشح والباقة","Interview":"المقابلة","Email (hr@forka.com)":"البريد (hr@forka.com)","LinkedIn":"لينكدإن",
"You don't have permission to change this. Ask Khaled for Editor access.":"ليست لديك صلاحية لتعديل هذا. اطلب من خالد صلاحية محرر.","Storage is full — archive old candidates.":"المساحة ممتلئة — أرشف المرشحين القدامى.","Couldn't save — try again.":"تعذّر الحفظ — حاول مرة أخرى.","Can't reach the shared data yet — showing what has loaded.":"تعذّر الوصول إلى البيانات المشتركة بعد — يتم عرض ما تم تحميله.","Access changed — reload to continue.":"تغيّرت الصلاحيات — أعد تحميل الصفحة للمتابعة.","Demo mode — sample data, stored only in this browser. Use the switcher (top right) to see each access level.":"وضع تجريبي — بيانات نموذجية محفوظة في هذا المتصفح فقط. استخدم المبدّل (أعلى الصفحة) لرؤية كل مستوى صلاحية.","Select the text and copy it":"حدّد النص وانسخه","AI is busy — try in a minute":"الذكاء الاصطناعي مشغول — حاول بعد دقيقة","AI not allowed on this page":"الذكاء الاصطناعي غير مسموح في هذه الصفحة","AI couldn't do that — try again":"تعذّر على الذكاء الاصطناعي تنفيذ ذلك — حاول مرة أخرى","AI scoring needs CV text — this candidate sent a file only, so score from the file by hand":"التقييم بالذكاء الاصطناعي يحتاج نص السيرة الذاتية — هذا المرشح أرسل ملفًا فقط، فقيّمه يدويًا من الملف",
};
export const AR_RX=[
 [/^None of your (\d+) hiring requests is posted yet\.$/,"لم يُنشر أي من طلبات التوظيف الخاصة بك ($1) بعد."],
 [/^Step (\d) of 4$/,"الخطوة $1 من 4"],[/^Draft saved (\d\d:\d\d)$/,"تم حفظ المسودة $1"],[/^Saved (\d\d:\d\d)$/,"تم الحفظ $1"],[/^Last saved (.+)$/,"آخر حفظ $1"],
 [/^Must-have (\d)$/,"المتطلب الأساسي $1"],[/^Interview test (\d)$/,"اختبار المقابلة $1"],
 [/^(.+) head$/,(m,d)=>"رئيس قسم "+trText(d)],
 [/^Data connection stopped \((.+)\)\.?$/,"توقف الاتصال بالبيانات ($1)."],
 [/^View as: (.+) head$/,(m,d)=>"عرض بصفة: رئيس قسم "+trText(d)],
 [/^Dept head · (.+)$/,(m,d)=>"رئيس القسم · "+trText(d)],
 [/^(\d+)d waiting$/,"بانتظار منذ $1 يوم"],
 [/^(\d+) days? waiting$/,"بانتظار منذ $1 يوم"],
 [/^Candidates \((\d+)\)$/,"المرشحون ($1)"],
 [/^(\d+) selected$/,"تم تحديد $1"],
 [/^CEO: approve vacancy (.+)$/,"الرئيس التنفيذي: الموافقة على شاغر $1"],
 [/^CEO: final approval (.+)$/,"الرئيس التنفيذي: الموافقة النهائية على $1"],
 [/^(.+) head: approve scorecard (.+)$/,(m,d,t)=>"رئيس "+trText(d)+": اعتماد بطاقة تقييم "+t],
 [/^Dept head: reply on shortlist (.+)$/,"رئيس القسم: الرد على القائمة المختصرة لـ $1"],
 [/^Pre-screen: (.+)$/,"الفرز المبدئي: $1"],
 [/^Talent pool — (.+)$/,"بنك المواهب — $1"],
 [/^Rejected — (.+)$/,"مرفوض — $1"],
 [/^Moved to (.+)$/,(m,s)=>"نُقل إلى "+trText(s)],
 [/^Showing (\d+) of (\d+)$/,"عرض $1 من $2"],
 [/^Good to see you, (.+)$/,"أهلًا بك يا $1"],
 [/^(\d+) in preparation$/,"$1 قيد الإعداد"],[/^(\d+) new to screen$/,"$1 بانتظار الفرز"],[/^(\d+) hired$/,"تم تعيين $1"],
 [/^(\d+) rejected or in talent pool$/,"$1 مرفوض أو في بنك المواهب"],
 [/^avg (.*)request → hire \(target 21–28\)$/,"المتوسط $1من الطلب إلى التعيين (الهدف ٢١–٢٨)"],
 [/^panel avg (.+)$/,"متوسط اللجنة $1"],[/^avg (.+)$/,"المتوسط $1"],[/^Screen ([\d.–]+)$/,"الفرز $1"],[/^Interview ([\d.–]+)$/,"المقابلة $1"],[/^pass ([\d.]+)$/,"النجاح $1"],
 [/^(\d+) yrs$/,"$1 سنوات"],[/^notice (\S+) days$/,"الإشعار $1 يوم"],[/^consent recorded$/,"الموافقة مسجّلة"],[/^consent not recorded$/,"الموافقة غير مسجّلة"],
 [/^Added by HR \((.+)\)$/,"أضافته الموارد البشرية ($1)"],
 [/^Proposed total package \((.+)\/month\)$/,"الباقة الإجمالية المقترحة ($1/شهريًا)"],
 [/^(\d+) of 2 working days$/,"$1 من يومي عمل"],[/^(.+) total package$/,"$1 الباقة الإجمالية"],
 [/^raised by (.+)$/,"رفعه $1"],[/^join by (.+)$/,"الالتحاق قبل $1"],[/^posted (.+)$/,"نُشرت $1"],[/^applied (.+)$/,"تقدّم في $1"],[/^\(basic (.+)\)$/,"(الأساسي $1)"],
 [/^CEO approved vacancy$/,"وافق الرئيس التنفيذي على الشاغر"],[/^Head asked for changes: (.+)$/,"طلب رئيس القسم تعديلات: $1"],[/^CEO declined: (.+)$/,"رفض الرئيس التنفيذي: $1"],

 [/^(\d+) \/ 2 days$/,"$1 / يومان"],[/^Show (\d+) more \((\d+) not shown\)$/,"عرض $1 إضافية ($2 غير معروضة)"],[/^(\d+) more in this stage\. Use the list view or search\.$/,"$1 آخرون في هذه المرحلة. استخدم عرض القائمة أو البحث."],[/^Candidate consented and completed the assessment \(tool: (.+)\)$/,"وافق المرشح وأكمل التقييم (الأداة: $1)"],
];
export const AR_SUB=[ // last-resort fragments inside mixed text
 [" working days"," أيام عمل"],["/month)","/شهريًا)"],["(basic ","(الأساسي "],["Source: ","المصدر: "],
];
export const AR_SUB_SORTED=AR_SUB.sort((a,b)=>b[0].length-a[0].length);
export const DOTS=/(\s*[·—×]\s*)/, COMMA=/(,\s+)/;
export function trCore(c){
  if(AR[c]!==undefined) return AR[c];
  for(const [rx,rep] of AR_RX){ if(rx.test(c)) return c.replace(rx,rep) }
  const m=c.match(/^(.+?)\s*([:…])$/); if(m&&AR[m[1]]!==undefined) return AR[m[1]]+m[2];
  return null;
}
export function trText(s){
  if(LANG!=="ar"||!s) return s;
  const lead=s.match(/^\s*/)[0], trail=s.match(/\s*$/)[0], core=s.trim();
  if(!core||!/[A-Za-z]/.test(core)) return s;
  let r=trCore(core); if(r!=null) return lead+r+trail;
  let hit=false;
  const seg=(str,rx)=>str.split(rx).map((x,i)=>{ if(i%2||!x.trim()) return x; const l=x.match(/^\s*/)[0],r=x.match(/\s*$/)[0],c=x.trim(); const t=trCore(c); if(t!=null){hit=true;return l+t+r} if(rx!==COMMA&&/,\s/.test(c)) return l+seg(c,COMMA)+r; return x }).join("");
  const res=seg(core,DOTS); if(hit) return lead+res+trail;
  let out=core; for(const [en,ar] of AR_SUB_SORTED){ if(out.includes(en)){ out=out.split(en).join(ar); hit=true } }
  return hit? lead+out+trail : s;
}
export const SKIP={SCRIPT:1,STYLE:1,TEXTAREA:1,PRE:1,CODE:1};
export function trNode(root){
  if(LANG!=="ar"||!root) return;
  if(root.nodeType===3){ trTextNode(root); return }
  if(root.nodeType!==1||SKIP[root.tagName]||root.closest&&root.closest("[data-noi18n]")) return;
  trAttrs(root);
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT,{acceptNode:n=>n.nodeType===1?(SKIP[n.tagName]||n.hasAttribute("data-noi18n")?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_SKIP):NodeFilter.FILTER_ACCEPT});
  root.querySelectorAll("[placeholder],[title],[aria-label]").forEach(trAttrs);
  let n; while((n=w.nextNode())) trTextNode(n);
}
export function trTextNode(n){
  const p=n.parentNode; if(!p||SKIP[p.nodeName]||(p.closest&&p.closest("[data-noi18n]"))) return;
  const v=n.nodeValue, t=trText(v); if(t===v) return;
  if(p.nodeName==="OPTION"&&!p.hasAttribute("value")) p.setAttribute("value",v.trim()); // keep the stored value in English
  n.nodeValue=t;
}
export function trAttrs(el){ for(const a of ["placeholder","title","aria-label"]){ const v=el.getAttribute&&el.getAttribute(a); if(v){ const t=trText(v); if(t!==v) el.setAttribute(a,t) } } }
export const _i18nObs=new MutationObserver(ms=>{ if(LANG!=="ar")return; for(const m of ms){ if(m.type==="characterData") trTextNode(m.target); else m.addedNodes.forEach(trNode) } });
export function applyLang(){
  document.documentElement.lang=LANG; document.documentElement.dir=LANG==="ar"?"rtl":"ltr";
  document.querySelectorAll("#langSw button").forEach(b=>b.classList.toggle("on",b.dataset.l===LANG));
}
export function setLang(l){ LANG=l; try{localStorage.setItem("forkaHireLang",l)}catch(e){} applyLang(); if(l==="en") restoreEn(); closeModal(); const ab=document.getElementById("askbox"); if(ab) ab.remove(); render(); trNode(document.body) }
(function(){ const _t=trTextNode; trTextNode=function(n){ const v=n.nodeValue; _t(n); if(n.nodeValue!==v&&n.__en===undefined) n.__en=v } })();
(function(){ const _a=trAttrs; trAttrs=function(el){ for(const a of ["placeholder","title","aria-label"]){ const v=el.getAttribute&&el.getAttribute(a); if(v&&!el.hasAttribute("data-en-"+a)) el.setAttribute("data-en-"+a,v) } _a(el) } })();
export function restoreEn(){ const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); let n; while((n=w.nextNode())) if(n.__en!==undefined){ n.nodeValue=n.__en; delete n.__en }
  document.querySelectorAll("[data-en-placeholder],[data-en-title],[data-en-aria-label]").forEach(el=>{ for(const a of ["placeholder","title","aria-label"]) if(el.hasAttribute("data-en-"+a)){ el.setAttribute(a,el.getAttribute("data-en-"+a)); el.removeAttribute("data-en-"+a) } }) }
export const PASS = 3.5;
export const DEPTS = ["Operations","Kitchen","Service","Marketing","Finance","HR","Procurement & Store","Administration"];
export const BRANCHES = ["Sharjah","Fujairah","Umm Al Quwain","Mayar Cafe","Oman","Ajman Central Store","Head Office"];
export const WORK = ["On site","Remote","Hybrid"];
export const place = r => !r ? "" : r.work==="Remote" ? ["Remote",r.branch].filter(Boolean).join(" · ") : r.work==="Hybrid" ? [r.branch,"Hybrid"].filter(Boolean).join(" · ") : (r.branch||"");
export const PRACTICAL = ["Trial shift","Cooking test","Barista test","Case study","Presentation","Excel exercise","Operations scenario"];
export const TRAITS = [["Reliability and discipline","Follows SOPs, on time, finishes tasks"],["Calm under pressure","Steady in a rush, a complaint or an audit"],["Team cooperation","Helps others, handles conflict well"],["Energy with people","Warm, confident with guests and staff"],["Openness to change","Learns fast, adapts, takes on new tasks"]];
export const COMPETENCY = ["Leadership","Problem solving","Accountability","Communication","Teamwork","Commercial awareness"];
export const COMP_Q = ["Tell me about a time you got a team through a very hard shift.","Tell me about something that went wrong at work and how you fixed it.","Tell me about a mistake you made and what you did next.","Tell me about a time you had to explain a change to staff or a guest who didn't like it.","Tell me about a colleague who was struggling. What did you do?","How did you help control cost, waste or sales in your last job?"];
export const HR_Q = [["Motivation","Why Forka, why this role, and why now?"],["Values and fit","Tell me about a time you had to follow a rule you disagreed with."],["Availability","Shifts, weekends, notice period and joining date — all confirmed?"]];
export const REC = ["Strong hire","Hire","Not sure","No hire"];
export const CALL = ["Relevant experience","Reason for leaving","Salary fit","Communication","Career motivation"];
export const DOCS = ["Passport copy","Visa / residency","Certificates","Photos","Bank details","Signed offer letter"];
export const STAGES = [
 ["applied","Applied","HR"],["screening","Screening","HR"],["personality","Personality","HR"],["shortlist","Shortlist","Dept head"],
 ["interview","Interview","Dept head + HR"],["references","References","HR"],["final","Final evaluation","HR"],
 ["approval","CEO approval","CEO"],["offer","Offer & documents","HR"],["hired","Hired","—"]];
export const SI = Object.fromEntries(STAGES.map((s,i)=>[s[0],i]));
export const PUBLIC = {applied:"Received",screening:"Under review",personality:"Under review",shortlist:"Under review",interview:"Interview",references:"Final checks",final:"Final checks",approval:"Final checks",offer:"Offer",hired:"Welcome to Forka",rejected:"Not selected this time",pool:"Kept in our talent pool"};
export const PUB_TRACK = ["Received","Under review","Interview","Final checks","Offer"];
export const REQ_STATUS = {requested:["Waiting for CEO","warn"],approved:["Scorecard being built","blue"],review:["Head to approve scorecard","warn"],ready:["Ready to post","blue"],open:["Open","ok"],filled:["Filled","br"],closed:["Closed",""],declined:["Declined","bad"]};
export let DB=null, USER=null, ME=null, OWNER=false, DEMO=false, CANWRITE=true, SAMPLE=null, ASSETS=null;
export const S: any ={reqs:{},pipe:{},apps:{},jobs:{},team:{members:{}},brand:null};
export const V: any ={role:"candidate",page:null,ceo:false,dept:null,viewAs:null,filter:{q:"",req:"",stage:""},sel:new Set(),pv:"list"};
export const NAMES={};
export const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const $=s=>document.querySelector(s);
export const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
export const now=()=>Date.now();
export const fmtD=t=>t?new Date(t).toLocaleDateString(LANG==="ar"?"ar-u-nu-latn":"en-GB",{day:"numeric",month:"short"}):"–";
export const fmtN=n=>n==null||n===""?"–":Number(n).toLocaleString("en-US");
export const avg=a=>{a=a.filter(x=>typeof x==="number");return a.length?a.reduce((p,c)=>p+c,0)/a.length:null};
export const f1=x=>x==null?"–":x.toFixed(1);
export function workDaysSince(t){ if(!t) return 0; let d=new Date(t),n=0;const e=new Date(); d.setHours(0,0,0,0); while(d<e){d.setDate(d.getDate()+1); if(d>e)break; const w=d.getDay(); if(w!==5&&w!==6)n++;} return n; }
export function toast(m,ms){const t=$("#toast");t.textContent=m;t.style.display="block";clearTimeout(t._t);t._t=setTimeout(()=>t.style.display="none",ms||2600)}
export const nm=id=>NAMES[id]||(DEMO_PEOPLE[id]?.name)||(/@/.test(id||"")?String(id).split("@")[0]:"Someone");
export const DEMO_PEOPLE={u_khaled:{name:"Khaled Alamer",role:"hr",ceo:true},u_jen:{name:"Jennifer Tudara",role:"hr"},u_abuali:{name:"Abu Ali",role:"head",dept:"Operations"},u_chef:{name:"Head Chef",role:"head",dept:"Kitchen"},u_sara:{name:"Sara (candidate)",role:"candidate"}};
export const local={data:null,subs:[],
  load(){try{this.data=JSON.parse(localStorage.getItem("forkaHiringDemo")||"null")}catch(e){} if(!this.data){this.data=demoSeed()} },
  save(){try{localStorage.setItem("forkaHiringDemo",JSON.stringify(this.data))}catch(e){} this.subs.forEach(f=>f())},
  watch(col,cb){const f=()=>cb(JSON.parse(JSON.stringify(this.data[col]||{})));this.subs.push(f);f()},
  async put(col,id,obj){(this.data[col]=this.data[col]||{})[id]=obj;this.save()},
  async del(col,id){if(this.data[col])delete this.data[col][id];this.save()}};
export const CFG: any =window.FORKA_APPS||{};
export const HURL=CFG.HIRING_URL||"";
export let TOKEN="",RVER="",SME=null,RSINCE=0,RVK="";
export const RCB={};
export const RDATA={reqs:{},pipe:{},jobs:{},apps:{},config:{}};
export async function api(action,payload){try{const r=await fetch(HURL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(Object.assign({action,token:TOKEN},payload||{}))});return await r.json()}catch(e){return{ok:false,error:"net"}}}
export const IDB={p:null,open(){return this.p||(this.p=new Promise(res=>{try{const q=indexedDB.open("forka-hiring",1);q.onupgradeneeded=()=>q.result.createObjectStore("kv");q.onsuccess=()=>res(q.result);q.onerror=()=>res(null)}catch(e){res(null)}}))},
  async get(k){const d=await this.open();if(!d)return null;return new Promise(res=>{try{const q=d.transaction("kv").objectStore("kv").get(k);q.onsuccess=()=>res(q.result||null);q.onerror=()=>res(null)}catch(e){res(null)}})},
  async set(k,v){const d=await this.open();if(!d)return;try{d.transaction("kv","readwrite").objectStore("kv").put(v,k)}catch(e){}},
  async del(k){const d=await this.open();if(!d)return;try{d.transaction("kv","readwrite").objectStore("kv").delete(k)}catch(e){}}};
export let _kt=0;
export function keepData(){clearTimeout(_kt);_kt=setTimeout(()=>IDB.set("cache",{tok:TOKEN,ver:RVER,since:RSINCE,vk:RVK,me:SME,data:RDATA}),300)}
export function fire(col){(RCB[col]||[]).forEach(cb=>cb(JSON.parse(JSON.stringify(RDATA[col]||{}))))}
export function applyRemote(r,fromCache){if(r.me)SME=r.me;if(r.ver)RVER=r.ver;if(r.vk)RVK=r.vk;
  if(r.now)RSINCE=r.now-120000;else if(fromCache)RSINCE=r.since||0;        // 2 minutes of overlap: nothing saved meanwhile is missed
  if(r.data&&r.delta){const ch=[];let lost=false;                           // only what changed since the last download
    Object.keys(RDATA).forEach(c=>{const keep=r.ids[c]||[],cur=RDATA[c],add=r.data[c]||{},o={};let n=0;
      keep.forEach(id=>{if(add[id]!==undefined)o[id]=add[id];else if(cur[id]!==undefined)o[id]=cur[id];else lost=true});
      Object.keys(add).forEach(id=>{if(o[id]===undefined)o[id]=add[id]});
      n=Object.keys(add).length+Object.keys(cur).filter(id=>o[id]===undefined).length;
      if(n){RDATA[c]=o;ch.push(c)}});
    if(lost){RVER="";RSINCE=0;setTimeout(()=>pull(false),0);return}       // this device is missing something: download everything once
    keepData();ch.forEach(fire);return}
  if(r.data){Object.keys(RDATA).forEach(c=>{RDATA[c]=r.data[c]||{}});if(!fromCache)keepData();Object.keys(RDATA).forEach(fire)}}
export async function pull(light){const r=await api("load",RVER?{ver:RVER,since:RSINCE,vk:RVK}:{ver:""});
  if(r.ok){if(r.same){if(r.me)SME=r.me;return}const ae=document.activeElement,typing=!!ae&&(["TEXTAREA","SELECT"].includes(ae.tagName)||(ae.tagName==="INPUT"&&!/^(checkbox|radio|button|submit|file|range|color)$/.test(ae.type)));   // anywhere, not only in a pop-up
    if(typing&&light)return;applyRemote(r);banner("");return}
  if(r.error==="session")return gone("signin");if(r.error==="noaccess")return gone("noaccess");
  if(!light)banner("Can't reach the hiring data right now — showing what was saved on this device.")}
export function gone(kind){try{localStorage.removeItem("fh-cache")}catch(e){}IDB.del("cache");
  document.body.innerHTML=`<div style="max-width:460px;margin:12vh auto;padding:28px;background:#fffdf9;border:1px solid #e4ded4;border-radius:12px;font-family:'Inter Tight',system-ui,sans-serif;text-align:center"><div style="font-family:'EB Garamond',serif;font-size:26px;margin-bottom:8px">Forka Hiring</div><p style="color:#4a4642">${kind==="noaccess"?"You are signed in, but you are not on the hiring team yet. Ask Khaled to add you (Hiring &gt; Team).":"Please sign in at Forka Apps first."}</p><a href="${esc(CFG.ERP_HOME||"/")}" style="display:inline-block;margin-top:10px;background:#23211F;color:#fff;padding:9px 16px;border-radius:8px;text-decoration:none">Open Forka Apps</a></div>`}
export const store={
  watch(col,cb){ if(DEMO) return local.watch(col,cb);
    if(HURL){(RCB[col]=RCB[col]||[]).push(cb);cb(JSON.parse(JSON.stringify(RDATA[col]||{})));return}
    const tm=setTimeout(()=>banner("Can't reach the shared data yet — showing what has loaded."),10000);
    DB.collection(col).onSnapshot(snap=>{ if(!snap.metadata.fromCache){clearTimeout(tm);banner("")} const o={}; snap.docs.forEach(d=>{o[d.id]=d.data()}); cb(o) },
      e=>{clearTimeout(tm); banner(e.code==="revoked"?"Access changed — reload to continue.":"Data connection stopped ("+e.code+").")}); },
  async put(col,id,obj){ if(DEMO) return local.put(col,id,obj);
    if(HURL){const was=RDATA[col][id];RDATA[col][id]=JSON.parse(JSON.stringify(obj));fire(col);
      const r=await api("put",{col,id,data:obj});if(r.ok){RVER=r.ver||RVER;keepData();return}
      if(was===undefined)delete RDATA[col][id];else RDATA[col][id]=was;fire(col);
      if(r.error==="session"){gone("signin")}toast(r.error==="role"?"Only HR or the CEO can change this.":r.error==="big"?"This record is too long to save — shorten the notes or CV text.":"Couldn't save — check the connection and try again.");throw new Error(r.error)}
    try{ await DB.doc(col+"/"+id).set(JSON.parse(JSON.stringify(obj))) }catch(e){ handleWriteErr(e); throw e } },
  async del(col,id){ if(DEMO) return local.del(col,id);
    if(HURL){const was=RDATA[col][id];delete RDATA[col][id];fire(col);const r=await api("del",{col,id});if(r.ok){RVER=r.ver||RVER;keepData();return}RDATA[col][id]=was;fire(col);toast("Couldn't delete — try again.");throw new Error(r.error)}
    try{await DB.doc(col+"/"+id).delete()}catch(e){handleWriteErr(e);throw e} }
};
export function handleWriteErr(e){ if(e&&e.code==="invalid_argument"){CANWRITE=false;toast("You don't have permission to change this. Ask Khaled for Editor access.")} else if(e&&e.code==="quota_exceeded"){toast("Storage is full — archive old candidates.")} else toast("Couldn't save — try again.") }
export function banner(m){const b=$("#banner");b.textContent=m;b.style.display=m?"block":"none"}
export async function boot(){
  render();
  try{ [DB,USER]=await Promise.all([window.claude?claude.use("db"):null, window.claude?claude.use("user"):null]); }catch(e){}
  try{ SAMPLE = window.claude? await claude.use("sample") : null }catch(e){ SAMPLE=null }
  try{ ASSETS = window.claude? await claude.use("assets") : null }catch(e){ ASSETS=null }
  if(!HURL&&CFG.MODE==="live"){document.body.innerHTML=`<div style="max-width:460px;margin:12vh auto;padding:28px;background:#fffdf9;border:1px solid #e4ded4;border-radius:12px;font-family:'Inter Tight',system-ui,sans-serif;text-align:center"><div style="font-family:'EB Garamond',serif;font-size:26px;margin-bottom:8px">Forka Hiring</div><p>Hiring is being set up. Please try again soon.</p></div>`;return}
  if(HURL){
    try{TOKEN=localStorage.getItem("fa-token")||""}catch(e){}
    if(!TOKEN){gone("signin");return}
    let c=await IDB.get("cache");if(!c){try{c=JSON.parse(localStorage.getItem("fh-cache")||"null")}catch(e){}}
    try{localStorage.removeItem("fh-cache")}catch(e){}  // moved to IndexedDB
    if(c&&c.me&&c.data&&(!c.tok||c.tok===TOKEN)){applyRemote(c,true)}   // open at once from the last visit (same sign-in only)
    ["reqs","pipe","jobs"].forEach(k=>store.watch(k,o=>{S[k]=o;afterData()}));
    store.watch("apps",o=>{S.apps=o;afterData()});
    store.watch("config",o=>{S.team=o.team||{members:{}};S.brand=o.brand||null;S.aiguide=o.aiguide||null;afterData()});
    await pull(false);if(!SME)return;
    setInterval(()=>{if(!document.hidden)pull(true)},30000);
    document.addEventListener("visibilitychange",()=>{if(!document.hidden)pull(true)});
    return}
  if(!DB){ DEMO=true; local.load(); ME="u_khaled"; V.viewAs="u_khaled"; banner("Demo mode — sample data, stored only in this browser. Use the switcher (top right) to see each access level."); }
  else { ME=await USER.id(); OWNER=!!USER.isOwner(); }
  ["reqs","pipe","jobs"].forEach(c=>store.watch(c,o=>{S[c]=o;afterData()}));
  store.watch("apps",o=>{S.apps=o;afterData()});
  store.watch("config",o=>{S.team=o.team||{members:{}};S.brand=o.brand||null;S.aiguide=o.aiguide||null;afterData()});
}
export let resolving=false;
export let _adq=false;
export function afterData(){if(_adq)return;_adq=true;Promise.resolve().then(()=>{_adq=false;afterDataNow()})}
export async function afterDataNow(){ resolveRole(); render(); if(!DEMO&&!HURL&&USER&&!resolving){resolving=true; const ids=new Set(Object.keys(S.team.members||{})); Object.values(S.pipe).forEach(p=>{p.ownerUid&&ids.add(p.ownerUid);(p.history||[]).forEach(h=>h.by&&ids.add(h.by))}); Object.values(S.reqs).forEach(r=>r.createdBy&&ids.add(r.createdBy)); try{const ps=await USER.profiles([...ids]);for(const k in ps)NAMES[k]=ps[k].name||NAMES[k]||""}catch(e){} resolving=false; render();} }
export function resolveRole(){
  let id = DEMO? V.viewAs : ME, p;
  if(DEMO){ p=DEMO_PEOPLE[id]; V.role=p.role; V.ceo=!!p.ceo; V.dept=p.dept||null; V.me=id; }
  else if(HURL){
    if(!SME)return; ME=SME.email; OWNER=!!SME.ceo; NAMES[ME]=SME.name||ME;
    Object.entries(S.team.members||{}).forEach(([k,m])=>{if(m&&m.name)NAMES[k]=m.name});
    if(OWNER){ V.role=V.viewAs&&V.viewAs!=="candidate"?V.viewAs:"hr"; V.ceo=V.role==="hr"; V.dept=V.role==="head"?(V.viewDept||"Operations"):null; }
    else { V.role=SME.role; V.ceo=false; V.dept=SME.dept||null; }
    V.me=ME;
  }
  else {
    const m=(S.team.members||{})[ME];
    if(OWNER){ V.role=V.viewAs||"hr"; V.ceo=V.role==="hr"; V.dept=V.role==="head"?(V.viewDept||"Operations"):null; }
    else if(m){ V.role=m.role; V.ceo=false; V.dept=m.dept||null; }
    else { V.role="candidate"; V.ceo=false; }
    V.me=ME;
  }
  const pages = {hr:["dash","approvals","reqs","pipeline","pool","careers","team"],head:["dash","reqs","pipeline"],candidate:["jobs","mine"]}[V.role];
  if(!V.ceo) pages.splice(pages.indexOf("approvals"),pages.indexOf("approvals")>=0?1:0);
  V.pages=pages; if(!pages.includes(V.page)) V.page=pages[0];
}
export const NAV_IC: Record<string,string> ={dash:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="8" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="5" rx="1.6"/><rect x="13.5" y="11.5" width="7" height="9" rx="1.6"/><rect x="3.5" y="14.5" width="7" height="6" rx="1.6"/></svg>`,approvals:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M8.8 12l2.2 2.2 4.4-4.4"/></svg>`,reqs:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h4"/></svg>`,pipeline:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19.5c.6-3.2 2.9-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.6c2.3.2 4 1.8 4.5 4.4"/></svg>`,pool:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="4" width="17" height="5" rx="1.5"/><path d="M5 9v9.5c0 .8.7 1.5 1.5 1.5h11c.8 0 1.5-.7 1.5-1.5V9M10 13h4"/></svg>`,careers:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.5 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.5-3.6-8.5s1.1-5.9 3.6-8.5z"/></svg>`,team:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l2 2M14 9l2 2"/></svg>`,jobs:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="7" width="17" height="12.5" rx="2"/><path d="M9 7V5.5c0-.8.7-1.5 1.5-1.5h3c.8 0 1.5.7 1.5 1.5V7M3.5 12.5h17"/></svg>`,mine:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3.5h7l4 4v13H7z"/><path d="M14 3.5v4h4M10 13h5M10 16.5h5"/></svg>`};
export const PAGE_LABEL={dash:"Dashboard",approvals:"CEO approvals",reqs:"Hiring requests",pipeline:"Candidates",pool:"Talent pool & compliance",careers:"Careers page",team:"Team & access",jobs:"Open roles",mine:"My applications"};
export let _ac=null,_acP=null,_acA=null;
export function allCands(){ // pipeline records + online applications not yet picked up by HR (built once per data change)
  if(_ac&&_acP===S.pipe&&_acA===S.apps) return _ac;
  const out={...S.pipe};
  for(const [u,doc] of Object.entries(S.apps)){ for(const [aid,a] of Object.entries(doc.list||{})){ if(!out[aid]) out[aid]={...a,id:aid,ownerUid:u,stage:a.knockout&&a.knockout.length?"rejected":"applied",reject:a.knockout&&a.knockout.length?{reason:"Pre-screen: "+a.knockout.join("; "),at:a.createdAt,auto:true}:null,online:true,unsaved:true,history:[{t:a.createdAt,by:u,m:"Applied online"}]} } }
  _acP=S.pipe;_acA=S.apps;return _ac=out;
}
export const PAGE=200;
export const shown=(L,key)=>L.slice(0,(V.more&&V.more[key])||PAGE);
export function reqOf(c){return S.reqs[c.req]||{}}
export function headSees(r){return V.role!=="head"||r.dept===V.dept||r.createdBy===V.me}
export function scr(c,r){ // screening average: CV must-haves + HR call
  const a=[]; (r.mustHaves||[]).forEach((m,i)=>a.push(c.cv?.[i])); CALL.forEach((m,i)=>a.push(c.call?.[i])); return avg(a);
}
export const PR=r=>r.practicals||(r.practical?[r.practical]:[]);
export const CR=r=>r.criticals||(r.critical?[r.critical]:[]);
export const PV=s=>Array.isArray(s.prac)?s.prac:(s.prac!=null?[s.prac]:[]);
export const ivScore=s=>avg([...(s.tech||[]),...(s.comp||[]),...PV(s),...(s.hr||[])]);
export function ivAvg(c){ return avg(Object.values(c.iv||{}).filter(s=>!s.hidden&&s.done).map(ivScore)) }
export function whoOf(k,s){ if(s&&s.who) return s.who; const m=(S.team.members||{})[k]||(DEMO&&typeof DEMO_PEOPLE!=="undefined"?DEMO_PEOPLE[k]:null); return m&&m.role==="head"?"head":"hr" }
export function panelDone(c){ const L=Object.entries(c.iv||{}).filter(([,s])=>s.done).map(([k,s])=>whoOf(k,s)); return L.includes("head")&&L.includes("hr") }
export function ivSheet(role,r,d){
  const fq=String((d.personality||{}).qs||"").split(/\n+/).map(x=>x.replace(/^\s*[-•\d.)]+\s*/,"").trim()).filter(Boolean).slice(0,2);
  const comp={k:"comp",t:'Competency — "tell me about a time…"',L:COMPETENCY.map((m,i)=>[m,COMP_Q[i]])};
  if(role==="head") return [{k:"tech",t:"Technical",L:(r.testQs||[]).map(m=>[m,"Ask them to talk you through it, or show you."])},comp,{k:"prac",t:"Practical test",L:PR(r).map(x=>[x,"Score what you saw them do."])}];
  return [comp,{k:"hr",t:"HR questions",L:[...HR_Q,...fq.map(q=>["Personality follow-up",q])]}];
}
export function autoCheck(c,r){ const F=[];
  const need=Math.max(0,...(r.mustHaves||[]).map(m=>{const x=String(m).match(/(\d+)\s*\+?\s*(?:years?|yrs?)/i);return x?+x[1]:0}));
  if(need&&c.years!=null) F.push(c.years>=need?["ok",c.years+" yrs (needs "+need+"+)"]:["bad",c.years+" yrs — needs "+need+"+"]);
  if(c.salary&&r.salMax) F.push(c.salary>r.salMax?["warn","Salary "+fmtN(c.salary)+" above range ("+fmtN(r.salMax)+")"]:["ok","Salary within range"]);
  if(c.notice!=null&&c.notice!=="") F.push(+c.notice>30?["warn","Notice "+c.notice+" days"]:["ok","Notice "+c.notice+" days"]);
  if(/Needs a visa|Visit visa/i.test(c.visa||"")) F.push(["warn",c.visa]);
  if((c.knockout||[]).length) F.push(["bad","Said No: "+c.knockout.join("; ")]);
  if(!c.cvFile&&!c.cvText) F.push(["warn","No CV"]);
  return F }
export function overdue(){ const L=[]; const C=allCands();
  Object.values(S.reqs).forEach(r=>{ if(r.status==="requested"&&workDaysSince(r.createdAt)>2) L.push(["CEO: approve vacancy "+r.title,workDaysSince(r.createdAt),{t:"req",id:r.id}]);
    if(r.status==="review"&&workDaysSince(r.scorecardAt)>2) L.push([r.dept+" head: approve scorecard "+r.title,workDaysSince(r.scorecardAt),{t:"req",id:r.id}]) });
  Object.values(C).forEach(c=>{ if(c.stage==="approval"&&workDaysSince(c.stageAt)>2) L.push(["CEO: final approval "+c.name,workDaysSince(c.stageAt),{t:"c",id:c.id}]);
    if(c.stage==="shortlist"&&workDaysSince(c.stageAt)>2) L.push(["Dept head: reply on shortlist "+c.name,workDaysSince(c.stageAt),{t:"c",id:c.id}]) });
  return L; }
export function go(p){V.page=p;V.sel.clear();sideOpen(false);render();window.scrollTo(0,0)}
export function sideMini(on){ const b=document.body; on=on===undefined?!b.classList.contains("side-mini"):on; b.classList.toggle("side-mini",on); try{localStorage.setItem("forkaHireSide",on?"mini":"full")}catch(e){} const m=$("#sdMini"); if(m){m.setAttribute("aria-label",on?"Expand menu":"Collapse menu");m.title=on?"Expand menu":"Collapse menu"} }
export function sideOpen(on){ document.body.classList.toggle("side-open",!!on) }
(()=>{ let v=null; try{v=localStorage.getItem("forkaHireSide")}catch(e){} if(v==="mini"||(!v&&window.innerWidth<1100&&window.innerWidth>860)) document.body.classList.add("side-mini") })();
document.addEventListener("keydown",e=>{ if(e.key==="Escape") sideOpen(false) });
export function openModal(html){paint("#dlg",html);$("#modal").classList.add("on")}
export function closeModal(){$("#modal").classList.remove("on");paint("#dlg",null)}
$("#modal").addEventListener("mousedown",e=>{if(e.target.id==="modal")closeModal()});
export const IC: Record<string,string> ={
 search:`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>`,
 sort:`<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 10l4-4 4 4M8 14l4 4 4-4"/></svg>`,
 up:`<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 14l5-5 5 5"/></svg>`,
 down:`<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg>`,
 lock:`<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`,
 eye:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/></svg>`,
 check:`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`,
 desk:`<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="12" rx="1.6"/><path d="M9 20h6M12 16.5V20"/></svg>`,
 phone:`<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/></svg>`
};
export const fmtT=t=>t?new Date(t).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}):"";
export const RANGES=[["","All time"],["30","Last 30 days"],["90","Last 90 days"],["year","This year"]];
export function inRange(t,r){ if(!r) return true; if(!t) return false; if(r==="year") return new Date(t).getFullYear()===new Date().getFullYear(); return t>=Date.now()-(+r)*864e5 }
export function median(a){ a=a.filter(x=>typeof x==="number"&&isFinite(x)).sort((x,y)=>x-y); if(!a.length) return null; const m=a.length>>1; return a.length%2?a[m]:(a[m-1]+a[m])/2 }
export const canPost=()=>V.role==="hr";
export function liveQ(id,set){ set(); clearTimeout(window._qt); window._qt=setTimeout(()=>{ render(); const i=document.getElementById(id); if(i){ i.focus(); i.setSelectionRange(i.value.length,i.value.length) } },250) }
export const VKEY=()=>"forkaHireViews:"+(V.me||"");
export function views(){ try{ return JSON.parse(localStorage.getItem(VKEY())||"{}")||{} }catch(e){ return {} } }
export function viewsSet(o){ try{ localStorage.setItem(VKEY(),JSON.stringify(o)) }catch(e){} }
export async function saveView(){ const name=await ask("Name this view"); if(!name) return; const o=views(); const L=(o.reqs||[]).filter(v=>v.name!==name.slice(0,40));
  L.push({name:name.slice(0,40),f:JSON.parse(JSON.stringify(V.rf))}); o.reqs=L.slice(-12); viewsSet(o); V.rview=name.slice(0,40); toast("View saved"); render() }
export function useView(name){ const v=(views().reqs||[]).find(x=>x.name===name); V.rview=v?name:""; V.rf=v?{...RF0(),...v.f}:RF0(); render() }
export function delView(){ const o=views(); o.reqs=(o.reqs||[]).filter(v=>v.name!==V.rview); viewsSet(o); V.rview=""; toast("View deleted"); render() }
export function postFlow(){ closeModal(); const ready=Object.values(S.reqs).filter(r=>r.status==="ready"&&headSees(r));
  if(ready.length){ V.rf={...RF0(),status:"ready"}; V.rview=""; go("reqs") } else { go("reqs"); reqForm() } }
export const MASK="•";
export const REV={};
export function maskPhone(p){ p=String(p||"").trim(); if(!p) return ""; if(p.includes(MASK)) return p;
  let d=p.replace(/\D/g,""); const plus=/^(\+|00)/.test(p); if(/^00/.test(p)) d=d.slice(2); if(d.length<5) return MASK+MASK+MASK;
  const cc=plus?d.slice(0,3):"", rest=d.slice(cc.length); return (cc?"+"+cc+" ":"")+rest[0]+MASK+" "+MASK+MASK+MASK+" "+MASK+MASK+rest.slice(-2) }
export function maskEmail(e){ e=String(e||"").trim(); if(!e) return ""; if(e.includes(MASK)) return e; const i=e.indexOf("@"); if(i<1) return MASK+MASK+MASK; return e[0]+MASK+MASK+MASK+e.slice(i) }
export const pooled=c=>c&&(c.stage==="rejected"||c.stage==="pool");
export const canReveal=c=>V.role==="hr"||(V.role==="head"&&headSees(reqOf(c)));
export async function reveal(id,btn){ const c=allCands()[id]; if(!c) return; let r;
  if(btn){ btn.disabled=true }
  if(DEMO||!HURL) r={ok:true,phone:c.phone||"",email:c.email||""};
  else { r=await api("reveal",{id}); if(!r.ok&&r.error==="action") r={ok:true,phone:c.phone||"",email:c.email||"",old:true} }  // Hiring script not updated yet: the page already has them
  if(btn){ btn.disabled=false }
  if(!r.ok){ if(r.error==="session") return gone("signin"); toast(r.error==="role"?"Only HR can see these details.":"Couldn't show the details — try again."); return }
  REV[id]={phone:r.phone||"",email:r.email||""}; render(); if($("#modal").classList.contains("on")&&DRAFT&&DRAFT.id===id) openCand(id) }
export function nextActions(C,cands,reqs){ const A=[], dn=r=>(r&&r.dept?r.dept+" head":"Dept head");
  const add=(o)=>A.push(o);
  if(V.role==="head"){
    reqs.filter(r=>r.status==="review").forEach(r=>add({t:"Approve scorecard",s:r.title,o:"You",d:workDaysSince(r.scorecardAt),sla:1,go:`openReq('${r.id}')`}));
    cands.filter(c=>c.stage==="shortlist").forEach(c=>add({t:"Pick for interview or decline",s:c.name+" · "+(reqOf(c).title||""),o:"You",d:workDaysSince(c.stageAt),sla:1,go:`openCand('${c.id}')`}));
    cands.filter(c=>c.stage==="interview"&&!(c.iv||{})[V.me]).forEach(c=>add({t:"Score the interview",s:c.name+" · "+(reqOf(c).title||""),o:"You",d:workDaysSince(c.stageAt),go:`openCand('${c.id}')`}));
  } else {
    if(V.ceo){ reqs.filter(r=>r.status==="requested").forEach(r=>add({t:"Approve vacancy",s:r.title+" · "+r.dept,o:"CEO",d:workDaysSince(r.createdAt),sla:1,go:`openReq('${r.id}')`}));
      cands.filter(c=>c.stage==="approval").forEach(c=>add({t:"Final approval",s:c.name+" · "+(reqOf(c).title||""),o:"CEO",d:workDaysSince(c.stageAt),sla:1,go:`openCand('${c.id}')`})); }
    reqs.filter(r=>r.status==="approved").forEach(r=>add({t:"Build the scorecard",s:r.title+" · "+r.dept,o:"HR",d:workDaysSince(r.createdAt),go:`openReq('${r.id}')`}));
    reqs.filter(r=>r.status==="ready").forEach(r=>add({t:"Post the job",s:r.title+" · "+place(r),o:"HR",d:workDaysSince(r.createdAt),go:`openReq('${r.id}')`}));
    reqs.filter(r=>r.status==="review").forEach(r=>add({t:"Approve scorecard",s:r.title,o:dn(r),d:workDaysSince(r.scorecardAt),sla:1,go:`openReq('${r.id}')`}));
    const lab={applied:"Screen the CV",screening:"Finish screening",personality:"Personality assessment",references:"Check references",final:"Final evaluation",offer:"Offer & documents"};
    cands.filter(c=>lab[c.stage]).forEach(c=>add({t:lab[c.stage],s:c.name+" · "+(reqOf(c).title||""),o:"HR",d:workDaysSince(c.stageAt||c.createdAt),go:`openCand('${c.id}')`}));
    cands.filter(c=>c.stage==="shortlist").forEach(c=>add({t:"Reply on shortlist",s:c.name+" · "+(reqOf(c).title||""),o:dn(reqOf(c)),d:workDaysSince(c.stageAt),sla:1,go:`openCand('${c.id}')`}));
  }
  const late=x=>x.sla&&x.d>2?1:0; return A.sort((a,b)=>(late(b)-late(a))||(b.d-a.d)) }
export function dashStage(s){ V.filter={q:"",req:(V.dash&&V.dash.req)||"",stage:s}; V.pv="list"; go("pipeline") }
export const RF0=()=>({q:"",title:"",status:"",dept:"",branch:"",date:"",sort:"createdAt",dir:-1});
export function sortReq(k){ const f=V.rf; if(f.sort===k) f.dir=-f.dir; else { f.sort=k; f.dir=["createdAt","joinBy","cands"].includes(k)?-1:1 } render() }
window.L_all=v=>{const C=allCands();Object.values(C).forEach(c=>v?V.sel.add(c.id):V.sel.delete(c.id));render()};
export const BRAND0={intro:"We operate restaurants across the UAE and Oman — Kuwaiti Kitchen, Mayar Cafe and more — and we're building the biggest F&B group in the region. Owners should own; operators should operate. We're looking for operators.",values:["Food first","Standards you can measure","Grow with the group","Multi-skilled teams","Every candidate gets a reply"],benefits:"Clear career paths across five businesses · training through the Forka Learning Library · a fair, scored hiring process"};
export function brand(){ const s=S.brand||{}; return {intro:s.intro!=null?s.intro:BRAND0.intro,values:Array.isArray(s.values)?s.values:BRAND0.values,benefits:s.benefits!=null?s.benefits:BRAND0.benefits} }
export const BSEC=[["intro","About us","b_intro","The first words every candidate reads. Two or three short sentences."],["values","Why work with us","b_vals","One reason per line. Short and concrete."],["benefits","Benefits","b_ben","What people get when they join."]];
export function bEd(){ const b=brand(), D=V.bdraft||(V.bdraft={}); return {intro:D.intro!=null?D.intro:b.intro,values:D.values!=null?D.values:b.values.join("\n"),benefits:D.benefits!=null?D.benefits:b.benefits} }
export function bLive(){ const e=bEd(); return {intro:e.intro,values:e.values.split("\n").map(s=>s.trim()).filter(Boolean),benefits:e.benefits} }
export function bEdit(k,el){ V.bdraft=V.bdraft||{}; V.bdraft[k]=el.value; const st=$("#st_"+k); if(st) st.outerHTML=staticHtml(bStat(k)); const b=$("#bs_"+k); if(b) b.disabled=false; const pv=$("#pvBody"); if(pv) paint(pv,pvHtml()) }
export async function saveSec(k){ const e=bEd(), cur=JSON.parse(JSON.stringify(S.brand||{})); cur[k]=k==="values"?e.values.split("\n").map(s=>s.trim()).filter(Boolean):e[k];
  const b=$("#bs_"+k); if(b) b.disabled=true;
  try{ await store.put("config","brand",cur) }catch(err){ if(b) b.disabled=false; return }
  if(V.bdraft) delete V.bdraft[k]; V.bsaved=V.bsaved||{}; V.bsaved[k]=now(); toast("Careers page saved"); render() }
export const WSTEPS=["Role & location","Compensation & timing","Evaluation plan","Review & submit"];
export const WFIELDS={1:["f_title","f_dept","f_branch"],2:["f_smax"],3:["f_mh0","f_mh1","f_mh2","g_pr","g_tr"]};
export const RDKEY=()=>"forkaHireReqDraft:"+(V.me||"");
export function reqDraftGet(){ try{ return JSON.parse(localStorage.getItem(RDKEY())||"null") }catch(e){ return null } }
export function reqDraftClear(reopen){ try{ localStorage.removeItem(RDKEY()) }catch(e){} if(reopen) reqForm(null,true) }
export function reqRead(){ const v=id=>($("#"+id)||{value:""}).value.trim();
  return {title:v("f_title"),dept:v("f_dept"),branch:v("f_branch"),work:v("f_work")||"On site",headcount:+v("f_hc")||1,reason:v("f_reason"),joinBy:v("f_join")?new Date(v("f_join")).getTime():null,salMin:+v("f_smin")||null,salMax:+v("f_smax")||null,cur:v("f_cur")||"AED",purpose:v("f_purpose"),duties:v("f_duties"),
    mustHaves:[0,1,2].map(i=>v("f_mh"+i)),testQs:[0,1,2].map(i=>v("f_tq"+i)),practicals:[...document.querySelectorAll(".f_pr:checked")].map(x=>x.value).concat(v("f_prother")?v("f_prother").split(",").map(x=>x.trim()).filter(Boolean):[]),criticals:[...document.querySelectorAll(".f_cr:checked")].map(x=>x.value),traits:[...document.querySelectorAll(".f_tr:checked")].map(x=>x.value)} }
export function reqDraftSave(){ if(!$("#f_title")) return; const t=now(); try{ localStorage.setItem(RDKEY(),JSON.stringify({at:t,step:V.rstep||1,r:reqRead()})) }catch(e){ return }
  const s=$("#w_saved"); if(s) s.textContent="Draft saved "+fmtT(t) }
export function wValidate(step,mark){ const v=id=>($("#"+id)||{value:""}).value.trim(), E=[], add=(id,m)=>E.push([id,m]);
  if(step===1||!step){ if(!v("f_title")) add("f_title","Write the role title"); if(!v("f_dept")) add("f_dept","Choose the department"); if(!v("f_branch")&&v("f_work")!=="Remote") add("f_branch","Choose the branch. Only remote jobs can leave it empty.") }
  if(step===2||!step){ if(!(+v("f_smax"))) add("f_smax","Write the top of the salary range") }
  if(step===3||!step){ [0,1,2].forEach(i=>{ if(!v("f_mh"+i)) add("f_mh"+i,"Write this must-have") });
    if(!document.querySelectorAll(".f_pr:checked").length&&!v("f_prother")) add("g_pr","Choose at least one practical test");
    const tr=[...document.querySelectorAll(".f_tr:checked")].map(x=>x.value), cr=[...document.querySelectorAll(".f_cr:checked")].map(x=>x.value);
    if(tr.length<2||tr.length>3) add("g_tr","Tick 2 or 3 traits"); else if(cr.some(c=>!tr.includes(c))) add("g_tr","A critical trait must also be ticked as a trait") }
  if(mark){ (step?WFIELDS[step]||[]:[].concat(WFIELDS[1],WFIELDS[2],WFIELDS[3])).forEach(id=>{ const el=$("#"+id), er=$("#e_"+id); if(el){ el.classList.remove("hx-bad"); el.removeAttribute("aria-invalid") } if(er) er.textContent="" });
    E.forEach(([id,m])=>{ const el=$("#"+id), er=$("#e_"+id); if(el){ el.classList.add("hx-bad"); el.setAttribute("aria-invalid","true") } if(er) er.textContent=m }) }
  return E }
export const wStepOf=id=>+Object.keys(WFIELDS).find(k=>WFIELDS[k].includes(id))||1;
export function wShow(){ const n=V.rstep||1;
  document.querySelectorAll("#dlg [data-wstep]").forEach(p=>{ p.hidden=+p.dataset.wstep!==n });
  document.querySelectorAll("#w_prog li").forEach((li,i)=>{ li.className=i+1<n?"done":i+1===n?"cur":""; const b=li.querySelector("button"); if(i+1===n) b.setAttribute("aria-current","step"); else b.removeAttribute("aria-current") });
  const st=$("#w_stepn"); if(st) st.textContent="Step "+n+" of 4";
  const sh=(id,on)=>{ const b=$("#"+id); if(b) b.style.display=on?"":"none" };
  sh("w_back",n>1); sh("w_next",n<4); sh("w_send",n===4);
  if(n===4) wReview();
  const m=$("#modal"); if(m) m.scrollTop=0;
  const h=document.querySelector(`#dlg [data-wstep="${n}"] h3`); if(h){ h.setAttribute("tabindex","-1"); h.focus({preventScroll:true}) } }
export function wStep(d){ const n=V.rstep||1;
  if(d>0){ V.rtried[n]=true; const E=wValidate(n,true); if(E.length){ const el=$("#"+E[0][0]); if(el){ el.scrollIntoView({block:"center"}); (el.matches("input,select,textarea")?el:el.querySelector("input")||el).focus() } toast("Please fill the fields marked in red"); return } }
  V.rstep=Math.max(1,Math.min(4,n+d)); wShow(); reqDraftSave() }
export function wGo(t){ for(let k=V.rstep||1;k<t;k++){ V.rtried[k]=true; if(wValidate(k,true).length){ V.rstep=k; wShow(); return } } V.rstep=t; wShow() }
export async function saveReq(){
  const WE=wValidate(0,false); if(WE.length&&$("#w_prog")){ V.rstep=wStepOf(WE[0][0]); wShow(); V.rtried[V.rstep]=true; wValidate(V.rstep,true) }  // show the first step with a gap, fields in red
  const v=id=>$("#"+id).value.trim();
  const r={id:uid(),title:v("f_title"),dept:v("f_dept"),branch:v("f_branch"),work:v("f_work")||"On site",headcount:+v("f_hc")||1,reason:v("f_reason"),joinBy:v("f_join")?new Date(v("f_join")).getTime():null,salMin:+v("f_smin")||null,salMax:+v("f_smax")||null,cur:v("f_cur")||"AED",purpose:v("f_purpose"),duties:v("f_duties"),
    mustHaves:[0,1,2].map(i=>v("f_mh"+i)).filter(Boolean),testQs:[0,1,2].map(i=>v("f_tq"+i)).filter(Boolean),practicals:[...document.querySelectorAll(".f_pr:checked")].map(x=>x.value).concat(v("f_prother")?v("f_prother").split(",").map(x=>x.trim()).filter(Boolean):[]),criticals:[...document.querySelectorAll(".f_cr:checked")].map(x=>x.value),traits:[...document.querySelectorAll(".f_tr:checked")].map(x=>x.value),
    status:"requested",createdBy:V.me,createdAt:now(),knockout:[],history:[{t:now(),by:V.me,m:"Hiring request raised"}]};
  const miss=[!r.title&&"role title",!r.dept&&"department",!r.branch&&r.work!=="Remote"&&"branch",!r.salMax&&"salary range",r.mustHaves.length<3&&"3 must-haves",!r.practicals.length&&"practical test",r.criticals.some(c=>!r.traits.includes(c))&&"critical traits must also be ticked as traits",(r.traits.length<2||r.traits.length>3)&&"2–3 traits"].filter(Boolean);
  r.practical=r.practicals.join(" + "); r.critical=r.criticals.join(", ");
  if(miss.length) return toast("Missing: "+miss.join(", "));
  await store.put("reqs",r.id,r); reqDraftClear(); closeModal(); toast("Sent to Khaled for approval"); go("reqs");
}
export async function reqAct(id,a){
  const r=JSON.parse(JSON.stringify(S.reqs[id])); const log=m=>r.history.push({t:now(),by:V.me,m});
  if(a==="approve"){ const d=new Date(), n=Object.values(S.reqs).filter(x=>x.reqId&&x.reqId.startsWith("REQ-"+String(d.getFullYear()).slice(2)+String(d.getMonth()+1).padStart(2,"0"))).length+1;
    r.reqId="REQ-"+String(d.getFullYear()).slice(2)+String(d.getMonth()+1).padStart(2,"0")+"-"+String(n).padStart(2,"0"); r.status="approved"; log("CEO approved vacancy — "+r.reqId); }
  if(a==="decline"){ const why=await ask("Why is this vacancy declined?"); if(!why)return; r.status="declined"; log("CEO declined: "+why) }
  if(a==="headok"){ r.status="ready"; log("Department head approved the scorecard") }
  if(a==="changes"){ const why=await ask("What should HR change?"); if(!why)return; r.status="approved"; log("Head asked for changes: "+why) }
  if(a==="post"){ r.status="open"; r.postedAt=now(); log("Job posted");
    await store.put("jobs",id,{id,title:r.title,dept:r.dept,branch:r.branch,work:r.work||"On site",summary:r.purpose,jd:r.jd||"",knockout:r.knockout||[],open:true,postedAt:r.postedAt}); }
  if(a==="close"){ r.status=Object.values(allCands()).filter(c=>c.req===id&&c.stage==="hired").length>=r.headcount?"filled":"closed"; log("Role closed"); if(S.jobs[id]) await store.put("jobs",id,{...S.jobs[id],open:false}); }
  await store.put("reqs",id,r); toast("Saved"); openReq(id);
}
export async function delReq(id){ const r=S.reqs[id]; if(!r) return;
  if(Object.values(allCands()).some(c=>c.req===id)) return toast("This request has candidates. Close the role instead of deleting it.");
  if(!await sure("Delete this hiring request? This cannot be undone.",r.title+" × "+r.headcount+" · "+r.dept,"Yes, delete")) return;
  try{ await store.del("reqs",id); if(S.jobs[id]) await store.del("jobs",id) }catch(e){ return }
  closeModal(); toast("Request deleted"); render() }
export async function saveJD(id,next){ const r=JSON.parse(JSON.stringify(S.reqs[id])); r.jd=$("#r_jd").value; r.ad=$("#r_ad").value; r.adAr=$("#r_adar").value; r.knockout=$("#r_ko").value.split("\n").map(s=>s.trim()).filter(Boolean); r.titleAr=($("#r_titlear")||{value:""}).value.trim(); r.knockoutAr=(($("#r_koar")||{value:""}).value).split("\n").map(s=>s.trim()).filter(Boolean);
  if(next==="review"){ if(!r.jd) return toast("Write the JD first"); r.status="review"; r.scorecardAt=now(); r.history.push({t:now(),by:V.me,m:"Scorecard + JD sent to head for approval"}) }
  await store.put("reqs",id,r); if(S.jobs[id]&&S.jobs[id].open) await store.put("jobs",id,{...S.jobs[id],jd:r.jd,knockout:r.knockout}); toast("Saved"); openReq(id) }
export async function submitApp(id){ const j=S.jobs[id]; const v=x=>$("#"+x).value.trim();
  const file=$("#a_file").files[0];
  if(!v("a_name")||!v("a_email")) return toast("Name and email are needed");
  if(!file&&!v("a_cv")) return toast("Please upload your CV (or paste it)");
  if(!$("#a_cons").checked) return toast("Please tick the consent box");
  const ans=(j.knockout||[]).map((q,i)=>[q,v("a_ko"+i)]); if(ans.some(a=>!a[1])) return toast("Answer the quick questions");
  const btn=document.querySelector(".ft .btn.br"); let cvFile=null;
  if(file){ btn.disabled=true; btn.textContent="Uploading CV…"; cvFile=await uploadCV(file); btn.disabled=false; btn.textContent="Submit application"; if(!cvFile) return; }
  const aid=uid(); const a={cvFile,req:id,jobTitle:j.title,name:v("a_name"),email:v("a_email"),phone:v("a_phone"),location:v("a_loc"),years:+v("a_yrs")||0,notice:+v("a_notice")||null,salary:+v("a_sal")||null,visa:v("a_visa"),cvText:v("a_cv"),answers:ans,knockout:ans.filter(a=>a[1]!=="Yes").map(a=>a[0]),consent:true,source:"Careers page",createdAt:now()};
  const doc=JSON.parse(JSON.stringify(S.apps[V.me]||{list:{}})); doc.list[aid]=a;
  try{ await store.put("apps",V.me,doc) }catch(e){ return }
  closeModal(); toast("Application sent — track it under My applications"); go("mine");
}
export async function saveApplicant(){ const v=x=>$("#"+x).value.trim(); if(!v("n_name")) return toast("Name needed");
  const file=$("#n_file").files[0]; let cvFile=null; if(file){ toast("Uploading CV…"); cvFile=await uploadCV(file); if(!cvFile) return; }
  const c={cvFile,id:uid(),req:v("n_req"),source:v("n_src"),cvText:v("n_cv"),name:v("n_name"),email:v("n_email"),phone:v("n_phone"),location:v("n_loc"),years:+v("n_yrs")||null,salary:+v("n_sal")||null,consent:$("#n_cons").checked,stage:"applied",stageAt:now(),createdAt:now(),history:[{t:now(),by:V.me,m:"Added by HR ("+v("n_src")+")"}]};
  await store.put("pipe",c.id,c); closeModal(); toast("Added"); openCand(c.id) }
export let DRAFT=null;
export function setScore(path,n){ const p=path.split("."); const d=DRAFT;
  if(p[0]==="iv"){ const m=myCard(); if(m.done) return; if(p[1]==="prac"){ m.prac=PV(m).slice(); m.prac[+(p[2]||0)]=n } else { m[p[1]]=m[p[1]]||[]; m[p[1]][+p[2]]=n } }
  else { d[p[0]]=d[p[0]]||{}; d[p[0]][p[1]]=n }
  openCand(d.id); }
export function myCard(){ const d=DRAFT; d.iv=d.iv||{}; const m=d.iv[V.me]=d.iv[V.me]||{tech:[],comp:[]}; m.who=V.role==="head"?"head":"hr"; return m }
export function ivSet(k,v,quiet){ const m=myCard(); if(m.done) return; m[k]=v; if(!quiet)openCand(DRAFT.id) }
export function ivNote(path,v){ const m=myCard(); if(m.done) return; m.n=m.n||{}; m.n[path]=v }
export function lock_iv(si){ return si>SI.interview }
export let SCH=null;
export const UAE=4*3600000;
export function uaeParts(t){const d=new Date(t+UAE);return{y:d.getUTCFullYear(),m:d.getUTCMonth(),d:d.getUTCDate(),wd:d.getUTCDay(),h:d.getUTCHours(),mi:d.getUTCMinutes()}}
export const uaeTime=(y,m,d,h,mi)=>Date.UTC(y,m,d,h,mi||0)-UAE;
export function whenTxt(t){const p=uaeParts(t);return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][p.wd]+" "+p.d+" "+["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][p.m]+", "+((p.h+11)%12+1)+":"+String(p.mi).padStart(2,"0")+(p.h<12?" AM":" PM")}
export function waNum(ph){let n=String(ph||"").replace(/[^\d+]/g,"");if(n.startsWith("+"))n=n.slice(1);else if(n.startsWith("00"))n=n.slice(2);else if(/^0[5]\d{8}$/.test(n))n="971"+n.slice(1);return n}
export function waLink(d,link,kind){const first=String(d.name||"").split(" ")[0];const job=reqOf(d).title||d.jobTitle||"";
  const txt=d.lang==="ar"?`مرحباً ${first}، معك فريق التوظيف في فوركا بخصوص وظيفة ${job}. اختر موعد ${kind==="call"?"المكالمة":"المقابلة"} المناسب لك من هنا: ${link}`:`Hello ${first}, this is the Forka Hiring team about the ${job} role. Please pick a time for your ${kind==="call"?"HR call":"interview"} here: ${link}`;
  return "https://wa.me/"+waNum(d.phone)+"?text="+encodeURIComponent(txt)}
export function bookLink(b){return String(CFG.APPLY_URL||"https://apply.forka.com/").replace(/\/?$/,"/")+"#book="+b.token}
export async function inviteIv(){ await move("interview"); schedDlg("interview") }
export function schedDlg(kind){ const d=DRAFT, r=reqOf(d);
  if(!HURL&&!DEMO){ toast("Booking links work on the live app (erp.forka.com/hiring)"); return }
  if(!d.email){ toast("Add the candidate's email first"); return }
  SCH={kind,slots:new Set(),mins:kind==="call"?30:45,mode:kind==="call"?"Phone":r.work==="Remote"?"Video call":"In person",place:kind==="call"||r.work==="Remote"?"":(r.branch?r.branch+" branch":""),note:"",sent:null};
  schedRender() }
export function schTog(t){ SCH.slots.has(t)?SCH.slots.delete(t):SCH.slots.add(t); schedRender() }
export async function schSend(){ const b=$("#schGo"); if(b){b.disabled=true;b.textContent="Sending…"}
  if(DRAFT.unsaved) await persist(DRAFT,null);
  const r=DEMO?{ok:true,mailed:true,link:String(CFG.APPLY_URL||"https://apply.forka.com/").replace(/\/?$/,"/")+"#book=demo-"+uid(),book:{token:"demo-"+uid(),kind:SCH.kind,slots:[...SCH.slots],mins:SCH.mins,mode:SCH.mode,place:SCH.place,by:V.me,byName:nm(V.me),at:now(),pick:null}}
    :await api("invite",{id:DRAFT.id,kind:SCH.kind,slots:[...SCH.slots],mins:SCH.mins,mode:SCH.mode,place:SCH.place,note:SCH.note});
  if(DEMO&&r.ok){ DRAFT.books=Object.assign({},DRAFT.books||{},{[SCH.kind]:r.book}); await persist(DRAFT,(SCH.kind==="call"?"HR call":"Interview")+" booking link sent (demo)"); SCH.sent=r; schedRender(); return }
  if(!r.ok){ toast(r.error==="email"?"The candidate has no valid email":r.error==="slots"?"Pick times at least an hour from now":r.error==="role"?"Only HR books the HR call":"Couldn't send — try again"); schedRender(); return }
  SCH.sent=r; const p=RDATA.pipe[DRAFT.id]; if(p){ p.books=Object.assign({},p.books||{},{[SCH.kind]:r.book}); fire("pipe") } DRAFT.books=Object.assign({},DRAFT.books||{},{[SCH.kind]:r.book}); schedRender() }
export function refSet(i,k,v){ DRAFT.refs=DRAFT.refs||[{},{}]; DRAFT.refs[i]=DRAFT.refs[i]||{}; DRAFT.refs[i][k]=v }
export function finSet(v){ DRAFT.fin={...(DRAFT.fin||{}),total:+v||null,basic:v?Math.round(+v*0.3):null}; const b=$("#basicOut"); if(b) b.value=DRAFT.fin.basic?fmtN(DRAFT.fin.basic):"" }
export async function persist(d,msg){ d=JSON.parse(JSON.stringify(d)); delete d.unsaved; if(msg)(d.history=d.history||[]).push({t:now(),by:V.me,m:msg});
  await store.put("pipe",d.id,d);
  // mirror ONLY the stage name to the candidate's own application doc (they never see scores or notes)
  if(d.ownerUid&&S.apps[d.ownerUid]&&(S.apps[d.ownerUid].list||{})[d.id]&&S.apps[d.ownerUid].list[d.id].status!==d.stage){ const a=JSON.parse(JSON.stringify(S.apps[d.ownerUid])); a.list[d.id].status=d.stage; try{await store.put("apps",d.ownerUid,a)}catch(e){} }
  DRAFT=d; return d }
export async function saveDraft(){ await persist(DRAFT,null); toast("Saved"); openCand(DRAFT.id) }
export async function move(stage,msg){ const d=DRAFT; d.stage=stage; d.stageAt=now(); if(stage==="hired")d.hiredAt=now();
  await persist(d,msg||("Moved to "+STAGES[SI[stage]][1])); toast(msg||"Moved to "+STAGES[SI[stage]][1]); openCand(d.id) }
export async function submitIv(){ const m=myCard(), r=reqOf(DRAFT), sheet=ivSheet(m.who,r,DRAFT);
  const miss=sheet.some(sec=>sec.L.some((x,i)=>!(sec.k==="prac"?PV(m)[i]:(m[sec.k]||[])[i])));
  if(miss) return toast("Score every question first"); if(!m.rec) return toast("Pick your recommendation");
  m.done=true; m.at=now(); await persist(DRAFT,"Interview scorecard submitted by "+nm(V.me)+" — "+m.rec); toast("Scorecard submitted"); openCand(DRAFT.id) }
export async function rejectC(){ const r=reqOf(DRAFT); const why=await ask("Which criterion did they fail? (required — no rejections on feeling)",[...(r.mustHaves||[]),"Salary above range","Screening score below pass mark","Interview score below pass mark","Practical test","References","Candidate withdrew"]); if(!why)return;
  DRAFT.reject={reason:why,at:now(),by:V.me}; await move("rejected","Rejected — "+why) }
export async function toPool(){ const why=await ask("Why keep them in the talent pool?"); if(!why)return; DRAFT.poolNote=why; DRAFT.reject={reason:why,at:now()}; await move("pool","Talent pool — "+why) }
export async function addNote(){ const v=$("#noteIn").value.trim(); if(!v)return; (DRAFT.notes=DRAFT.notes||[]).push({t:now(),by:V.me,m:v}); await persist(DRAFT); openCand(DRAFT.id) }
export async function bulk(kind){ const C=allCands(); let why="";
  if(kind==="reject"){ why=await ask("Reason for all selected (criterion failed)",["Screening score below pass mark","Missing must-have experience","Salary above range","Position filled"]); if(!why)return }
  if(kind==="pool"){ why=await ask("Talent pool note"); if(!why)return }
  for(const id of V.sel){ const d=JSON.parse(JSON.stringify(C[id])); if(!d||["hired"].includes(d.stage))continue;
    if(kind==="advance"){ const i=SI[d.stage]; if(i==null||i>=SI.shortlist) continue; d.stage=STAGES[i+1][0]; d.stageAt=now(); await persist(d,"Bulk move to "+STAGES[i+1][1]) }
    else { d.reject={reason:why,at:now(),by:V.me}; if(kind==="pool")d.poolNote=why; d.stage=kind==="pool"?"pool":"rejected"; d.stageAt=now(); await persist(d,(kind==="pool"?"Talent pool — ":"Rejected — ")+why) } }
  V.sel.clear(); toast("Done"); render() }
export async function reconsider(id){ const R=Object.values(S.reqs).filter(r=>r.status==="open"); if(!R.length)return toast("No open roles");
  const pick=await ask("Which open role?",R.map(r=>r.title+" · "+place(r))); if(!pick)return; const r=R.find(x=>x.title+" · "+place(x)===pick);
  const d=JSON.parse(JSON.stringify(allCands()[id])); d.req=r.id; d.stage="applied"; d.stageAt=now(); d.reject=null; d.source="Talent pool"; d.cv={}; d.call={}; d.iv={}; await persist(d,"Reconsidered from talent pool for "+r.title); toast("Moved to "+r.title) }
export async function purgeOld(){ const C=allCands(); for(const c of Object.values(C)){ if(["rejected","pool"].includes(c.stage)&&c.personality&&c.personality.summary&&workDaysSince(c.reject?.at||c.stageAt)>130){ const d=JSON.parse(JSON.stringify(c)); d.personality={deleted:true}; await persist(d,"Personality report deleted (6-month retention)") } } toast("Deleted"); render() }
export async function uploadCV(file){
  if(file.size>20*1024*1024){ toast("That file is over 20 MB"); return null }
  const ok=/pdf|image\//.test(file.type)||/\.pdf$/i.test(file.name); if(!ok){ toast("Please upload a PDF or a photo (save Word files as PDF)"); return null }
  if(DEMO){ if(file.size>1.5*1024*1024) return {name:file.name,size:file.size,type:file.type,demoTooBig:true};
    const data=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(file)}); return {name:file.name,size:file.size,type:file.type,data} }
  if(HURL){ if(file.size>5*1024*1024){ toast("CV files up to 5 MB"); return null }
    const data=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(String(fr.result).split(",")[1]);fr.readAsDataURL(file)});
    const r=await api("upload",{file:{name:file.name,type:file.type||"application/pdf",data}}); if(r.ok) return r.file; toast("Upload failed — try again or paste the text"); return null }
  if(!ASSETS){ toast("File upload isn't available for your access level — paste your CV text instead"); return null }
  try{ const up=await ASSETS.upload(file); return {id:up.id,url:up.url,name:file.name,size:up.sizeBytes,type:up.contentType} }
  catch(e){ toast("Upload failed — try again or paste the text"); return null }
}
export async function saveMemberMail(){ const n=$("#m_name").value.trim(), e=$("#m_mail").value.trim().toLowerCase();
  if(!n||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)){ toast("Name and a company email are needed"); return }
  const t=JSON.parse(JSON.stringify(S.team||{members:{}})); t.members=t.members||{}; t.members[e]={name:n,role:$("#m_role").value,dept:$("#m_role").value==="head"?$("#m_dept").value:null};
  try{ await store.put("config","team",t) }catch(e){ return } closeModal(); toast("Added"); render() }
export let PICK=null;
export async function saveMember(){ if(!PICK)return toast("Pick a person"); const t=JSON.parse(JSON.stringify(S.team||{members:{}})); t.members=t.members||{}; t.members[PICK]={role:$("#m_role").value,dept:$("#m_role").value==="head"?$("#m_dept").value:null};
  await store.put("config","team",t); closeModal(); toast("Added"); render() }
export async function removeMember(k){ const t=JSON.parse(JSON.stringify(S.team)); delete t.members[k]; await store.put("config","team",t); render() }
export async function saveGuide(){ const v=$("#ai_guide").value.trim().slice(0,4000); await store.put("config","aiguide",{text:v,at:now(),by:V.me}); toast(v?"Guidance saved — the AI will follow it":"Guidance cleared") }
export async function saveBrand(){ await store.put("config","brand",{intro:$("#b_intro").value,values:$("#b_vals").value.split("\n").map(s=>s.trim()).filter(Boolean),benefits:$("#b_ben").value}); toast("Careers page saved") }
export function ask(q,opts){ return new Promise(res=>{ const prev=$("#dlg").innerHTML, wasOn=$("#modal").classList.contains("on");
  const box=document.createElement("div"); box.id="askbox"; box.style.cssText="position:fixed;inset:0;background:rgba(35,33,31,.5);z-index:70;display:flex;align-items:center;justify-content:center;padding:12px";
  box.innerHTML=`<div class="dlg" style="width:min(460px,100%)"><div class="bd"><h3>${esc(q)}</h3>${opts?`<select id="askSel" style="margin-top:10px"><option value="">Choose…</option>${opts.map(o=>`<option>${esc(o)}</option>`).join("")}<option value="__other">Other (write it)</option></select>`:""}<textarea id="askIn" style="margin-top:10px;${opts?"display:none":""}"></textarea></div><div class="ft"><button class="btn sec" id="askNo">Cancel</button><button class="btn" id="askOk">OK</button></div></div>`;
  document.body.appendChild(box); const sel=box.querySelector("#askSel"), inp=box.querySelector("#askIn");
  if(sel) sel.onchange=()=>{inp.style.display=sel.value==="__other"?"block":"none"};
  box.querySelector("#askNo").onclick=()=>{box.remove();res(null)};
  box.querySelector("#askOk").onclick=()=>{const v=sel&&sel.value&&sel.value!=="__other"?sel.value:inp.value.trim(); if(!v)return; box.remove(); res(v)}; }) }
export function sure(q,sub,yes){ return new Promise(res=>{ const box=document.createElement("div"); box.id="askbox"; box.setAttribute("role","alertdialog"); box.setAttribute("aria-modal","true");
  box.style.cssText="position:fixed;inset:0;background:rgba(35,33,31,.5);z-index:70;display:flex;align-items:center;justify-content:center;padding:12px";
  box.innerHTML=`<div class="dlg" style="width:min(460px,100%)"><div class="bd"><h3>${esc(q)}</h3>${sub?`<p class="small muted" dir="auto" data-noi18n="1">${esc(sub)}</p>`:""}</div><div class="ft"><button class="btn sec" id="sureNo">Cancel</button><button class="btn bad" id="sureOk">${esc(yes)}</button></div></div>`;
  document.body.appendChild(box); if(LANG==="ar") trNode(box);
  const done=v=>{box.remove();document.removeEventListener("keydown",k);res(v)}, k=e=>{if(e.key==="Escape")done(false)};
  document.addEventListener("keydown",k); box.querySelector("#sureNo").onclick=()=>done(false); box.querySelector("#sureOk").onclick=()=>done(true);
  box.onclick=e=>{if(e.target===box)done(false)}; box.querySelector("#sureNo").focus() }) }
export async function copyTxt(t){ try{await navigator.clipboard.writeText(t);toast("Copied")}catch(e){toast("Select the text and copy it")} }
export const AI_ON=()=>!!SAMPLE||!!HURL;
export async function aiText(prompt){ if(SAMPLE) return (await SAMPLE(prompt)).text||"";
  const r=await api("ai",{prompt}); if(!r.ok){const e=new Error(r.error);e.code=r.error;e.detail=r.detail;throw e} return r.text||"" }
export async function askJSON(prompt){ const t=await aiText(prompt+"\n\nReply with JSON only, no prose, no code fences."); const m=t.match(/[\[{][\s\S]*[\]}]/); return JSON.parse(m?m[0]:t) }
export const AI_ERR={rate_limited:"AI is busy — try in a minute",aibusy:"AI is busy — try in a minute",not_granted:"AI not allowed on this page",
  nokey:"AI is not switched on yet. The CEO adds the AI key in the Hiring script (Script properties).",aikey:"The AI key was not accepted. Ask the CEO to check it.",
  ailimit:"Today's AI limit is reached. Try again tomorrow.",airefused:"AI declined this one. Review it by hand.",aitimeout:"AI took too long — try again.",
  nocv:"There is no CV file or CV text to read.",cvold:"This is an old Word (.doc) file. Ask for a PDF, or paste the CV text.",cvread:"The CV file could not be read. Paste the CV text instead.",
  missing:"The CV file was not found.",action:"The Hiring script on Google is still the old version. Paste the new script into the Forka Hiring project and deploy a New version.",net:"Can't reach the Hiring server — check the internet and try again.",role:"Only HR or this department's head can do this.",session:"Please sign in again at Forka Apps."};
export async function aiBusy(btn,fn){ btn=btn||event?.target; const old=btn?.textContent; if(btn){btn.disabled=true;btn.textContent="Working…"} try{ await fn() }catch(e){ toast(AI_ERR[e&&e.code]||("AI couldn't do that"+(e&&e.detail?" ("+String(e.detail).slice(0,140)+")":e&&e.code?" ("+e.code+")":"")+" — try again"),9000) } if(btn){btn.disabled=false;btn.textContent=old} }
export function aiGuide(){ const g=((S.aiguide&&S.aiguide.text)||"").trim(), n=(($("#r_ainote")||{}).value||"").trim();
  return (g?`Forka HR's standing guidance. Follow it. Where it conflicts with the general instructions below, it wins:\n<guidance>\n${g}\n</guidance>\n\n`:"")+(n?`Extra notes for this job only (follow them too):\n<notes>\n${n}\n</notes>\n\n`:"") }
export function aiJD(id){ const btn=event.target; aiBusy(btn,async()=>{ const r=S.reqs[id];
  const o=await askJSON(aiGuide()+`You write hiring material for Forka Collective, an F&B operating group running restaurants in the UAE and Oman (Kuwaiti Kitchen, Mayar Cafe). Plain English, many readers use English as a second language. No hype.
Role: ${r.title} · ${r.dept} · ${place(r)}.${r.work==="Remote"?" This is a remote job: say so clearly in the JD and ads, and do not ask candidates to come to a branch.":r.work==="Hybrid"?" This is a hybrid job (part in the branch, part remote): say so in the JD and ads.":""} Purpose: ${r.purpose}. Duties: ${r.duties}. Must-haves: ${r.mustHaves.join("; ")}. Practical test: ${r.practical}. Traits: ${r.traits.join(", ")}.
Return {"jd": "job description with sections: About the role, What you'll do, What you need (must-haves), Nice to have, How we hire (CV screen, HR call, short online assessment, interview + ${r.practical}, references, offer). Include a line that the role may include other duties as assigned.", "ad":"LinkedIn post, max 120 words, tells people to email hr@forka.com with '${r.title}' in the subject", "adAr":"the same ad in natural Gulf-friendly Modern Standard Arabic", "knockout":["3 yes/no knock-out questions built from the must-haves, phrased so the right answer is Yes"]}`);
  $("#r_jd").value=o.jd||""; $("#r_ad").value=o.ad||""; $("#r_adar").value=o.adAr||""; if(o.knockout) $("#r_ko").value=o.knockout.join("\n"); toast("Draft ready — review, then Save") }) }
export function aiSum(){ const btn=window.event&&window.event.target; aiBusy(btn,async()=>{ const d=DRAFT, r=reqOf(d);
  if(SAMPLE){ d.ai=await askJSON(`Summarise this CV for the job ${r.title}. Must-haves: ${JSON.stringify(r.mustHaves||[])}. Ignore name, age, gender, nationality, religion. Score each must-have 1-5 with evidence from the CV.
CV: """${(d.cvText||"").slice(0,12000)}"""
Return {"summary":"3-4 sentences","role":"","years":null,"employers":[],"languages":[],"visaNotice":"","mustHaves":[{"item":"","score":1,"evidence":""}],"checks":[],"questions":[]}`) }
  else { const res=await api("aisum",{req:d.req,cv:d.cvFile&&d.cvFile.drive?d.cvFile.id:"",text:d.cvText||""}); if(!res.ok){const e=new Error(res.error);e.code=res.error;e.detail=res.detail;throw e} d.ai=res.ai }
  d.ai.at=now(); d.ai.by=V.me;
  d.cv=d.cv||{}; d.aiWhy=[]; (d.ai.mustHaves||[]).forEach((m,i)=>{ d.aiWhy[i]=m.evidence; if(d.cv[i]==null&&m.score>=1&&m.score<=5) d.cv[i]=m.score });
  await persist(d,"AI CV summary"); DRAFT=JSON.parse(JSON.stringify(d)); toast("Summary ready — check it against the CV"); openCand(d.id) }) }
export function aiScreen(){ return aiSum() }
export function aiScreenOld(){ const btn=event.target; if(!(DRAFT.cvText||"").trim()) return toast("AI scoring needs CV text — this candidate sent a file only, so score from the file by hand"); aiBusy(btn,async()=>{ const d=DRAFT, r=reqOf(d);
  const o=await askJSON(`Score this CV against each must-have on 1–5 (1 does not meet, 3 meets with gaps, 5 exceeds). Judge only evidence in the CV; if it isn't there, score low and say so. Ignore name, age, gender, nationality, religion.
Must-haves: ${JSON.stringify(r.mustHaves)}
CV: """${(d.cvText||"").slice(0,6000)}"""
Return {"scores":[n,...],"why":["one short reason per must-have",...]}`);
  d.cv=d.cv||{}; (o.scores||[]).forEach((n,i)=>{ if(n>=1&&n<=5) d.cv[i]=Math.round(n) }); d.aiWhy=o.why||[]; toast("Suggested — check each score"); openCand(d.id) }) }
export function aiParse(){ const btn=event.target; aiBusy(btn,async()=>{ const o=await askJSON(`Extract from this CV: {"name":"","email":"","phone":"","location":"","years":number of years of relevant work experience}. CV: """${$("#n_cv").value.slice(0,6000)}"""`);
  ["name","email","phone","location"].forEach(k=>{ if(o[k]) $("#n_"+k==="#n_location"?"#n_loc":"#n_"+k).value=o[k] }); if(o.location)$("#n_loc").value=o.location; if(o.years!=null)$("#n_yrs").value=o.years; toast("Filled — check it") }) }
export function demoSeed(){ const t=now(), D=864e5;
  const r1={id:"r1",reqId:"REQ-2610-01",title:"Branch Supervisor",dept:"Operations",branch:"Sharjah",headcount:1,reason:"Replacement",joinBy:t+21*D,salMin:6000,salMax:8000,cur:"AED",purpose:"Run the floor and the shift team so every guest gets the same Kuwaiti Kitchen standard.",duties:"Open/close the branch, lead shift briefings, handle complaints, check wastage and overnight inventory, train new staff.",mustHaves:["3+ years supervising in a UAE restaurant","Runs SOP checklists and shift briefings","Arabic and English, spoken"],testQs:["Handling a guest complaint during peak","Controlling wastage and food cost","Scheduling a shift with two no-shows"],practical:"Trial shift",critical:"Reliability and discipline",traits:["Reliability and discipline","Calm under pressure","Energy with people"],status:"open",createdBy:"u_abuali",createdAt:t-12*D,postedAt:t-9*D,knockout:["Do you have at least 3 years of supervisor experience in UAE restaurants?","Can you work rotating shifts including weekends?"],
    jd:"About the role\nYou run the floor and the shift team at our Sharjah branch.\n\nWhat you'll do\n• Open and close the branch on the SOP checklist\n• Lead the shift briefing every day\n• Handle guest complaints on the spot\n• Check wastage and overnight inventory\n• Train new team members\n• Other duties as assigned\n\nWhat you need\n• 3+ years supervising in a UAE restaurant\n• Comfortable with SOP checklists and briefings\n• Arabic and English, spoken\n\nHow we hire\nCV screen → HR call → short online assessment → interview + trial shift → references → offer. Every applicant gets a reply.",ad:"We're hiring a Branch Supervisor for Kuwaiti Kitchen, Sharjah…",adAr:"",history:[{t:t-12*D,by:"u_abuali",m:"Hiring request raised"},{t:t-11*D,by:"u_khaled",m:"CEO approved vacancy — REQ-2610-01"},{t:t-9*D,by:"u_jen",m:"Job posted"}]};
  const r2={id:"r2",title:"Commis Chef",dept:"Kitchen",branch:"Fujairah",headcount:2,reason:"New position",joinBy:t+30*D,salMin:2500,salMax:3200,cur:"AED",purpose:"Prep and cook to recipe card for the Fujairah kitchen.",duties:"Prep, line cooking, labelling and FIFO, cleaning schedule.",mustHaves:["1+ year in a commercial kitchen","Food safety basics (HACCP awareness)","Follows recipe cards exactly"],testQs:["Knife skills and prep speed","Labelling and FIFO","Cooking two signature dishes to card"],practical:"Cooking test",traits:["Reliability and discipline","Team cooperation"],status:"requested",createdBy:"u_chef",createdAt:t-3*D,knockout:[],history:[{t:t-3*D,by:"u_chef",m:"Hiring request raised"}]};
  const base=(id,name,stage,extra)=>({id,req:"r1",name,email:name.split(" ")[0].toLowerCase()+"@mail.com",phone:"+971 50 000 0000",location:"Sharjah",years:4,notice:30,salary:7000,visa:"Own visa / residency",source:"LinkedIn",consent:true,cvText:"Restaurant supervisor, 4 years in Dubai and Sharjah casual dining. Runs opening/closing checklists, daily briefings, rosters for 14 staff. Arabic and English.",stage,stageAt:t-3*D,createdAt:t-8*D,history:[{t:t-8*D,by:"u_jen",m:"Added by HR (LinkedIn)"}],...extra});
  return {reqs:{r1,r2},jobs:{r1:{id:"r1",title:r1.title,dept:r1.dept,branch:r1.branch,summary:r1.purpose,jd:r1.jd,knockout:r1.knockout,open:true,postedAt:r1.postedAt}},apps:{},config:{},
   pipe:{c1:base("c1","Ahmed Saleh","applied",{stageAt:t-D,createdAt:t-D,source:"Email (hr@forka.com)"}),
     c2:base("c2","Maria Santos","screening",{cv:{0:4,1:4},call:{0:4,1:3}}),
     c3:base("c3","Rami Haddad","shortlist",{cv:{0:5,1:4,2:5},call:{0:4,1:4,2:4,3:5,4:4},stageAt:t-4*D,personality:{consent:true,tool:"to be chosen",tr:{0:"Match",1:"Match",2:"Watch-out"},summary:"Steady and organised; a little reserved with guests at first.",qs:"How do you open up with regulars? Tell me about a loud complaint you turned around."}}),
     c4:base("c4","Joseph Mensah","interview",{cv:{0:4,1:4,2:3},call:{0:4,1:4,2:3,3:4,4:5},personality:{consent:true,summary:"High energy with people; watch discipline on paperwork.",qs:"Walk me through your closing checklist."},iv:{u_abuali:{who:"head",tech:[4,4,2],comp:[4,4,3,4,5,3],prac:[4],n:{"tech.0":"Calm, apologised first, offered a fix within 2 minutes","tech.2":"Did not think about calling the next shift early","comp.2":"Blamed the kitchen for a late order","prac.0":"Ran the floor well on the trial shift"},rec:"Hire",strengths:"Guests liked him on the trial shift; strong on complaints.",concerns:"Scheduling under pressure.",pf:"Confirmed",done:true,at:t-1*D},u_jen:{who:"hr",tech:[],comp:[4,3,5,4,5,3],hr:[4,3,5,4],n:{"comp.2":"Gave a clear example, owned the mistake","hr.1":"Hesitated on rule he disagreed with","hr.3":"Closing checklist clear and complete"},rec:"Hire",strengths:"Honest, owns mistakes, available from 1st Dec.",concerns:"Salary expectation at the top of the range.",pf:"Confirmed",done:true,at:t-1*D}}}),
     c5:base("c5","Layla Nasser","approval",{cv:{0:5,1:5,2:5},call:{0:5,1:4,2:4,3:5,4:5},personality:{consent:true,summary:"Calm, structured, warm."},iv:{u_abuali:{tech:[5,4,5],comp:[5,4,5,5,4,4],prac:5,done:true}},refs:[{name:"K. Aziz",co:"Prev. GM",ok:"Verified — positive"},{name:"S. Omar",co:"Area manager",ok:"Verified — positive"}],fin:{total:7800,basic:2340,nego:true,rec:"Strongest candidate; ready in 30 days."},stageAt:t-3*D}),
     c6:base("c6","Tom Riley","rejected",{reject:{reason:"Arabic and English, spoken",at:t-5*D}})}} }
applyLang();
_i18nObs.observe(document.body,{childList:true,subtree:true,characterData:true});
trNode(document.body);

/** For the browser checks and the console: change a top-level value from outside (as the old page allowed). */
export const SETTABLE = ["ASSETS", "CANWRITE", "DB", "DEMO", "DRAFT", "LANG", "ME", "OWNER", "PICK", "RSINCE", "RVER", "RVK", "SAMPLE", "SCH", "SME", "TOKEN", "USER", "_ac", "_acA", "_acP", "_adq", "_kt", "resolving"];
export function __set(name, v) { switch (name) {
  case 'ASSETS': ASSETS = v; break;
  case 'CANWRITE': CANWRITE = v; break;
  case 'DB': DB = v; break;
  case 'DEMO': DEMO = v; break;
  case 'DRAFT': DRAFT = v; break;
  case 'LANG': LANG = v; break;
  case 'ME': ME = v; break;
  case 'OWNER': OWNER = v; break;
  case 'PICK': PICK = v; break;
  case 'RSINCE': RSINCE = v; break;
  case 'RVER': RVER = v; break;
  case 'RVK': RVK = v; break;
  case 'SAMPLE': SAMPLE = v; break;
  case 'SCH': SCH = v; break;
  case 'SME': SME = v; break;
  case 'TOKEN': TOKEN = v; break;
  case 'USER': USER = v; break;
  case '_ac': _ac = v; break;
  case '_acA': _acA = v; break;
  case '_acP': _acP = v; break;
  case '_adq': _adq = v; break;
  case '_kt': _kt = v; break;
  case 'resolving': resolving = v; break;
} }
export function setDRAFT(v) { DRAFT = v; }
export function setSCH(v) { SCH = v; }
