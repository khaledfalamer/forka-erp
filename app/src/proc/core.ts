// @ts-nocheck
/* Forka Procurement - logic: data, sides and access, saving to the Procurement server, Oman, and every action.
   Moved from Forka-Procurment/index.html without changing behaviour. The screens are in ./views (React).
   Types are added step by step; until then this file is not type-checked (see app/README.md). */
import { paint } from '../shared/paint';
import { render } from './views/shell';
import { ivRow } from './views/inv';
import { vSupPage, vSupList } from './views/sup';
import { rqViewFile } from './views/req';
export { render };


export let fkI=0;
export const CFG=window.FORKA_CONFIG||{};
export const SHEET=!!CFG.SHEET_URL;
export let REFRESH=null,ERP='',ERP_SIDES=null;
(function(){try{const m=location.hash.match(/erp=([A-Za-z0-9-]{20,120})/);if(m){sessionStorage.setItem('pp-erp',m[1]);history.replaceState(null,'',location.pathname+location.search)}ERP=sessionStorage.getItem('pp-erp')||''}catch(_){}})();
export let pin='',pinNeeded=false,editMode=false,saving=false,editMsg='',myRole='';
export const EDIT_SEL='[data-f],[data-sf],button[data-act="ok"],button[data-act="rmitem"],button[data-act="invedit"],button[data-act="add"],button[data-act="addsup"],button[data-act="tog"],button[data-act="rate"],button[data-act="ontime"],button[data-act="neweval"],button[data-act="newdeliv"],button[data-act="newgrn"],button[data-act="gset"],button[data-act="gdel"],button[data-act="mdel"],button[data-act="gstatus"],button[data-act="gstock"],[data-gl],[data-media],[data-scan],#gadd,[data-rf],button[data-act="useprice"]';
export const T={
en:{sideOman:'Oman',omPlan:'Purchasing',omOps:'Operations',omFin:'Payments',omHomeH:'Oman restaurant · own items, suppliers, LPOs, receiving and payments · amounts in OMR',landOmPlan:'Oman items, suppliers, LPOs and stock count.',landOmOps:'Receive deliveries (GRN), issue items to the kitchen (issue vouchers) and see stock movements in the Oman store.',landOmFin:'Pay Oman suppliers and check statements. Each bill shows if it is paid from the UAE or Oman.',omBack:'Oman',pFromAll:'Paid from: all',landOman:'Oman restaurant · OMR',omBanner:'Oman store · own items, suppliers, LPOs and GRNs · amounts in OMR',gov:'Governorate',payFrom:'Paid from',payFromUae:'UAE (Finance)',payFromOman:'Oman (local)',lpNew:'New LPO',lpManual:'Manual',gDoc:'GRN paper',gDocT:'Goods Received Note',gDocTAr:'إشعار استلام بضاعة',gDocNo:'GRN no.',gDocDriver:'Driver / supplier signature',gDocRule:'Goods were counted and checked at the door. Rejected goods go back with the driver. Payment only when LPO, GRN and invoice match.',gDocResult:'Result',gOrd:'Ordered',gRecv:'Received',gRej:'Rejected',app:'Procurement Planner',sub:'November 2026 · Al Matbakh Al Kuwaiti + Mayar',fill:'Inventory',sups:'Suppliers',ana:'Analysis',aGrn:'Receiving (GRN)',scanT:'Scan the bill',scanH:'Take a photo of the delivery note or invoice. Claude reads it and fills the invoice no., PO, prices and items. You still count what really arrived.',scanBtn:'Take photo of bill',scanning:'Reading the bill…',scanDone:'Bill read. Check every line, then count what arrived and fill “Qty received”.',scanFail:'Could not read the bill. Try a clearer photo, flat and in good light.',scanNA:'Bill scanning is not switched on in this version yet.',scanDenied:'Claude was not allowed for this page. Reload and press Allow when asked.',scanRate:'Too many scans just now. Wait a minute and try again.',scanImg:'This photo could not be used. Try a JPG or PNG photo.',billSup:'Supplier on the bill (not in our list)',billTotal:'Bill total',pickItem:'Pick our item…',optional:'optional',checkMatch:'Check this match — names differ',onBill:'on bill',grnH:'One GRN per delivery: check the truck, count each item, record rejections with photos, then match PO + GRN + invoice before payment. OTIF is calculated from the GRNs.',newGrn:'New GRN',grnList:'GRNs',noGrn:'No GRNs yet.',gDraft:'Draft',gHold:'On hold',gReady:'Ready for payment',gPaid:'Paid',o_accepted:'Accepted',o_part:'Part-accepted',o_rejected:'Rejected',step1:'1 · Delivery details',step2:'2 · At the door',step3:'3 · Count and check each item',step4:'4 · Photos and videos',step5:'5 · Three-way match (PO + GRN + invoice)',gTime:'Time',gPo:'PO no.',gDn:'Delivery note no.',gInv:'Invoice no.',gOrderedBy:'Ordered by (procurement)',gBy:'Received by (store)',splitWarn:'The person who ordered must not receive. Purchasing buys, the store receives, Finance pays.',gClean:'Truck clean?',yes:'Yes',no:'No',gZone:'Goods type',zChill:'Chilled',zFroz:'Frozen',zDry:'Dry',gTemp:'Temperature',tempRule:'Chilled 5°C or colder · frozen −18°C or colder',tempBad:'Out of range — refuse or quarantine.',gAddItem:'Add item from this supplier',gReason:'Reason',gPrice:'Invoice price',plan:'plan',gExp:'Expiry',gAcc:'Accepted',gNoLines:'Add the items on this delivery.',gValue:'Accepted value',priceVar:'price differences',mediaH:'Take photos of damaged or rejected goods, the truck thermometer and the delivery note. Videos up to 25 MB.',addMedia:'Add photo / video',vidBig:'Video is over 25 MB — record a shorter clip.',gSigned:'Driver signed the rejection?',ck2_po:'PO number entered',ck2_inv:'Invoice number entered',ck2_lines:'Every line has ordered and received quantities',monthPlan:'month plan',ck2_price:'Invoice prices match the plan (or difference approved)',ck2_photos:'Photos attached for rejected goods',ck2_signed:'Driver signed for rejected goods',ck2_split:'Received by a different person than ordered',varOk:'Price difference approved by procurement?',markRecv:'Mark as received',addStock:'Add accepted qty to stock',stockAdded:'Stock updated',stockUpd:'items updated',markPaid:'Mark as paid',reopen:'Reopen',ruleGolden:'Rule: Purchasing buys, the store receives, Finance pays. Pay only when PO, GRN and invoice match.',aStock:'Stock (ABC)',aSup:'Supplier spend',aScore:'Supplier scorecards',aOtif:'Deliveries (OTIF)',useVal:'Monthly use value',onHand:'Stock on hand',onHandH:'stock now × unit price',excess:'Excess stock',excessH:'stock above use + reserve',abcTitle:'ABC analysis — where the money is',shareItems:'share of items',shareValue:'share of monthly value',ofItems:'of items',ofValue:'of value',polA:'Count weekly. Keep the reserve tight. Get two quotes before each order. Watch price changes.',polB:'Count every two weeks. Normal reserve. Review prices each quarter.',polC:'Count monthly. Buy in bulk, fewer orders. Don’t spend time chasing small savings.',abcNote:'A = items that make up the first 80% of monthly use value, B = the next 15%, C = the last 5%. Value = use per month × unit price.',monthVal:'Month value',cumShare:'Cumulative',cover:'Cover',activeSups:'Active suppliers',sups80:'suppliers make 80% of spend',top5:'Top 5 suppliers',ofBudget:'of the budget',payMix:'Payment mix',supSpend:'Spend by supplier',supSpendH:'Planned spend this month, with the latest scorecard and delivery (OTIF) results.',share:'Share',aItems:'A items',score:'Score',scoreH:'Rate each supplier 1–5 on six areas. The weighted score decides the band.',newEval:'New evaluation',c_quality:'Quality',c_price:'Price',c_delivery:'Delivery & reliability',c_service:'Service & support',c_capacity:'Capacity',c_compliance:'Compliance & risk',q_quality:'Fresh, to spec, no damage, consistent',q_price:'Competitive, stable, no surprise charges',q_delivery:'Right quantity, on time, as agreed',q_service:'Answers fast, fixes problems, credit notes',q_capacity:'Can handle our volume and urgent orders',q_compliance:'Licences, food safety, halal, invoices with VAT',bPref:'Preferred',bAppr:'Approved',bWatch:'Watch',bRepl:'Replace',noScore:'Not rated',ranking:'Ranking',evals:'evaluations',avg:'average',history:'History',noEvals:'No evaluations yet.',evDate:'Date',evBy:'Evaluated by',evCat:'What was evaluated',evCatPh:'e.g. chicken, rice',rateEach:'Rate each area (1–5)',scale:'1 = poor · 2 = fair · 3 = good · 4 = very good · 5 = excellent',comment:'Comment',otifH:'Log each delivery: ordered, received, rejected for quality, on time. OTIF = quantity % × quality % × on-time %.',newDeliv:'Log delivery',qtyPct:'Quantity %',qualPct:'Quality %',timePct:'On time %',otifPct:'OTIF',good:'Good',watch:'Watch',poor:'Poor',dels:'Deliveries',noDels:'No deliveries logged yet.',rejW:'rejected',onTime:'On time',late:'Late',qOrd:'Qty ordered',qRecv:'Qty received',qRej:'Qty rejected (quality)',onTimeQ:'Arrived on time?',invNo:'Invoice / DN no.',sum:'Summary',addSup:'Add supplier',supSearch:'Search supplier…',contact:'Contact person',phone:'Phone',email:'Email',terms:'Payment terms',cash:'Cash',days:'Credit days',deliv:'Delivery days',delivPh:'e.g. Sun, Tue, Thu',lead:'Lead time (days)',trn:'TRN (VAT no.)',area:'Area / address',supplies:'What they supply',notes:'Notes',items:'Items',monthly:'Month AED',newSup:'New supplier name',supMissing:'suppliers missing details',fromLines:'typed in a line — add details',m_phone:'phone',m_terms:'terms',m_days:'credit days',snotes:'Notes',supHint:'',supHint2:'Click a supplier to open its page and add details. Renaming a supplier also renames it on all its items.',allSups:'All suppliers',complete:'Complete',perMonth:'this month',lastBy:'last edited by',dayW:'days',secContact:'Contact',secAddress:'Address',secTerms:'Payment & delivery',secBank:'Bank details',supName:'Supplier name',phone2:'Phone 2',emirate:'Emirate',address:'Address',addressPh:'Area, street, building',map:'Google Maps link',openMap:'Open map',minOrder:'Minimum order (AED)',licence:'Trade licence no.',bankName:'Bank',accName:'Account name',iban:'IBAN',accNo:'Account no.',swift:'SWIFT',bankNote:'Needed to pay credit suppliers by transfer. Check it against the supplier’s letter or invoice.',pickCat:'Choose at least one category.',itemsFrom:'Items from this supplier',unitPrice:'Unit price',siToBuy:'To buy this month:',siNothing:'Nothing to buy this month',siExplain:'Right side: what this month\'s order from this supplier costs (to buy × unit price), and how much to buy.',ivPhoto:'Photo',ivNoPhoto:'No photo yet',ivAddPhoto:'Add photo',ivChangePhoto:'Change photo',ivRemovePhoto:'Remove photo',ivRemovePhotoQ:'Remove this photo from the item?',ivPhotoEdit:'Press Edit to add or change the photo.',ivPhotoUp:'Uploading photo…',openItems:'Open in Fill in',s_name:'name',s_phone:'phone',s_emirate:'emirate',s_terms:'terms',s_days:'credit days',s_cats:'categories',s_iban:'IBAN',how:'How it works',
 name:'Your name',namePh:'Type your name to start',needName:'Type your name first, so we know who filled each line.',
 live:'Saved for the whole team — every change is shared live.',local:'You can’t save to the shared list from this link. Your changes stay in this browser — when you finish, press “Send my updates” and send it to procurement.',
 loading:'Connecting to the shared list…',updating:'Updating…',offline:'The shared list can’t be reached right now. Changes stay in this browser for now.',
 send:'Send my updates',edit:'Edit',viewOnly:'View only. To make changes, type your name and the team PIN, then press Edit.',editingAs:'Editing as',unsaved:'unsaved changes',noChanges:'no changes yet',pendingHint:'press Edit to save or cancel them',save:'Save changes',saving:'Saving…',saved:'Saved to the Sheet',cancel:'Cancel changes',doneEdit:'Sign out',home:'Overview',tUnit:'Unit',ovSub:'Choose where to work. Counts update as the team saves.',dFill:'Prices, units, packing, reserve and stock for every line of the month plan.',dSups:'Contact, payment terms, delivery days and bank details per supplier.',dAna:'ABC classes, spend by supplier, scorecards and delivery performance.',dSum:'Budget by supplier, concept and payment method.',dGrn:'Check each delivery, record rejections and match it to the invoice before payment.',dReq:'Branches ask for stock; the store approves, issues a transfer note at cost, the branch confirms.',dMoves:'Everything in from suppliers and out to branches, by month.',dHow:'Short guide for the team.',photos:'photos',ph_video:'Video',ph_photo:'Photo',mvInL:'In',mvOutL:'Out',hSupMissing:'suppliers missing details',hOrder:'to reorder',cancelS:'Cancel',saveS:'Save',hBudget:'budget',branch:'Branch',req:'Branch requests',moves:'Stock movements',sidePlan:'Purchasing',sideOps:'Operations',sidePlanH:'The monthly purchase plan, stock levels, suppliers and analysis.',sideOpsH:'What moves in and out of the store: receiving from suppliers, branch requests and transfer bills.',hMissing:'lines missing details',hBelow:'items below reserve',hToApprove:'requests to approve',hToIssue:'approved, to issue',hToConfirm:'issued, waiting for branch',hGrnOpen:'GRNs waiting',reqH:'A branch asks for items, the store approves and issues them with a transfer bill at cost price, then the branch confirms what arrived.',tNew:'New request',tsDraft:'Draft',tsRequested:'Requested',tsApproved:'Approved',tsRejected:'Rejected',tsIssued:'Issued',tsReceived:'Received',tsF_requested:'Branch requests',tsF_approved:'Store approves',tsF_issued:'Store issues + bill',tsF_received:'Branch confirms',allBranches:'All branches',tNeed:'Needed by',tShort:'short',tNone:'No requests yet.',tNeedBranch:'Choose the branch first.',tNeedQty:'Add items and a quantity on every line.',tNeedIss:'Enter the quantity to issue.',tSend:'Send request',tApprove:'Approve',tReject:'Reject',tIssue:'Issue + make bill',tConfirm:'Confirm received',tBill:'Transfer bill',tFrom:'Ajman Central Store',tFromOm:'Oman store',tReqBy:'Requested by',tNotePh:'e.g. for the weekend, event on Friday',tLines:'Items',tAddItem:'Add item — type to search',tInStore:'In store',tReqQ:'Requested',tIssQ:'Issued',tRcvQ:'Received',tCost:'Unit cost',tValue:'Value',tNoLines:'Add the items the branch needs.',tOver:'Some lines ask for more than the store has. Check the shelf before issuing.',tApprBy:'Approved by',tIssBy:'Issued by',tRcvBy:'Received by',tRule:'Rule: the branch requests, the store issues, the branch confirms. Stock goes down when the store issues.',tPrint:'Print',shBtn:'Share',shPrep:'Preparing the PDF…',shSaved:'PDF saved to your downloads',shFail:'Could not make the PDF. Use Print, then Save as PDF.',tBillT:'Transfer note',tIssued:'Issued',tTo:'To',tTotal:'Total at cost',tBillNote:'Internal transfer at cost price (unit price in the Procurement Planner on the issue date). Not a tax invoice. This value goes to the branch food cost.',movesH:'Everything that came into the store (accepted on GRNs) and went out to branches (issued on transfer bills).',mvIn:'In from suppliers',mvOut:'Out to branches',mvAtCost:'issued at cost',mvRef:'Reference',mvFromTo:'From / to',mvQty:'Qty',mvNone:'No movements this month.',r_branch:'Branch',signIn:'Sign in',yourPin:'Your PIN',loginT:'Sign in to the Procurement Planner',loginH:'Type your personal PIN. The CEO gives each person their own PIN and role.',signedAs:'Signed in as',saveFirst:'Save or cancel your changes before signing out.',r_admin:'Admin',r_buyer:'Procurement',r_store:'Store',r_finance:'Finance',r_viewer:'View only',r_team:'Team PIN',roleOnly:'View only — your role can’t change anything.',errRole:'Your role can’t make this change. Nothing was saved.',errSplit:'The person who ordered can’t receive, and the person who received can’t pay. Nothing was saved.',errNotready:'This GRN isn’t ready for payment — the three-way match is not complete.',errPaid:'This GRN is already paid. Only the CEO can reopen it.',errLocked:'Too many wrong PINs. Logins are locked for 10 minutes.',bankHidden:'Bank details are shown to Finance and the CEO only.',needPin:'Type the team PIN.',checking:'Checking PIN…',wrongPin:'Wrong PIN.',noPinSet:'The PIN is not set on the Sheet yet — ask the CEO.',oldScript:'The Sheet script needs updating before anyone can edit.',net:'Can’t reach the Sheet — check the internet and try again.',pin:'Team PIN',badPin:'Wrong team PIN — saved in this browser only',budget:'Budget',pemo:'Pemo card',credit:'Credit suppliers',nopay:'Payment not set',
 missing:'Missing',toconfirm:'To confirm',confirmed:'Confirmed',notneeded:'Not needed',all:'All',
 progress:'Progress',of:'of',lines:'lines',
 search:'Search item or supplier…',concept:'Concept',supplier:'Supplier',payment:'Payment',category:'Category',
 item:'Item',use:'Use / month',par:'Reserve (min)',stock:'Stock now',rop:'Reorder point',auto:'auto',daysLeft:'days left',sOk:'Stock OK',sOrder:'Order now',sBelow:'Below reserve',stockF:'Stock',ropNote:'Reorder point = Reserve + daily use × supplier lead time (2 days if not set). Calculated automatically.',price:'Unit price',unit:'Price per',pack:'Each one contains',per:'per',buy:'To buy',bud:'Budget AED',status:'Status',
 confirm:'Confirm',done:'Confirmed',undo:'Undo',add:'Add item',newItem:'New item name',food:'Food',nonfood:'Non-food',
 storeRef:'Store',use_:'use',pemoW:'Pemo',creditW:'Credit',choose:'Choose…',
 m_price:'price',m_unit:'unit',m_pack:'packing',m_sup:'supplier',m_pay:'payment',m_use:'monthly use',m_par:'reserve',m_name:'name',
 needs:'Needs',erpT:'Sign in through Forka Apps',erpH:'Procurement now opens from Forka Apps. Sign in there with your company email, then choose Procurement.',erpGo:'Go to Forka Apps',erpExpired:'Your sign-in has ended. Please sign in again at Forka Apps.',erpNone:'You do not have access to Procurement yet. Ask the CEO in Forka Apps.',bySup:'By supplier',smT:'How this item is supplied',smStore:'Store stock',smDirect:'Daily to branches',smDirectS:'Not stored - supplier delivers to branches',smCycle:'Bought every few days',smCycleB:'Bought every {n} days',smDays:'days',perOrder:'about {q} {u} per order',stVal:'Stock value now',stValH:'Counted stock x unit price',stNoPrice:'counted items have no price',stNotCounted:'items not counted yet',topStock:'Highest value in stock',byType:'By type',hStock:'in stock',byCon:'By concept',copyCsv:'Copy all (CSV)',topup:'Pemo top-up for the month',
 importT:'Import updates (owner)',omReq:'Issue vouchers',omReqH:'Issue items from the Oman store to the restaurant kitchen. Issued quantities come off the store stock.',allSaved:'All saved',rqSendQ:'Send "{t}" to Purchasing?',rqSendYes:'Yes, send',rqNotSent:'Not sent yet: no connection. It will be sent automatically when the connection is back.',saveQ:'Save {n} changes to the inventory?',saveYes:'Yes, save',keepEdit:'Keep editing',leaveQ:'You have unsaved inventory changes. Save them before leaving?',stay:'Stay here',sentOld:'{n} earlier changes had not been sent. They are sent now.',sentOld1:'1 earlier change had not been sent. It is sent now.',editInv:'Edit',baseMissing:'The item list did not load. The Procurement server needs its new version: please tell the CEO.',editInvH:'Press Edit to change items, stock counts or prices, then Save.',rmItem:'Remove item',rmQ:'Remove "{n}" from the inventory? It will no longer be counted or ordered.',rmYes:'Yes, remove',rmNo:'Keep it',rmDone:'Removed. Press Save to confirm, or Cancel to bring it back.',rmGone:'Removed.',dropQ:'Drop your unsaved changes?',dropYes:'Yes, drop them',impOman:'This file is for the Oman store. Open Oman > Purchasing > Summary, then import.',impUae:'This file is for the UAE side. Leave Oman first.',impDone:'Added and saved {n} items and {s} suppliers.',importH:'Paste an update a team member sent you, then press Import. It saves to the shared list.',imp:'Import',imported:'Imported',
 copied:'Copied',saveErr:'Could not save — kept in this browser',
 how1:'Every line starts from the October budget. Check it for November.',
 how2:'Red boxes are missing — fill them in (price, the unit the price is for, how it’s packed, supplier, payment, monthly use, PAR).',
 how3:'Update “Stock now” with today’s count. The app works out: To buy = Use + Reserve − Stock. The reorder point is automatic: Reserve + daily use × the supplier’s lead time. When stock reaches it, the line shows “Order now”.',
 how4:'When a line is right, press Confirm. If an item isn’t needed this month, set Use to 0 and confirm.',
 how5:'“Store” hints show the warehouse team’s November figure for the same item, for comparison.',
 notes:'Budget = To buy × Unit price. Amounts in AED.',basis:'Starting data: October 2026 budget'},
ar:{sideOman:'عُمان',omPlan:'المشتريات',omOps:'العمليات',omFin:'المدفوعات',omHomeH:'مطعم عُمان · أصناف وموردون وأوامر شراء واستلام ومدفوعات خاصة به · المبالغ بالريال العُماني',landOmPlan:'أصناف عُمان وموردوها وأوامر الشراء وجرد المخزون.',landOmOps:'استلام التوريدات (إشعار الاستلام)، وإذن الصرف إلى المطبخ، وحركة المخزون في مخزن عُمان.',landOmFin:'سداد موردي عُمان وكشوف الحساب. كل فاتورة توضّح هل تُدفع من الإمارات أو من عُمان.',omBack:'عُمان',pFromAll:'جهة الدفع: الكل',landOman:'مطعم عُمان · بالريال العُماني',omBanner:'مخزن عُمان · أصناف وموردون وأوامر شراء واستلام خاصة · المبالغ بالريال العُماني',gov:'المحافظة',payFrom:'يُدفع من',payFromUae:'الإمارات (المالية)',payFromOman:'عُمان (محلياً)',lpNew:'أمر شراء جديد',lpManual:'يدوي',gDoc:'ورقة الاستلام',gDocT:'Goods Received Note',gDocTAr:'إشعار استلام بضاعة',gDocNo:'رقم الاستلام',gDocDriver:'توقيع السائق / المورد',gDocRule:'تم عدّ البضاعة وفحصها عند الاستلام. البضاعة المرفوضة تعود مع السائق. الدفع فقط عند تطابق أمر الشراء والاستلام والفاتورة.',gDocResult:'النتيجة',gOrd:'المطلوب',gRecv:'المستلم',gRej:'المرفوض',app:'مخطط المشتريات',sub:'نوفمبر 2026 · المطبخ الكويتي + ميار',fill:'المخزون',sups:'الموردون',ana:'التحليل',aGrn:'الاستلام (GRN)',scanT:'امسح الفاتورة',scanH:'صوّر مذكرة التسليم أو الفاتورة. Claude يقرأها ويعبّئ رقم الفاتورة وأمر الشراء والأسعار والأصناف. وتبقى أنت تعدّ اللي وصل فعلاً.',scanBtn:'صوّر الفاتورة',scanning:'جاري قراءة الفاتورة…',scanDone:'تمت قراءة الفاتورة. راجع كل سطر، ثم عدّ اللي وصل وعبّئ «الكمية المستلمة».',scanFail:'تعذّرت قراءة الفاتورة. جرّب صورة أوضح، مستوية وبإضاءة جيدة.',scanNA:'مسح الفواتير غير مفعّل في هذه النسخة بعد.',scanDenied:'لم يُسمح لـ Claude في هذه الصفحة. حدّث الصفحة واضغط سماح عند الطلب.',scanRate:'محاولات كثيرة الآن. انتظر دقيقة وحاول مرة أخرى.',scanImg:'لا يمكن استخدام هذه الصورة. جرّب صورة JPG أو PNG.',billSup:'المورد في الفاتورة (غير موجود في قائمتنا)',billTotal:'إجمالي الفاتورة',pickItem:'اختر الصنف عندنا…',optional:'اختياري',checkMatch:'تأكد من هذا الربط — الأسماء مختلفة',onBill:'في الفاتورة',grnH:'إذن استلام لكل توريد: افحص الشاحنة، عدّ كل صنف، سجّل المرفوض مع الصور، ثم طابق أمر الشراء + الاستلام + الفاتورة قبل الدفع. الـ OTIF يُحسب من أذونات الاستلام.',newGrn:'إذن استلام جديد',grnList:'أذونات الاستلام',noGrn:'لا توجد أذونات استلام بعد.',gDraft:'مسودة',gHold:'معلّق',gReady:'جاهز للدفع',gPaid:'مدفوع',o_accepted:'مقبول',o_part:'مقبول جزئياً',o_rejected:'مرفوض',step1:'1 · بيانات التوريد',step2:'2 · عند الباب',step3:'3 · عدّ وافحص كل صنف',step4:'4 · صور وفيديو',step5:'5 · المطابقة الثلاثية (أمر شراء + استلام + فاتورة)',gTime:'الوقت',gPo:'رقم أمر الشراء',gDn:'رقم مذكرة التسليم',gInv:'رقم الفاتورة',gOrderedBy:'طلبه (المشتريات)',gBy:'استلمه (المستودع)',splitWarn:'من يطلب لا يستلم. المشتريات تشتري، المستودع يستلم، المالية تدفع.',gClean:'الشاحنة نظيفة؟',yes:'نعم',no:'لا',gZone:'نوع البضاعة',zChill:'مبرّد',zFroz:'مجمّد',zDry:'جاف',gTemp:'الحرارة',tempRule:'المبرّد 5° أو أقل · المجمّد −18° أو أقل',tempBad:'خارج الحد — ارفض أو اعزل.',gAddItem:'أضف صنف من هذا المورد',gReason:'السبب',gPrice:'سعر الفاتورة',plan:'الخطة',gExp:'الانتهاء',gAcc:'المقبول',gNoLines:'أضف الأصناف الموجودة في هذا التوريد.',gValue:'قيمة المقبول',priceVar:'فروقات سعر',mediaH:'صوّر البضاعة التالفة أو المرفوضة، وحرارة الشاحنة، ومذكرة التسليم. الفيديو حتى 25 ميجا.',addMedia:'أضف صورة / فيديو',vidBig:'الفيديو أكبر من 25 ميجا — صوّر مقطعاً أقصر.',gSigned:'السائق وقّع على المرفوض؟',ck2_po:'رقم أمر الشراء مُدخل',ck2_inv:'رقم الفاتورة مُدخل',ck2_lines:'كل سطر له كمية مطلوبة ومستلمة',monthPlan:'خطة الشهر',ck2_price:'أسعار الفاتورة تطابق الخطة (أو الفرق معتمد)',ck2_photos:'صور مرفقة للبضاعة المرفوضة',ck2_signed:'السائق وقّع على المرفوض',ck2_split:'المستلم شخص غير الذي طلب',varOk:'فرق السعر معتمد من المشتريات؟',markRecv:'تأكيد الاستلام',addStock:'أضف الكمية المقبولة للمخزون',stockAdded:'تم تحديث المخزون',stockUpd:'أصناف تحدّثت',markPaid:'تأكيد الدفع',reopen:'إعادة فتح',ruleGolden:'القاعدة: المشتريات تشتري، المستودع يستلم، المالية تدفع. لا دفع إلا إذا تطابق أمر الشراء والاستلام والفاتورة.',aStock:'المخزون (ABC)',aSup:'الصرف حسب المورد',aScore:'تقييم الموردين',aOtif:'التوريدات (OTIF)',useVal:'قيمة الاستهلاك الشهري',onHand:'قيمة المخزون الحالي',onHandH:'المخزون الآن × السعر',excess:'مخزون زائد',excessH:'فوق الاستهلاك + الاحتياطي',abcTitle:'تحليل ABC — وين الفلوس',shareItems:'نسبة الأصناف',shareValue:'نسبة القيمة الشهرية',ofItems:'من الأصناف',ofValue:'من القيمة',polA:'جرد أسبوعي. احتياطي محكم. عرضا سعر قبل كل طلب. راقب تغيّر الأسعار.',polB:'جرد كل أسبوعين. احتياطي عادي. مراجعة الأسعار كل ربع سنة.',polC:'جرد شهري. اشترِ بكميات وقلّل الطلبات. لا تضيّع وقت على توفير صغير.',abcNote:'A = الأصناف التي تشكّل أول 80% من قيمة الاستهلاك الشهري، B = الـ 15% التالية، C = آخر 5%. القيمة = الاستهلاك الشهري × السعر.',monthVal:'قيمة الشهر',cumShare:'التراكمي',cover:'يكفي',activeSups:'موردون نشطون',sups80:'موردين يشكّلون 80% من الصرف',top5:'أكبر 5 موردين',ofBudget:'من الميزانية',payMix:'طريقة الدفع',supSpend:'الصرف حسب المورد',supSpendH:'الصرف المخطط هذا الشهر مع آخر تقييم ونتيجة التوريد (OTIF).',share:'النسبة',aItems:'أصناف A',score:'التقييم',scoreH:'قيّم كل مورد من 1 إلى 5 في ست مجالات. الدرجة الموزونة تحدد التصنيف.',newEval:'تقييم جديد',c_quality:'الجودة',c_price:'السعر',c_delivery:'التوريد والالتزام',c_service:'الخدمة والدعم',c_capacity:'القدرة',c_compliance:'الامتثال والمخاطر',q_quality:'طازج، مطابق للمواصفات، بدون تلف، ثابت',q_price:'منافس، ثابت، بدون رسوم مفاجئة',q_delivery:'الكمية الصحيحة، في الوقت، حسب الاتفاق',q_service:'يرد بسرعة، يحل المشاكل، إشعارات دائنة',q_capacity:'يقدر على كمياتنا والطلبات المستعجلة',q_compliance:'الرخص، سلامة الغذاء، حلال، فواتير بالضريبة',bPref:'مفضّل',bAppr:'معتمد',bWatch:'تحت المراقبة',bRepl:'يُستبدل',noScore:'غير مقيّم',ranking:'الترتيب',evals:'تقييمات',avg:'المتوسط',history:'السجل',noEvals:'لا توجد تقييمات بعد.',evDate:'التاريخ',evBy:'المقيّم',evCat:'ماذا قُيّم',evCatPh:'مثال: دجاج، رز',rateEach:'قيّم كل مجال (1–5)',scale:'1 = ضعيف · 2 = مقبول · 3 = جيد · 4 = جيد جداً · 5 = ممتاز',comment:'ملاحظة',otifH:'سجّل كل توريد: المطلوب، المستلم، المرفوض للجودة، وهل وصل في الوقت. OTIF = نسبة الكمية × نسبة الجودة × نسبة الالتزام بالوقت.',newDeliv:'تسجيل توريد',qtyPct:'نسبة الكمية',qualPct:'نسبة الجودة',timePct:'نسبة الالتزام بالوقت',otifPct:'OTIF',good:'جيد',watch:'مراقبة',poor:'ضعيف',dels:'التوريدات',noDels:'لا توجد توريدات مسجلة بعد.',rejW:'مرفوض',onTime:'في الوقت',late:'متأخر',qOrd:'الكمية المطلوبة',qRecv:'الكمية المستلمة',qRej:'الكمية المرفوضة (جودة)',onTimeQ:'وصل في الوقت؟',invNo:'رقم الفاتورة / الاستلام',sum:'الملخص',addSup:'إضافة مورد',supSearch:'ابحث عن مورد…',contact:'الشخص المسؤول',phone:'الهاتف',email:'البريد',terms:'شروط الدفع',cash:'نقداً',days:'أيام الآجل',deliv:'أيام التوريد',delivPh:'مثال: الأحد، الثلاثاء، الخميس',lead:'مدة التوريد (أيام)',trn:'الرقم الضريبي',area:'المنطقة / العنوان',supplies:'ماذا يورّد',notes:'ملاحظات',items:'الأصناف',monthly:'الشهر درهم',newSup:'اسم المورد الجديد',supMissing:'موردون تنقصهم بيانات',fromLines:'مكتوب في سطر — أضف بياناته',m_phone:'الهاتف',m_terms:'شروط الدفع',m_days:'أيام الآجل',snotes:'ملاحظات',supHint:'',supHint2:'اضغط على المورد لفتح صفحته وإضافة بياناته. تغيير اسم المورد يغيّره في كل أصنافه.',allSups:'كل الموردين',complete:'مكتمل',perMonth:'هذا الشهر',lastBy:'آخر تعديل',dayW:'يوم',secContact:'التواصل',secAddress:'العنوان',secTerms:'الدفع والتوريد',secBank:'البيانات البنكية',supName:'اسم المورد',phone2:'هاتف 2',emirate:'الإمارة',address:'العنوان',addressPh:'المنطقة، الشارع، المبنى',map:'رابط خرائط Google',openMap:'افتح الخريطة',minOrder:'الحد الأدنى للطلب (درهم)',licence:'رقم الرخصة التجارية',bankName:'البنك',accName:'اسم الحساب',iban:'الآيبان',accNo:'رقم الحساب',swift:'سويفت',bankNote:'مطلوبة للدفع للموردين بالآجل بالتحويل. طابقها مع خطاب المورد أو فاتورته.',pickCat:'اختر فئة واحدة على الأقل.',itemsFrom:'أصناف هذا المورد',unitPrice:'سعر الوحدة',siToBuy:'للشراء هذا الشهر:',siNothing:'لا شيء للشراء هذا الشهر',siExplain:'على اليسار: تكلفة طلب هذا الشهر من هذا المورد (الكمية × سعر الوحدة)، والكمية المطلوبة.',ivPhoto:'الصورة',ivNoPhoto:'لا توجد صورة بعد',ivAddPhoto:'إضافة صورة',ivChangePhoto:'تغيير الصورة',ivRemovePhoto:'حذف الصورة',ivRemovePhotoQ:'حذف هذه الصورة من الصنف؟',ivPhotoEdit:'اضغط تعديل لإضافة الصورة أو تغييرها.',ivPhotoUp:'جارٍ رفع الصورة…',openItems:'افتح في التعبئة',s_name:'الاسم',s_phone:'الهاتف',s_emirate:'الإمارة',s_terms:'شروط الدفع',s_days:'أيام الآجل',s_cats:'الفئات',s_iban:'الآيبان',how:'طريقة العمل',
 name:'اسمك',namePh:'اكتب اسمك للبدء',needName:'اكتب اسمك أولاً حتى نعرف من عبّأ كل سطر.',
 live:'محفوظ للفريق كله — كل تعديل يظهر للجميع مباشرة.',local:'لا يمكنك الحفظ في القائمة المشتركة من هذا الرابط. تعديلاتك تبقى في هذا المتصفح — عند الانتهاء اضغط «إرسال تحديثاتي» وأرسلها لقسم المشتريات.',
 loading:'جاري الاتصال بالقائمة المشتركة…',updating:'جاري التحديث…',offline:'لا يمكن الوصول للقائمة المشتركة الآن. التعديلات محفوظة في هذا المتصفح مؤقتاً.',
 send:'إرسال تحديثاتي',edit:'تعديل',viewOnly:'للعرض فقط. للتعديل اكتب اسمك ورمز الفريق ثم اضغط تعديل.',editingAs:'تعديل باسم',unsaved:'تعديلات غير محفوظة',noChanges:'لا توجد تعديلات بعد',pendingHint:'اضغط تعديل لحفظها أو إلغائها',save:'حفظ التعديلات',saving:'جاري الحفظ…',saved:'تم الحفظ في الشيت',cancel:'إلغاء التعديلات',doneEdit:'تسجيل الخروج',home:'نظرة عامة',tUnit:'الوحدة',ovSub:'اختر مكان العمل. الأرقام تتحدث مع حفظ الفريق.',dFill:'الأسعار والوحدات والتعبئة والاحتياطي والمخزون لكل سطر في خطة الشهر.',dSups:'التواصل وشروط الدفع وأيام التوريد والبيانات البنكية لكل مورد.',dAna:'فئات ABC، الإنفاق حسب المورد، بطاقات التقييم وأداء التوريد.',dSum:'الميزانية حسب المورد والمفهوم وطريقة الدفع.',dGrn:'فحص كل تسليم، تسجيل المرفوض ومطابقته مع الفاتورة قبل الدفع.',dReq:'الفروع تطلب المخزون؛ المخزن يوافق ويصرف بإذن صرف بالتكلفة، والفرع يؤكد.',dMoves:'كل ما دخل من الموردين وخرج للفروع، حسب الشهر.',dHow:'دليل مختصر للفريق.',photos:'صور',ph_video:'فيديو',ph_photo:'صورة',mvInL:'داخل',mvOutL:'خارج',hSupMissing:'مورد ناقص البيانات',hOrder:'للطلب',cancelS:'إلغاء',saveS:'حفظ',hBudget:'الميزانية',branch:'الفرع',req:'طلبات الفروع',moves:'حركة المخزون',sidePlan:'المشتريات',sideOps:'العمليات',sidePlanH:'خطة المشتريات الشهرية، مستويات المخزون، الموردون والتحليل.',sideOpsH:'كل ما يدخل ويخرج من المخزن: الاستلام من الموردين، طلبات الفروع وفواتير التحويل.',hMissing:'سطر ناقص البيانات',hBelow:'صنف تحت الاحتياطي',hToApprove:'طلب بانتظار الموافقة',hToIssue:'موافق عليه، بانتظار الصرف',hToConfirm:'مصروف، بانتظار الفرع',hGrnOpen:'استلام معلّق',reqH:'الفرع يطلب الأصناف، المخزن يوافق ويصرفها بفاتورة تحويل بسعر التكلفة، ثم الفرع يؤكد اللي وصل.',tNew:'طلب جديد',tsDraft:'مسودة',tsRequested:'مطلوب',tsApproved:'موافق عليه',tsRejected:'مرفوض',tsIssued:'مصروف',tsReceived:'مستلم',tsF_requested:'الفرع يطلب',tsF_approved:'المخزن يوافق',tsF_issued:'المخزن يصرف + فاتورة',tsF_received:'الفرع يؤكد',allBranches:'كل الفروع',tNeed:'مطلوب قبل',tShort:'ناقص',tNone:'لا توجد طلبات بعد.',tNeedBranch:'اختر الفرع أولاً.',tNeedQty:'أضف الأصناف والكمية في كل سطر.',tNeedIss:'اكتب الكمية المصروفة.',tSend:'إرسال الطلب',tApprove:'موافقة',tReject:'رفض',tIssue:'صرف + فاتورة',tConfirm:'تأكيد الاستلام',tBill:'فاتورة التحويل',tFrom:'المخزن المركزي — عجمان',tFromOm:'مخزن عُمان',tReqBy:'طلبه',tNotePh:'مثلاً: لنهاية الأسبوع، فعالية يوم الجمعة',tLines:'الأصناف',tAddItem:'أضف صنف — اكتب للبحث',tInStore:'في المخزن',tReqQ:'المطلوب',tIssQ:'المصروف',tRcvQ:'المستلم',tCost:'تكلفة الوحدة',tValue:'القيمة',tNoLines:'أضف الأصناف اللي يحتاجها الفرع.',tOver:'بعض الأسطر أكثر من الموجود في المخزن. تأكد من الرف قبل الصرف.',tApprBy:'وافق',tIssBy:'صرفه',tRcvBy:'استلمه',tRule:'القاعدة: الفرع يطلب، المخزن يصرف، الفرع يؤكد. المخزون ينقص عند الصرف.',tPrint:'طباعة',shBtn:'مشاركة',shPrep:'جارٍ تجهيز ملف PDF…',shSaved:'تم حفظ ملف PDF في التنزيلات',shFail:'تعذّر تجهيز ملف PDF. استخدم الطباعة ثم الحفظ كـ PDF.',tBillT:'إذن صرف مخزني',tIssued:'تاريخ الصرف',tTo:'إلى',tTotal:'الإجمالي بالتكلفة',tBillNote:'تحويل داخلي بسعر التكلفة (سعر الوحدة في مخطط المشتريات يوم الصرف). ليست فاتورة ضريبية. هذه القيمة تدخل في تكلفة طعام الفرع.',movesH:'كل ما دخل المخزن (المقبول في الاستلام) وما خرج للفروع (المصروف بفواتير التحويل).',mvIn:'داخل من الموردين',mvOut:'خارج للفروع',mvAtCost:'مصروف بالتكلفة',mvRef:'المرجع',mvFromTo:'من / إلى',mvQty:'الكمية',mvNone:'لا توجد حركة هذا الشهر.',r_branch:'فرع',signIn:'دخول',yourPin:'رمزك الشخصي',loginT:'الدخول إلى مخطط المشتريات',loginH:'اكتب رمزك الشخصي. الرئيس التنفيذي يعطي كل شخص رمزه ودوره.',signedAs:'داخل باسم',saveFirst:'احفظ تعديلاتك أو ألغها قبل الخروج.',r_admin:'مدير',r_buyer:'المشتريات',r_store:'المخزن',r_finance:'المالية',r_viewer:'عرض فقط',r_team:'رمز الفريق',roleOnly:'عرض فقط — دورك لا يسمح بأي تعديل.',errRole:'دورك لا يسمح بهذا التعديل. لم يُحفظ شيء.',errSplit:'من طلب البضاعة لا يستلمها، ومن استلمها لا يدفع. لم يُحفظ شيء.',errNotready:'هذا الاستلام غير جاهز للدفع — المطابقة الثلاثية غير مكتملة.',errPaid:'هذا الاستلام مدفوع. الرئيس التنفيذي فقط يقدر يعيد فتحه.',errLocked:'رموز خاطئة كثيرة. الدخول مقفل 10 دقائق.',bankHidden:'البيانات البنكية تظهر للمالية والرئيس التنفيذي فقط.',needPin:'اكتب رمز الفريق.',checking:'جاري التحقق من الرمز…',wrongPin:'الرمز غير صحيح.',noPinSet:'الرمز غير مضبوط في الشيت بعد — راجع الرئيس التنفيذي.',oldScript:'سكربت الشيت يحتاج تحديث قبل أن يستطيع أحد التعديل.',net:'لا يمكن الوصول للشيت — تأكد من الإنترنت وحاول مرة أخرى.',pin:'رمز الفريق',badPin:'رمز الفريق غير صحيح — حُفظ في هذا المتصفح فقط',budget:'الميزانية',pemo:'بطاقة Pemo',credit:'موردون بالآجل',nopay:'طريقة الدفع غير محددة',
 missing:'ناقص',toconfirm:'بانتظار التأكيد',confirmed:'مؤكد',notneeded:'غير مطلوب',all:'الكل',
 progress:'التقدم',of:'من',lines:'سطر',
 search:'ابحث عن صنف أو مورد…',concept:'المفهوم',supplier:'المورد',payment:'الدفع',category:'الفئة',
 item:'الصنف',use:'الاستهلاك / شهر',par:'الاحتياطي (حد أدنى)',stock:'المخزون الآن',rop:'نقطة الطلب',auto:'تلقائي',daysLeft:'يوم متبقي',sOk:'المخزون تمام',sOrder:'اطلب الحين',sBelow:'تحت الاحتياطي',stockF:'المخزون',ropNote:'نقطة الطلب = الاحتياطي + الاستهلاك اليومي × مدة توريد المورد (يومان إذا غير محددة). تُحسب تلقائياً.',price:'سعر الوحدة',unit:'السعر لكل',pack:'كل وحدة فيها',per:'لكل',buy:'للشراء',bud:'الميزانية درهم',status:'الحالة',
 confirm:'تأكيد',done:'مؤكد',undo:'تراجع',add:'إضافة صنف',newItem:'اسم الصنف الجديد',food:'غذائي',nonfood:'غير غذائي',
 storeRef:'المستودع',use_:'استخدم',pemoW:'Pemo',creditW:'آجل',choose:'اختر…',
 m_price:'السعر',m_unit:'الوحدة',m_pack:'التعبئة',m_sup:'المورد',m_pay:'الدفع',m_use:'الاستهلاك',m_par:'الاحتياطي',m_name:'الاسم',
 needs:'ينقصه',erpT:'سجل الدخول عبر تطبيقات فوركا',erpH:'تطبيق المشتريات يفتح الآن من تطبيقات فوركا. سجل الدخول هناك ببريد الشركة ثم اختر المشتريات.',erpGo:'الذهاب إلى تطبيقات فوركا',erpExpired:'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى في تطبيقات فوركا.',erpNone:'ليس لديك صلاحية على المشتريات بعد. اطلبها من الرئيس التنفيذي في تطبيقات فوركا.',bySup:'حسب المورد',smT:'طريقة توريد الصنف',smStore:'مخزون المستودع',smDirect:'يومي للفروع',smDirectS:'لا يخزن - المورد يوصل للفروع',smCycle:'يشترى كل عدة أيام',smCycleB:'يشترى كل {n} أيام',smDays:'أيام',perOrder:'حوالي {q} {u} لكل طلب',stVal:'قيمة المخزون الآن',stValH:'المخزون المعدود × سعر الوحدة',stNoPrice:'أصناف معدودة بدون سعر',stNotCounted:'أصناف لم تُعد بعد',topStock:'الأعلى قيمة في المخزون',byType:'حسب النوع',hStock:'في المخزون',byCon:'حسب المفهوم',copyCsv:'نسخ الكل (CSV)',topup:'شحن Pemo للشهر',
 importT:'استيراد التحديثات (للمالك)',omReq:'إذن الصرف',omReqH:'صرف الأصناف من مخزن عُمان إلى مطبخ المطعم. الكميات المصروفة تُخصم من مخزون المخزن.',allSaved:'تم حفظ كل شيء',rqSendQ:'إرسال "{t}" إلى المشتريات؟',rqSendYes:'نعم، أرسل',rqNotSent:'لم يُرسل بعد: لا يوجد اتصال. سيُرسل تلقائياً عند عودة الاتصال.',saveQ:'حفظ {n} تعديلات على المخزون؟',saveYes:'نعم، احفظ',keepEdit:'متابعة التعديل',leaveQ:'لديك تعديلات غير محفوظة في المخزون. حفظها قبل المغادرة؟',stay:'البقاء هنا',sentOld:'{n} تعديلات سابقة لم تكن قد أُرسلت. أُرسلت الآن.',sentOld1:'تعديل سابق لم يكن قد أُرسل. أُرسل الآن.',editInv:'تعديل',baseMissing:'لم يتم تحميل قائمة الأصناف. خادم المشتريات يحتاج إلى نسخته الجديدة: يرجى إبلاغ الرئيس التنفيذي.',editInvH:'اضغط تعديل لتغيير الأصناف أو الجرد أو الأسعار، ثم احفظ.',rmItem:'حذف الصنف',rmQ:'حذف "{n}" من المخزون؟ لن يُجرد أو يُطلب بعد الآن.',rmYes:'نعم، احذف',rmNo:'إبقاء',rmDone:'تم الحذف. اضغط حفظ للتأكيد أو إلغاء لإرجاعه.',rmGone:'تم الحذف.',dropQ:'تجاهل التعديلات غير المحفوظة؟',dropYes:'نعم، تجاهلها',impOman:'هذا الملف لمخزن عُمان. افتح عُمان ← المشتريات ← الملخص ثم استورد.',impUae:'هذا الملف للجانب الإماراتي. اخرج من عُمان أولاً.',impDone:'أُضيف وحُفظ {n} صنفاً و{s} مورداً.',importH:'الصق التحديث الذي أرسله أحد الفريق ثم اضغط استيراد. يُحفظ في القائمة المشتركة.',imp:'استيراد',imported:'تم الاستيراد',
 copied:'تم النسخ',saveErr:'تعذّر الحفظ — بقي في هذا المتصفح',
 how1:'كل سطر يبدأ من ميزانية شهر أكتوبر. راجعه لشهر نوفمبر.',
 how2:'الخانات الحمراء ناقصة — عبّئها (السعر، الوحدة التي يُحسب عليها السعر، طريقة التعبئة، المورد، الدفع، الاستهلاك الشهري، مخزون الأمان).',
 how3:'حدّث «المخزون الآن» بجرد اليوم. التطبيق يحسب: للشراء = الاستهلاك + الاحتياطي − المخزون. نقطة الطلب تلقائية: الاحتياطي + الاستهلاك اليومي × مدة توريد المورد. عندما يصل المخزون لها يظهر «اطلب الحين».',
 how4:'إذا كان السطر صحيحاً اضغط تأكيد. إذا الصنف غير مطلوب هذا الشهر اجعل الاستهلاك 0 ثم أكّد.',
 how5:'تلميح «المستودع» يعرض رقم فريق المستودع لنوفمبر لنفس الصنف للمقارنة.',
 notes:'الميزانية = للشراء × سعر الوحدة. المبالغ بالدرهم.',basis:'البيانات الأولية: ميزانية أكتوبر 2026'}};
export const UNITS=[['PC','Piece','حبة'],['KG','KG','كيلو'],['G','Gram','غرام'],['L','Litre','لتر'],['ML','ML','مل'],['CTN','Carton','كرتون'],['BOX','Box','صندوق'],['BAG','Bag','كيس'],['PKT','Packet','باكيت'],['BTL','Bottle','قارورة'],['CAN','Can','علبة'],['JAR','Jar','مرطبان'],['TIN','Tin','تنكة'],['TRAY','Tray','طبق'],['BUCKET','Bucket','سطل'],['GALLON','Gallon','جالون'],['ROLL','Roll','رول'],['BUNDLE','Bundle','ربطة'],['DOZEN','Dozen','درزن'],['SET','Set','طقم']];
export const CATS=[['meat','Meat & poultry','لحوم ودواجن'],['seafood','Fish & seafood','أسماك ومأكولات بحرية'],['veg','Vegetables & fruit','خضار وفواكه'],['dairy','Dairy & eggs','ألبان وبيض'],['rice','Rice & grains','رز وحبوب'],['dry','Dry goods & spices','مواد جافة وبهارات'],['oil','Oils & ghee','زيوت وسمن'],['flour','Flour & bakery','طحين ومخبوزات'],['sauce','Sauces & canned','صلصات ومعلبات'],['frozen','Frozen food','مجمدات'],['bev','Drinks & water','مشروبات ومياه'],['coffee','Coffee & tea','قهوة وشاي'],['sweet','Desserts & sweets','حلويات'],['pack','Packaging & disposables','تغليف ومستهلكات'],['clean','Cleaning & hygiene','تنظيف ونظافة'],['fuel','Charcoal & gas','فحم وغاز'],['equip','Equipment & maintenance','معدات وصيانة'],['other','Other','أخرى']];
export const DAYS=[['sun','Sun','الأحد'],['mon','Mon','الإثنين'],['tue','Tue','الثلاثاء'],['wed','Wed','الأربعاء'],['thu','Thu','الخميس'],['fri','Fri','الجمعة'],['sat','Sat','السبت']];
export let EMIRATES=[['Dubai','دبي'],['Sharjah','الشارقة'],['Ajman','عجمان'],['Umm Al Quwain','أم القيوين'],['Ras Al Khaimah','رأس الخيمة'],['Fujairah','الفجيرة'],['Abu Dhabi','أبوظبي'],['Al Ain','العين'],['Oman','عُمان'],['Outside UAE','خارج الإمارات']];
export let supOpen=null;
export const U=c=>{const u=UNITS.find(x=>x[0]===c);return u?(lang==='ar'?u[2]:u[1]):(c||'')};
export const CON={'Al Matbakh':{en:'Al Matbakh',ar:'المطبخ الكويتي'},'Mayar':{en:'Mayar',ar:'ميار'}};
Object.assign(T.en,{landSub:'Procurement',landPlan:'Plan the month, suppliers, prices and analysis.',landOps:'Stock movements and store issue bills to the branches.',
 pinT_plan:'Purchasing',pinT_ops:'Operations',pinT_oman:'Oman',pinH_plan:'Enter the Purchasing PIN.',pinH_ops:'Enter the Operations PIN.',pinGo:'Enter',pinBack:'Back',pinWrong:'Wrong PIN. Try again.',pinDemo:'Preview PIN',exit:'Exit',landFoot:'Forka Collective Investment',
 req:'Branch bills',reqH:'Make a bill for everything that leaves the store for a branch. When you issue it, the quantities come off the store stock and the bill is ready to print.',
 tNew:'New bill',tNone:'No bills yet.',tIssue:'Issue and print bill',tIssueQ:'Issue this bill? The quantities will come off the store stock. It cannot be changed after.',tDelDraft:'Delete draft',
 tQty:'Quantity',tRule:'Choose the branch, add the items and quantities, then press Issue. Stock goes down when the bill is issued.',tOpenBill:'Open bill',tNeedBranch:'Choose the branch first.',tNeedIss:'Add at least one item with a quantity.',
 tBillT:'Store Issue Bill',tBillNo:'Bill no.',tDate:'Date',tCost:'Unit cost',tSign:'Name, signature and date',tBillNote:'Internal transfer at cost price. Not a tax invoice. The value goes to the branch food cost.',
 tsDraft:'Draft',tsIssued:'Issued',tLines:'Items',tAddItem:'Add item',tNoLines:'No items yet. Add the first item above.',tOver:'Some quantities are more than the stock shown for the store. Check the shelf before issuing.',
 movesH:'Everything that came into the store (accepted on receiving) and went out to the branches (issued on branch bills).'});
Object.assign(T.ar,{landSub:'المشتريات والمخزون',landPlan:'خطة الشهر والموردون والأسعار والتحليل.',landOps:'حركة المخزون وإذونات صرف المخزن للفروع.',
 pinT_plan:'المشتريات',pinT_ops:'العمليات',pinT_oman:'عُمان',pinH_plan:'أدخل رمز المشتريات.',pinH_ops:'أدخل رمز العمليات.',pinGo:'دخول',pinBack:'رجوع',pinWrong:'الرمز غير صحيح. حاول مرة ثانية.',pinDemo:'رمز النسخة التجريبية',exit:'خروج',landFoot:'Forka Collective Investment',
 req:'إذونات صرف الفروع',reqH:'اعمل إذن صرف لكل ما يخرج من المخزن إلى فرع. عند الصرف تنقص الكميات من مخزون المخزن ويكون الإذن جاهزاً للطباعة.',
 tNew:'إذن صرف جديد',tNone:'لا توجد إذونات بعد.',tIssue:'صرف وطباعة الإذن',tIssueQ:'صرف هذا الإذن؟ ستنقص الكميات من مخزون المخزن ولا يمكن تعديله بعد ذلك.',tDelDraft:'حذف المسودة',
 tQty:'الكمية',tRule:'اختر الفرع، أضف الأصناف والكميات، ثم اضغط صرف. المخزون ينقص عند صرف الإذن.',tOpenBill:'عرض الإذن',tNeedBranch:'اختر الفرع أولاً.',tNeedIss:'أضف صنفاً واحداً على الأقل مع الكمية.',
 tBillT:'إذن صرف مخزني',tBillNo:'رقم الإذن',tDate:'التاريخ',tCost:'تكلفة الوحدة',tSign:'الاسم والتوقيع والتاريخ',tBillNote:'تحويل داخلي بسعر التكلفة. ليست فاتورة ضريبية. القيمة تدخل في تكلفة طعام الفرع.',
 tsDraft:'مسودة',tsIssued:'مصروف',tLines:'الأصناف',tAddItem:'إضافة صنف',tNoLines:'لا توجد أصناف بعد. أضف أول صنف من الأعلى.',tOver:'بعض الكميات أكثر من مخزون المخزن الظاهر. تأكد من الرف قبل الصرف.',
 movesH:'كل ما دخل المخزن (المقبول في الاستلام) وما خرج للفروع (المصروف بإذونات الصرف).'});
Object.assign(T.en,{sideFin:'Finance',landFin:'Finance',landFinD:'payments for goods received',pinT_fin:'Finance',pinH_fin:'Enter the Finance PIN.',pay:'Payments',
 payH:'Everything the store has received from suppliers, and what still needs to be paid. A delivery is ready to pay when the invoice, quantities and price checks are complete.',
 pToPay:'To pay',pHold:'On hold',pPaid:'Paid',pOverdue:'Overdue',pDue:'Due',pRecv:'Received',pTerms:'Terms',pCash:'Cash / Pemo',pDays:'days credit',pPayBtn:'Mark paid',pPaidBy:'Paid by',pOpen:'Open',
 pBySup:'To pay by supplier',pNone:'Nothing here.',pHoldWhy:'Missing',pAllSup:'All suppliers',pThisMonth:'this month',pIban:'IBAN',pNoIban:'No bank details',
 c_inv:'invoice no.',c_lines:'quantities',c_price:'price approval',c_photos:'photos of rejects',c_signed:'driver signature',c_split:'receiver ≠ orderer',
 calToday:'Today',calClear:'Clear',calWd:['Mon','Tue','Wed','Thu','Fri','Sat','Sun']});
Object.assign(T.ar,{sideFin:'المالية',landFin:'المالية',landFinD:'مدفوعات البضاعة المستلمة',pinT_fin:'المالية',pinH_fin:'أدخل رمز المالية.',pay:'المدفوعات',
 payH:'كل ما استلمه المخزن من الموردين وما يحتاج للدفع. الاستلام يكون جاهزاً للدفع عند اكتمال الفاتورة والكميات وفحص الأسعار.',
 pToPay:'للدفع',pHold:'معلّق',pPaid:'مدفوع',pOverdue:'متأخر',pDue:'الاستحقاق',pRecv:'تاريخ الاستلام',pTerms:'الشروط',pCash:'نقدي / Pemo',pDays:'يوم آجل',pPayBtn:'تم الدفع',pPaidBy:'دفعه',pOpen:'فتح',
 pBySup:'المطلوب دفعه حسب المورد',pNone:'لا يوجد شيء هنا.',pHoldWhy:'ينقصه',pAllSup:'كل الموردين',pThisMonth:'هذا الشهر',pIban:'IBAN',pNoIban:'لا توجد بيانات بنكية',
 c_inv:'رقم الفاتورة',c_lines:'الكميات',c_price:'اعتماد السعر',c_photos:'صور المرفوض',c_signed:'توقيع السائق',c_split:'المستلم غير طالب الشراء',
 calToday:'اليوم',calClear:'مسح',calWd:['إث','ثل','أر','خم','جم','سب','أح']});
Object.assign(T.en,{paySch:'Payment schedule',ps_delivery:'On delivery',ps_days:'After credit days',ps_weekly:'Every week on',ps_monthly:'Every month on day',payDow:'Payment day',payDom:'Day of month',
 paySchH:'Every delivery is added to this supplier’s statement. Bills are paid on the first payment day after the credit days end.',
 soa:'Statements (SOA)',soaH:'Every delivery received is added to the supplier’s statement automatically. Payments are recorded when finance marks a bill paid.',
 sBilled:'Billed',sPaidT:'Paid',sBal:'Balance',sHoldT:'On hold (not ready)',sNext:'Next payment',sNextAmt:'Due on that day',sDebit:'Bill',sCredit:'Payment',sRun:'Balance',sDesc:'Details',sPayment:'Payment',
 sPayDue:'Pay due bills',sPayQ:'Mark these bills as paid?',sNoBills:'No bills for this supplier yet.',sPick:'Choose a supplier',sPrint:'Print statement',sAsOf:'Statement as of',sSched:'Schedule',
 nT:'Payment notifications',nDue:'Payments due in the next 7 days',nNone:'Nothing due in the next 7 days.',nNew:'New deliveries since you last looked',nOver:'overdue',nToday:'today',nIn:'in',nDays:'days',nBills:'bills',nOpen:'Open statement',nNext:'Next payments',nSet:'Set the payment schedule on the supplier page (Purchasing → Suppliers).'});
Object.assign(T.ar,{paySch:'جدول الدفع',ps_delivery:'عند التوريد',ps_days:'بعد أيام الآجل',ps_weekly:'كل أسبوع يوم',ps_monthly:'كل شهر يوم',payDow:'يوم الدفع',payDom:'يوم من الشهر',
 paySchH:'كل توريد يُضاف إلى كشف حساب المورد. الفواتير تُدفع في أول يوم دفع بعد انتهاء أيام الآجل.',
 soa:'كشوف الحساب',soaH:'كل توريد مستلم يُضاف تلقائياً إلى كشف حساب المورد. الدفعات تُسجَّل عندما تؤشر المالية على الفاتورة كمدفوعة.',
 sBilled:'إجمالي الفواتير',sPaidT:'المدفوع',sBal:'الرصيد',sHoldT:'معلّق (غير جاهز)',sNext:'الدفعة القادمة',sNextAmt:'المستحق في ذلك اليوم',sDebit:'فاتورة',sCredit:'دفعة',sRun:'الرصيد',sDesc:'التفاصيل',sPayment:'دفعة',
 sPayDue:'دفع الفواتير المستحقة',sPayQ:'تأكيد دفع هذه الفواتير؟',sNoBills:'لا توجد فواتير لهذا المورد بعد.',sPick:'اختر مورداً',sPrint:'طباعة الكشف',sAsOf:'كشف حساب حتى',sSched:'الجدول',
 nT:'تنبيهات الدفع',nDue:'دفعات مستحقة خلال 7 أيام',nNone:'لا توجد دفعات مستحقة خلال 7 أيام.',nNew:'توريدات جديدة منذ آخر مرة',nOver:'متأخر',nToday:'اليوم',nIn:'بعد',nDays:'أيام',nBills:'فواتير',nOpen:'فتح الكشف',nNext:'الدفعات القادمة',nSet:'حدّد جدول الدفع في صفحة المورد (المشتريات ← الموردون).'});
Object.assign(T.en,{sideDept:'Requests',landDept:'Department heads',landDeptD:'request something from procurement',pinT_dept:'Department request',pinH_dept:'Enter the department PIN.',
 rnew:'New request',rmine:'My requests',prq:'Requests',
 rqHello:'What do you need?',rqHelloH:'Tell procurement what you need and why. They will review it, call or meet you to agree the details, then look for suppliers. You can follow every step here.',
 rk_food:'Food or ingredient',rk_foodD:'A new meat cut, product, ingredient or brand — for a new dish or a change',
 rk_equip:'Equipment',rk_equipD:'Kitchen or bar equipment, tools, furniture, IT',
 rk_service:'Service',rk_serviceD:'Maintenance contract, cleaning, pest control, consultancy, transport',
 rk_design:'Design or creative',rk_designD:'Interior design, branding, menu design, photography, printing',
 rk_other:'Other',rk_otherD:'Anything else procurement should buy or arrange',
 rqCost:'Budget type',capex:'CAPEX',opex:'OPEX',capexH:'Something that lasts more than a year — equipment, furniture, fit-out',opexH:'Used up in daily running — food, supplies, services, repairs',
 rqTitle:'What do you need? (short title)',rqTitlePh:'e.g. Wagyu short rib for new grill dish',rqWhy:'Details and reason',rqWhyPh:'What it is for, what you have tried, brand or quality you want, anything procurement should know',
 rqDept:'Department',rqBranch:'Branch / location',rqQty:'Quantity',rqUnit:'Unit',rqNeed:'Needed by',rqBudget:'Budget idea (AED, optional)',rqUrg:'Urgency',urgN:'Normal',urgU:'Urgent',rqPhone:'Your phone (for a call)',
 rqRefs:'Reference links (optional)',rqRefsPh:'Website, product page, supplier you know…',rqPhotos:'Photos (optional, up to 3)',rqAddPhoto:'Add photo',rqSend:'Send to procurement',rqSent:'Request sent to procurement',rqNeedTitle:'Write what you need first.',rqNeedKind:'Choose what type of request it is.',rqNeedDept:'Choose your department.',
 rqNone:'No requests yet.',rqOpen:'Open',rqAll:'All',rqMsg:'Message',rqMsgPh:'Write a message…',rqSendMsg:'Send',rqCancel:'Cancel this request',rqBack:'Requests',rqBy:'Requested by',rqAssigned:'Handled by',rqAssign:'Handled by (buyer)',rqLog:'Conversation and notes',
 rqSpec:'Specification (agreed with requester)',rqSpecH:'Fill this after the call or meeting. This is what suppliers will quote against.',rqSpecNotes:'Other specification notes',
 rqOpts:'Supplier options',rqOptsH:'Suppliers contacted and what they offered. Mark the one you recommend.',rqAddOpt:'Add supplier option',rqOptSup:'Supplier',rqOptPrice:'Price (AED)',rqOptLead:'Lead time / delivery',rqOptNote:'Notes',rqPick:'Chosen',
 rqAddNote:'Add to the record',rqMail:'Email requester',rqMailH:'Opens your email with the request number and title filled in',rqMailNoTo:'This older request has no saved email. Type the requester’s address in your email.',lt_mail:'Email to requester',lt_note:'Internal note',lt_call:'Call with requester',lt_meet:'Meeting with requester',lt_msg:'Message to requester',lt_status:'Status',lt_reply:'Reply from requester',lt_ceo:'Note from the CEO to procurement',rqInternal:'internal',
 rs_new:'New',rs_review:'Clarifying details',rs_sourcing:'Looking for suppliers',rs_quotes:'Quotes ready',rs_ordered:'Ordered',rs_done:'Delivered',rs_rejected:'Not going ahead',rs_cancelled:'Cancelled',
 rqMove:'Move to',rqOpenN:'Open',rqAge:'days ago',rqToday:'today',rqDue:'due',
 sp_brand:'Brand / grade',sp_origin:'Origin',sp_cut:'Size / cut / count',sp_pack:'Pack size',sp_temp:'Storage temperature',sp_shelf:'Shelf life needed',sp_monthly:'Expected monthly use',
 sp_model:'Model / type',sp_dims:'Size / dimensions',sp_power:'Power / gas / water',sp_cap:'Capacity',sp_warranty:'Warranty & service',sp_install:'Delivery & installation',
 sp_scope:'Scope of work',sp_deliv:'Deliverables',sp_time:'Timeline',sp_site:'Site visit needed',sp_freq:'Frequency / duration'});
Object.assign(T.ar,{sideDept:'الطلبات',landDept:'رؤساء الأقسام',landDeptD:'اطلب شيئاً من المشتريات',pinT_dept:'طلب قسم',pinH_dept:'أدخل رمز الأقسام.',
 rnew:'طلب جديد',rmine:'طلباتي',prq:'الطلبات',
 rqHello:'ماذا تحتاج؟',rqHelloH:'أخبر المشتريات بما تحتاجه ولماذا. سيراجعون الطلب ويتصلون بك أو يجتمعون معك لتحديد التفاصيل، ثم يبحثون عن الموردين. تقدر تتابع كل خطوة هنا.',
 rk_food:'مادة غذائية',rk_foodD:'قطعة لحم أو منتج أو مكوّن أو علامة تجارية جديدة — لطبق جديد أو تعديل',
 rk_equip:'معدات',rk_equipD:'معدات مطبخ أو بار، أدوات، أثاث، أجهزة',
 rk_service:'خدمة',rk_serviceD:'عقد صيانة، تنظيف، مكافحة حشرات، استشارة، نقل',
 rk_design:'تصميم أو إبداع',rk_designD:'تصميم داخلي، هوية، تصميم منيو، تصوير، طباعة',
 rk_other:'أخرى',rk_otherD:'أي شيء آخر تشتريه أو ترتبه المشتريات',
 rqCost:'نوع الميزانية',capex:'رأسمالية (CAPEX)',opex:'تشغيلية (OPEX)',capexH:'شيء يدوم أكثر من سنة — معدات، أثاث، تجهيزات',opexH:'يُستهلك في التشغيل اليومي — طعام، مستلزمات، خدمات، إصلاحات',
 rqTitle:'ماذا تحتاج؟ (عنوان قصير)',rqTitlePh:'مثال: ضلع واغيو لطبق مشاوي جديد',rqWhy:'التفاصيل والسبب',rqWhyPh:'لأي غرض، ماذا جربت، العلامة أو الجودة المطلوبة، وأي شيء تحتاج المشتريات معرفته',
 rqDept:'القسم',rqBranch:'الفرع / الموقع',rqQty:'الكمية',rqUnit:'الوحدة',rqNeed:'مطلوب قبل',rqBudget:'فكرة الميزانية (درهم، اختياري)',rqUrg:'الأولوية',urgN:'عادي',urgU:'عاجل',rqPhone:'رقم هاتفك (للاتصال)',
 rqRefs:'روابط مرجعية (اختياري)',rqRefsPh:'موقع، صفحة منتج، مورد تعرفه…',rqPhotos:'صور (اختياري، حتى 3)',rqAddPhoto:'إضافة صورة',rqSend:'إرسال إلى المشتريات',rqSent:'تم إرسال الطلب إلى المشتريات',rqNeedTitle:'اكتب ما تحتاجه أولاً.',rqNeedKind:'اختر نوع الطلب.',rqNeedDept:'اختر قسمك.',
 rqNone:'لا توجد طلبات بعد.',rqOpen:'فتح',rqAll:'الكل',rqMsg:'رسالة',rqMsgPh:'اكتب رسالة…',rqSendMsg:'إرسال',rqCancel:'إلغاء الطلب',rqBack:'الطلبات',rqBy:'مقدم الطلب',rqAssigned:'المسؤول',rqAssign:'المسؤول (المشتري)',rqLog:'المحادثة والملاحظات',
 rqSpec:'المواصفات (المتفق عليها مع مقدم الطلب)',rqSpecH:'عبّئها بعد الاتصال أو الاجتماع. على أساسها يقدّم الموردون عروضهم.',rqSpecNotes:'ملاحظات أخرى على المواصفات',
 rqOpts:'خيارات الموردين',rqOptsH:'الموردون الذين تم التواصل معهم وما عرضوه. حدد الذي توصي به.',rqAddOpt:'إضافة خيار مورد',rqOptSup:'المورد',rqOptPrice:'السعر (درهم)',rqOptLead:'مدة التوريد',rqOptNote:'ملاحظات',rqPick:'المختار',
 rqAddNote:'إضافة للسجل',rqMail:'مراسلة مقدم الطلب بالبريد',rqMailH:'يفتح بريدك مع رقم الطلب وعنوانه',rqMailNoTo:'هذا طلب قديم بدون بريد محفوظ. اكتب بريد مقدم الطلب في رسالتك.',lt_mail:'بريد إلى مقدم الطلب',lt_note:'ملاحظة داخلية',lt_call:'اتصال مع مقدم الطلب',lt_meet:'اجتماع مع مقدم الطلب',lt_msg:'رسالة لمقدم الطلب',lt_status:'الحالة',lt_reply:'رد مقدم الطلب',lt_ceo:'ملاحظة من الرئيس التنفيذي للمشتريات',rqInternal:'داخلي',
 rs_new:'جديد',rs_review:'توضيح التفاصيل',rs_sourcing:'البحث عن موردين',rs_quotes:'العروض جاهزة',rs_ordered:'تم الطلب',rs_done:'تم التسليم',rs_rejected:'لن يُنفّذ',rs_cancelled:'ملغي',
 rqMove:'نقل إلى',rqOpenN:'مفتوحة',rqAge:'يوم مضى',rqToday:'اليوم',rqDue:'المطلوب',
 sp_brand:'العلامة / الدرجة',sp_origin:'المنشأ',sp_cut:'الحجم / القطعة / العدد',sp_pack:'حجم العبوة',sp_temp:'حرارة التخزين',sp_shelf:'الصلاحية المطلوبة',sp_monthly:'الاستهلاك الشهري المتوقع',
 sp_model:'الموديل / النوع',sp_dims:'الأبعاد',sp_power:'كهرباء / غاز / ماء',sp_cap:'السعة',sp_warranty:'الضمان والخدمة',sp_install:'التوصيل والتركيب',
 sp_scope:'نطاق العمل',sp_deliv:'المخرجات',sp_time:'المدة الزمنية',sp_site:'زيارة موقع مطلوبة',sp_freq:'التكرار / المدة'});
Object.assign(T.en,{pon:'Procurement ongoing',ponH:'Requests with agreed details. Find suppliers, collect quotes, order and follow up until delivered.',prqH:'New requests from department heads. Accept and clarify the details with the requester, or decline with a reason.',
 rs_later:'Parked for later',rqActive:'Active',rqClosed:'Closed',
 ga_accept:'Accept and start clarifying',ga_agreed:'Details agreed — start looking for suppliers',ga_quotes:'Quotes ready',ga_order:'Order placed',ga_done:'Delivered',ga_back:'Back a step',ga_park:'Park for later',ga_reject:'Not going ahead',ga_reopen:'Reopen',
 rqMoved:'Moved to Procurement ongoing',rqFix:'Fill the fields in red first.',rqNeedOpt:'Add at least one supplier with a price.',rqNeedPick:'Mark the chosen supplier first.',
 rqWhyT_rejected:'Why is this not going ahead?',rqWhyT_later:'Why park it for later?',rqReason:'Reason',rqNote:'Explain (the requester will see this)',rqReview:'Look at it again on (optional)',rqConfirm:'Confirm',
 rr_notneeded:'Not needed any more',rr_budget:'Too expensive / no budget now',rr_nosupplier:'No suitable supplier found',rr_spec:'Specification not clear or not approved',rr_duplicate:'Duplicate request',rr_later:'Leave it for later',rr_other:'Other',
 rqClosedBox:'Reason',rqReviewOn:'look again on',rqReq:'required'});
Object.assign(T.ar,{pon:'المشتريات الجارية',ponH:'طلبات تم الاتفاق على تفاصيلها. ابحث عن موردين، اجمع العروض، اطلب وتابع حتى التسليم.',prqH:'طلبات جديدة من رؤساء الأقسام. اقبلها ووضّح التفاصيل مع مقدم الطلب، أو ارفضها مع ذكر السبب.',
 rs_later:'مؤجل لوقت لاحق',rqActive:'النشطة',rqClosed:'المغلقة',
 ga_accept:'قبول وبدء التوضيح',ga_agreed:'تم الاتفاق على التفاصيل — ابدأ البحث عن موردين',ga_quotes:'العروض جاهزة',ga_order:'تم الطلب',ga_done:'تم التسليم',ga_back:'رجوع خطوة',ga_park:'تأجيل لوقت لاحق',ga_reject:'لن يُنفّذ',ga_reopen:'إعادة فتح',
 rqMoved:'نُقل إلى المشتريات الجارية',rqFix:'عبّئ الخانات الحمراء أولاً.',rqNeedOpt:'أضف مورداً واحداً على الأقل مع السعر.',rqNeedPick:'حدد المورد المختار أولاً.',
 rqWhyT_rejected:'لماذا لن يُنفّذ هذا الطلب؟',rqWhyT_later:'لماذا يُؤجل لوقت لاحق؟',rqReason:'السبب',rqNote:'توضيح (سيراه مقدم الطلب)',rqReview:'مراجعته مرة أخرى في (اختياري)',rqConfirm:'تأكيد',
 rr_notneeded:'لم يعد مطلوباً',rr_budget:'مكلف جداً / لا توجد ميزانية الآن',rr_nosupplier:'لم يُعثر على مورد مناسب',rr_spec:'المواصفات غير واضحة أو غير معتمدة',rr_duplicate:'طلب مكرر',rr_later:'نتركه لوقت لاحق',rr_other:'أخرى',
 rqClosedBox:'السبب',rqReviewOn:'المراجعة في',rqReq:'مطلوب'});
Object.assign(T.en,{rqQuote:'Quotation copy',rqUpload:'Upload',rqTooBig:'File too big (max 3 MB). Use a smaller PDF or a photo.',rqFileType:'Only PDF or photo files.',rqOpenTab:'Open in a new tab'});
Object.assign(T.ar,{rqQuote:'نسخة عرض السعر',rqUpload:'رفع',rqTooBig:'الملف كبير جداً (الحد 3 ميغابايت). استخدم ملف PDF أصغر أو صورة.',rqFileType:'ملفات PDF أو صور فقط.',rqOpenTab:'فتح في تبويب جديد'});
Object.assign(T.en,{sideCeo:'CEO',landCeo:'CEO',landCeoD:'approvals',pinT_ceo:'CEO approvals',pinH_ceo:'Enter the CEO PIN.',appr:'Approvals',apprH:'Purchases waiting for your OK before procurement places the order. Check the chosen supplier and the quotation, then approve or send back.',
 rs_approval:'Waiting for CEO',rs_approved:'CEO approved',ga_send:'Send to CEO for approval',ga_withdraw:'Withdraw from CEO',ga_approve:'Approve — place the order',ga_ceoback:'Send back to procurement',
 rqNeedAppr:'The CEO must approve before the order is placed.',ap_pending:'Waiting for me',ap_ok:'Approved',ap_back:'Sent back',ap_all:'All',
 rqWhyT_ceoback:'What should procurement change?',ceoNoteReq:'Write what should change.',rqChosen:'Chosen supplier',rqTotal:'Estimated total',rqSentCeo:'Sent to the CEO',rqApproved:'Approved',rqWaitSince:'waiting since',ceoSays:'CEO',nApprT:'Waiting for your approval',nApprNone:'Nothing waiting for you.'});
Object.assign(T.ar,{sideCeo:'الرئيس التنفيذي',landCeo:'الرئيس التنفيذي',landCeoD:'الموافقات',pinT_ceo:'موافقات الرئيس التنفيذي',pinH_ceo:'أدخل رمز الرئيس التنفيذي.',appr:'الموافقات',apprH:'مشتريات تنتظر موافقتك قبل أن تطلبها المشتريات. راجع المورد المختار وعرض السعر، ثم وافق أو أعدها.',
 rs_approval:'بانتظار الرئيس التنفيذي',rs_approved:'وافق الرئيس التنفيذي',ga_send:'إرسال للرئيس التنفيذي للموافقة',ga_withdraw:'سحب من الرئيس التنفيذي',ga_approve:'موافقة — اطلبوا',ga_ceoback:'إعادة إلى المشتريات',
 rqNeedAppr:'يجب أن يوافق الرئيس التنفيذي قبل الطلب.',ap_pending:'بانتظاري',ap_ok:'تمت الموافقة',ap_back:'أُعيدت',ap_all:'الكل',
 rqWhyT_ceoback:'ماذا يجب أن تغيّر المشتريات؟',ceoNoteReq:'اكتب ما يجب تغييره.',rqChosen:'المورد المختار',rqTotal:'الإجمالي التقديري',rqSentCeo:'أُرسل للرئيس التنفيذي',rqApproved:'تمت الموافقة',rqWaitSince:'ينتظر منذ',ceoSays:'الرئيس التنفيذي',nApprT:'بانتظار موافقتك',nApprNone:'لا يوجد شيء بانتظارك.'});
Object.assign(T.en,{btnReq:'Requests',capReq:'Department heads ask procurement for food, equipment, services or design.',btnPay:'Payments',capPay:'Finance: what was received and what needs to be paid.',sideDept:'Requests',sideFin:'Payments',pinT_fin:'Payments',pinH_fin:'Enter the Payments PIN.',pinT_dept:'Requests',pinH_dept:'Enter the Requests PIN.'});
Object.assign(T.ar,{btnReq:'الطلبات',capReq:'رؤساء الأقسام يطلبون من المشتريات: مواد غذائية، معدات، خدمات أو تصميم.',btnPay:'المدفوعات',capPay:'المالية: ما تم استلامه وما يجب دفعه.',sideDept:'الطلبات',sideFin:'المدفوعات',pinT_fin:'المدفوعات',pinH_fin:'أدخل رمز المدفوعات.',pinT_dept:'الطلبات',pinH_dept:'أدخل رمز الطلبات.'});
Object.assign(T.en,{ppSheet:'To add people, change PINs or alerts, edit the Users tab in the Google Sheet.',outLive:'Alerts are sent by email (and WhatsApp if set up) from the Google Sheet. The daily payment alert runs at 8:00.',people:'People & alerts',activity:'Activity',pinOnlyH:'Enter your personal PIN.',pinNoSide:'This PIN cannot open this page.',
 ppH:'Each person signs in with their own PIN. The app knows who did what, and alerts go to the right people.',ppAdd:'Add person',ppName:'Name',ppPin:'PIN (4–6 digits)',ppSides:'Can open',ppEmail:'Email',ppWa:'WhatsApp number',ppAlerts:'Gets alerts for',ppActive:'Active',ppOff:'Switched off',ppSave:'Save',ppDup:'Another person already uses this PIN.',ppBad:'Name and a 4–6 digit PIN are required.',ppEdit:'Edit',ppPinHidden:'hidden',
 al_request:'New department request',al_approval:'Purchase waiting for CEO',al_decision:'CEO decision (approved / sent back)',al_payments:'Payments due (daily, 8:00)',al_reply:'Message from procurement (requester)',
 actH:'Every change in the app, with who did it and when.',actWhen:'When',actWho:'Who',actWhat:'What',actNone:'No activity yet.',outT:'Alerts sent',outH:'In the live app these go out by email and WhatsApp. In this preview they are listed here so you can see who would get what.',outNone:'No alerts yet.',outRun:'Send today’s payment alert now (test)',outTo:'To',outNoOne:'Nobody is set to receive this alert.',
 ak_Requests:'Request',ak_GRN:'Receiving',ak_Transfers:'Branch bill',ak_line:'Inventory line',ak_people:'People',ak_sup:'Supplier',ak_Evaluations:'Supplier evaluation',ak_Deliveries:'Delivery',
 msg_request:'New request from {by}: {title}',msg_approval:'Waiting for your approval: {title} — {sup} AED {amt}',msg_decision:'CEO {dec}: {title}',msg_reply:'Procurement update on your request: {title}',msg_payments:'Payments due in the next 7 days: {n} supplier(s), AED {amt}',dec_approved:'approved',dec_returned:'sent back'});
Object.assign(T.ar,{ppSheet:'لإضافة أشخاص أو تغيير الرموز أو التنبيهات، عدّل تبويب Users في Google Sheet.',outLive:'التنبيهات تُرسل بالبريد (وواتساب إذا تم إعداده) من Google Sheet. تنبيه الدفعات اليومي الساعة 8:00.',people:'الأشخاص والتنبيهات',activity:'سجل النشاط',pinOnlyH:'أدخل رمزك الشخصي.',pinNoSide:'هذا الرمز لا يفتح هذه الصفحة.',
 ppH:'كل شخص يدخل برمزه الخاص. التطبيق يعرف من فعل ماذا، والتنبيهات تصل للأشخاص الصحيحين.',ppAdd:'إضافة شخص',ppName:'الاسم',ppPin:'الرمز (4–6 أرقام)',ppSides:'يستطيع فتح',ppEmail:'البريد الإلكتروني',ppWa:'رقم واتساب',ppAlerts:'يستلم تنبيهات',ppActive:'فعّال',ppOff:'موقوف',ppSave:'حفظ',ppDup:'هذا الرمز مستخدم لشخص آخر.',ppBad:'الاسم ورمز من 4–6 أرقام مطلوبان.',ppEdit:'تعديل',ppPinHidden:'مخفي',
 al_request:'طلب جديد من قسم',al_approval:'شراء ينتظر الرئيس التنفيذي',al_decision:'قرار الرئيس التنفيذي (موافقة / إعادة)',al_payments:'دفعات مستحقة (يومياً 8:00)',al_reply:'رسالة من المشتريات (لمقدم الطلب)',
 actH:'كل تعديل في التطبيق، مع من قام به ومتى.',actWhen:'الوقت',actWho:'الشخص',actWhat:'ماذا',actNone:'لا يوجد نشاط بعد.',outT:'التنبيهات المرسلة',outH:'في التطبيق الفعلي تُرسل بالبريد وواتساب. في هذه النسخة تظهر هنا لترى من سيستلم ماذا.',outNone:'لا توجد تنبيهات بعد.',outRun:'إرسال تنبيه الدفعات الآن (تجربة)',outTo:'إلى',outNoOne:'لا يوجد أحد مُعدّ لاستلام هذا التنبيه.',
 ak_Requests:'طلب',ak_GRN:'استلام',ak_Transfers:'إذن صرف',ak_line:'صنف مخزون',ak_people:'الأشخاص',ak_sup:'مورد',ak_Evaluations:'تقييم مورد',ak_Deliveries:'توريد',
 msg_request:'طلب جديد من {by}: {title}',msg_approval:'بانتظار موافقتك: {title} — {sup} {amt} درهم',msg_decision:'الرئيس التنفيذي {dec}: {title}',msg_reply:'تحديث من المشتريات على طلبك: {title}',msg_payments:'دفعات مستحقة خلال 7 أيام: {n} مورد، {amt} درهم',dec_approved:'وافق',dec_returned:'أعاد'});
Object.assign(T.en,{lpo:'Purchase orders',lpoH:'Purchase orders (LPOs) are created automatically: when the CEO approves a request, and for stock items whose counted stock reaches the reorder point (grouped by supplier). Check the draft, then issue it to the supplier.',
 lp_draft:'Draft',lp_issued:'Issued',lp_part:'Partly received',lp_received:'Received',lp_cancelled:'Cancelled',lpNone:'No purchase orders yet.',lpAuto:'{n} draft LPO(s) created for items at their reorder point.',lpFromReq:'Request',lpFromStock:'Restock',
 lpTitle:'Local Purchase Order',lpTitleAr:'أمر شراء محلي',lpNo:'LPO no.',lpDate:'Date',lpTo:'Deliver to',lpNeed:'Delivery date',lpTerms:'Payment terms',lpNotes:'Notes to supplier',lpItem:'Item',lpQty:'Qty',lpUnit:'Unit',lpPrice:'Unit price',lpLine:'Total',lpRecv:'Received',lpSub:'Subtotal',lpVat:'VAT 5%',lpTot:'Total',lpAddLine:'Add item',lpIssue:'Issue LPO to supplier',lpIssued:'LPO issued',lpCancel:'Cancel LPO',lpPrintBtn:'Open LPO document',lpBack:'Purchase orders',lpPrep:'Prepared by',lpAppr:'Approved by',lpSupSign:'Supplier acknowledgement',
 lpRule:'Please quote this LPO number on your delivery note and invoice. Goods are checked on delivery at the address above; items that do not match this order (item, quantity, price, quality or temperature) will be rejected. Prices are fixed as stated.',lpFix:'Fill the fields in red first.',lpSrcReq:'From request',lpSrcStock:'Restock — items at reorder point',lpOpen:'Open LPO',lpMake:'Create LPO',lpWaitIssue:'LPO ready — check and issue it',
 gFromPo:'Receive against purchase order',gPickPo:'Choose an issued LPO…',gPoFilled:'Supplier and items filled from the LPO.',lpCreated:'Draft LPO created',lpSupMissing:'Choose the supplier.',ak_POs:'Purchase order',lpCancelQ:'Cancel this LPO?',lpTrn:'TRN'});
Object.assign(T.ar,{lpo:'أوامر الشراء',lpoH:'أوامر الشراء تُنشأ تلقائياً: عند موافقة الرئيس التنفيذي على طلب، وللأصناف التي يصل مخزونها المعدود إلى نقطة إعادة الطلب (مجمّعة حسب المورد). راجع المسودة ثم أصدرها للمورد.',
 lp_draft:'مسودة',lp_issued:'صادر',lp_part:'استلام جزئي',lp_received:'تم الاستلام',lp_cancelled:'ملغي',lpNone:'لا توجد أوامر شراء بعد.',lpAuto:'تم إنشاء {n} مسودة أمر شراء لأصناف وصلت نقطة إعادة الطلب.',lpFromReq:'طلب',lpFromStock:'إعادة تعبئة',
 lpTitle:'أمر شراء محلي',lpTitleAr:'Local Purchase Order',lpNo:'رقم الأمر',lpDate:'التاريخ',lpTo:'التسليم إلى',lpNeed:'تاريخ التسليم',lpTerms:'شروط الدفع',lpNotes:'ملاحظات للمورد',lpItem:'الصنف',lpQty:'الكمية',lpUnit:'الوحدة',lpPrice:'سعر الوحدة',lpLine:'الإجمالي',lpRecv:'المستلم',lpSub:'المجموع',lpVat:'ضريبة 5%',lpTot:'الإجمالي',lpAddLine:'إضافة صنف',lpIssue:'إصدار الأمر للمورد',lpIssued:'تم إصدار أمر الشراء',lpCancel:'إلغاء الأمر',lpPrintBtn:'عرض مستند أمر الشراء',lpBack:'أوامر الشراء',lpPrep:'أعدّه',lpAppr:'اعتمده',lpSupSign:'إقرار المورد',
 lpRule:'يرجى ذكر رقم أمر الشراء في مذكرة التسليم والفاتورة. تُفحص البضاعة عند التسليم في العنوان أعلاه؛ أي صنف لا يطابق هذا الأمر (الصنف، الكمية، السعر، الجودة أو الحرارة) سيُرفض. الأسعار ثابتة كما هو مذكور.',lpFix:'عبّئ الخانات الحمراء أولاً.',lpSrcReq:'من طلب',lpSrcStock:'إعادة تعبئة — أصناف عند نقطة الطلب',lpOpen:'فتح أمر الشراء',lpMake:'إنشاء أمر شراء',lpWaitIssue:'أمر الشراء جاهز — راجعه وأصدره',
 gFromPo:'الاستلام مقابل أمر شراء',gPickPo:'اختر أمر شراء صادر…',gPoFilled:'تمت تعبئة المورد والأصناف من أمر الشراء.',lpCreated:'تم إنشاء مسودة أمر شراء',lpSupMissing:'اختر المورد.',ak_POs:'أمر شراء',lpCancelQ:'إلغاء أمر الشراء؟',lpTrn:'الرقم الضريبي'});
export let myEmail='',invEdit=false,rowRank=null,rowRankKey=null,keepKey='',keepIds=null,supRank=null,supRankKey=null,lastTab='',lang='en',tab='fill',BASE=[],shared={},local={},supShared={},supLocal={},sq='',db=null,user=null,mode='loading',me='',uid=null,isOwner=false;
export let fl={q:'',st:'all',con:'',sup:'',pay:'',cat:'',stk:''};
export const t=k=>T[lang][k]??T.en[k]??k;
export function dd(v,time){if(!v)return '';const s=String(v),d=new Date(s.length===10?s+'T00:00:00':s);if(isNaN(d))return esc(s);
  const loc=lang==='ar'?'ar-AE-u-nu-latn':'en-GB';let o=d.toLocaleDateString(loc,{day:'numeric',month:'short',year:'numeric'});
  if(time&&s.length>10)o+=' · '+d.toLocaleTimeString(loc,{hour:'2-digit',minute:'2-digit',hour12:false});return `<bdi class="dt">${esc(o)}</bdi>`}
export const fmt=(n,d=0)=>(n==null||isNaN(n))?'–':Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
export const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function ls2(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k));localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
export function ls(k,v){let reg='uae';try{reg=REGION}catch(_){}if(reg!=='uae'&&['pp-local','pp-slocal','pp-rlocal'].includes(k))k=k+'-'+reg;try{if(v===undefined)return JSON.parse(localStorage.getItem(k));localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
export function toast(m){const e=document.getElementById('toast');e.textContent=m;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('show'),1800)}
export async function copy(s){try{await navigator.clipboard.writeText(s);toast(t('copied'))}catch(e){const a=document.createElement('textarea');a.value=s;document.body.appendChild(a);a.select();try{document.execCommand('copy');toast(t('copied'))}catch(_){}a.remove()}}
export function ids(){const s=new Set(BASE.map(b=>b.id));Object.keys(shared).forEach(k=>s.add(k));Object.keys(local).forEach(k=>s.add(k));return [...s]}
export function line(id){
  const b=BASE.find(x=>x.id===id);
  const base=b?{id,n:b.n,con:b.con,cat:b.cat,sup:b.sup,pay:b.pay,use:Math.max(0,+(b.mq-b.par).toFixed(3)),par:b.par,st:b.st,p:b.p,u:b.u||'',pkN:b.pkN??null,pkU:b.pkU||'',ref:b.ref,isNew:false}:{id,n:'',con:'Al Matbakh',cat:'Food',sup:'',pay:'',use:null,par:null,st:null,p:null,u:'',pkN:null,pkU:'',isNew:true};
  return Object.assign(base,shared[id]||{},local[id]||{});
}
export function lines(){return ids().map(line).filter(l=>!l.off)}
export const slug=n=>'S-'+String(n||'').toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50);
export let SBASE=[];
export function setBase(lines){BASE=Array.isArray(lines)?lines.filter(l=>l&&l.id):[];const seen={};BASE.forEach(l=>{const n=(l.sup||'').trim();if(!n)return;const id=slug(n);if(!seen[id]){seen[id]={id,n,c:{}}}seen[id].c[l.pay||'']=(seen[id].c[l.pay||'']||0)+1});SBASE=Object.values(seen).map(x=>({id:x.id,n:x.n,terms:(x.c.pemo||0)>(x.c.credit||0)?'pemo':(x.c.credit?'credit':'')}))}
export function baseFrom(tab){return tab?Object.keys(tab).filter(k=>k!=='_month').map(k=>Object.assign({},tab[k],{id:tab[k].id||k})):null}
export function supRec(id){const b=SBASE.find(x=>x.id===id);return Object.assign({id,n:b?b.n:'',contact:'',phone:'',phone2:'',email:'',emirate:'',address:'',map:'',terms:b?b.terms:'',days:null,deliv:[],lead:null,minOrder:null,trn:'',licence:'',bankName:'',accName:'',iban:'',accNo:'',swift:'',cats:[],notes:''},supShared[id]||{},supLocal[id]||{})}
export function suppliers(){const ids=new Set(SBASE.map(b=>b.id));Object.keys(supShared).forEach(k=>ids.add(k));Object.keys(supLocal).forEach(k=>ids.add(k));
  const S=[...ids].map(supRec).filter(x=>!x.off);const names=new Set(S.map(x=>x.n.trim().toUpperCase()));
  lines().forEach(l=>{const n=String(l.sup||'').trim();if(n&&!names.has(n.toUpperCase())){names.add(n.toUpperCase());S.push(Object.assign(supRec(slug(n)),{n,implicit:true}))}});
  return S}
export function missingS(x){const m=[];if(!String(x.n||'').trim())m.push('name');if(!String(x.phone||'').trim())m.push('phone');if(!x.emirate)m.push('emirate');if(!x.terms)m.push('terms');if(x.terms==='credit'&&!(+x.days>0))m.push('days');if(!(x.cats||[]).length)m.push('cats');if(x.terms==='credit'&&canSeeBank()&&!String(x.iban||'').trim())m.push('iban');return m}
export function editS(id,patch){
  if(SHEET&&!editMode)return false;
  if(!me){toast(t('needName'));return false}
  const old=supRec(id),at=new Date().toISOString();
  if(patch.n!==undefined&&old.n&&patch.n&&patch.n!==old.n){lines().filter(l=>l.sup===old.n).forEach(l=>edit(l.id,{sup:patch.n}))}
  if(mode==='live'&&!SHEET){const cur=Object.assign({},supShared[id]||{},{n:old.n,terms:old.terms},patch,{who:me,at});supShared[id]=cur;storeSet(id,cur,'sup').catch(()=>toast(t('saveErr')))}
  else{supLocal[id]=Object.assign({},supLocal[id]||{},old.implicit&&!supShared[id]&&!supLocal[id]?{n:old.n}:{},patch,{who:me,at});ls('pp-slocal',supLocal);queueSave()}
  logAct('sup',id,patch);return true}
export let _lead=null;
export function leadOf(n){if(!_lead){_lead={};suppliers().forEach(x=>{if(+x.lead>0)_lead[(x.n||'').toUpperCase()]=+x.lead})}return _lead[String(n||'').toUpperCase()]||2}
export function smOf(l){return l.sm==='direct'||l.sm==='cycle'?l.sm:''}
export function cycOf(l){return Math.max(1,Math.round(+l.cyc||3))}
export function smName(l){const m=smOf(l);return m==='direct'?'Daily to branches':m==='cycle'?'Every '+cycOf(l)+' days':'Store stock'}
export function ropOf(l){const lead=leadOf(l.sup);return +((+l.par||0)+(+l.use||0)/30*lead).toFixed(1)}
export function stockState(l){if(smOf(l))return '';if(!(+l.use>0)&&!(+l.par>0))return '';const st=+l.st||0;if(st<(+l.par||0))return 'below';if(st<=ropOf(l))return 'order';return 'ok'}
export function calc(l){if(smOf(l)){const q=+(+l.use||0);return {q:+q.toFixed(3),v:q*(+l.p||0)}}const q=Math.max(0,(+l.use||0)+(+l.par||0)-(+l.st||0));return {q:+q.toFixed(3),v:q*(+l.p||0)}}
export function missing(l){const m=[];
  if(l.isNew&&!String(l.n||'').trim())m.push('name');
  const notNeeded=l.ok&&!(+l.use>0);
  if(notNeeded)return m;
  if(!(+l.p>0))m.push('price');if(!String(l.u||'').trim())m.push('unit');if(!(+l.pkN>0)||!l.pkU)m.push('pack');if(!String(l.sup||'').trim())m.push('sup');if(!l.pay)m.push('pay');
  if(!(+l.use>0))m.push('use');if(!smOf(l)&&!(+l.par>0))m.push('par');return m}
export function status(l){const m=missing(l);if(m.length)return 'missing';if(l.ok&&!(+l.use>0))return 'notneeded';return l.ok?'confirmed':'toconfirm'}
export const queue={},busy={};
export function edit(id,patch){
  if(SHEET&&!editMode)return false;
  if(!me){toast(t('needName'));const n=document.getElementById('me');n&&n.focus();return false}
  if(patch.st!==undefined&&patch.stAt===undefined)patch=Object.assign({},patch,{stAt:new Date().toISOString()});
  const cur=Object.assign({},shared[id]||{},local[id]||{},patch,{who:me,at:new Date().toISOString()});if(uid)cur.uid=uid;
  if(mode==='live'&&!SHEET){shared[id]=cur;delete local[id];queue[id]=cur;flush(id)}else{local[id]=Object.assign({},local[id]||{},patch,{who:me,at:cur.at});ls('pp-local',local);queueSave()}
  logAct('line',id,patch);return true}
export async function flush(id){if(busy[id]||!queue[id])return;busy[id]=true;const body=queue[id];delete queue[id];
  try{await storeSet(id,JSON.parse(JSON.stringify(body)))}
  catch(e){if(e&&e.code==='unavailable'){await new Promise(r=>setTimeout(r,800+Math.random()*800));try{await storeSet(id,body)}catch(e2){fail(id,body,e2)}}else fail(id,body,e)}
  busy[id]=false;if(queue[id])flush(id)}
export function viewOf(id,body){const l=Object.assign(line(id),body),c=calc(l);return {n:l.n,con:l.con,cat:l.cat,sup:l.sup,pay:l.pay,use:l.use,par:l.par,st:l.st,p:l.p,u:l.u,pkN:l.pkN,pkU:l.pkU,'Supply':smName(l),'Reorder point':ropOf(l),'Stock state':stockState(l),q:c.q,v:+c.v.toFixed(2),status:status(l)}}
export async function post(o){if(ERP){o=Object.assign({},o,{erp:ERP});delete o.pin}try{const r=await fetch(CFG.SHEET_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(o)});return await r.json()}catch(e){return {ok:false,error:'net'}}}
export async function startEdit(){
  const pp=document.getElementById('pin');pin=(pp&&pp.value.trim())||'';
  if(!pin){editMsg=t('needPin');render();return}
  editMsg=t('checking');render();const r=await post({pin,check:true});
  if(!r.ok){editMsg=errMsg(r.error);pin='';render();return}
  applyMe(r.me);try{sessionStorage.setItem('pp-pin',pin)}catch(_){}
  editMsg='';mode='loading';render();
  try{shared=await sheetLoad();mode='live';editMode=myRole!=='viewer'}catch(e){if(e.code==='pin'){signOut(errMsg(e.err));return}mode='offline'}
  render();sendLeftovers()}
export function applyMe(m){const was=myRole;if(m&&m.email)myEmail=String(m.email);if(m&&m.role){myRole=m.role;myBranch=m.branch||'';if(m.name){me=m.name;ls('pp-me',me)}}else if(!myRole)myRole='team';}
export function signOut(msg){pin='';clearSnap();bgDone();try{sessionStorage.removeItem('pp-pin')}catch(_){}editMode=false;myRole='';myBranch='';reqOpen=null;billOpen=null;shared={};supShared={};recShared={Evaluations:{},Deliveries:{},GRN:{},Transfers:{},Requests:{},POs:{}};supOpen=null;grnOpen=null;mode='login';editMsg=msg||'';unlocked=null;gateMsg=msg||'';if(msg&&gateSide)gateSide=gateSide;else gateSide=null;try{sessionStorage.removeItem('pp-ok')}catch(_){}render()}
export function errMsg(e){if(e==='erp'){setTimeout(erpGone,0);return t('erpExpired')}return e==='side'?t('pinNoSide'):e==='pin'?t('wrongPin'):e==='nopin'?t('noPinSet'):e==='net'?t('net'):e==='locked'?t('errLocked'):e==='role'?t('errRole'):e==='split'?t('errSplit'):e==='notready'?t('errNotready'):e==='paid'?t('errPaid'):t('oldScript')}
export const BANKF=['bankName','accName','iban','accNo','swift'];
export function canSeeBank(){return !SHEET||['admin','finance','team'].includes(myRole)}
export function canEl(el){const r=myRole;if(r==='admin'||r==='team')return true;if(!r||r==='viewer'||r==='branch')return false;
  const a=el.dataset.act||'',rk=el.dataset.rk||'',sf=el.dataset.sf;
  const grn=rk==='GRN'||['newgrn','gset','gdel','mdel','gstatus','gstock'].includes(a)||el.dataset.gl!==undefined||!!el.dataset.media||el.id==='gadd';
  const paid=grn&&el.dataset.rid?rec('GRN',el.dataset.rid).status==='paid':false;
  const deliv=rk==='Deliveries'||a==='newdeliv'||a==='ontime';
  if(r==='buyer'){if(grn)return a==='gset'&&el.dataset.k==='varOk'&&!paid;if(deliv)return false;if(sf&&BANKF.includes(sf))return false;return true}
  if(r==='store'){if(grn){if(paid)return false;if(a==='gstatus')return el.dataset.v!=='paid';if(a==='gset')return el.dataset.k!=='varOk';return true}if(deliv)return true;return el.dataset.f==='st'}
  if(r==='finance'){if(a==='gstatus')return el.dataset.v==='paid'&&!paid;return !!sf&&BANKF.includes(sf)}
  return false}
export function hideBank(P){P.querySelectorAll('h3.sec').forEach(h=>{if(h.textContent.trim()===t('secBank')){const c=h.closest('.card');if(c)c.innerHTML=`<h3 class="sec">${t('secBank')}</h3><p style="color:var(--fk-muted);font-size:13px;margin:0">${t('bankHidden')}</p>`}})}
export let qsT=null,saveAgain=false;
export function queueSave(){if(!SHEET||mode!=='live'||!editMode)return;clearTimeout(qsT);qsT=setTimeout(()=>saveAll({lines:!invEdit}),700)}
export async function sendLeftovers(){if(!SHEET||mode!=='live'||!editMode)return;const n=nUnsaved();if(!n)return;if(await saveAll({lines:!invEdit}))toast(n===1?t('sentOld1'):t('sentOld').replace('{n}',n))}
window.addEventListener('beforeunload',e=>{if(SHEET&&nUnsaved()){saveAll({lines:!invEdit});e.preventDefault();e.returnValue=''}});
export async function saveAll(opt){opt=opt||{};const withLines=opt.lines!==false;const ids=withLines?Object.keys(local):[],sids=Object.keys(supLocal);
  if(!(ids.length+sids.length+recPending()))return true;if(saving){saveAgain=true;return false}saving=true;render();
  const sent={l:Object.fromEntries(ids.map(i=>[i,local[i]])),s:Object.fromEntries(sids.map(i=>[i,supLocal[i]])),r:Object.fromEntries(Object.keys(recLocal).map(k=>[k,Object.assign({},recLocal[k]||{})]))};
  const items=ids.map(id=>{const data=JSON.parse(JSON.stringify(Object.assign({},shared[id]||{},local[id])));return {id,data,view:viewOf(id,data)}});
  sids.forEach(id=>{const r=supRec(id);const data=JSON.parse(JSON.stringify(Object.assign({},supShared[id]||{},{n:r.n,terms:r.terms},supLocal[id])));items.push({kind:'sup',id,data,view:supView(r)})});
  Object.keys(recLocal.GRN).forEach(id=>{const data=JSON.parse(JSON.stringify(rec('GRN',id)));const T=grnTot(data),o=grnOtif([data]);items.push({kind:'GRN',id,data,view:{'GRN no.':data.no,Date:data.date,Supplier:data.sup,'PO no.':data.po,'Invoice no.':data.inv,'Received by':data.by,'Ordered by':data.orderedBy,'On time':data.ontime,'Temp °C':data.temp,Lines:grnLines(data).length,'Qty received':T.r,'Qty rejected':T.rej,'Accepted value AED':+T.val.toFixed(2),'Price variances':T.varc,Outcome:grnOutcome(data),Status:grnStatus(data),OTIF:o.s,Photos:(data.media||[]).length,Items:grnLines(data).map(l=>l.name+' '+(l.recv??'')+'/'+(l.ord??'')+(+l.rej?' rej '+l.rej+' '+(l.reason||''):'')).join('; ')}})});
  ['Evaluations','Deliveries'].forEach(k=>Object.keys(recLocal[k]).forEach(id=>{const data=JSON.parse(JSON.stringify(rec(k,id)));items.push({kind:k,id,data,view:k==='Evaluations'?Object.assign({Supplier:data.sup,Date:data.date,'Evaluated by':data.by,Category:data.cat},Object.fromEntries(CRIT.map(([c])=>[c,data[c]])),{Score:evalScore(data),Band:band(evalScore(data))[1],Comment:data.note}):Object.assign({Supplier:data.sup,Date:data.date,Item:data.item,'Qty ordered':data.ord,'Qty received':data.recv,'Qty rejected':data.rej,'On time':data.ontime,'Invoice no.':data.inv},(o=>({'%Qty':o.q,'%Quality':o.ql,'%On time':o.tm,OTIF:o.s}))(otif([data])))})}));
  Object.keys(recLocal.POs||{}).forEach(id=>{const data=JSON.parse(JSON.stringify(rec('POs',id)));const tt=poTot(data);items.push({kind:'POs',id,data,view:{'LPO no.':data.no,Date:data.date,Supplier:data.sup,Source:(data.src||{}).no||(data.src||{}).type||'','Deliver to':data.deliverTo,'Delivery date':data.need,Lines:(data.lines||[]).length,'Subtotal AED':+tt.sub.toFixed(2),'VAT AED':+tt.vat.toFixed(2),'Total AED':+tt.tot.toFixed(2),Status:poStatus(data),'Issued by':data.issBy||'',Items:(data.lines||[]).map(l=>l.name+' x '+l.qty).join('; ')}})});
  Object.keys(recLocal.Requests||{}).forEach(id=>{const data=JSON.parse(JSON.stringify(rec('Requests',id)));items.push({kind:'Requests',id,data,view:{'Request no.':data.no,Date:data.date,'Requested by':data.by,Department:data.dept,Branch:data.branch,Type:data.kind,'CAPEX/OPEX':data.cost,Title:data.title,Qty:data.qty,Unit:data.unit,'Needed by':data.needBy,Urgency:data.urg,Status:data.status,'Assigned to':data.buyer}})});
  Object.keys(recLocal.Transfers||{}).forEach(id=>{const data=JSON.parse(JSON.stringify(rec('Transfers',id)));items.push({kind:'Transfers',id,data,view:tView(data)})});
  const r=await post({pin,side,batch:OMAN()?items.map(it=>Object.assign({},it,{kind:omKind(it.kind)})):items});
  if(r.ok){if(opt.inv)invEdit=false;items.forEach(it=>{if(it.kind==='Evaluations'||it.kind==='Deliveries'||it.kind==='GRN'||it.kind==='Transfers'||it.kind==='Requests'||it.kind==='POs')recShared[it.kind][it.id]=it.data;else if(it.kind==='sup')supShared[it.id]=it.data;else shared[it.id]=it.data});
    Object.keys(sent.l).forEach(i=>{if(local[i]===sent.l[i])delete local[i]});Object.keys(sent.s).forEach(i=>{if(supLocal[i]===sent.s[i])delete supLocal[i]});
    Object.keys(sent.r).forEach(k=>Object.keys(sent.r[k]).forEach(i=>{if(recLocal[k]&&recLocal[k][i]===sent.r[k][i])delete recLocal[k][i]}));
    ls('pp-rlocal',recLocal);ls('pp-local',local);ls('pp-slocal',supLocal);if(opt.loud)toast(t('saved'))}
  else if(r.error==='pin'||r.error==='locked'){saving=false;signOut(errMsg(r.error));return false}
  else{toast(errMsg(r.error));clearTimeout(qsT);qsT=setTimeout(()=>saveAll({lines:!invEdit}),15000)}
  saving=false;if(saveAgain){saveAgain=false;queueSave()}render();return !!r.ok}
export function tView(d){const T2=tTot(d),b=BRANCHES.find(x=>x[0]===d.branch);return {'TN no.':d.no,Date:d.date,Branch:b?b[1]:d.branch,'Needed by':d.need,Status:d.status,'Requested by':d.reqBy,'Approved by':d.apprBy,'Issued by':d.issBy,'Issued at':d.issAt,'Received by':d.rcvBy,'Received at':d.rcvAt,Lines:tLines(d).length,'Qty requested':T2.req,'Qty issued':T2.iss,'Qty received':T2.rcv,'Value AED':+T2.val.toFixed(2),Shortages:T2.short,Items:tLines(d).map(l=>(l.name||'')+' × '+(l.iss??l.req??'')).join('; ')}}
export function nUnsaved(){return Object.keys(local).length+Object.keys(supLocal).length+recPending()}
export function confirmBox(msg,yes,fn,no,safe){const o=document.createElement('div');o.className='cfm';o.setAttribute('role','alertdialog');o.setAttribute('aria-modal','true');
  o.innerHTML=`<div class="cfm-b"><p></p><div class="cfm-r"><button class="btn" data-x="no">${no||t('rmNo')}</button><button class="btn ${safe?'btn-accent':'btn-danger'}" data-x="yes"></button></div></div>`;
  o.querySelector('p').textContent=msg;o.querySelector('[data-x=yes]').textContent=yes;
  const close=()=>{o.remove();document.removeEventListener('keydown',esc_)},esc_=e=>{if(e.key==='Escape')close()};document.addEventListener('keydown',esc_);
  o.addEventListener('click',e=>{const x=e.target.closest('[data-x]');if(e.target===o||(x&&x.dataset.x==='no'))close();else if(x&&x.dataset.x==='yes'){close();fn()}});
  document.body.appendChild(o);o.querySelector('[data-x=no]').focus()}
export function cancelEdits(){invEdit=false;local={};supLocal={};recLocal={Evaluations:{},Deliveries:{},GRN:{},Transfers:{},Requests:{},POs:{}};ls('pp-rlocal',recLocal);ls('pp-local',local);ls('pp-slocal',supLocal);render()}
export function supView(x){const L=lines().filter(l=>l.sup===x.n);const tx=v=>v?"'"+v:'';const dl=Array.isArray(x.deliv)?x.deliv.map(d=>DAYS.find(z=>z[0]===d)?.[1]||d).join(', '):(x.deliv||'');
  return {n:x.n,contact:x.contact,phone:x.phone,'Phone 2':tx(x.phone2),email:x.email,'Emirate':x.emirate,'Address':x.address,'Map link':x.map,terms:x.terms,days:x.days,deliv:dl,lead:x.lead,'Minimum order AED':x.minOrder,trn:x.trn,'Trade licence':tx(x.licence),'Bank':x.bankName,'Account name':x.accName,'IBAN':x.iban,'Account no.':tx(x.accNo),'SWIFT':x.swift,supplies:(x.cats||[]).map(c=>CATS.find(z=>z[0]===c)?.[1]||c).join(', '),notes:x.notes,items:L.length,v:+L.reduce((a,l)=>a+calc(l).v,0).toFixed(2)}}
export async function storeSet(id,body,kind){
  if(!SHEET)return db.collection((OMAN()?'oman_':'')+(({sup:'suppliers',GRN:'grn',Evaluations:'evaluations',Deliveries:'deliveries',Transfers:'transfers',Requests:'requests',POs:'pos'})[kind]||'lines')).doc(id).set(body);
  const l=Object.assign(line(id),body),c=calc(l);
  const view={n:l.n,con:l.con,cat:l.cat,sup:l.sup,pay:l.pay,use:l.use,par:l.par,st:l.st,p:l.p,u:l.u,pkN:l.pkN,pkU:l.pkU,'Supply':smName(l),'Reorder point':ropOf(l),'Stock state':stockState(l),q:c.q,v:+c.v.toFixed(2),status:status(l)};
  const r=await fetch(CFG.SHEET_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({pin,side,id,data:body,view})});
  const j=await r.json().catch(()=>({ok:false}));
  if(!j.ok){const e=new Error(j.error||'save');e.code=j.error==='pin'?'pin':'unavailable';throw e}}
export let VER='',PRELOAD=null;
export const SAME={same:true};
export const IDB={p:null,open(){return this.p||(this.p=new Promise(res=>{try{const q=indexedDB.open('forka-procurement',1);q.onupgradeneeded=()=>q.result.createObjectStore('kv');q.onsuccess=()=>res(q.result);q.onerror=()=>res(null)}catch(e){res(null)}}))},
  async get(k){const d=await this.open();if(!d)return null;return new Promise(res=>{try{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result||null);q.onerror=()=>res(null)}catch(e){res(null)}})},
  async set(k,v){const d=await this.open();if(!d)return;try{d.transaction('kv','readwrite').objectStore('kv').put(v,k)}catch(e){}},
  async del(k){const d=await this.open();if(!d)return;try{d.transaction('kv','readwrite').objectStore('kv').delete(k)}catch(e){}}};
export let SNAPOFF=false,BGWAIT=false;
export function keepSnap(j){if(ERP&&!SNAPOFF&&j&&j.ok&&j.lines&&j.me)IDB.set('snap',{email:String(j.me.email||'').trim().toLowerCase(),erp:ERP,r:j})}
export function clearSnap(){SNAPOFF=true;IDB.del('snap')}
export function bgDone(){BGWAIT=false;const e=document.getElementById('bgst');if(e)e.remove()}
export function accWho(){const u=CFG.ACCOUNTS_URL;if(!u||!ERP)return Promise.resolve(null);
  const ac=typeof AbortController==='function'?new AbortController():null;let tm;
  const ask=fetch(u,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'who',token:ERP}),signal:ac?ac.signal:undefined})
    .then(r=>r.json()).then(j=>j&&j.ok&&j.me&&j.me.email?j.me:null).catch(()=>null);
  return Promise.race([ask,new Promise(res=>{tm=setTimeout(()=>{try{ac&&ac.abort()}catch(_){}res(null)},2500)})]).finally(()=>clearTimeout(tm))}
export function snapFor(s,w,want){if(!s||!s.r||!s.r.me)return null;
  if(s.erp&&s.erp===ERP)return s.r;
  if(!w||!s.email||String(w.email).trim().toLowerCase()!==s.email)return null;
  if((w.status&&w.status!=='active')||!(w.apps&&w.apps.proc))return null;
  const sd=(w.sides||[]).filter(x=>SIDES[x]);if(!sd.length||(want&&sd.indexOf(want)<0))return null;
  return Object.assign({},s.r,{me:Object.assign({},s.r.me,{sides:sd})})}
export const wantCeo=()=>side==='ceo'&&(tab==='people'||tab==='activity');
export async function sheetLoad(light){
  if(PRELOAD){const j0=PRELOAD;PRELOAD=null;return applyLoad(j0)}
  let j=await post({pin,side,load:true,ver:light&&!wantCeo()&&BASE.length?VER:'',ceo:wantCeo()});   // no item list yet (e.g. a saved copy from before it moved to the Base tab): ask for everything, never "anything new?"
  if(j.ok&&j.same){applyMe(j.me);return SAME}
  keepSnap(j);
  if(!j.ok&&(j.error==='id'||j.error==='bad')){const r=await fetch(CFG.SHEET_URL+(CFG.SHEET_URL.includes('?')?'&':'?')+'t='+Date.now());j=await r.json()}  // old v3 script: open read
  if(!j.ok){const e=new Error('load');e.err=j.error;e.code=['pin','locked','nopin'].includes(j.error)?'pin':j.error==='net'?'net':'load';throw e}
  return applyLoad(j)}
export function applyLoad(j){
  if(j.ver)VER=j.ver;
  {const b=baseFrom(j.tabs&&j.tabs.Base);if(b)setBase(b);else if(j.tabs&&!BASE.length)setTimeout(()=>toast(t('baseMissing')),400)}
  applyMe(j.me);supShared=j.suppliers||{};if(j.tabs&&j.tabs.People){PEOPLE={};j.tabs.People.forEach((u,i)=>PEOPLE['U'+i]=Object.assign({id:'U'+i,active:true},u))}if(j.tabs&&j.tabs.Activity){ACT={};j.tabs.Activity.forEach((a,i)=>ACT['A'+i]=Object.assign({id:'A'+i},a))}if(j.tabs){recShared.Evaluations=j.tabs.Evaluations||{};recShared.Deliveries=j.tabs.Deliveries||{};recShared.GRN=j.tabs.GRN||{};recShared.Transfers=j.tabs.Transfers||{};
    // Requests and purchase orders were saved but never read back, so after a reload they vanished (and LPOs could not be found or matched).
    recShared.Requests=j.tabs.Requests||{};recShared.POs=j.tabs.POs||{}}
  // Oman store: its own items, suppliers, LPOs and GRNs, kept in their own Sheet tabs
  if(j.tabs){const T=j.tabs;inRegion('oman',()=>{shared=T.OmanItems||{};supShared=T.OmanSuppliers||{};recShared=Object.assign(emptyRec(),{GRN:T.OmanGRN||{},POs:T.OmanPOs||{},Evaluations:T.OmanEvaluations||{},Deliveries:T.OmanDeliveries||{},Transfers:T.OmanTransfers||{}})})}
  if(REGION==='oman'){const L=shared;inRegion('uae',()=>{shared=j.lines||{}});return L}
  return j.lines||{}}
export function fail(id,body,e){if(e&&e.code==='pin'){pinNeeded=true;setTimeout(render,0);local[id]=Object.assign({},local[id]||{},body);ls('pp-local',local);toast(t('badPin'));return}local[id]=Object.assign({},local[id]||{},body);ls('pp-local',local);if(e&&(e.code==='invalid_argument'||e.code==='revoked')){mode='local';render()}toast(t('saveErr'))}
export const TAB_IC={prq:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16M4 12h10M4 18h7"/><circle cx="18" cy="16" r="3"/></svg>`,pon:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4v4h4M12 8v4l3 2"/></svg>`,lpo:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h8l4 4v14H6Z"/><path d="M14 3v4h4M9 12h6M9 16h4"/></svg>`,fill:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8l8-4 8 4v8l-8 4-8-4Z"/><path d="M4 8l8 4 8-4M12 12v8"/></svg>`,sups:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.6"/><circle cx="17" cy="17.5" r="1.6"/></svg>`,ana:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h16M7 16v-5M12 16V7M17 16v-8"/></svg>`,sum:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>`,how:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .9-1 1.6v.4M12 17h.01"/></svg>`,rnew:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/></svg>`,rmine:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h4"/></svg>`,appr:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M8.8 12l2.2 2.2 4.4-4.4"/></svg>`,people:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="9" r="3"/><path d="M3 19c0-3 3-5 6-5s6 2 6 5"/><circle cx="17" cy="8" r="2.4"/><path d="M16 13.5c2.8 0 5 1.6 5 4.5"/></svg>`,activity:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h4l3-7 4 14 3-7h4"/></svg>`,moves:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7h12l-3-3M17 17H5l3 3"/></svg>`,req:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z"/><path d="M9 8h6M9 12h6"/></svg>`,grn:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16l-1.5 11a2 2 0 0 1-2 1.7H7.5a2 2 0 0 1-2-1.7Z"/><path d="M9 11l2 2 4-4"/></svg>`,pay:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M16 12.5h2M3 9h18"/></svg>`,soa:`<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h3"/></svg>`};
export function tabName(k){return t(k==='grn'?'aGrn':OMAN()&&k==='req'?'omReq':k)}
export function pSide(on){document.body.classList.toggle('pside-open',!!on)}
export function pMini(on){const b=document.body;on=on===undefined?!b.classList.contains('pside-mini'):on;b.classList.toggle('pside-mini',on);try{localStorage.setItem('pp-side',on?'mini':'full')}catch(_){}}
try{if(localStorage.getItem('pp-side')==='mini')document.addEventListener('DOMContentLoaded',()=>document.body.classList.add('pside-mini'))}catch(_){}
document.addEventListener('keydown',e=>{if(e.key==='Escape')pSide(false)});
export function stockVal(L){let v=0,noP=0,notC=0;const bc={},bk={},items=[];
  L.forEach(l=>{if(smOf(l)==='direct')return;if(l.st===undefined||l.st===null||l.st===''){notC++;return}const st=+l.st||0,pr=+l.p||0;if(st>0&&!pr){noP++;return}const x=st*pr;if(!(x>0))return;
    v+=x;const c=l.con||'-',k=l.cat||'-';bc[c]=(bc[c]||0)+x;bk[k]=(bk[k]||0)+x;items.push([l,x])});
  items.sort((a,b)=>b[1]-a[1]);return {v,noP,notC,bc,bk,items}}
Object.assign(T.en,{ivCols:'Columns',ivPinned:'always shown',ivViews:'Saved views',ivViewPick:'Saved views',ivSaveView:'Save view',ivViewName:'Name for this view',ivViewOk:'Save',ivViewNo:'Cancel',ivDelView:'Delete view',ivViewSaved:'View saved',ivViewDel:'View deleted',ivReorder:'Items to reorder',ivReorderH:'At or below the reorder point',ivDone:'Lines confirmed',ivDetails:'Details',ivClose:'Close',ivConv:'Conversion',ivUsage:'Usage and reserve',ivSupply:'Supply',ivSm:'Supply mode',ivNowT:'Stock and order',ivPrice:'Price',ivNameT:'New item',ivCount:'{n} items',ivLead:'Supplier lead time: {n} days',ivNoConv:'Set the unit and the pack to see the conversion.',ivLocked:'Locked. Press Edit to change items, stock counts or prices.',ivPay:'Pemo {a} · Credit {b} · Not set {c}',ivEditing:'Editing',ivOpen:'Open details',ivPerDay:'{q} {u} per day',ivDaysLeft:'Days left'});
Object.assign(T.ar,{ivCols:'الأعمدة',ivPinned:'يظهر دائماً',ivViews:'العروض المحفوظة',ivViewPick:'العروض المحفوظة',ivSaveView:'حفظ العرض',ivViewName:'اسم هذا العرض',ivViewOk:'حفظ',ivViewNo:'إلغاء',ivDelView:'حذف العرض',ivViewSaved:'تم حفظ العرض',ivViewDel:'تم حذف العرض',ivReorder:'أصناف تحتاج طلب',ivReorderH:'عند نقطة الطلب أو أقل',ivDone:'سطور مؤكدة',ivDetails:'التفاصيل',ivClose:'إغلاق',ivConv:'التحويل',ivUsage:'الاستهلاك والاحتياطي',ivSupply:'التوريد',ivSm:'طريقة التوريد',ivNowT:'المخزون والطلب',ivPrice:'السعر',ivNameT:'صنف جديد',ivCount:'{n} صنف',ivLead:'مدة توريد المورد: {n} أيام',ivNoConv:'حدد الوحدة والعبوة لترى التحويل.',ivLocked:'مقفل. اضغط تعديل لتغيير الأصناف أو الجرد أو الأسعار.',ivPay:'Pemo {a} · آجل {b} · غير محدد {c}',ivEditing:'وضع التعديل',ivOpen:'فتح التفاصيل',ivPerDay:'{q} {u} في اليوم',ivDaysLeft:'الأيام المتبقية'});
export const IV_ALL=120,IV_BUF=900,IV_MIN=60;
export const IV_COLS=['item','stock','sup','sm','pay','use','par','rop','buy','p','unit','pack','bud','status'];
export const IV_DEF=['item','stock','sup','rop','buy','p','bud','status'],IV_PIN=['item','stock'];
export let invOpen=null,ivMenu=false,ivNaming=false,invR=[],invWin={a:0,b:0},invH={},invHK='',invAvg=0;
export const IVI={
 cols:'<path d="M4 5h16v14H4z"/><path d="M9.5 5v14M14.5 5v14"/>',
 open:'<path d="M4 5h16v14H4z"/><path d="M14 5v14"/><path d="M9 10l2 2-2 2"/>',
 x:'<path d="M6 6l12 12M18 6L6 18"/>',
 view:'<path d="M7 4h10v16l-5-4-5 4z"/>',
 trash:'<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>',
 check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>'};
export function ivCols(){const s=ls2('pp-inv-cols');const on=Array.isArray(s)?s:IV_DEF;return IV_COLS.filter(k=>IV_PIN.includes(k)||on.includes(k)||(ivCard()&&['rop','buy','status'].includes(k)))}
export function ivViews(){const v=ls2('pp-inv-views');return Array.isArray(v)?v:[]}
export const IV_FK=['q','st','con','sup','pay','stk'];
export function ivFl(){const o={};IV_FK.forEach(k=>o[k]=fl[k]);return o}
export function ivCurView(){const c=JSON.stringify(ivFl());return ivViews().findIndex(v=>JSON.stringify(Object.assign({q:'',st:'all',con:'',sup:'',pay:'',stk:''},v.fl))===c)}
export function ivColName(k){return k==='sm'?t('ivSm'):t({item:'item',stock:'stock',sup:'supplier',pay:'payment',use:'use',par:'par',rop:'rop',buy:'buy',p:'price',unit:'unit',pack:'pack',bud:'bud',status:'status'}[k])}
export function ivCard(){try{return matchMedia('(max-width:639px)').matches}catch(_){return false}}
export function ivHt(id){return invH[id]||invAvg||(ivCard()?150:64)}
export function ivRange(st,h){const n=invR.length;if(n<=IV_ALL)return {a:0,b:n};
  let y=0,a=-1,b=n;for(let i=0;i<n;i++){const hh=ivHt(invR[i].id);if(a<0&&y+hh>=st-IV_BUF)a=i;if(y>st+h+IV_BUF){b=i;break}y+=hh}
  if(a<0)a=Math.max(0,n-IV_MIN);if(b-a<IV_MIN)b=Math.min(n,a+IV_MIN);if(b-a<IV_MIN)a=Math.max(0,b-IV_MIN);return {a,b}}
export function ivPad(a,b){let t0=0,t1=0;for(let i=0;i<a;i++)t0+=ivHt(invR[i].id);for(let i=b;i<invR.length;i++)t1+=ivHt(invR[i].id);return [t0,t1]}
export const ivB=(n,d)=>`<bdi class="ivn">${fmt(n,d)}</bdi>`;
export function ivConvTxt(l){return l.u&&+l.pkN>0&&l.pkU?`1 ${U(l.u)} = ${ivB(+l.pkN,l.pkN%1?2:0)} ${U(l.pkU)}`:''}
export function ivPost(root){
  if(SHEET){if(!editMode)root.querySelectorAll(EDIT_SEL).forEach(e=>e.disabled=true);else root.querySelectorAll(EDIT_SEL).forEach(e=>{if(!canEl(e))e.disabled=true});
    Object.entries(local).forEach(([id,p])=>Object.keys(p).forEach(f=>root.querySelectorAll(`[data-id="${CSS.escape(id)}"][data-f="${f}"]`).forEach(el=>el.classList.add('chg'))))}
  if(!invEdit)root.querySelectorAll('[data-f],button[data-act="ok"],button[data-act="useprice"]').forEach(e=>e.disabled=true);
  if(OMAN())omr(root)}
export function ivMeasure(w){let s=0,n=0;w.querySelectorAll('tbody tr[data-inv]').forEach(r=>{const h=r.offsetHeight;if(h>0){invH[r.dataset.inv]=h;s+=h;n++}});
  if(n){const all=Object.values(invH);invAvg=all.reduce((a,b)=>a+b,0)/all.length}
  const tb=w.querySelector('table');if(tb){const [a,b]=ivPad(invWin.a,invWin.b);tb.style.marginTop=a+'px';tb.style.marginBottom=b+'px'}}
export function ivPin(w){const th=w.querySelector('th.pin1');if(th)w.style.setProperty('--pin1w',th.offsetWidth+'px')}
export function invAfter(P){const top=document.getElementById('top');P.style.setProperty('--invtop',((top&&top.offsetHeight)||0)+'px');
  const dr=P.querySelector('.invdr');if(dr){if(!invEdit)dr.querySelectorAll('[data-f],button[data-act="ok"],button[data-act="useprice"]').forEach(e=>e.disabled=true);
    if(SHEET)Object.entries(local).forEach(([id,p])=>Object.keys(p).forEach(f=>dr.querySelectorAll(`[data-id="${CSS.escape(id)}"][data-f="${f}"]`).forEach(el=>el.classList.add('chg'))))}
  const w=P.querySelector('.tbl-wrap.inv');if(w){ivPin(w);ivMeasure(w)}}
export function ivPaint(w){const n=invR.length;if(n<=IV_ALL||!w.isConnected)return;const st=w.scrollTop,h=w.clientHeight;
  const [t0]=ivPad(invWin.a,invWin.b);let t1=t0;for(let i=invWin.a;i<invWin.b;i++)t1+=ivHt(invR[i].id);
  if((invWin.a===0||st-200>=t0)&&(invWin.b===n||st+h+200<=t1))return;
  const tb=w.querySelector('tbody');if(!tb)return;const ae=document.activeElement;if(ae&&tb.contains(ae))ae.blur();
  invWin=ivRange(st,h);paint(tb,invR.slice(invWin.a,invWin.b).map(ivRow));ivPost(tb);ivMeasure(w)}
export let ivRaf=0;
document.addEventListener('scroll',e=>{const w=e.target;if(w&&w.classList&&w.classList.contains('inv')&&w.classList.contains('tbl-wrap')){if(ivRaf)return;ivRaf=requestAnimationFrame(()=>{ivRaf=0;ivPaint(w)})}},true);
window.addEventListener('resize',()=>{if(tab==='fill'&&unlocked&&document.querySelector('#page .tbl-wrap.inv')){const k=[lang,invEdit?1:0,ivCard()?1:0,ivCols().join(',')].join('|');if(k!==invHK)render();else{const w=document.querySelector('#page .tbl-wrap.inv');ivPin(w);ivPaint(w)}}});
export function ivSaveView(){const el=document.getElementById('ivvname');const name=(el&&el.value||'').trim().slice(0,40);if(!name){if(el){el.classList.add('miss');el.focus()}return}
  const v=ivViews().filter(x=>x.name!==name);v.push({name,fl:ivFl()});ls2('pp-inv-views',v);ivNaming=false;toast(t('ivViewSaved'));render()}
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('[data-tab]')){invOpen=null;ivMenu=false;ivNaming=false}if(!unlocked||tab!=='fill'){if(tab!=='fill')invOpen=null;return}
  const b=e.target.closest('button');const a=b&&b.dataset.act;
  if(ivMenu&&!e.target.closest('.ivmw')){ivMenu=false;render();if(!a)return}
  if(a==='ivcols'){ivMenu=!ivMenu;render();return}
  if(a==='invopen'){invOpen=b.dataset.id;render();const d=document.querySelector('.invdr .ivx');d&&d.focus({preventScroll:true});return}
  if(a==='invclose'){const id=invOpen;invOpen=null;render();const o=id&&document.querySelector(`.ivopen[data-id="${CSS.escape(id)}"]`);o&&o.focus({preventScroll:true});return}
  if(a==='ivreorder'){fl.stk=fl.stk==='order'?'':'order';render();return}
  if(a==='ivsaveview'){ivNaming=true;render();const i=document.getElementById('ivvname');i&&i.focus();return}
  if(a==='ivviewno'){ivNaming=false;render();return}
  if(a==='ivviewok'){ivSaveView();return}
  if(a==='ivdelview'){const i=ivCurView();if(i>=0){const v=ivViews();v.splice(i,1);ls2('pp-inv-views',v);toast(t('ivViewDel'));render()}return}
  const tr=e.target.closest('.inv tbody tr[data-inv]');
  if(tr&&!e.target.closest('button,input,select,textarea,a,label')){invOpen=tr.dataset.inv;render()}});
document.addEventListener('change',e=>{const el=e.target;
  if(el.dataset&&el.dataset.ivcol){const on=new Set(ivCols());if(el.checked)on.add(el.dataset.ivcol);else on.delete(el.dataset.ivcol);ls2('pp-inv-cols',IV_COLS.filter(k=>on.has(k)));render();const c=document.querySelector(`[data-ivcol="${el.dataset.ivcol}"]`);c&&c.focus();return}
  if(el.id==='ivview'){const v=ivViews()[+el.value];if(el.value!==''&&v){Object.assign(fl,{q:'',st:'all',con:'',sup:'',pay:'',stk:''},v.fl);render()}}});
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&e.target.id==='ivvname'){e.preventDefault();ivSaveView();return}
  if(e.key==='Escape'&&tab==='fill'&&!document.querySelector('.cfm')){if(ivMenu){ivMenu=false;render();return}if(ivNaming&&e.target.id==='ivvname'){ivNaming=false;render();return}if(invOpen){const id=invOpen;invOpen=null;render();const o=document.querySelector(`.ivopen[data-id="${CSS.escape(id)}"]`);o&&o.focus({preventScroll:true})}}});
export function vSups(){return supOpen?vSupPage(supRec(supOpen)):vSupList()}
export function emi(e){const x=EMIRATES.find(z=>z[0]===e);return x?(lang==='ar'?x[1]:x[0]):(e||'')}
export let REGION='uae';
export const RS={};
export function emptyRec(){return {Evaluations:{},Deliveries:{},GRN:{},Transfers:{},Requests:{},POs:{}}}
export const OM_GOV=[['Muscat','مسقط'],['Dhofar','ظفار'],['Musandam','مسندم'],['Al Buraimi','البريمي'],['Ad Dakhiliyah','الداخلية'],['North Al Batinah','شمال الباطنة'],['South Al Batinah','جنوب الباطنة'],['South Ash Sharqiyah','جنوب الشرقية'],['North Ash Sharqiyah','شمال الشرقية'],['Ad Dhahirah','الظاهرة'],['Al Wusta','الوسطى']];
export function regionNow(){return {BASE,SBASE,shared,local,supShared,supLocal,recShared,recLocal,BRANCHES,LPLOC,EMIRATES}}
export function regionNew(r){return {BASE:[],SBASE:[],shared:{},local:ls2('pp-local-'+r)||{},supShared:{},supLocal:ls2('pp-slocal-'+r)||{},recShared:emptyRec(),recLocal:Object.assign(emptyRec(),ls2('pp-rlocal-'+r)||{}),
  BRANCHES:[['oman','Oman restaurant kitchen','مطبخ مطعم عُمان']],LPLOC:[['oman','Oman restaurant store','مخزن مطعم عُمان']],EMIRATES:OM_GOV}}
export function setRegion(r){if(r===REGION)return;RS[REGION]=regionNow();const x=RS[r]||regionNew(r);
  ({BASE,SBASE,shared,local,supShared,supLocal,recShared,recLocal,BRANCHES,LPLOC,EMIRATES}=x);REGION=r;_lead=null;rowRank=null;supRank=null;poAutoDone=false}
export function inRegion(r,fn){const cur=REGION;setRegion(r);try{fn()}finally{setRegion(cur)}}
export const OMAN=()=>REGION==='oman';
export const omKind=k=>!k||k==='line'?'OmanItems':k==='sup'?'OmanSuppliers':'Oman'+k;
export function omr(root){const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))if(n.nodeValue.indexOf('AED')>=0)n.nodeValue=n.nodeValue.replace(/AED/g,'OMR').replace(/درهم/g,'ر.ع');
  root.querySelectorAll('[placeholder*="AED"]').forEach(e=>e.placeholder=e.placeholder.replace(/AED/g,'OMR'))}
export let anaTab='abc',abcF='',recShared={Evaluations:{},Deliveries:{},GRN:{},Transfers:{},Requests:{},POs:{}},recLocal={Evaluations:{},Deliveries:{},GRN:{},Transfers:{},Requests:{},POs:{}},evalOpen=null,delivOpen=null;
export const CRIT=[['quality',30],['price',20],['delivery',20],['service',10],['capacity',10],['compliance',10]];
export function rec(kind,id){return Object.assign({},recShared[kind][id]||{},recLocal[kind][id]||{})}
export function recs(kind){const ids=new Set([...Object.keys(recShared[kind]),...Object.keys(recLocal[kind])]);return [...ids].map(id=>Object.assign({id},rec(kind,id))).filter(x=>!x.off)}
export function editR(kind,id,patch){if(SHEET&&!editMode)return false;if(!me){toast(t('needName'));return false}
  const at=new Date().toISOString();
  if(mode==='live'&&!SHEET){const cur=Object.assign({},recShared[kind][id]||{},patch,{who:me,at});recShared[kind][id]=cur;storeSet(id,cur,kind).catch(()=>toast(t('saveErr')))}
  else{recLocal[kind][id]=Object.assign({},recLocal[kind][id]||{},patch,{who:me,at});ls('pp-rlocal',recLocal);queueSave()}logAct(kind,id,patch);return true}
export function recPending(){return Object.keys(recLocal.Evaluations).length+Object.keys(recLocal.Deliveries).length+Object.keys(recLocal.GRN).length+Object.keys(recLocal.Transfers||{}).length+Object.keys(recLocal.Requests||{}).length+Object.keys(recLocal.POs||{}).length}
export function evalScore(e){let s=0,w=0;CRIT.forEach(([k,wt])=>{if(+e[k]>0){s+=+e[k]*wt;w+=wt}});return w===100?+(s/100).toFixed(2):null}
export function band(sc){if(sc==null)return ['b-mute',t('noScore')];if(sc>=4.5)return ['b-ok',t('bPref')];if(sc>=3.5)return ['b-ok',t('bAppr')];if(sc>=2.5)return ['b-warn',t('bWatch')];return ['b-bad',t('bRepl')]}
export function otif(list){let o=0,r=0,rej=0,ot=0;list.forEach(d=>{const R=+d.recv||0;o+=+d.ord||0;r+=R;rej+=Math.min(R,+d.rej||0);if(d.ontime==='yes')ot+=R});
  const q=o?r/o:null,ql=r?(r-rej)/r:null,tm=r?ot/r:null;return {o,r,rej,q,ql,tm,s:q!=null&&ql!=null&&tm!=null?q*ql*tm:null,n:list.length}}
export const pct=x=>x==null?'–':Math.round(x*100)+'%';
export function abc(){const L=lines().map(l=>({l,v:(+l.use||0)*(+l.p||0)})).filter(x=>x.v>0).sort((a,b)=>b.v-a.v);const tot=L.reduce((a,x)=>a+x.v,0);let cum=0;
  L.forEach(x=>{cum+=x.v;x.cum=tot?cum/tot:0;x.cls=x.cum-x.v/tot<0.8?'A':x.cum-x.v/tot<0.95?'B':'C'});return {L,tot}}
export function supScore(n){const E=recs('Evaluations').filter(e=>e.sup===n&&evalScore(e)!=null).sort((a,b)=>(b.date||'')>(a.date||'')?1:-1);return E[0]?evalScore(E[0]):null}
export let grnOpen=null,grnDoc=false;
export const mediaMem={};
export const REASONS=[['damaged','Damaged','تالف'],['expired','Expired / short life','منتهي / صلاحية قصيرة'],['temp','Wrong temperature','حرارة غير مناسبة'],['wrong','Wrong item / spec','صنف أو مواصفات خطأ'],['short','Short / missing','ناقص'],['quality','Poor quality','جودة ضعيفة'],['other','Other','أخرى']];
export function grnLines(g){return Array.isArray(g.lines)?g.lines:[]}
export function grnTot(g){let o=0,r=0,rej=0,val=0,varc=0;grnLines(g).forEach(l=>{o+=+l.ord||0;r+=+l.recv||0;rej+=Math.min(+l.recv||0,+l.rej||0);const acc=Math.max(0,(+l.recv||0)-(+l.rej||0));val+=acc*(+l.price||0);if(l.plan>0&&+l.price>0&&Math.abs(+l.price/l.plan-1)>0.01)varc++});return {o,r,rej,val,varc}}
export function grnOtif(G){const L=[];G.forEach(g=>grnLines(g).forEach(l=>L.push({ord:l.ord,recv:l.recv,rej:l.rej,ontime:g.ontime})));return otif(L)}
export function grnOutcome(g){const T=grnTot(g);if(!T.r)return '';if(T.rej>=T.r)return 'rejected';if(T.rej>0||T.r<T.o)return 'part';return 'accepted'}
export function grnChecks(g){const T=grnTot(g);return [['inv',!!String(g.inv||'').trim()],['lines',grnLines(g).length>0&&grnLines(g).every(l=>l.recv!=null&&l.recv!==''&&l.ord!=null&&l.ord!=='')],['price',T.varc===0||g.varOk==='yes'],['photos',!(T.rej>0)||(g.media||[]).length>0],['signed',!(T.rej>0)||g.signed==='yes'],['split',!g.by||!g.orderedBy||g.by.trim().toUpperCase()!==g.orderedBy.trim().toUpperCase()]]}
export function grnStatus(g){if(g.status==='paid')return 'paid';if(!grnLines(g).length||g.status!=='received')return 'draft';return grnChecks(g).every(c=>c[1])?'ready':'hold'}
export const GST={draft:['b-mute','gDraft'],hold:['b-warn','gHold'],ready:['b-ok','gReady'],paid:['b-ok','gPaid']};
export async function addMedia(id,files){const g=rec('GRN',id);const list=[...(g.media||[])];
  for(const f of files){const mid='M-'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);let size=f.size,type=f.type||'';
    if(type.startsWith('image/')){try{const url=URL.createObjectURL(f);const img=await new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=url});const k=Math.min(1,1600/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);const d=c.toDataURL('image/jpeg',0.78);mediaMem[mid]=d;size=Math.round(d.length*0.75);type='image/jpeg';URL.revokeObjectURL(url)}catch(e){toast('✗ '+f.name);continue}}
    else if(type.startsWith('video/')){if(f.size>25*1048576){toast(t('vidBig'));continue}mediaMem[mid]=URL.createObjectURL(f)}else continue;
    list.push({id:mid,name:f.name,type,size,at:new Date().toISOString()})}
  editR('GRN',id,{media:list});render()}
export let scanBusy=false,scanMsg='';
export async function scanAvail(){try{const C=window.claude;if(C&&C.use){const s=await C.use('sample');if(s){const lim=s.limits?await s.limits():{images:true};if(lim&&lim.images)return {kind:'claude',s}}}}catch(_){}
  if(SHEET&&CFG.SCAN)return {kind:'sheet'};return null}
export function normN(x){return String(x||'').toUpperCase().replace(/[^A-Z0-9؀-ۿ ]+/g,' ').split(/\s+/).filter(w=>w.length>1)}
export const STOPW=new Set(['LLC','L','L.C','TRADING','TRD','CO','COMPANY','EST','ESTABLISHMENT','FZE','FZC','GENERAL','AND','THE','GM','G','KG','PC','PCS','PKT','BOX','BTL','LTR','ML','PACKET']);
export function compact(x){return normN(x).filter(w=>!STOPW.has(w)).join('').replace(/FOODSTUFFS?/g,'FOODSTUFF').replace(/J/g,'Z')}
export function simN(a,b){const A=compact(a),B=compact(b);if(!A||!B)return 0;if(A===B)return 1;const bg=s=>{const m={};for(let i=0;i<s.length-1;i++){const k=s.slice(i,i+2);m[k]=(m[k]||0)+1}return m};const x=bg(A),y=bg(B);let n=0,tx=0,ty=0;for(const k in x){tx+=x[k];if(y[k])n+=Math.min(x[k],y[k])}for(const k in y)ty+=y[k];return tx+ty?2*n/(tx+ty):0}
export async function shrink(file){const url=URL.createObjectURL(file);const img=await new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=url});const k=Math.min(1,1800/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);
  const d=c.toDataURL('image/jpeg',0.82);const blob=await new Promise((res,rej)=>c.toBlob(x=>x?res(x):rej(new Error('blob')),'image/jpeg',0.82));return {d,blob}}
export async function scanBill(id,file){if(scanBusy)return;const av=await scanAvail();if(!av){toast(t('scanNA'));return}
  scanBusy=true;scanMsg=t('scanning');render();
  try{const {d,blob}=await shrink(file);const g=rec('GRN',id);
    const pool=lines().filter(l=>!g.sup||l.sup===g.sup);const cand=(pool.length?pool:lines()).map(l=>`${l.id} | ${l.n}`).join('\n');
    const sups=suppliers().map(x=>x.n).filter(Boolean).join('; ');
    const prompt=`You read a supplier delivery note / tax invoice photo for a restaurant group in the UAE and return JSON only.
Return: {"supplier":string|null,"invoice_no":string|null,"po_no":string|null,"dn_no":string|null,"date":"YYYY-MM-DD"|null,"lines":[{"name":string,"qty":number|null,"unit":string|null,"unit_price":number|null,"total":number|null,"match_id":string|null}],"vat":number|null,"grand_total":number|null}
Rules: copy numbers exactly as printed; unit_price excludes VAT if the bill shows both; one entry per product line; skip totals/VAT rows. For match_id pick the id of the SAME product from the list below (same product and pack size). Be strict: a different product that shares a word is NOT a match (fresh 'Lemon' is not 'Lemon salt'; 'Chicken breast' is not 'Chicken stock'). If unsure, use null — a person will pick it. supplier: pick the closest name from this list if it is clearly the same company, else the name printed: ${sups}
Our items (id | name):
${cand}`;
    let out;
    if(av.kind==='claude'){out=await av.s.json(prompt,{images:[blob],modelTier:'default'})}
    else{const r=await post({pin,scan:{mime:'image/jpeg',data:d.split(',')[1],prompt}});if(!r.ok)throw new Error(r.error||'scan');out=r.result}
    applyScan(id,out,d);scanMsg=t('scanDone')}
  catch(e){const c=e&&e.code;console.warn('scan failed',e);scanMsg=c==='not_granted'?t('scanDenied'):c==='rate_limited'?t('scanRate'):c==='image_rejected'?t('scanImg'):t('scanFail')+(c?' ('+c+')':(e&&e.message?' ('+String(e.message).slice(0,60)+')':''))}
  scanBusy=false;render()}
export function applyScan(id,o,dataUrl){const g=rec('GRN',id);const patch={};o=o||{};
  if(o.invoice_no&&!g.inv)patch.inv=String(o.invoice_no);if(o.po_no&&!g.po)patch.po=String(o.po_no);if(o.dn_no&&!g.dn)patch.dn=String(o.dn_no);
  if(o.date&&/^\d{4}-\d{2}-\d{2}$/.test(o.date))patch.billDate=o.date;
  if(o.supplier&&!g.sup){const best=suppliers().map(x=>({n:x.n,s:simN(x.n,o.supplier)})).sort((a,b)=>b.s-a.s)[0];if(best&&best.s>=0.6)patch.sup=best.n;else patch.billSup=String(o.supplier)}
  const supN=patch.sup||g.sup;const all=supN?[...lines().filter(l=>l.sup===supN),...lines().filter(l=>l.sup!==supN)]:lines();const L=[...grnLines(g)];
  (o.lines||[]).forEach(x=>{const aiSaid=Object.prototype.hasOwnProperty.call(x,'match_id');let it=x.match_id?all.find(l=>l.id===x.match_id):null;let how=it?'ai':'';
    if(!it&&!aiSaid){const b=all.map(l=>({l,s:simN(l.n,x.name)})).sort((a,b)=>b.s-a.s)[0];if(b&&b.s>=0.85){it=b.l;how='name'}}
    const conf=it?simN(it.n,x.name):0;
    L.push({item:it?it.id:null,name:it?it.n:String(x.name||''),billName:String(x.name||''),u:it?it.u:(x.unit||''),ord:x.qty??null,planQ:it?calc(it).q:0,recv:null,rej:null,price:x.unit_price??(x.total&&x.qty?+(x.total/x.qty).toFixed(2):null),plan:it?(+it.p||0):0,scanned:true,matched:!!it,how,check:!!it&&conf<0.75})});
  patch.lines=L;if(o.grand_total)patch.billTotal=+o.grand_total;if(o.vat!=null)patch.billVat=+o.vat;
  const mid='M-'+Date.now().toString(36);mediaMem[mid]=dataUrl;patch.media=[...(g.media||[]),{id:mid,name:'bill.jpg',type:'image/jpeg',size:Math.round(dataUrl.length*0.75),bill:true,at:new Date().toISOString()}];
  editR('GRN',id,patch)}
export const SIDES={plan:['prq','pon','lpo','fill','sups','ana','sum','how'],dept:['rnew','rmine'],ceo:['appr','people','activity'],ops:['moves','req','grn','how'],fin:['pay','soa'],oman:['lpo','fill','sups','ana','sum','grn','req','moves','pay','soa']};
export const OMSUB={plan:['lpo','fill','sups','ana','sum'],ops:['grn','req','moves'],fin:['pay','soa']};
export let omSub=null;
try{omSub=sessionStorage.getItem('pp-om')||null}catch(_){}
export function eff(){return side==='oman'?(omSub||'oman'):side}
export function setOmSub(v){omSub=v;try{v?sessionStorage.setItem('pp-om',v):sessionStorage.removeItem('pp-om')}catch(_){}poOpen=null;poDoc=false;grnDoc=false;reqOpen=billOpen=grnOpen=supOpen=null;notifOpen=false;if(v)tab=OMSUB[v][0]}
export const DOOR_IC={"plan": "<path d=\"M3 4h2l2.4 11h10.2L20 8H6.2\"/><circle cx=\"9\" cy=\"19\" r=\"1.4\"/><circle cx=\"17\" cy=\"19\" r=\"1.4\"/>", "ops": "<path d=\"M3 8l9-5 9 5v8l-9 5-9-5z\"/><path d=\"M3 8l9 5 9-5M12 13v8\"/>", "dept": "<rect x=\"5\" y=\"4\" width=\"14\" height=\"17\" rx=\"2\"/><path d=\"M9 4V3h6v1M9 10h6M9 14h6M9 18h4\"/>", "fin": "<rect x=\"3\" y=\"6\" width=\"18\" height=\"12\" rx=\"2\"/><path d=\"M3 10h18M7 15h3\"/>", "oman": "<path d=\"M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z\"/><circle cx=\"12\" cy=\"9.5\" r=\"2.5\"/>"};
export function doorBadge(k){try{if(k==='plan'){const n=recs('Requests').filter(r=>(r.status||'new')==='new').length;return n}if(k==='fin'){return notes().due.length}}catch(_){}return 0}
export const DEMO_PIN={plan:'1111',ops:'2222',fin:'3333',dept:'4444',ceo:'5555',oman:'6666'};
export let unlocked=null,gateSide=null,gateMsg='';
export let BRANCHES=[['sharjah','Sharjah','الشارقة'],['fujairah','Fujairah','الفجيرة'],['uaq','Umm Al Quwain','أم القيوين'],['mayar','Mayar Cafe','ميار كافيه']];
export const brName=k=>{const b=BRANCHES.find(x=>x[0]===k);return b?(lang==='ar'?b[2]:b[1]):(k||'—')};
export let side='plan',myBranch='',reqOpen=null,billOpen=null,reqF={st:'',br:''},mvF={m:'',q:''};
export function roleNow(){return SHEET?myRole:'admin'}
export async function pinOk(){const el=document.getElementById('pin');const v=(el&&el.value.trim())||'';if(!v){gateMsg=t('pinH_'+gateSide);render();return}
  if(!SHEET){const u=peopleList().find(p=>p.pin===v&&p.active!==false);if(!u){gateMsg=t('pinWrong');render();return}if(!(u.sides||[]).includes(gateSide)){gateMsg=t('pinNoSide');render();return}me=u.name;ls('pp-me',me);enterSide(gateSide);return}
  pin=v;gateMsg=t('checking');render();const r=await post({pin,side:gateSide,check:true});
  if(!r.ok){gateMsg=r.error==='pin'?t('pinWrong'):errMsg(r.error);pin='';render();return}
  applyMe(r.me);try{sessionStorage.setItem('pp-pin',pin);sessionStorage.setItem('pp-ok',gateSide)}catch(_){}
  enterSide(gateSide);mode='loading';render();
  try{shared=await sheetLoad();mode='live';editMode=myRole!=='viewer'}catch(e){if(e.code==='pin'){signOut(errMsg(e.err));return}mode='offline'}
  render();sendLeftovers()}
export async function erpEnter(sd){pin='erp';SNAPOFF=false;
  if(PRELOAD&&ERP_SIDES&&ERP_SIDES.indexOf(sd)>=0){try{sessionStorage.setItem('pp-pin',pin);sessionStorage.setItem('pp-ok',sd)}catch(_){}
    enterSide(sd);shared=await sheetLoad();mode='live';editMode=myRole!=='viewer';render();sendLeftovers();return}
  gateMsg=t('checking');render();const r=await post({side:sd,check:true});
  if(!r.ok){pin='';gateSide=null;if(r.error==='erp'){erpGone();return}gateMsg=r.error==='side'?t('pinNoSide'):r.error==='noproc'?t('erpNone'):errMsg(r.error);render();return}
  applyMe(r.me);ERP_SIDES=r.me.sides||ERP_SIDES;try{sessionStorage.setItem('pp-pin',pin);sessionStorage.setItem('pp-ok',sd)}catch(_){}
  enterSide(sd);mode='loading';render();
  try{shared=await sheetLoad();mode='live';editMode=myRole!=='viewer'}catch(e){if(e.code==='pin'){signOut(errMsg(e.err));return}mode='offline'}
  render();sendLeftovers()}
export function erpGone(){clearSnap();bgDone();ERP='';ERP_SIDES=null;pin='';try{sessionStorage.removeItem('pp-erp');sessionStorage.removeItem('pp-pin');sessionStorage.removeItem('pp-ok')}catch(_){}unlocked=null;gateSide=null;mode='login';gateMsg=t('erpExpired');render()}
export function enterSide(sd){setRegion(sd==='oman'?'oman':'uae');setOmSub(null);poOpen=null;poDoc=false;grnDoc=false;rqOpenId=null;unlocked=sd;side=sd;tab=SIDES[sd][0];gateMsg='';reqOpen=billOpen=grnOpen=supOpen=null;if(!SHEET){try{sessionStorage.setItem('pp-ok',sd)}catch(_){}}render();window.scrollTo(0,0)}
export function exitSide(){unlocked=null;gateSide=null;gateMsg='';try{sessionStorage.removeItem('pp-ok')}catch(_){}if(SHEET){signOut();return}render();window.scrollTo(0,0)}
export function sideTabs(){return side==='oman'?(omSub?OMSUB[omSub]:[]):SIDES[side]}
export function sideOf(tb){return tb==='home'?side:SIDES.ops.includes(tb)&&tb!=='how'?'ops':SIDES.plan.includes(tb)?'plan':side}
export function goSide(s){if((s==='oman')!==OMAN()&&SHEET&&(Object.keys(local).length+Object.keys(supLocal).length+recPending())){toast(t('saveFirst'));return false}setRegion(s==='oman'?'oman':'uae');side=s;ls('pp-side',s);const T=sideTabs();if(!T.includes(tab))tab=T[0];reqOpen=null;billOpen=null;grnOpen=null}
export const TST={draft:['b-mute','tsDraft'],requested:['b-warn','tsRequested'],approved:['b-warn','tsApproved'],rejected:['b-bad','tsRejected'],issued:['b-warn','tsIssued'],received:['b-ok','tsReceived']};
export function tLines(x){return Array.isArray(x.lines)?x.lines:[]}
export function tTot(x){let req=0,iss=0,rcv=0,val=0,short=0;tLines(x).forEach(l=>{req+=+l.req||0;iss+=+l.iss||0;rcv+=+l.rcv||0;val+=(+l.iss||0)*(+l.price||0);if(x.status==='received'&&(+l.rcv||0)<(+l.iss||0))short++});return {req,iss,rcv,val,short}}
export let issueAsk=null;
export function tDone(x){return ['issued','received'].includes(x.status)}
export function tCan(x){if(SHEET&&!editMode)return false;if(tDone(x))return false;return ['admin','team','store'].includes(roleNow())}
export function newTransfer(){const d=new Date(),day=d.toISOString().slice(0,10);const id='T-'+Date.now().toString(36);
  const no='TN-'+day.slice(2).replace(/-/g,'')+'-'+String(recs('Transfers').filter(x=>(x.date||'')===day).length+1).padStart(2,'0');
  if(editR('Transfers',id,{no,date:day,branch:reqF.br||'',reqBy:me,status:'draft',lines:[]})){reqOpen=id;billOpen=null;render();window.scrollTo(0,0)}}
export function tSet(id,patch){if(editR('Transfers',id,patch))render()}
export function tStatus(id,v){const x=Object.assign({id},rec('Transfers',id));const at=new Date().toISOString();
  if(v==='issued'){if(tDone(x)||x.stockDone){toast(t('stockAdded'));return}
    if(!x.branch){toast(t('tNeedBranch'));return}
    const L=tLines(x).map(l=>Object.assign({},l)).filter(l=>+l.iss>0);if(!L.length){toast(t('tNeedIss'));return}
    if(issueAsk!==id){issueAsk=id;render();return}issueAsk=null;
    L.forEach(l=>{const it=line(l.item);l.req=+l.iss;l.price=+it.p||0;l.u=it.u||l.u;if(l.item&&it.n){edit(l.item,{st:Math.max(0,+((+it.st||0)-(+l.iss)).toFixed(3))})}});
    tSet(id,{status:'issued',lines:L,issBy:me,issAt:at,stockDone:true});billOpen=id;render();window.scrollTo(0,0);return}
  if(v==='delete'){if(tDone(x))return;if(editR('Transfers',id,{off:true})){reqOpen=null;render()}}}
export let payF={st:'topay',sup:'',q:'',from:''};
export function supByName(n){const k=String(n||'').trim().toUpperCase();return suppliers().find(x=>String(x.n||'').trim().toUpperCase()===k)}
export function addDays(d,n){const x=new Date(d+'T00:00:00');if(isNaN(x))return '';x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)}
export function payRows(){const today=new Date().toISOString().slice(0,10);
  return recs('GRN').filter(g=>g.status==='received'||g.status==='paid').map(g=>{const st=grnStatus(g),T2=grnTot(g),S=supByName(g.sup)||{};const cr=S.terms==='credit'&&+S.days>0;
    const due=dueOf(S,g.date||today);const miss=grnChecks(g).filter(c=>!c[1]).map(c=>c[0]);
    return {g,st,val:T2.val,S,cr,due,over:st!=='paid'&&due&&due<today,miss}})}
export function paySched(S){S=S||{};return S.payCycle||(S.terms==='credit'&&+S.days>0?'days':'delivery')}
export function schedTxt(S){const c=paySched(S);if(c==='days')return `${fmt(+S.days||0)} ${t('pDays')}`;if(c==='weekly'){const d=DAYS.find(z=>z[0]===(S.payDow||'sun'));return `${t('ps_weekly')} ${d?(lang==='ar'?d[2]:d[1]):''}`}if(c==='monthly')return `${t('ps_monthly')} ${+S.payDom||1}`;return S.terms==='credit'?t('ps_delivery'):t('pCash')}
export function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
export function dueOf(S,d){S=S||{};const c=paySched(S);if(!d)return '';const base=new Date(d+'T00:00:00');if(isNaN(base))return d;
  const cr=S.terms==='credit'&&+S.days>0?+S.days:0;
  if(c==='days'){base.setDate(base.getDate()+cr);return iso(base)}
  if(c==='weekly'){base.setDate(base.getDate()+cr);const w=Math.max(0,DAYS.findIndex(z=>z[0]===(S.payDow||'sun')));while(base.getDay()!==w)base.setDate(base.getDate()+1);return iso(base)}
  if(c==='monthly'){base.setDate(base.getDate()+cr);const dom=Math.min(31,Math.max(1,+S.payDom||1));let y=base.getFullYear(),m=base.getMonth();
    const mk=(y,m)=>new Date(y,m,Math.min(dom,new Date(y,m+1,0).getDate()));let c2=mk(y,m);if(c2<base)c2=mk(y,m+1);return iso(c2)}
  return d}
export function daysTo(d){const a=new Date(new Date().toISOString().slice(0,10)+'T00:00:00'),b=new Date(d+'T00:00:00');return Math.round((b-a)/864e5)}
export function supAgg(){const R=payRows(),by={};R.forEach(r=>{const k=r.g.sup||'—';const a=by[k]=by[k]||{n:k,S:r.S,rows:[],billed:0,paid:0,hold:0,ready:[]};a.rows.push(r);a.billed+=r.val;if(r.st==='paid')a.paid+=r.val;else if(r.st==='hold')a.hold+=r.val;else a.ready.push(r)});
  Object.values(by).forEach(a=>{a.bal=a.billed-a.paid;const d=a.ready.map(r=>r.due).filter(Boolean).sort();a.next=d[0]||'';a.nextAmt=a.next?a.ready.filter(r=>r.due<=a.next).reduce((x,r)=>x+r.val,0):0;a.nextN=a.next?a.ready.filter(r=>r.due<=a.next).length:0});return by}
export function finSeen(){return ls('pp-fin-seen')||''}
export function notes(){const A=Object.values(supAgg()).filter(a=>a.next&&daysTo(a.next)<=7).sort((a,b)=>a.next.localeCompare(b.next));
  const seen=finSeen();const nw=recs('GRN').filter(g=>['received','paid'].includes(g.status)&&(g.recvAt||g.date||'')>seen);return {due:A,nw}}
export let notifOpen=false,soaSup='',soaAsk=false;
export const RQK=['food','equip','service','design','other'];
export const RQS=['new','review','sourcing','quotes','approval','approved','ordered','done','later','rejected','cancelled'];
export const RQIN=['new','review'],RQGO=['sourcing','quotes','approval','approved','ordered'];
export const RQREAS=['notneeded','budget','nosupplier','spec','duplicate','later','other'];
export const SPECREQ={food:['brand','cut','pack'],equip:['model','dims','power'],service:['scope','deliv','time'],design:['scope','deliv','time'],other:['scope']};
export const RQOPEN=['new','review','sourcing','quotes','ordered'];
export const DEPTS=[['kitchen','Kitchen / Chef','المطبخ / الشيف'],['bakery','Bakery','المخبز'],['bar','Coffee bar','بار القهوة'],['ops','Operations','العمليات'],['store','Store','المخزن'],['maint','Maintenance','الصيانة'],['mkt','Marketing','التسويق'],['hr','HR / Admin','الموارد البشرية / الإدارة'],['fin','Finance','المالية'],['it','IT','تقنية المعلومات'],['other','Other','أخرى']];
export const RQLOC=[['sharjah','AMK Sharjah','المطبخ الكويتي الشارقة'],['fujairah','AMK Fujairah','المطبخ الكويتي الفجيرة'],['uaq','AMK Umm Al Quwain','المطبخ الكويتي أم القيوين'],['mayar','Mayar Cafe','ميار كافيه'],['oman','Oman','عُمان'],['ajman','Ajman Central Store','مخزن عجمان المركزي'],['office','Head office','المكتب الرئيسي'],['all','All branches','كل الفروع']];
export const SPECF={food:['brand','origin','cut','pack','temp','shelf','monthly'],equip:['model','dims','power','cap','warranty','install'],service:['scope','deliv','time','freq','site'],design:['scope','deliv','time','site'],other:['scope','deliv','time']};
export const RQST={new:'b-warn',review:'b-warn',sourcing:'b-pemo',quotes:'b-pemo',ordered:'b-ok',done:'b-ok',rejected:'b-bad',cancelled:'b-mute',later:'b-mute',approval:'b-warn',approved:'b-ok'};
export const nm=(L,k)=>{const x=L.find(z=>z[0]===k);return x?(lang==='ar'?x[2]:x[1]):(k||'—')};
export let rqDraft={},rqOpenId=null,rqF={st:'open',kind:'',q:''},rqG={st:'active',kind:'',q:''},rqClose=null,rqTry=false;
export function rqGoCount(){return recs('Requests').filter(r=>RQGO.includes(r.status||'new')).length}
export function rqNewCount(){return recs('Requests').filter(r=>(r.status||'new')==='new').length}
export function rqAge(d){if(!d)return '';const n=-daysTo(d.slice(0,10));return n<=0?t('rqToday'):`${n} ${t('rqAge')}`}
Object.assign(T.en,{rqMoreF:'More filters',rqLessF:'Fewer filters',rqClearF:'Clear filters',rqMineF:'Handled by me',rqShown:'shown',rqKindAll:'All kinds',rqCostAll:'CAPEX and OPEX',rqDeptAll:'All departments',rqLocAll:'All locations',rqFilters:'Filters',
 rqB_sum:'Request summary',rqB_own:'Owner and status',rqB_thr:'Clarification thread',rqB_hist:'Decision history',rqNoThread:'No messages yet.',rqNoHist:'No status changes yet.',rqNotAssigned:'Not assigned yet',rqType:'Type',rqMailHs:'Opens your email app. A copy is noted here.',
 cf_review:'Accept "{t}" and start clarifying it?',cf_reviewY:'Yes, accept',cf_approval:'Send "{t}" to the CEO for approval?',cf_approvalY:'Yes, send',cf_ceook:'Approve "{t}"? The order can then be placed and an LPO is prepared.',cf_ceookY:'Yes, approve',
 cf_withdraw:'Withdraw "{t}" from the CEO? It goes back to quotes.',cf_withdrawY:'Yes, withdraw',cf_reopen:'Reopen "{t}"?',cf_reopenY:'Yes, reopen',cf_lpo:'Create an LPO for "{t}"?',cf_lpoY:'Yes, create',cf_cancelled:'Cancel your request "{t}"?',cf_cancelledY:'Yes, cancel it'});
Object.assign(T.ar,{rqMoreF:'فلاتر أكثر',rqLessF:'فلاتر أقل',rqClearF:'مسح الفلاتر',rqMineF:'المسندة لي',rqShown:'معروض',rqKindAll:'كل الأنواع',rqCostAll:'CAPEX و OPEX',rqDeptAll:'كل الأقسام',rqLocAll:'كل المواقع',rqFilters:'الفلاتر',
 rqB_sum:'ملخص الطلب',rqB_own:'المسؤول والحالة',rqB_thr:'محادثة التوضيح',rqB_hist:'سجل القرارات',rqNoThread:'لا توجد رسائل بعد.',rqNoHist:'لا توجد تغييرات في الحالة بعد.',rqNotAssigned:'لم يُسند بعد',rqType:'النوع',rqMailHs:'يفتح تطبيق البريد. وتُسجَّل نسخة هنا.',
 cf_review:'قبول "{t}" وبدء التوضيح؟',cf_reviewY:'نعم، اقبل',cf_approval:'إرسال "{t}" للرئيس التنفيذي للموافقة؟',cf_approvalY:'نعم، أرسل',cf_ceook:'الموافقة على "{t}"؟ بعدها يمكن الطلب ويُجهَّز أمر الشراء.',cf_ceookY:'نعم، موافق',
 cf_withdraw:'سحب "{t}" من الرئيس التنفيذي؟ سيعود إلى مرحلة العروض.',cf_withdrawY:'نعم، اسحب',cf_reopen:'إعادة فتح "{t}"؟',cf_reopenY:'نعم، أعد الفتح',cf_lpo:'إنشاء أمر شراء لـ "{t}"؟',cf_lpoY:'نعم، أنشئ',cf_cancelled:'إلغاء طلبك "{t}"؟',cf_cancelledY:'نعم، ألغِه'});
export const RQI={plus:'<path d="M12 5v14M5 12h14"/>',filter:'<path d="M4 6h16M7 12h10M10 18h4"/>',view:'<path d="M7 4h10v16l-5-4-5 4z"/>',trash:'<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>',
 mail:'<path d="M4 6h16v12H4z"/><path d="M4 7l8 6 8-6"/>',note:'<path d="M6 4h9l3 3v13H6z"/><path d="M9 11h6M9 15h6"/>',flag:'<path d="M6 21V4"/><path d="M6 4h11l-2 4 2 4H6"/>',
 user:'<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 4-5.5 7-5.5s6 1.5 7 5.5"/>',clock:'<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',box:'<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/>',
 search:'<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',chat:'<path d="M4 5h16v11H9l-5 4z"/>',list:'<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="5" cy="6" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="18" r="1"/>',
 doc:'<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/>'};
export const RQCH={in:{pills:['open','new','review'],more:['rejected','cancelled','all']},go:{pills:['active','sourcing','quotes','approval','approved','ordered','later'],more:['done','rejected','all']}};
export const RQ_FD={kind:'',q:'',urg:false,mine:false,cost:'',dept:'',branch:''};
export let rqMore={in:false,go:false},rqNaming=false;
export function rqViews(){const v=ls2('pp-rq-views');return Array.isArray(v)?v:[]}
export function rqFl(F){return {st:F.st||'',kind:F.kind||'',q:F.q||'',urg:!!F.urg,mine:!!F.mine,cost:F.cost||'',dept:F.dept||'',branch:F.branch||''}}
export function rqCurView(m,F){const c=JSON.stringify(rqFl(F));return rqViews().findIndex(v=>v.m===m&&JSON.stringify(rqFl(v.f||{}))===c)}
export function rqSaveView(){const el=document.getElementById('rqvname');const name=(el&&el.value||'').trim().slice(0,40);if(!name){if(el){el.classList.add('miss');el.focus()}return}
  const m=tab==='pon'?'go':'in',F=m==='go'?rqG:rqF;const v=rqViews().filter(x=>!(x.m===m&&x.name===name));v.push({name,m,f:rqFl(F)});ls2('pp-rq-views',v);rqNaming=false;toast(t('ivViewSaved'));render()}
export function rqInGroup(r,mode){const st=r.status||'new';return mode==='in'?RQIN.includes(st)||(['rejected','cancelled'].includes(st)&&RQIN.includes(r.prevStatus||'new')):!RQIN.includes(st)&&!(['rejected','cancelled'].includes(st)&&RQIN.includes(r.prevStatus||'new'))}
export function rqMiss(r){const st=r.status||'new';const m={spec:[],buyer:false,opt:false,pick:false};
  if(st==='review'){const sp=r.spec||{};m.spec=(SPECREQ[r.kind]||SPECREQ.other).filter(k=>!String(sp[k]||'').trim());m.buyer=!String(r.buyer||'').trim()}
  if(st==='sourcing')m.opt=!(r.opts||[]).some(o=>String(o.sup||'').trim()&&+o.price>0);
  if(st==='quotes')m.pick=!(r.opts||[]).some(o=>o.pick);return m}
export function rqAsk(key,r,fn){confirmBox(t(key).replace('{t}',(r&&(r.title||r.no))||''),t(key+'Y'),fn,t('cancelS'),1)}
export function rqGo(to,ok){const id=rqOpenId;const r=Object.assign({id},rec('Requests',id));const st=r.status||'new';
  if(to==='later'||to==='rejected'){rqClose={id,to,reason:to==='later'?'later':'',note:'',date:''};render();return}
  if(to==='reopen'&&!ok){rqAsk('cf_reopen',r,()=>rqGo('reopen',1));return}
  if(to==='reopen'){const back=r.prevStatus&&!['later','rejected'].includes(r.prevStatus)?r.prevStatus:'review';if(editR('Requests',id,{status:back,closeReason:'',closeNote:'',reviewOn:'',log:rqLog(id,'status',back)}))render();return}
  if(to==='back'){const back=st==='sourcing'?'review':st==='quotes'?'sourcing':'quotes';if(editR('Requests',id,{status:back,log:rqLog(id,'status',back)})){if(back==='review'){tab='prq'}render()}return}
  const M=rqMiss(r);
  if(to==='sourcing'&&(M.spec.length||M.buyer)){toast(t('rqFix'));render();return}
  if(to==='quotes'&&M.opt){toast(t('rqNeedOpt'));render();return}
  if(to==='approval'&&M.pick){toast(t('rqNeedPick'));render();return}
  if(to==='ordered'&&st!=='approved'){toast(t('rqNeedAppr'));return}
  if(!ok&&['review','approval','withdraw','ceook'].includes(to)){rqAsk('cf_'+to,r,()=>rqGo(to,1));return}
  if(to==='withdraw'){if(editR('Requests',id,{status:'quotes',log:rqLog(id,'status','quotes')}))render();return}
  if(to==='ceook'){const at=new Date().toISOString();if(editR('Requests',id,{status:'approved',ceo:{decision:'approved',by:me,at},log:rqLog(id,'status','approved')})){sendAlert('decision',{dec:t('dec_approved'),title:r.title});poFromRequest(id);toast(t('rqApproved'));render()}return}
  if(to==='ceoback'){rqClose={id,to:'ceoback',reason:'other',note:''};render();return}
  const patch={status:to,log:rqLog(id,'status',to)};if(to==='approval'){patch.sentCeoAt=new Date().toISOString();patch.ceo=null}if(to==='review'&&!r.buyer)patch.buyer=me;
  if(editR('Requests',id,patch)){if(to==='sourcing'){tab='pon';toast(t('rqMoved'))}if(to==='approval'){toast(t('rqSentCeo'));const o=(r.opts||[]).find(x=>x.pick)||{};sendAlert('approval',{title:r.title,sup:o.sup||'',amt:fmt((+o.price||0)*(+r.qty||1),2)})}render();window.scrollTo(0,0)}}
export async function upload_(f){if(!SHEET)return f;try{const r=await post({pin,upload:{name:f.name,type:f.type,data:f.data.split(',')[1]}});if(r.ok&&r.url)return {name:f.name,type:f.type,url:r.url,id:r.id,thumb:r.thumb||''}}catch(e){}toast(t('saveErr'));return null}
export async function rqQuoteFile(i,file){const id=rqOpenId;if(!id||!file)return;let f;
  if(file.type.startsWith('image/')){try{const url=URL.createObjectURL(file);const img=await new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=url});const k=Math.min(1,1600/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);f={name:file.name,type:'image/jpeg',data:c.toDataURL('image/jpeg',0.78)}}catch(e){toast('✗');return}}
  else if(file.type==='application/pdf'){if(file.size>3*1048576){toast(t('rqTooBig'));return}const data=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)});f={name:file.name,type:'application/pdf',data}}
  else{toast(t('rqFileType'));return}
  f=await upload_(f);if(!f)return;f.at=new Date().toISOString();f.by=me;const L=(rec('Requests',id).opts||[]).map(x=>Object.assign({},x));if(!L[i])return;L[i].files=[...(L[i].files||[]),f].slice(0,3);if(editR('Requests',id,{opts:L}))render()}
export function rqApprCount(){return recs('Requests').filter(r=>r.status==='approval').length}
export let apF='pending';
document.addEventListener('click',e=>{const f=e.target.closest('[data-apf]');if(f){apF=f.dataset.apf;render();return}const b=e.target.closest('[data-act="ceobell"]');if(b){tab='appr';apF='pending';rqOpenId=null;render()}});
export function loadJs(u){return new Promise((ok,no)=>{if(document.querySelector(`script[src="${u}"]`)&&loadJs[u])return ok();const e=document.createElement('script');e.src=u;e.onload=()=>{loadJs[u]=1;ok()};e.onerror=no;document.head.appendChild(e)})}
export function docnoImg(e){const w=e.offsetWidth,h=e.offsetHeight;if(!w||!h)return;const cs=e.ownerDocument.defaultView.getComputedStyle(e),k=3,c=document.createElement('canvas');c.width=w*k;c.height=h*k;
  const x=c.getContext('2d');x.scale(k,k);x.font=`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;x.fillStyle=cs.color;x.textBaseline='middle';const rtl=cs.direction==='rtl'||/[\u0600-\u06FF]/.test(e.textContent);x.direction=rtl?'rtl':'ltr';x.textAlign=rtl?'right':'left';x.fillText(e.textContent,rtl?w:0,h/2+0.5);
  const im=e.ownerDocument.createElement('img');im.src=c.toDataURL();im.style.width=w+'px';im.style.height=h+'px';im.style.verticalAlign='bottom';e.textContent='';e.appendChild(im)}
export async function shareDoc(name){const el=document.getElementById('bill');if(!el)return;const fn=String(name).replace(/[^\w\-.]+/g,'-')+'.pdf';toast(t('shPrep'));
  try{await loadJs('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');await loadJs('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    const c=await html2canvas(el,{scale:2,backgroundColor:'#ffffff',useCORS:true,ignoreElements:x=>x.classList&&x.classList.contains('no-print'),onclone:d=>d.querySelectorAll('.docno,#bill .dt').forEach(docnoImg)});
    const w=595,h=Math.round(c.height*w/c.width),pdf=new window.jspdf.jsPDF({unit:'pt',format:[w,Math.max(h,200)]});pdf.addImage(c.toDataURL('image/jpeg',0.92),'JPEG',0,0,w,h);
    const file=new File([pdf.output('blob')],fn,{type:'application/pdf'});window.lastShare=file;
    if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:name})}catch(e){if(e&&e.name!=='AbortError')throw e}}
    else{const a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=fn;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000);toast(t('shSaved'))}
  }catch(e){toast(t('shFail'))}}
export function openMail(u){window.location.href=u}
export function rqLog(id,type,text){const r=rec('Requests',id);const L=[...(r.log||[]),{at:new Date().toISOString(),by:me,type,text}];return L}
export function rqSubmit(){const d=rqDraft;if(!d.kind){toast(t('rqNeedKind'));return}if(!String(d.title||'').trim()){toast(t('rqNeedTitle'));return}if(!d.dept){toast(t('rqNeedDept'));return}
  const day=new Date().toISOString().slice(0,10);const id='R-'+Date.now().toString(36);
  const no='PRQ-'+day.slice(2).replace(/-/g,'')+'-'+String(recs('Requests').filter(x=>(x.date||'').slice(0,10)===day).length+1).padStart(2,'0');
  const rec0=Object.assign({urg:'normal',cost:d.cost||(['equip','design'].includes(d.kind)?'capex':'opex')},d,{no,date:new Date().toISOString(),by:me,byEmail:myEmail,status:'new',log:[{at:new Date().toISOString(),by:me,type:'status',text:'new'}]});
  confirmBox(t('rqSendQ').replace('{t}',rec0.title),t('rqSendYes'),async()=>{if(!editR('Requests',id,rec0))return;clearTimeout(qsT);rqDraft={};tab='rmine';rqOpenId=id;render();window.scrollTo(0,0);
    const ok=!SHEET||await saveAll({lines:false});if(ok&&!(recLocal.Requests||{})[id]){sendAlert('request',{by:me,title:rec0.title});toast(t('rqSent'))}else toast(t('rqNotSent'))},t('cancelS'),1)}
export async function ivPhoto(id,file){try{const url=URL.createObjectURL(file);const img=await new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=url});const k=Math.min(1,900/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);const ph=c.toDataURL('image/jpeg',0.75);let keep=ph;if(SHEET){toast(t('ivPhotoUp'));const up=await upload_({name:(file.name||'item')+'.jpg',type:'image/jpeg',data:ph});if(!up)return;keep=up.thumb||up.url}edit(id,{img:keep});render()}catch(e){toast('✗')}}
document.addEventListener('change',e=>{const f=e.target.closest&&e.target.closest('[data-ivphoto]');if(f&&f.files&&f.files[0])ivPhoto(f.dataset.ivphoto,f.files[0])});
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-act="ivphrm"]');if(b){confirmBox(t('ivRemovePhotoQ'),t('ivRemovePhoto'),()=>{edit(b.dataset.id,{img:''});render()},t('cancelS'))}});
export async function rqPhoto(file){try{const url=URL.createObjectURL(file);const img=await new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=url});const k=Math.min(1,900/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);const ph=c.toDataURL('image/jpeg',0.7);let keep=ph;if(SHEET){const up=await upload_({name:file.name||'photo.jpg',type:'image/jpeg',data:ph});if(!up)return;keep=up.thumb||up.url}rqDraft.photos=[...(rqDraft.photos||[]),keep].slice(0,3);render()}catch(e){toast('✗')}}
document.addEventListener('click',e=>{
  const k=e.target.closest('[data-rqkind]');if(k){rqDraft.kind=k.dataset.rqkind;if(!rqDraft.cost)rqDraft.cost=['equip','design'].includes(rqDraft.kind)?'capex':'opex';render();return}
  const c=e.target.closest('[data-rqcost]');if(c){rqDraft.cost=c.dataset.rqcost;render();return}
  const u=e.target.closest('[data-rqurg]');if(u){rqDraft.urg=u.dataset.rqurg;render();return}
  const pd=e.target.closest('[data-rqphdel]');if(pd){rqDraft.photos.splice(+pd.dataset.rqphdel,1);render();return}
  const z=e.target.closest('[data-rqzoom]');if(z&&rqOpenId){const ph=(rec('Requests',rqOpenId).photos||[])[+z.dataset.rqzoom];if(ph){const d=document.createElement('div');d.className='rq-zoom';d.innerHTML=`<img src="${ph}" alt=""><button class="btn">✕</button>`;d.onclick=()=>d.remove();document.body.appendChild(d)}return}
  const qv=e.target.closest('[data-rqqv]');if(qv&&rqOpenId){const [i,j]=qv.dataset.rqqv.split(':').map(Number);const f=((rec('Requests',rqOpenId).opts||[])[i]||{}).files?.[j];if(f)rqViewFile(f);return}
  const qd=e.target.closest('[data-rqqdel]');if(qd&&rqOpenId){const [i,j]=qd.dataset.rqqdel.split(':').map(Number);const L=(rec('Requests',rqOpenId).opts||[]).map(x=>Object.assign({},x));if(L[i]){L[i].files=(L[i].files||[]).filter((_,k)=>k!==j);if(editR('Requests',rqOpenId,{opts:L}))render()}return}
  const o=e.target.closest('[data-rqopen]');if(o){rqOpenId=o.dataset.rqopen;render();window.scrollTo(0,0);return}
  const st=e.target.closest('[data-rqst]');if(st){(tab==='pon'?rqG:rqF).st=st.dataset.rqst;render();return}
  const gg=e.target.closest('[data-rqgo]');if(gg&&rqOpenId){const to=gg.dataset.rqgo;if(to==='cancelled'){const id=rqOpenId,r0=rec('Requests',id);rqAsk('cf_cancelled',r0,()=>{if(editR('Requests',id,{status:'cancelled',prevStatus:r0.status||'new',log:rqLog(id,'status','cancelled')}))render()});return}rqGo(to);return}
  const pk=e.target.closest('[data-rqpick]');if(pk&&rqOpenId){const L=(rec('Requests',rqOpenId).opts||[]).map((x,i)=>Object.assign({},x,{pick:i===+pk.dataset.rqpick?!x.pick:false}));if(editR('Requests',rqOpenId,{opts:L}))render();return}
  const od=e.target.closest('[data-rqoptdel]');if(od&&rqOpenId){const L=[...(rec('Requests',rqOpenId).opts||[])];L.splice(+od.dataset.rqoptdel,1);if(editR('Requests',rqOpenId,{opts:L}))render();return}
  const fx=e.target.closest('[data-rqfx]');if(fx){const F=tab==='pon'?rqG:rqF;F[fx.dataset.rqfx]=!F[fx.dataset.rqfx];render();return}
  const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
  if(a==='rqmore'){const m=tab==='pon'?'go':'in';rqMore[m]=!rqMore[m];render();return}
  if(a==='rqclear'){const m=tab==='pon'?'go':'in';Object.assign(m==='go'?rqG:rqF,RQ_FD,{st:RQCH[m].pills[0]});render();return}
  if(a==='rqsaveview'){rqNaming=true;render();const n=document.getElementById('rqvname');n&&n.focus();return}
  if(a==='rqviewok'){rqSaveView();return}
  if(a==='rqviewno'){rqNaming=false;render();return}
  if(a==='rqdelview'){const m=tab==='pon'?'go':'in',i=rqCurView(m,m==='go'?rqG:rqF);if(i>=0){const v=rqViews();v.splice(i,1);ls2('pp-rq-views',v);toast(t('ivViewDel'));render()}return}
  if(a==='rqnewgo'){tab='rnew';rqOpenId=null;rqClose=null;render();window.scrollTo(0,0);return}
  if(a==='rqsend')rqSubmit();
  else if(a==='rqback'){const r0=rqOpenId?rec('Requests',rqOpenId):{};rqOpenId=null;rqClose=null;if(side==='ceo')tab='appr';else if(side==='plan')tab=RQIN.includes(r0.status||'new')||(['rejected','cancelled'].includes(r0.status)&&RQIN.includes(r0.prevStatus||'new'))?'prq':'pon';render()}
  else if(a==='rqcloseno'){rqClose=null;render()}
  else if(a==='rqcloseok'&&rqClose&&rqClose.to==='ceoback'){const c=rqClose;if(!String(c.note||'').trim()){toast(t('ceoNoteReq'));render();return}const at=new Date().toISOString();if(editR('Requests',c.id,{status:'quotes',ceo:{decision:'returned',by:me,at,note:c.note.trim().slice(0,800)},log:rqLog(c.id,'status','quotes|'+t('ga_ceoback')+'|'+c.note.trim().slice(0,800))})){sendAlert('decision',{dec:t('dec_returned'),title:rec('Requests',c.id).title});rqClose=null;render()}}
  else if(a==='rqcloseok'&&rqClose){const c=rqClose;if(!c.reason||!String(c.note||'').trim()){toast(t('rqFix'));render();return}const r0=rec('Requests',c.id);const prev=['later','rejected'].includes(r0.status)?r0.prevStatus:(r0.status||'new');
    if(editR('Requests',c.id,{status:c.to,prevStatus:prev,closeReason:c.reason,closeNote:c.note.trim().slice(0,800),reviewOn:c.date||'',log:rqLog(c.id,'status',c.to+'|'+t('rr_'+c.reason)+'|'+c.note.trim().slice(0,800))})){rqClose=null;render()}}
  else if(a==='rqaddopt'){const L=[...(rec('Requests',rqOpenId).opts||[]),{sup:'',price:null,lead:'',note:''}];if(editR('Requests',rqOpenId,{opts:L}))render()}
  else if(a==='rqmail'){const id=rqOpenId,r=rec('Requests',id);if(!r)return;const tx=((document.getElementById('rqtext')||{}).value||'').trim().slice(0,1500);
    const to=r.byEmail||((peopleList().find(p=>p.email&&String(p.name||'').trim().toLowerCase()===String(r.by||'').trim().toLowerCase())||{}).email)||'';
    const ar=lang==='ar',no=r.no||id,sub=`${no} · ${r.title||''} · ${ar?'مشتريات فوركا':'Forka Procurement'}`;
    const body=(ar?`مرحباً ${r.by||''}،\n\n`:`Hello ${r.by||''},\n\n`)+(tx?tx+'\n\n':'')+(ar?`رقم الطلب: ${no}\nالطلب: ${r.title||''}\nالحالة: ${t('rs_'+(r.status||'new'))}\n\n${me||''}\nمشتريات فوركا\nhttps://procurement.forka.com`:`Request number: ${no}\nRequest: ${r.title||''}\nStatus: ${T.en['rs_'+(r.status||'new')]||r.status||''}\n\n${me||''}\nForka Procurement\nhttps://procurement.forka.com`);
    if(editR('Requests',id,{log:rqLog(id,'mail',(to?to+' — ':'')+(tx||sub))}))render();
    if(!to)toast(t('rqMailNoTo'));
    openMail('mailto:'+encodeURIComponent(to).replace(/%40/g,'@')+'?subject='+encodeURIComponent(sub)+'&body='+encodeURIComponent(body))}
  else if(a==='rqlog'){const tx=(document.getElementById('rqtext')||{}).value||'';if(!tx.trim())return;const ty=side==='dept'?'reply':side==='ceo'?'ceo':((document.getElementById('rqlt')||{}).value||'msg');if(editR('Requests',rqOpenId,{log:rqLog(rqOpenId,ty,tx.trim().slice(0,1500))})){if(ty==='msg'){const r0=rec('Requests',rqOpenId);sendAlert('reply',{title:r0.title},r0.by)}render()}}
});
document.addEventListener('change',e=>{const el=e.target;
  if(el.dataset.rqd){let v=el.value;if(['qty','budget'].includes(el.dataset.rqd))v=v===''?null:Math.max(0,parseFloat(v)||0);else v=String(v).slice(0,el.dataset.rqd==='details'?2000:200);rqDraft[el.dataset.rqd]=v;if(['title','dept'].includes(el.dataset.rqd))renderSoon(el);return}
  if(el.dataset.rqqf!==undefined){const f=el.files[0];el.value='';rqQuoteFile(+el.dataset.rqqf,f);return}
  if(el.dataset.rqphoto){const f=el.files[0];el.value='';if(f)rqPhoto(f);return}
  if(el.dataset.rqspec&&rqOpenId){const sp=Object.assign({},rec('Requests',rqOpenId).spec||{},{[el.dataset.rqspec]:String(el.value).trim().slice(0,600)});editR('Requests',rqOpenId,{spec:sp});renderSoon(el);return}
  if(el.dataset.rqf&&rqOpenId){editR('Requests',rqOpenId,{[el.dataset.rqf]:String(el.value).trim().slice(0,80)});render();return}
  if(el.dataset.rqopt!==undefined&&rqOpenId){const L=(rec('Requests',rqOpenId).opts||[]).map(x=>Object.assign({},x));const i=+el.dataset.rqopt,f=el.dataset.of;if(!L[i])return;L[i][f]=f==='price'?(el.value===''?null:Math.max(0,parseFloat(el.value)||0)):String(el.value).trim().slice(0,200);editR('Requests',rqOpenId,{opts:L});renderSoon(el);return}
  if(el.id==='rqkind'){(tab==='pon'?rqG:rqF).kind=el.value;render();return}
  if(['rqcost','rqdept','rqbranch'].includes(el.id)){(tab==='pon'?rqG:rqF)[el.id.slice(2)]=el.value;render();return}
  if(el.id==='rqview'){const m=tab==='pon'?'go':'in',v=rqViews()[+el.value];if(el.value!==''&&v){const F=m==='go'?rqG:rqF;Object.assign(F,RQ_FD,v.f);if(RQCH[m].more.includes(F.st)||F.kind||F.cost||F.dept||F.branch)rqMore[m]=true}render();return}
  if(el.id==='rqcr'&&rqClose){rqClose.reason=el.value;render();return}
  if(el.id==='rqcd'&&rqClose){rqClose.date=el.value;return}
  if(el.id==='rqcn'&&rqClose){rqClose.note=el.value;render();return}
});
document.addEventListener('keydown',e=>{const el=e.target;if(!el||!el.closest)return;
  if(el.id==='rqvname'){if(e.key==='Enter'){e.preventDefault();rqSaveView()}else if(e.key==='Escape'){rqNaming=false;render()}return}
  if((e.key==='Enter'||e.key===' ')&&el.matches('[data-rqopen]')){e.preventDefault();el.click()}});
document.addEventListener('input',e=>{if(e.target.id==='rqq'){(tab==='pon'?rqG:rqF).q=e.target.value;render();const q=document.getElementById('rqq');if(q){q.focus();q.setSelectionRange(q.value.length,q.value.length)}}});
export const SIDEK=['plan','ops','dept','fin','ceo','oman'];
export const ALERTK=['request','approval','decision','payments','reply'];
export const SEED_PEOPLE=[{id:'P-khaled',name:'CEO',pin:'5555',sides:['plan','ops','dept','fin','ceo','oman'],email:'ceo@forka.com',wa:'',alerts:['approval','payments'],active:true},
 {id:'P-hamim',name:'Buyer',pin:'1111',sides:['plan'],email:'',wa:'',alerts:['request','decision'],active:true},
 {id:'P-arman',name:'Store keeper',pin:'2222',sides:['ops'],email:'',wa:'',alerts:[],active:true},
 {id:'P-finance',name:'Finance',pin:'3333',sides:['fin'],email:'',wa:'',alerts:['payments'],active:true},
 {id:'P-chef',name:'Head Chef',pin:'4444',sides:['dept'],email:'',wa:'',alerts:['reply'],active:true}];
export let PEOPLE={},ACT={},OUTBOX={},ppOpen=null,ppDraft=null;
export function peopleList(){const L=Object.values(PEOPLE);return L.length?L:SEED_PEOPLE}
export function pstore(coll,id,data,mem){mem[id]=data;if(db&&mode==='live'&&!SHEET){db.collection(coll).doc(id).set(data).catch(()=>{})}else ls('pp-'+coll,mem)}
export function logAct(kind,id,patch){if(SHEET)return;try{const keys=Object.keys(patch||{}).filter(k=>!['who','at','uid','log'].includes(k));let label='';
  if(kind==='Requests'||kind==='GRN'||kind==='Transfers'){const r=rec(kind,id);label=(r.no||id)+(r.title?' · '+r.title:'')+(patch.status?' → '+(t('rs_'+patch.status)!=='rs_'+patch.status?t('rs_'+patch.status):patch.status):'')}
  else if(kind==='line'){label=(line(id).n||id)}else if(kind==='sup'){label=(supRec(id).n||id)}else if(kind==='people'){label=((PEOPLE[id]||{}).name||patch.name||id)}else label=id;
  const now=Date.now(),last=Object.values(ACT).sort((a,b)=>b.at.localeCompare(a.at))[0];
  if(last&&last.by===me&&last.kind===kind&&last.ref===id&&!patch.status&&now-Date.parse(last.at)<120000){const f=[...new Set([...(last.fields||[]),...keys])].slice(0,12);pstore('activity',last.id,Object.assign({},last,{fields:f,at:new Date().toISOString(),label}),ACT);return}
  const aid='A-'+now.toString(36)+Math.random().toString(36).slice(2,5);pstore('activity',aid,{id:aid,at:new Date().toISOString(),by:me,side,kind,ref:id,label,fields:keys.slice(0,12)},ACT)}catch(e){}}
export function fill(tpl,o){return tpl.replace(/\{(\w+)\}/g,(_,k)=>o[k]??'')}
export function sendAlert(ev,vars,onlyName){if(SHEET)return;const to=peopleList().filter(p=>p.active!==false&&(p.alerts||[]).includes(ev)&&(!onlyName||p.name.trim().toLowerCase()===String(onlyName).trim().toLowerCase()));
  const id='O-'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);pstore('outbox',id,{id,at:new Date().toISOString(),ev,text:fill(T.en['msg_'+ev]||ev,vars),text_ar:fill(T.ar['msg_'+ev]||ev,vars),to:to.map(p=>({name:p.name,email:p.email||'',wa:p.wa||''}))},OUTBOX)}
document.addEventListener('click',e=>{
  const ed=e.target.closest('[data-ppedit]');if(ed){const p=peopleList().find(x=>x.id===ed.dataset.ppedit);ppDraft=JSON.parse(JSON.stringify(p));render();return}
  const tg=e.target.closest('[data-ppt]');if(tg&&ppDraft){const [f,k]=tg.dataset.ppt.split(':');if(f==='active')ppDraft.active=k==='1';else{const a=new Set(ppDraft[f]||[]);a.has(k)?a.delete(k):a.add(k);ppDraft[f]=[...a]}render();return}
  const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
  if(a==='ppadd'){ppDraft={name:'',pin:'',sides:[],alerts:[],email:'',wa:'',active:true};render()}
  else if(a==='ppcancel'){ppDraft=null;render()}
  else if(a==='ppsave'&&ppDraft){const d=ppDraft;d.name=String(d.name||'').trim();if(!d.name||!/^\d{4,6}$/.test(d.pin||'')){toast(t('ppBad'));render();return}
    if(peopleList().some(p=>p.pin===d.pin&&p.id!==d.id&&p.active!==false)){toast(t('ppDup'));return}
    if(!Object.keys(PEOPLE).length)SEED_PEOPLE.forEach(p=>pstore('people',p.id,p,PEOPLE));
    if(!d.id)d.id='P-'+Date.now().toString(36);pstore('people',d.id,d,PEOPLE);logAct('people',d.id,{name:d.name});ppDraft=null;render()}
  else if(a==='outrun'){const A=Object.values(supAgg()).filter(x=>x.next&&daysTo(x.next)<=7);sendAlert('payments',{n:A.length,amt:fmt(A.reduce((s,x)=>s+x.nextAmt,0),2)});render()}
});
document.addEventListener('change',e=>{const el=e.target;if(el.dataset.ppf&&ppDraft){ppDraft[el.dataset.ppf]=el.dataset.ppf==='pin'?String(el.value).replace(/\D/g,'').slice(0,6):String(el.value).trim().slice(0,120);render()}});
export let LPLOC=[['ajman','Ajman Central Store','مخزن عجمان المركزي'],...RQLOC.filter(x=>!['ajman','all'].includes(x[0]))];
export let poOpen=null,poDoc=false,poF='open',poAutoMsg='',poAutoDone=false;
export function poTot(po){const sub=(po.lines||[]).reduce((a,l)=>a+(+l.qty||0)*(+l.price||0),0);return {sub,vat:sub*0.05,tot:sub*1.05}}
export function poRecvd(po){const R=(po.lines||[]).map(()=>0);recs('GRN').forEach(g=>{if(g.poId!==po.id||!['received','paid'].includes(g.status))return;grnLines(g).forEach(l=>{if(l.poLine!=null&&R[l.poLine]!=null)R[l.poLine]+=Math.max(0,(+l.recv||0)-(+l.rej||0))})});return R}
export function poStatus(po){const st=po.status||'draft';if(st!=='issued')return st;const R=poRecvd(po),L=po.lines||[];if(L.length&&L.every((l,i)=>R[i]>=(+l.qty||0)-1e-9))return 'received';if(R.some(x=>x>0))return 'part';return 'issued'}
export function poMiss(po){const m={need:!po.need,sup:!po.sup,lines:(po.lines||[]).map(l=>({qty:!(+l.qty>0),price:!(+l.price>0)}))};m.any=m.need||m.sup||!(po.lines||[]).length||m.lines.some(x=>x.qty||x.price);return m}
export function poNo(){const day=new Date().toISOString().slice(0,10);return (OMAN()?'LPO-OM-':'LPO-')+day.slice(2).replace(/-/g,'')+'-'+String(recs('POs').filter(x=>(x.date||'')===day).length+1).padStart(2,'0')}
export function poCreate(o){const id='PO-'+Date.now().toString(36)+Math.random().toString(36).slice(2,4);const S=supByName(o.sup)||{};const lead=+S.lead||2;
  const need=o.need||(()=>{const d=new Date();d.setDate(d.getDate()+lead);return d.toISOString().slice(0,10)})();
  const ok=editR('POs',id,Object.assign({no:poNo(),date:new Date().toISOString().slice(0,10),status:'draft',deliverTo:OMAN()?'oman':'ajman',cur:OMAN()?'OMR':'AED',need,notes:'',by:me},o,{need}));return ok?id:null}
export function poFromRequest(rid){const r=rec('Requests',rid);if(r.poId&&rec('POs',r.poId).no)return r.poId;const o=(r.opts||[]).find(x=>x.pick)||{};const sp=r.spec||{};
  const spec=Object.keys(sp).filter(k=>k!=='notes'&&String(sp[k]||'').trim()).map(k=>sp[k]).join(', ');
  const id=poCreate({sup:o.sup||'',src:{type:'request',id:rid,no:r.no},need:r.needBy||'',deliverTo:r.branch&&r.branch!=='all'?r.branch:'ajman',apprBy:(r.ceo||{}).by||'',
    lines:[{item:null,name:(r.title||'')+(spec?' — '+spec:''),qty:+r.qty||1,unit:r.unit||'',price:+o.price||0}]});
  if(id)editR('Requests',rid,{poId:id});return id}
export function poAutoRestock(){if(poAutoDone||(SHEET&&!editMode)||!me)return;poAutoDone=true;
  const open=new Set();recs('POs').forEach(po=>{if(['draft','issued','part'].includes(poStatus(po)))(po.lines||[]).forEach(l=>{if(l.item)open.add(l.item)})});
  const by={};lines().forEach(l=>{if(l.st==null||l.st===''||!l.stAt)return;if(!['below','order'].includes(stockState(l))||open.has(l.id)||!l.sup)return;const q=calc(l).q;if(!(q>0))return;(by[l.sup]=by[l.sup]||[]).push({item:l.id,name:l.n,qty:Math.ceil(q*100)/100,unit:l.u||'',price:+l.p||0})});
  let n=0;Object.entries(by).forEach(([sup,L])=>{if(poCreate({sup,src:{type:'restock'},lines:L}))n++});poAutoMsg=n?fill(t('lpAuto'),{n}):''}
export function poIssue(id){const po=Object.assign({id},rec('POs',id));if(poMiss(po).any){toast(t('lpFix'));render();return}const at=new Date().toISOString();
  if(!editR('POs',id,{status:'issued',issBy:me,issAt:at}))return;
  if((po.src||{}).type==='request'&&po.src.id){const r=rec('Requests',po.src.id);if(r.status==='approved')editR('Requests',po.src.id,{status:'ordered',log:rqLog(po.src.id,'status','ordered|'+po.no)})}
  toast(t('lpIssued'));poDoc=true;render();window.scrollTo(0,0)}
export function poAfterGrn(gid){const g=rec('GRN',gid);if(!g.poId)return;const po=Object.assign({id:g.poId},rec('POs',g.poId));if(poStatus(po)==='received'&&(po.src||{}).type==='request'){const r=rec('Requests',po.src.id);if(r&&r.status==='ordered')editR('Requests',po.src.id,{status:'done',log:rqLog(po.src.id,'status','done|'+(g.no||''))})}}
document.addEventListener('click',e=>{
  const o=e.target.closest('[data-poopen]');if(o){poOpen=o.dataset.poopen;poDoc=false;render();window.scrollTo(0,0);return}
  const f=e.target.closest('[data-pof]');if(f){poF=f.dataset.pof;render();return}
  const ld=e.target.closest('[data-poldel]');if(ld&&poOpen){const L=[...(rec('POs',poOpen).lines||[])];L.splice(+ld.dataset.poldel,1);if(editR('POs',poOpen,{lines:L}))render();return}
  const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
  if(a==='ponew'){const id=poCreate({sup:'',src:{type:'manual'},lines:[]});if(id){poOpen=id;poDoc=false;render();window.scrollTo(0,0)}return}
  if(a==='poback'){poOpen=null;poDoc=false;render()}else if(a==='podoc'){poDoc=true;render();window.scrollTo(0,0)}else if(a==='podocback'){poDoc=false;render()}
  else if(a==='poissue'&&poOpen)poIssue(poOpen)
  else if(a==='pocancel'&&poOpen){if(editR('POs',poOpen,{status:'cancelled'})){poOpen=null;render()}}
  else if(a==='rqopenpo'&&rqOpenId){const rid=rqOpenId,r0=rec('Requests',rid);const go=()=>{const id=poFromRequest(rid);if(id){tab='lpo';poOpen=id;poDoc=false;rqOpenId=null;render();window.scrollTo(0,0)}};
    if(r0.poId&&rec('POs',r0.poId).no)go();else rqAsk('cf_lpo',r0,go)}
});
document.addEventListener('change',e=>{const el=e.target;
  if(el.dataset.pof2&&poOpen){editR('POs',poOpen,{[el.dataset.pof2]:String(el.value).trim().slice(0,300)});render();return}
  if(el.dataset.pol!==undefined&&poOpen){const L=(rec('POs',poOpen).lines||[]).map(x=>Object.assign({},x));const i=+el.dataset.pol,k=el.dataset.plf;if(!L[i])return;L[i][k]=['qty','price'].includes(k)?(el.value===''?null:Math.max(0,parseFloat(el.value)||0)):String(el.value).trim().slice(0,300);editR('POs',poOpen,{lines:L});renderSoon(el);return}
  if(el.id==='poadd'&&el.value&&poOpen){const m=el.value.match(/\[([^\]]+)\]$/);const it=m?line(m[1]):null;el.value='';if(!it||!it.n)return;const L=[...(rec('POs',poOpen).lines||[]),{item:it.id,name:it.n,qty:calc(it).q||null,unit:it.u||'',price:+it.p||null}];if(editR('POs',poOpen,{lines:L}))render();return}
  if(el.id==='gpo'&&el.value){const po=Object.assign({id:el.value},rec('POs',el.value));const R=poRecvd(po);const gid=el.dataset.rid;
    const L=(po.lines||[]).map((l,i)=>({item:l.item,name:l.name,u:l.unit,ord:Math.max(0,+((+l.qty||0)-R[i]).toFixed(3)),planQ:+l.qty||0,recv:null,rej:null,price:+l.price||null,plan:+l.price||0,poLine:i})).filter(l=>l.ord>0);
    if(editR('GRN',gid,{poId:po.id,po:po.no,sup:po.sup,lines:L,orderedBy:po.issBy||''})){toast(t('gPoFilled'));render()}return}
});
export let calEl=null;
export function calClose(){const c=document.getElementById('calpop');if(c)c.remove();calEl=null}
export function calOpen(el,ym){calEl=el;let c=document.getElementById('calpop');if(!c){c=document.createElement('div');c.id='calpop';c.className='calpop';document.body.appendChild(c)}
  const v=el.value||'',today=new Date().toISOString().slice(0,10);ym=ym||(v||today).slice(0,7);const [Y,M]=ym.split('-').map(Number);
  const first=new Date(Y,M-1,1),lead=(first.getDay()+6)%7,days=new Date(Y,M,0).getDate();
  const mname=first.toLocaleDateString(lang==='ar'?'ar-AE-u-nu-latn':'en-GB',{month:'long',year:'numeric'});
  const pad=n=>String(n).padStart(2,'0');let cells='';for(let i=0;i<lead;i++)cells+='<span></span>';
  for(let d=1;d<=days;d++){const iso=`${Y}-${pad(M)}-${pad(d)}`;cells+=`<button type="button" data-cd="${iso}" class="${iso===v?'on':''} ${iso===today?'tod':''}">${d}</button>`}
  const prev=new Date(Y,M-2,1),next=new Date(Y,M,1),f=x=>`${x.getFullYear()}-${pad(x.getMonth()+1)}`;
  c.innerHTML=`<div class="calhd"><button type="button" data-cm="${lang==='ar'?f(next):f(prev)}">‹</button><b>${mname}</b><button type="button" data-cm="${lang==='ar'?f(prev):f(next)}">›</button></div>
   <div class="calgrid">${T[lang].calWd.map(w=>`<span class="wd">${w}</span>`).join('')}${cells}</div>
   <div class="calft"><button type="button" data-cd="${today}">${t('calToday')}</button><button type="button" data-cd="">${t('calClear')}</button></div>`;
  c.dir=lang==='ar'?'rtl':'ltr';const r=el.getBoundingClientRect(),w=272,h=c.offsetHeight||330;
  let x=Math.min(Math.max(8,r.left),window.innerWidth-w-8),y=r.bottom+6;if(y+h>window.innerHeight-8)y=Math.max(8,r.top-h-6);c.style.left=x+'px';c.style.top=y+'px'}
export function calPick(v){const el=calEl;calClose();if(!el||!document.body.contains(el))return;el.value=v;el.dispatchEvent(new Event('change',{bubbles:true}))}
export function calPrep(root){root.querySelectorAll('input[type=date]').forEach(el=>{el.type='text';el.readOnly=true;el.classList.add('cal');if(!el.placeholder)el.placeholder='YYYY-MM-DD';el.setAttribute('inputmode','none')})}
document.addEventListener('click',e=>{const pop=e.target.closest('#calpop');
  if(pop){e.stopPropagation();const m=e.target.closest('[data-cm]');if(m){calOpen(calEl,m.dataset.cm);return}const d=e.target.closest('[data-cd]');if(d)calPick(d.dataset.cd);return}
  const el=e.target.closest('input.cal');if(el&&!el.disabled){if(calEl===el){calClose();return}calOpen(el);return}
  if(calEl)calClose()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&calEl)calClose();if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('input.cal')&&!calEl){e.preventDefault();calOpen(e.target)}});
window.addEventListener('scroll',()=>{if(calEl)calClose()},true);
window.addEventListener('resize',()=>{if(calEl)calClose()});
export function moves(){const M=[];
  recs('GRN').forEach(g=>{if(!g.stockDone)return;grnLines(g).forEach(l=>{const acc=Math.max(0,(+l.recv||0)-(+l.rej||0));if(acc&&l.item)M.push({d:g.date||'',ref:g.no||g.id,dir:'in',who:g.sup||'',item:l.item,name:l.name||line(l.item).n,u:l.u||line(l.item).u,q:acc,v:acc*(+l.price||0)})})});
  recs('Transfers').forEach(x=>{if(!['issued','received'].includes(x.status))return;tLines(x).forEach(l=>{if(+l.iss>0)M.push({d:(x.issAt||x.date||'').slice(0,10),ref:x.no||x.id,dir:'out',who:brName(x.branch),br:x.branch,item:l.item,name:l.name||line(l.item).n,u:l.u,q:+l.iss,v:(+l.iss)*(+l.price||0)})})});
  return M.sort((a,b)=>b.d>a.d?1:b.d<a.d?-1:0)}
document.addEventListener('click',async e=>{const tr=e.target.closest('tr[data-open]');if(tr&&!e.target.closest('button,input,select')){supOpen=tr.dataset.open;render();window.scrollTo(0,0);return}
  const od=e.target.closest('[data-omdoor]');if(od){setOmSub(od.dataset.omdoor);render();window.scrollTo(0,0);return}
  const oh=e.target.closest('[data-act="omhome"]');if(oh){setOmSub(null);render();window.scrollTo(0,0);return}
  const pf=e.target.closest('[data-pfrom]');if(pf){payF.from=pf.dataset.pfrom;render();return}
  const dr=e.target.closest('[data-door]');if(dr){gateSide=dr.dataset.door;gateMsg='';if(ERP){erpEnter(gateSide);return}render();return}
  const to=e.target.closest('[data-topen]');if(to){reqOpen=to.dataset.topen;billOpen=null;render();window.scrollTo(0,0);return}
  const an=e.target.closest('[data-ana]');if(an){anaTab=an.dataset.ana;evalOpen=null;delivOpen=null;render();return}
  const ab=e.target.closest('[data-abc]');if(ab){abcF=ab.dataset.abc;render();return}
  const eo=e.target.closest('[data-evopen]');if(eo){evalOpen=eo.dataset.evopen;render();window.scrollTo(0,0);return}
  const go_=e.target.closest('[data-gopen]');if(go_){grnOpen=go_.dataset.gopen;grnDoc=false;scanMsg='';render();window.scrollTo(0,0);return}
  const dop=e.target.closest('[data-dopen]');if(dop){delivOpen=dop.dataset.dopen;render();window.scrollTo(0,0);return}
  const lx=e.target.closest('.logo[data-act="exit"]');if(lx){exitSide();return}
  const so=e.target.closest('[data-soa]');if(so){soaSup=so.dataset.soa;soaAsk=false;tab='soa';grnOpen=null;if(notifOpen){notifOpen=false;ls('pp-fin-seen',new Date().toISOString())}render();window.scrollTo(0,0);return}
  const ps=e.target.closest('[data-pst]');if(ps){payF.st=ps.dataset.pst;render();return}
  const pu=e.target.closest('[data-psup]');if(pu){payF.sup=pu.dataset.psup;payF.st='topay';render();return}
  const b=e.target.closest('button,[data-st]');if(!b)return;
  if(b.dataset.tab&&tab==='fill'&&invEdit&&SHEET&&Object.keys(local).length&&b.dataset.tab!=='fill'){const go=b.dataset.tab;confirmBox(t('leaveQ'),t('saveYes'),async()=>{if(await saveAll({inv:true,loud:true})){tab=go;render();window.scrollTo(0,0)}},t('stay'),1);return}
  if(b.dataset.tab){pSide(false);if(b.dataset.tab==='sups'&&tab==='sups')supOpen=null;if(b.dataset.tab==='req')reqOpen=billOpen=null;if(b.dataset.tab==='grn'&&tab==='grn')grnOpen=null;tab=b.dataset.tab;rqOpenId=null;render();window.scrollTo(0,0);if(wantCeo()&&REFRESH)REFRESH(false);return}
  if(b.dataset.rst!==undefined){reqF.st=b.dataset.rst;render();return}
  if(b.dataset.l){lang=b.dataset.l;ls('pp-lang',lang);render();return}
  if(b.dataset.st){fl.st=b.dataset.st;tab='fill';render();return}
  const a=b.dataset.act;
  if(a==='ok'){const l=line(b.dataset.id);if(edit(l.id,{ok:!l.ok}))render()}
  else if(a==='tnew'){newTransfer()}
  else if(a==='tback'){reqOpen=null;issueAsk=null;render()}
  else if(a==='tnoissue'){issueAsk=null;render()}
  else if(a==='bell'){notifOpen=!notifOpen;if(!notifOpen)ls('pp-fin-seen',new Date().toISOString());render()}
  else if(a==='soaask'){soaAsk=true;render()}else if(a==='soano'){soaAsk=false;render()}
  else if(a==='soapay'){const ag=supAgg()[soaSup];soaAsk=false;if(ag&&ag.next){const at=new Date().toISOString();ag.ready.filter(r=>r.due<=ag.next).forEach(r=>editR('GRN',r.g.id,{status:'paid',paidBy:me,paidAt:at}));toast(t('pPaid'))}render()}
  else if(a==='tstatus'){tStatus(b.dataset.tid,b.dataset.v)}
  else if(a==='tdel'){const x=rec('Transfers',b.dataset.tid);const L=tLines(x).filter((_,i)=>i!==+b.dataset.i);tSet(b.dataset.tid,{lines:L})}
  else if(a==='tbill'){billOpen=b.dataset.tid;render();window.scrollTo(0,0)}
  else if(a==='tbillback'){reqOpen=billOpen;billOpen=null;render()}
  else if(a==='tprint'){window.print()}
  else if(a==='tshare'){shareDoc(b.dataset.name||'Forka')}
  else if(a==='tbillgo'||a==='gdocgo'){const go=b.dataset.go;if(a==='tbillgo')billOpen=b.dataset.tid;else grnDoc=true;render();window.scrollTo(0,0);
    setTimeout(()=>{if(go==='print')window.print();else{const s=document.querySelector('[data-act=tshare]');shareDoc(s?s.dataset.name:'Forka')}},250)}
  else if(a==='pinok'){pinOk()}
  else if(a==='gateback'){gateSide=null;gateMsg='';render()}
  else if(a==='exit'){if(SHEET&&Object.keys(local).length+Object.keys(supLocal).length+recPending()){toast(t('saveFirst'));return}exitSide()}
  else if(a==='saveall'){saveAll()}
  else if(a==='canceledits'){cancelEdits()}
  else if(a==='invedit'){invEdit=true;render()}
  else if(a==='invcancel'){if(nUnsaved()&&SHEET){confirmBox(t('dropQ'),t('dropYes'),()=>{cancelEdits();invEdit=false;render()})}else{invEdit=false;render()}}
  else if(a==='invsave'){if(!SHEET||!Object.keys(local).length){invEdit=false;render();return}confirmBox(t('saveQ').replace('{n}',Object.keys(local).length),t('saveYes'),()=>saveAll({inv:true,loud:true}),t('keepEdit'),1)}
  else if(a==='rmitem'){const l=line(b.dataset.id);confirmBox(t('rmQ').replace('{n}',l.n||t('newItem')),t('rmYes'),()=>{if(edit(l.id,{off:true})){toast(SHEET?t('rmDone'):t('rmGone'));render()}})}
  else if(a==='doneedit'){if(Object.keys(local).length+Object.keys(supLocal).length+recPending()){toast(t('saveFirst'));return}signOut()}
  else if(a==='addsup'){const id='S-N'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);if(editS(id,{n:'',terms:''})){sq='';supOpen=id;render();window.scrollTo(0,0);const el=document.querySelector(`[data-sid="${id}"][data-sf="n"]`);el&&el.focus()}}
  else if(a==='neweval'){const id='E-'+Date.now().toString(36);if(editR('Evaluations',id,{date:new Date().toISOString().slice(0,10),by:me})){evalOpen=id;render();window.scrollTo(0,0)}}
  else if(a==='newdeliv'){const id='D-'+Date.now().toString(36);if(editR('Deliveries',id,{date:new Date().toISOString().slice(0,10)})){delivOpen=id;render();window.scrollTo(0,0)}}
  else if(a==='newgrn'){const d=new Date(),id='G-'+Date.now().toString(36);const no=(OMAN()?'GRN-OM-':'GRN-')+d.toISOString().slice(2,10).replace(/-/g,'')+'-'+String(recs('GRN').filter(g=>(g.date||'')===d.toISOString().slice(0,10)).length+1).padStart(2,'0');if(editR('GRN',id,{no,date:d.toISOString().slice(0,10),time:d.toTimeString().slice(0,5),by:me,lines:[],media:[],status:'draft'})){grnOpen=id;render();window.scrollTo(0,0)}}
  else if(a==='gback'){grnOpen=null;grnDoc=false;scanMsg='';render()}
  else if(a==='gdoc'){grnDoc=true;render();window.scrollTo(0,0)}else if(a==='gdocback'){grnDoc=false;render()}
  else if(a==='gset'){if(editR('GRN',b.dataset.rid,{[b.dataset.k]:b.dataset.v}))render()}
  else if(a==='gdel'){const g=rec('GRN',b.dataset.rid);const L=[...grnLines(g)];L.splice(+b.dataset.i,1);if(editR('GRN',b.dataset.rid,{lines:L}))render()}
  else if(a==='mdel'){const g=rec('GRN',b.dataset.rid);const M=[...(g.media||[])];M.splice(+b.dataset.i,1);if(editR('GRN',b.dataset.rid,{media:M}))render()}
  else if(a==='gstatus'){if(editR('GRN',b.dataset.rid,Object.assign({status:b.dataset.v},b.dataset.v==='paid'?{paidBy:me,paidAt:new Date().toISOString()}:b.dataset.v==='received'?{recvAt:new Date().toISOString()}:{}))){if(b.dataset.v==='received')poAfterGrn(b.dataset.rid);render()}}
  else if(a==='gstock'){const g=rec('GRN',b.dataset.rid);let n=0;grnLines(g).forEach(l=>{if(!l.item)return;const acc=Math.max(0,(+l.recv||0)-(+l.rej||0));if(!acc)return;const cur=line(l.item);if(edit(l.item,{st:+((+cur.st||0)+acc).toFixed(3)}))n++});if(editR('GRN',b.dataset.rid,{stockDone:true})){toast(n+' '+t('stockUpd'));render()}}
  else if(a==='evback'){evalOpen=null;render()}else if(a==='dback'){delivOpen=null;render()}
  else if(a==='rate'){if(editR('Evaluations',b.dataset.rid,{[b.dataset.k]:+b.dataset.v}))render()}
  else if(a==='ontime'){if(editR('Deliveries',b.dataset.rid,{ontime:b.dataset.v}))render()}
  else if(a==='supback'){supOpen=null;render()}
  else if(a==='tog'){const x=supRec(b.dataset.sid),f=b.dataset.tf,v=b.dataset.v;const arr=Array.isArray(x[f])?[...x[f]]:[];const i=arr.indexOf(v);if(i>=0)arr.splice(i,1);else arr.push(v);if(editS(b.dataset.sid,{[f]:arr}))render()}
  else if(a==='supitems'){fl.sup=b.dataset.n;fl.st='all';fl.q='';tab='fill';render()}
  else if(a==='useprice'){if(edit(b.dataset.id,{p:+b.dataset.v}))render()}
  else if(a==='add'){if(!me){toast(t('needName'));return}invEdit=true;const id='N-'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);edit(id,{n:'',con:fl.con||'Al Matbakh',cat:'Food',isNew:true});fl.st='all';fl.q='';render();const el=document.querySelector(`[data-id="${id}"][data-f="n"]`);el&&el.focus()}
  else if(a==='send'){copy(JSON.stringify({forka:'procurement-planner',v:1,who:me,at:new Date().toISOString(),lines:local}))}
  else if(a==='csv'){const rows=[['Ref','Item','Concept','Category','Supplier','Payment','Use/month','PAR','Stock','Unit price','Price per','Pack qty','Pack unit','To buy','Budget AED','Status','By']];
    lines().forEach(l=>{const c=calc(l);rows.push([l.id,l.n,l.con,l.cat,l.sup,l.pay,l.use,l.par,l.st,l.p,l.u,l.pkN,l.pkU,c.q,c.v.toFixed(2),status(l),l.who||''])});
    copy(rows.map(r=>r.map(x=>{x=x==null?'':String(x);return /[",\n]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x}).join(',')).join('\n'))}
  else if(a==='import'){try{const o=JSON.parse(document.getElementById('imp').value);if(o.forka!=='procurement-planner')throw 0;let n=0;
      /* A file for the Oman store (suppliers and items): open Oman first. Everything goes into your unsaved changes;
         check it, then press Save, which sends it to the Oman tabs like any other edit. */
      if(o.region==='oman'||o.sups){if((o.region==='oman')!==OMAN()){toast(t(o.region==='oman'?'impOman':'impUae'));return}
        const okId=id=>/^[A-Za-z0-9_\-.~:@+]{1,60}$/.test(id);let ns=0;
        const SK=['n','contact','phone','phone2','email','emirate','address','map','terms','days','payFrom','payCycle','deliv','lead','minOrder','trn','licence','bankName','accName','iban','accNo','swift','cats','notes'];
        for(const [id,p] of Object.entries(o.sups||{})){if(!okId(id))continue;const c={};SK.forEach(k=>{if(p[k]!==undefined&&p[k]!==null)c[k]=p[k]});if(!editS(id,c))throw 0;ns++}
        for(const [id,p] of Object.entries(o.lines||{})){if(!okId(id))continue;const c={};['n','con','cat','sup','pay','use','par','st','p','u','pkN','pkU','isNew'].forEach(k=>{if(p[k]!==undefined&&p[k]!==null)c[k]=p[k]});if(!edit(id,c))throw 0;n++}
        toast(t('impDone').replace('{n}',n).replace('{s}',ns));render();return}
      for(const [id,p] of Object.entries(o.lines||{})){if(!/^[A-Za-z0-9_\-.~:@+]{1,60}$/.test(id))continue;const clean={};['n','con','cat','sup','pay','use','par','st','p','u','pkN','pkU','ok','who','at','isNew','off'].forEach(k=>{if(p[k]!==undefined)clean[k]=p[k]});
        const cur=Object.assign({},shared[id]||{},clean);shared[id]=cur;await storeSet(id,cur);n++}
      toast(t('imported')+': '+n);render()}catch(err){toast('✗')}}
});
document.addEventListener('change',e=>{const el=e.target;
  if(el.id==='pin')return;
  if(el.id==='me'){me=el.value.trim();ls('pp-me',me);if(!SHEET)renderSoon(el);return}
  if(el.id==='rbr'){reqF.br=el.value;render();return}
  if(el.id==='mvm'){mvF.m=el.value;render();return}
  if(el.id==='psup'){payF.sup=el.value;render();return}
  if(el.id==='tadd'&&el.value){const m=el.value.match(/\[([^\]]+)\]$/);const it=m?line(m[1]):null;el.value='';if(!it||!it.n){toast('✗');return}const x=rec('Transfers',el.dataset.tid);if(tLines(x).some(l=>l.item===it.id)){toast(t('tLines')+': ✓');return}tSet(el.dataset.tid,{lines:[...tLines(x),{item:it.id,name:it.n,u:it.u||'',iss:null}]});setTimeout(()=>{const q=document.querySelectorAll('[data-tlf="iss"]');if(q.length)q[q.length-1].focus()},0);return}
  if(el.dataset.tk&&el.dataset.tid){tSet(el.dataset.tid,{[el.dataset.tk]:String(el.value).trim().slice(0,300)});return}
  if(el.dataset.tl!==undefined&&el.dataset.tid){const x=rec('Transfers',el.dataset.tid);const L=tLines(x).map(l=>Object.assign({},l));const i=+el.dataset.tl,f=el.dataset.tlf;let v=el.value;if(['req','iss','rcv'].includes(f))v=v===''?null:Math.max(0,parseFloat(v)||0);else v=String(v).trim().slice(0,200);if(!L[i])return;L[i][f]=v;tSet(el.dataset.tid,{lines:L});return}
  if(el.id==='fstk'){fl.stk=el.value;render();return}
  if(el.id==='fcat'){fl.cat=el.value;render();return}
  if(el.id==='fcon'){fl.con=el.value;render();return}if(el.id==='fsup'){fl.sup=el.value;render();return}if(el.id==='fpay'){fl.pay=el.value;render();return}
  if(el.dataset.scan){const f=el.files[0];el.value='';if(f)scanBill(el.dataset.scan,f);return}
  if(el.dataset.media){addMedia(el.dataset.media,[...el.files]);el.value='';return}
  if(el.id==='gadd'&&el.value){const id=el.dataset.rid,l=line(el.value),g=rec('GRN',id);const c=calc(l);const L=[...grnLines(g),{item:l.id,name:l.n,u:l.u,ord:null,planQ:c.q||0,recv:null,rej:null,price:+l.p||null,plan:+l.p||0}];editR('GRN',id,{lines:L});renderSoon(el);return}
  if(el.dataset.gl!==undefined&&el.dataset.rid){const g=rec('GRN',el.dataset.rid);const L=grnLines(g).map(x=>Object.assign({},x));const i=+el.dataset.gl,f=el.dataset.gf;let v=el.value;if(['ord','recv','rej','price'].includes(f))v=v===''?null:Math.max(0,parseFloat(v)||0);if(f==='item'){const it=line(v);L[i]=v?Object.assign(L[i],{item:it.id,name:it.n,u:it.u||L[i].u,plan:+it.p||0,planQ:calc(it).q,matched:true,check:false}):Object.assign(L[i],{item:null,matched:false})}else L[i][f]=v;editR('GRN',el.dataset.rid,{lines:L});renderSoon(el);return}
  if(el.dataset.rk&&el.dataset.rid){const f=el.dataset.rf;let v=el.value;if(['ord','recv','rej'].includes(f))v=v===''?null:Math.max(0,parseFloat(v)||0);else if(f==='temp')v=v===''?null:parseFloat(v);else v=String(v).trim().slice(0,f==='note'?500:160);editR(el.dataset.rk,el.dataset.rid,{[f]:v});renderSoon(el);return}
  if(el.dataset.sid&&el.dataset.sf){const f=el.dataset.sf;let v=el.value;if(['days','lead','minOrder','payDom'].includes(f))v=v===''?null:Math.max(0,parseFloat(v)||0);else v=String(v).trim().slice(0,f==='notes'?500:160);
    const cur=supRec(el.dataset.sid);if(cur[f]===v)return;editS(el.dataset.sid,{[f]:v});renderSoon(el);return}
  if(el.dataset.id&&el.dataset.f){const f=el.dataset.f;let v=el.value;
    if(['use','par','st','p','pkN','cyc'].includes(f))v=v===''?null:Math.max(0,parseFloat(v)||0);else v=String(v).trim().slice(0,120);
    const cur=line(el.dataset.id);if(cur[f]===v)return;edit(el.dataset.id,{[f]:v});renderSoon(el)}
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='pin'&&!unlocked){e.preventDefault();pinOk()}});
export let redrawLater=false;
export const typingNow=()=>{const a=document.activeElement;return !!a&&(a.tagName==='TEXTAREA'||a.tagName==='SELECT'||(a.tagName==='INPUT'&&!/^(checkbox|radio|button|submit|file|range|color)$/.test(a.type)))};
export const renderSoon=el=>setTimeout(()=>{if(typingNow()&&document.activeElement!==el)redrawLater=true;else render()},0);
document.addEventListener('focusout',()=>{if(redrawLater)setTimeout(()=>{if(redrawLater&&!typingNow()){redrawLater=false;render()}},60)});
export let searchT=null;
export function searchRender(id){clearTimeout(searchT);searchT=setTimeout(()=>{render();const q=document.getElementById(id);if(q&&document.activeElement!==q){q.focus();q.setSelectionRange(q.value.length,q.value.length)}},180)}
document.addEventListener('input',e=>{const id=e.target.id;
  if(id==='pq'){payF.q=e.target.value;searchRender(id);return}if(id==='mvq'){mvF.q=e.target.value;searchRender(id);return}
  if(id==='q'){fl.q=e.target.value;searchRender(id);return}if(id==='sq'){sq=e.target.value;searchRender(id)}});
export async function boot(){
  lang=ls('pp-lang')||'en';me=ls('pp-me')||'';local=ls('pp-local')||{};side='plan';tab='fill';
  PEOPLE=ls('pp-people')||{};ACT=ls('pp-activity')||{};OUTBOX=ls('pp-outbox')||{};
  supLocal=ls('pp-slocal')||{};recLocal=Object.assign({Evaluations:{},Deliveries:{},GRN:{},Transfers:{},Requests:{},POs:{}},ls('pp-rlocal')||{});
  try{pin=sessionStorage.getItem('pp-pin')||''}catch(_){pin=''}
  // Opening from Forka Apps: ask the server now, while data.json downloads (both at once, not one after the other).
  const BG=SHEET&&ERP&&!pin?post({load:true,side:''}):null, SNAPP=SHEET&&ERP?IDB.get('snap'):null;
  // A copy saved under another sign-in: ask the accounts server, at the same time, whether it is the same person.
  const WHO=SNAPP?SNAPP.then(s=>s&&s.r&&s.email&&s.erp!==ERP?accWho():null):null;
  // Demo and tests only: a sample list with made-up suppliers, prices and quantities. The real list comes from the server after sign-in.
  if(!SHEET){try{const d=await (await fetch('demo-data.json')).json();setBase(d.lines)}catch(e){document.getElementById('page').innerHTML='<div class="empty">demo-data.json</div>';return}}
  let want='';if(pin){try{want=sessionStorage.getItem('pp-ok')||''}catch(_){}}
  const s0=SNAPP?await SNAPP:null,w0=WHO?await WHO:null,SNAP=snapFor(s0,w0,want||(pin?'?':'')),SNAPE=SNAP?s0.email||'':'';
  // Opening from Forka Apps: one call checks the sign-in and downloads the data together (or the saved copy opens at once).
  if(BG){const r0=SNAP||await BG;if(!SNAP)keepSnap(r0);if(r0.ok){ERP_SIDES=(r0.me&&r0.me.sides)||[];if(r0.lines){PRELOAD=r0}applyMe(r0.me);if(ERP_SIDES.length===1){await erpEnter(ERP_SIDES[0])}}else if(r0.error==='erp'||r0.error==='noproc'){clearSnap();ERP='';try{sessionStorage.removeItem('pp-erp')}catch(_){}pin='';gateMsg=r0.error==='noproc'?t('erpNone'):t('erpExpired')}}
  let ok='';try{ok=sessionStorage.getItem('pp-ok')||''}catch(_){}
  if(SIDES[ok]&&(!SHEET||pin)){if(unlocked!==ok){setRegion(ok==='oman'?'oman':'uae');unlocked=ok;side=ok;tab=sideTabs()[0]||SIDES[ok][0]}}else if(!(SHEET&&ERP&&mode==='live')){pin=''}
  if(SHEET&&!pin)mode='login';
  render();
  if(SHEET){
    const go=async first=>{if(!pin||mode==='login')return;try{const o=await sheetLoad(!first);if(o===SAME)return;shared=o;
        if(first){mode='live';editMode=myRole!=='viewer'}else if(myRole==='viewer')editMode=false;
        if(typingNow()){redrawLater=true}else render()}
      catch(e){if(e.code==='pin'){signOut(errMsg(e.err));return}if(first){mode='offline';render()}}};
    if(mode==='live'){}else if(!pin){mode='login';render()}
    else if(SNAP&&!PRELOAD){PRELOAD=SNAP;BGWAIT=true;await go(true);go(false).finally(bgDone)}  // open from the saved copy, then check the server
    else{mode='loading';render();await go(true)}
    REFRESH=go;
    // Opened from the saved copy: when the server answers, check access is unchanged and pick up any changes.
    if(BG&&SNAP){BGWAIT=true;if(mode==='live')render();BG.then(async r=>{
      if(!r.ok){bgDone();if(r.error==='erp'||r.error==='noproc'){erpGone();if(r.error==='noproc'){gateMsg=t('erpNone');render()}}return}
      if(SNAPE&&r.me&&r.me.email&&String(r.me.email).trim().toLowerCase()!==SNAPE){erpGone();return}   // never another person's copy
      keepSnap(r);ERP_SIDES=(r.me&&r.me.sides)||[];applyMe(r.me);
      if(unlocked&&ERP_SIDES.indexOf(unlocked)<0){erpGone();return}       // access to this section was removed
      if(r.ver!==VER){if(pin&&mode!=='login')await go(false);else PRELOAD=r.lines?r:null}
      bgDone();if(mode==='login')render()})}
    setInterval(()=>{if(!document.hidden)go(false)},30000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)go(false)});return}
  const timer=setTimeout(()=>{if(mode==='loading'){mode='offline';render()}},10000);
  try{
    let C=window.claude;for(let i=0;i<30&&!(C&&C.use);i++){await new Promise(r=>setTimeout(r,100));C=window.claude}
    db=C&&C.use?await C.use('db'):null;user=C&&C.use?await C.use('user'):null;    if(user){try{isOwner=!!(await user.isOwner())}catch(_){}try{uid=await user.id()}catch(_){}}
    let canW=null;if(user){try{canW=await user.can('data.write')}catch(_){canW=null}}
    if(!db){clearTimeout(timer);mode='local';render();return}
    if(canW===false){mode='local'}
    [['people',o=>PEOPLE=o],['activity',o=>ACT=o],['outbox',o=>OUTBOX=o]].forEach(([c,f])=>db.collection(c).onSnapshot(sn=>{const o={};sn.docs.forEach(d=>{if(d.exists)o[d.id]=d.data()});f(o);if(['people','activity'].includes(tab)&&!(document.activeElement&&document.activeElement.dataset&&document.activeElement.dataset.ppf))render()},()=>{}));
    [['oman_suppliers',o=>{supShared=o}],['oman_lines',o=>{shared=o}]].forEach(([c,f])=>db.collection(c).onSnapshot(sn=>{const o={};sn.docs.forEach(d=>{if(d.exists)o[d.id]=d.data()});inRegion('oman',()=>f(o));render()},()=>{}));
    [['GRN','oman_grn'],['POs','oman_pos']].forEach(([k,c])=>db.collection(c).onSnapshot(sn=>{const o={};sn.docs.forEach(d=>{if(d.exists)o[d.id]=d.data()});inRegion('oman',()=>{recShared[k]=o});render()},()=>{}));
    db.collection('suppliers').onSnapshot(sn=>{const o={};sn.docs.forEach(d=>{if(d.exists)o[d.id]=d.data()});inRegion('uae',()=>{supShared=o});if(typingNow()){redrawLater=true}else render()},()=>{});
    [['GRN','grn'],['Evaluations','evaluations'],['Deliveries','deliveries'],['Transfers','transfers'],['Requests','requests'],['POs','pos']].forEach(([k,c])=>db.collection(c).onSnapshot(sn=>{const o={};sn.docs.forEach(d=>{if(d.exists)o[d.id]=d.data()});inRegion('uae',()=>{recShared[k]=o});const ae=document.activeElement;if(!(ae&&(ae.tagName==='INPUT'||ae.tagName==='SELECT')&&(ae.dataset.tl||ae.dataset.tk||ae.dataset.rf||ae.dataset.gl!==undefined)))render()},()=>{}));
    db.collection('lines').onSnapshot(snap=>{const o={};snap.docs.forEach(d=>{if(d.exists&&!/^(G|E|D|T|R|PO)-[0-9a-z]+$/.test(d.id))o[d.id]=d.data()});inRegion('uae',()=>{shared=o});
        if(!snap.metadata.fromCache){clearTimeout(timer);if(mode==='loading'||mode==='offline')mode=canW===false?'local':'live';
          if(mode==='live'&&Object.keys(local).length){const L0=local;local={};ls('pp-local',local);Object.entries(L0).forEach(([id,p])=>{const cur=Object.assign({},o[id]||{},p);shared[id]=cur;queue[id]=cur;flush(id)})}}
        const ae=document.activeElement;if(ae&&ae.tagName==='INPUT'&&ae.dataset.f)return;render()},
      err=>{clearTimeout(timer);mode=err&&err.code==='revoked'?'local':'offline';render()});
  }catch(e){clearTimeout(timer);mode='local';render()}
}
/** For the browser checks and the console: change a top-level value from outside (as the old page allowed). */
export const SETTABLE = ["openMail", "ACT", "BASE", "BGWAIT", "BRANCHES", "EMIRATES", "ERP", "ERP_SIDES", "LPLOC", "OUTBOX", "PEOPLE", "PRELOAD", "REFRESH", "REGION", "SBASE", "SNAPOFF", "VER", "_lead", "abcF", "anaTab", "apF", "billOpen", "calEl", "db", "delivOpen", "editMode", "editMsg", "evalOpen", "fkI", "fl", "gateMsg", "gateSide", "grnDoc", "grnOpen", "invAvg", "invEdit", "invH", "invHK", "invOpen", "invR", "invWin", "isOwner", "issueAsk", "ivMenu", "ivNaming", "ivRaf", "keepIds", "keepKey", "lang", "lastTab", "local", "me", "mode", "mvF", "myBranch", "myEmail", "myRole", "notifOpen", "omSub", "payF", "pin", "pinNeeded", "poAutoDone", "poAutoMsg", "poDoc", "poF", "poOpen", "ppDraft", "ppOpen", "qsT", "recLocal", "recShared", "redrawLater", "reqF", "reqOpen", "rowRank", "rowRankKey", "rqClose", "rqDraft", "rqF", "rqG", "rqMore", "rqNaming", "rqOpenId", "rqTry", "saveAgain", "saving", "scanBusy", "scanMsg", "searchT", "shared", "side", "soaAsk", "soaSup", "sq", "supLocal", "supOpen", "supRank", "supRankKey", "supShared", "tab", "uid", "unlocked", "user"];
export function __set(name, v) { switch (name) {
  case 'openMail': openMail = v; break; // the checks put a stand-in here so no real email opens
  case 'ACT': ACT = v; break;
  case 'BASE': BASE = v; break;
  case 'BGWAIT': BGWAIT = v; break;
  case 'BRANCHES': BRANCHES = v; break;
  case 'EMIRATES': EMIRATES = v; break;
  case 'ERP': ERP = v; break;
  case 'ERP_SIDES': ERP_SIDES = v; break;
  case 'LPLOC': LPLOC = v; break;
  case 'OUTBOX': OUTBOX = v; break;
  case 'PEOPLE': PEOPLE = v; break;
  case 'PRELOAD': PRELOAD = v; break;
  case 'REFRESH': REFRESH = v; break;
  case 'REGION': REGION = v; break;
  case 'SBASE': SBASE = v; break;
  case 'SNAPOFF': SNAPOFF = v; break;
  case 'VER': VER = v; break;
  case '_lead': _lead = v; break;
  case 'abcF': abcF = v; break;
  case 'anaTab': anaTab = v; break;
  case 'apF': apF = v; break;
  case 'billOpen': billOpen = v; break;
  case 'calEl': calEl = v; break;
  case 'db': db = v; break;
  case 'delivOpen': delivOpen = v; break;
  case 'editMode': editMode = v; break;
  case 'editMsg': editMsg = v; break;
  case 'evalOpen': evalOpen = v; break;
  case 'fkI': fkI = v; break;
  case 'fl': fl = v; break;
  case 'gateMsg': gateMsg = v; break;
  case 'gateSide': gateSide = v; break;
  case 'grnDoc': grnDoc = v; break;
  case 'grnOpen': grnOpen = v; break;
  case 'invAvg': invAvg = v; break;
  case 'invEdit': invEdit = v; break;
  case 'invH': invH = v; break;
  case 'invHK': invHK = v; break;
  case 'invOpen': invOpen = v; break;
  case 'invR': invR = v; break;
  case 'invWin': invWin = v; break;
  case 'isOwner': isOwner = v; break;
  case 'issueAsk': issueAsk = v; break;
  case 'ivMenu': ivMenu = v; break;
  case 'ivNaming': ivNaming = v; break;
  case 'ivRaf': ivRaf = v; break;
  case 'keepIds': keepIds = v; break;
  case 'keepKey': keepKey = v; break;
  case 'lang': lang = v; break;
  case 'lastTab': lastTab = v; break;
  case 'local': local = v; break;
  case 'me': me = v; break;
  case 'mode': mode = v; break;
  case 'mvF': mvF = v; break;
  case 'myBranch': myBranch = v; break;
  case 'myEmail': myEmail = v; break;
  case 'myRole': myRole = v; break;
  case 'notifOpen': notifOpen = v; break;
  case 'omSub': omSub = v; break;
  case 'payF': payF = v; break;
  case 'pin': pin = v; break;
  case 'pinNeeded': pinNeeded = v; break;
  case 'poAutoDone': poAutoDone = v; break;
  case 'poAutoMsg': poAutoMsg = v; break;
  case 'poDoc': poDoc = v; break;
  case 'poF': poF = v; break;
  case 'poOpen': poOpen = v; break;
  case 'ppDraft': ppDraft = v; break;
  case 'ppOpen': ppOpen = v; break;
  case 'qsT': qsT = v; break;
  case 'recLocal': recLocal = v; break;
  case 'recShared': recShared = v; break;
  case 'redrawLater': redrawLater = v; break;
  case 'reqF': reqF = v; break;
  case 'reqOpen': reqOpen = v; break;
  case 'rowRank': rowRank = v; break;
  case 'rowRankKey': rowRankKey = v; break;
  case 'rqClose': rqClose = v; break;
  case 'rqDraft': rqDraft = v; break;
  case 'rqF': rqF = v; break;
  case 'rqG': rqG = v; break;
  case 'rqMore': rqMore = v; break;
  case 'rqNaming': rqNaming = v; break;
  case 'rqOpenId': rqOpenId = v; break;
  case 'rqTry': rqTry = v; break;
  case 'saveAgain': saveAgain = v; break;
  case 'saving': saving = v; break;
  case 'scanBusy': scanBusy = v; break;
  case 'scanMsg': scanMsg = v; break;
  case 'searchT': searchT = v; break;
  case 'shared': shared = v; break;
  case 'side': side = v; break;
  case 'soaAsk': soaAsk = v; break;
  case 'soaSup': soaSup = v; break;
  case 'sq': sq = v; break;
  case 'supLocal': supLocal = v; break;
  case 'supOpen': supOpen = v; break;
  case 'supRank': supRank = v; break;
  case 'supRankKey': supRankKey = v; break;
  case 'supShared': supShared = v; break;
  case 'tab': tab = v; break;
  case 'uid': uid = v; break;
  case 'unlocked': unlocked = v; break;
  case 'user': user = v; break;
} }
