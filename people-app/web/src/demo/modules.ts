// Demo stand-in for the module endpoints (leave, requests and approvals, time, documents, lifecycle,
// payroll, performance, learning, HR desk, policies, reports, settings). Made-up data only.
// Values that will come from approved country rules (docs/people/10) are marked as company policy or "to confirm".
import type { Ctx } from './mock';

type Any = Record<string, any>;
const bi = (en: string, ar: string) => ({ en, ar });

// Small deterministic random so the demo looks the same on every load.
function rng(seed: string) { let h = 2166136261; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296; }

const FAMILY: Record<string, 'service' | 'culinary' | 'management'> = {
  'Chef': 'culinary', 'Chef de Partie': 'culinary', 'Grill Chef': 'culinary', 'Assistant Cook': 'culinary', 'Steward': 'culinary', 'Pastry Chef': 'culinary',
  'Waiter': 'service', 'Cashier': 'service', 'Barista': 'service', 'Driver': 'service', 'Storekeeper': 'service',
};
const family = (job: string) => FAMILY[job] || 'management';

export function makeModules(x: Ctx) {
  const { D, E, rows, can, has, isSelf, today, addDay } = x;
  const byId = (l: Any[], id: any): Any => x.byId(l, id) as Any;
  type Me = ReturnType<Ctx['me']>;
  const T = today();
  const monday = (d: string) => { const dt = new Date(d + 'T00:00:00Z'); const wd = (dt.getUTCDay() + 6) % 7; return addDay(d, -wd); };
  const allRows = () => D.employments.map(x.row);
  const rowByEmp = (id: string) => allRows().find((r: Any) => r.employment_id === id);
  const userOfEmp = (empId: string) => { const e = byId(D.employments, empId); return e && D.users.find((u: Any) => u.person_id === e.person_id); };
  const visibleRows = (m: Me) => rows(m).filter((r: Any) => can.seeWork(m, r));
  const isHr = (m: Me, ent: string) => has(m, ['HR_MANAGER', 'HR_OFFICER'], ent);
  const isHrAny = (m: Me) => m.isCeo || m.grants.some((g: Any) => ['HR_MANAGER', 'HR_OFFICER'].includes(g.role));
  const isMgrOf = (m: Me, r: Any) => !isSelf(m, r) && (m.isCeo || m.employmentIds.includes(r.manager_employment_id) ||
    m.grants.some((g: Any) => g.role === 'BRANCH_MANAGER' && g.scope_id === r.branch_id));
  const country = (r: Any) => r.country_code as 'AE' | 'OM';
  const name = (r: Any) => bi(r.name_en, r.name_ar || r.name_en);
  const person = (r: Any) => ({ employmentId: r.employment_id, name: name(r), job: bi(r.job_en, r.job_ar), branch: bi(r.branch_en, r.branch_ar) });
  const self = (m: Me) => allRows().find((r: Any) => isSelf(m, r));
  const deny: () => never = () => { throw new E(403, 'no_access'); };
  const now = () => new Date().toISOString();

  // ---------- reference data ----------
  // Annual leave, sick leave etc. follow the company leave policy HRP04 (UAE). Oman values are placeholders until the Oman policy is shared.
  const leaveTypes: Any[] = [];
  for (const cc of ['AE', 'OM']) {
    const o = cc === 'OM';
    leaveTypes.push(
      { code: 'annual', country: cc, name: bi('Annual leave', 'الإجازة السنوية'), perYear: 30, paid: 100, halfDay: true, counts: 'calendar', note: o ? 'to_confirm' : 'policy' },
      { code: 'sick', country: cc, name: bi('Sick leave', 'الإجازة المرضية'), perYear: 15, paid: 100, halfDay: true, counts: 'calendar', docAfter: 1, note: o ? 'to_confirm' : 'policy' },
      { code: 'parental', country: cc, name: bi('Parental leave', 'إجازة الوالدين'), perYear: 5, paid: 100, halfDay: false, counts: 'working', note: o ? 'to_confirm' : 'policy' },
      { code: 'compassionate', country: cc, name: bi('Compassionate leave', 'إجازة الحداد'), perYear: 6, paid: 100, halfDay: false, counts: 'working', note: o ? 'to_confirm' : 'policy' },
      { code: 'maternity', country: cc, name: bi('Maternity leave', 'إجازة الأمومة'), perYear: 60, paid: 100, halfDay: false, counts: 'calendar', note: o ? 'to_confirm' : 'policy' },
      { code: 'hajj', country: cc, name: bi('Hajj leave (unpaid)', 'إجازة الحج (بدون راتب)'), perYear: 30, paid: 0, halfDay: false, counts: 'calendar', note: o ? 'to_confirm' : 'policy' },
      { code: 'unpaid', country: cc, name: bi('Unpaid leave', 'إجازة بدون راتب'), perYear: null, paid: 0, halfDay: true, counts: 'calendar', note: 'policy' },
    );
  }
  const lt = (cc: string, code: string) => leaveTypes.find(l => l.country === cc && l.code === code)!;
  // Fixed-date holidays only; religious holidays are added when officially announced.
  const holidays = [
    { country: 'AE', day: '2026-12-02', name: bi('UAE National Day', 'اليوم الوطني'), status: 'provisional' },
    { country: 'AE', day: '2026-12-03', name: bi('UAE National Day', 'اليوم الوطني'), status: 'provisional' },
    { country: 'AE', day: '2027-01-01', name: bi("New Year's Day", 'رأس السنة الميلادية'), status: 'provisional' },
    { country: 'OM', day: '2026-11-18', name: bi('Oman National Day', 'العيد الوطني العُماني'), status: 'provisional' },
    { country: 'OM', day: '2027-01-01', name: bi("New Year's Day", 'رأس السنة الميلادية'), status: 'provisional' },
  ];

  // ---------- documents get ids ----------
  D.documents.forEach((d: Any, i: number) => { d.id ??= 'doc-' + i; });

  // ---------- requests and approvals ----------
  const requests: Any[] = [];
  const rules = (type: string, p: Any): string[] => {
    if (type === 'leave') return (p.days > 5 || ['unpaid', 'maternity', 'hajj'].includes(p.leaveType)) ? ['line_manager', 'hr'] : ['line_manager'];
    if (type === 'attendance_correction' || type === 'schedule_change') return ['line_manager'];
    if (type === 'letter') return p.letter === 'salary_certificate' ? ['hr', 'hr_manager'] : ['hr'];
    return ['hr'];
  };
  const canAct = (m: Me, rule: string, r: Any) => {
    if (isSelf(m, r)) return false;
    if (m.isCeo) return true;
    if (rule === 'line_manager') return m.employmentIds.includes(r.manager_employment_id) || m.grants.some((g: Any) => g.role === 'BRANCH_MANAGER' && g.scope_id === r.branch_id) || isHr(m, r.entity_id);
    if (rule === 'hr') return isHr(m, r.entity_id);
    if (rule === 'hr_manager') return has(m, ['HR_MANAGER'], r.entity_id);
    return false;
  };
  // Inbox: only the people the step is meant for (HR can still act on a manager step from "All in my scope").
  const inInbox = (m: Me, rule: string, r: Any) => {
    if (isSelf(m, r)) return false;
    if (rule === 'line_manager') return m.employmentIds.includes(r.manager_employment_id) || m.grants.some((g: Any) => g.role === 'BRANCH_MANAGER' && g.scope_id === r.branch_id) || (m.isCeo && !r.manager_employment_id);
    return canAct(m, rule, r) && (!m.isCeo || rule === 'hr_manager' || isHr(m, r.entity_id));
  };
  const ruleLabel = (rule: string, r: Any) => {
    if (rule === 'line_manager') return r.manager_en ? bi(r.manager_en, r.manager_ar || r.manager_en) : bi('Line manager', 'المدير المباشر');
    if (rule === 'hr') return bi('HR', 'الموارد البشرية');
    if (rule === 'hr_manager') return bi('HR Manager', 'مدير الموارد البشرية');
    return bi(rule, rule);
  };
  function createRequest(by: Me | null, empId: string, type: string, payload: Any, createdAt?: string) {
    const r = rowByEmp(empId);
    const steps = rules(type, payload).map((rule, i) => ({ no: i + 1, rule, action: null as string | null, actedBy: null as string | null, at: null as string | null, comment: null as string | null }));
    const req = { id: 'req-' + (requests.length + 1), type, employmentId: empId, entityId: r.entity_id, payload, status: 'pending', currentStep: 1, steps,
      requestedBy: by ? by.displayName : (userOfEmp(empId)?.display_name || r.name_en), onBehalf: by ? !isSelf(by, r) : false, createdAt: createdAt || now() };
    requests.unshift(req);
    return req;
  }
  function decide(req: Any, actor: string, action: 'approved' | 'rejected', comment?: string, at?: string) {
    const st = req.steps[req.currentStep - 1];
    Object.assign(st, { action, actedBy: actor, at: at || now(), comment: comment || null });
    if (action === 'rejected') { req.status = 'rejected'; return; }
    if (req.currentStep < req.steps.length) { req.currentStep++; return; }
    req.status = 'approved';
    if (req.type === 'leave') {
      const r = rowByEmp(req.employmentId);
      ledger.push({ emp: req.employmentId, code: req.payload.leaveType, cc: country(r), day: req.payload.start, days: -req.payload.days, kind: 'taken', note: req.id });
    }
  }
  const viewReq = (m: Me, req: Any) => {
    const r = rowByEmp(req.employmentId);
    const step = req.steps[req.currentStep - 1];
    return { id: req.id, type: req.type, status: req.status, createdAt: req.createdAt, requestedBy: req.requestedBy, onBehalf: req.onBehalf,
      employee: person(r), payload: req.payload, currentStep: req.currentStep,
      leaveName: req.type === 'leave' ? lt(country(r), req.payload.leaveType).name : null,
      steps: req.steps.map((s: Any) => ({ ...s, who: ruleLabel(s.rule, r) })),
      canAct: req.status === 'pending' && !!step && canAct(m, step.rule, r), canWithdraw: req.status === 'pending' && isSelf(m, r) };
  };

  // ---------- leave ledger (opening balances + history) ----------
  const ledger: Any[] = [];
  for (const r of allRows()) {
    const g = rng(r.employment_id);
    const months = Math.max(0, (new Date(T).getTime() - new Date(r.start_date).getTime()) / 2.63e9);
    const opening = months >= 12 ? 30 : months >= 6 ? Math.floor(months) * 2 : 0;
    ledger.push({ emp: r.employment_id, code: 'annual', cc: country(r), day: '2026-01-01', days: opening, kind: 'opening', note: 'Opening balance 2026' });
    if (opening > 0) ledger.push({ emp: r.employment_id, code: 'annual', cc: country(r), day: '2026-07-12', days: -Math.min(opening, 4 + Math.floor(g() * 10)), kind: 'taken', note: 'Summer leave' });
    ledger.push({ emp: r.employment_id, code: 'sick', cc: country(r), day: '2026-01-01', days: 15, kind: 'opening', note: 'Opening balance 2026' });
    if (g() > .5) ledger.push({ emp: r.employment_id, code: 'sick', cc: country(r), day: '2026-03-03', days: -1 - Math.floor(g() * 2), kind: 'taken', note: 'Sick leave' });
  }
  const balances = (empId: string) => {
    const r = rowByEmp(empId); const cc = country(r);
    return leaveTypes.filter(l => l.country === cc).map(l => {
      const lines = ledger.filter(e => e.emp === empId && e.code === l.code);
      const pending = requests.filter(q => q.type === 'leave' && q.employmentId === empId && q.status === 'pending' && q.payload.leaveType === l.code).reduce((s, q) => s + q.payload.days, 0);
      const balance = lines.reduce((s, e) => s + e.days, 0);
      return { code: l.code, name: l.name, paid: l.paid, halfDay: l.halfDay, perYear: l.perYear, note: l.note, tracked: lines.length > 0 || ['annual', 'sick'].includes(l.code),
        balance, pending, lines: lines.map(e => ({ day: e.day, days: e.days, kind: e.kind, note: e.note })) };
    });
  };
  const countDays = (cc: string, code: string, start: string, end: string, halfStart: boolean, halfEnd: boolean) => {
    const l = lt(cc, code); let d = start, n = 0;
    while (d <= end) {
      const wd = new Date(d + 'T00:00:00Z').getUTCDay();
      const hol = holidays.some(h => h.country === cc && h.day === d);
      if (l.counts === 'calendar' || (wd !== 0 && !hol)) n++;   // demo: Sunday as the rest day for working-day leave
      d = addDay(d, 1);
    }
    if (halfStart) n -= .5; if (halfEnd && end !== start) n -= .5;
    return n;
  };

  // A few requests so the inboxes are not empty.
  const findEmp = (n: string) => allRows().find((r: Any) => r.name_en === n);
  const seedReq = () => {
    const aisha = findEmp('Aisha Rahman'), imran = findEmp('Imran Khan'), kofi = findEmp('Kofi Owusu'), john = findEmp('John Mensah'),
      tes = findEmp('Tesfaye Bekele'), faisal = findEmp('Faisal Al Busaidi'), joy = findEmp('Joy Reyes');
    const a1 = createRequest(null, aisha.employment_id, 'leave', { leaveType: 'annual', start: addDay(T, 20), end: addDay(T, 23), days: 4, reason: 'Family visit' }, addDay(T, -1) + 'T08:10:00Z');
    void a1;
    const a2 = createRequest(null, imran.employment_id, 'leave', { leaveType: 'annual', start: addDay(T, 35), end: addDay(T, 46), days: 12, reason: 'Travel home' }, addDay(T, -3) + 'T09:00:00Z');
    decide(a2, 'Ravi Menon', 'approved', 'Covered by the UAQ driver', addDay(T, -2) + 'T10:00:00Z');
    const a3 = createRequest(null, kofi.employment_id, 'leave', { leaveType: 'sick', start: addDay(T, -6), end: addDay(T, -6), days: 1, reason: 'Fever' }, addDay(T, -6) + 'T06:30:00Z');
    decide(a3, 'Mariam Saleh', 'approved', undefined, addDay(T, -6) + 'T07:00:00Z');
    createRequest(null, john.employment_id, 'letter', { letter: 'salary_certificate', addressedTo: 'Bank', language: 'en' }, addDay(T, -2) + 'T12:00:00Z');
    createRequest(null, tes.employment_id, 'attendance_correction', { date: addDay(T, -2), kind: 'out', time: '23:05', reason: 'Forgot to clock out after closing' }, addDay(T, -1) + 'T09:30:00Z');
    createRequest(null, faisal.employment_id, 'schedule_change', { date: addDay(T, 3), from: 'Evening', to: 'Morning', reason: 'University exam' }, addDay(T, -1) + 'T11:00:00Z');
    const j = createRequest(null, joy.employment_id, 'leave', { leaveType: 'annual', start: addDay(T, -30), end: addDay(T, -27), days: 4, reason: 'Rest' }, addDay(T, -45) + 'T08:00:00Z');
    decide(j, 'Grace Santos', 'approved', undefined, addDay(T, -44) + 'T08:00:00Z');
  };
  seedReq();

  // ---------- shifts ----------
  const TEMPL = [
    { id: 'M', name: bi('Morning', 'صباحي'), segments: [['08:00', '16:00']], color: 'saffron' },
    { id: 'E', name: bi('Evening', 'مسائي'), segments: [['16:00', '00:00']], color: 'sea' },
    { id: 'S', name: bi('Split', 'مقسّم'), segments: [['10:00', '15:00'], ['18:00', '23:00']], color: 'sage' },
    { id: 'N', name: bi('Late close', 'إغلاق متأخر'), segments: [['18:00', '02:00']], color: 'terracotta' },
  ];
  const hours = (t: Any) => t.segments.reduce((s: number, [a, b]: string[]) => { let h = (+b.slice(0, 2) + +b.slice(3) / 60) - (+a.slice(0, 2) + +a.slice(3) / 60); if (h <= 0) h += 24; return s + h; }, 0);
  const shifts = new Map<string, string>();        // key emp|date -> template id
  const published = new Map<string, boolean>();    // key branch|weekStart
  const W0 = monday(T);
  for (const r of allRows()) {
    if (!r.branch_id || r.branch_en === 'Head office') continue;
    const g = rng('shift' + r.employment_id); const rest = Math.floor(g() * 7);
    const base = family(r.job_en) === 'culinary' ? 'S' : g() > .5 ? 'M' : 'E';
    for (let w = -1; w <= 1; w++) for (let d = 0; d < 7; d++) {
      if (d === rest) continue;
      const date = addDay(W0, w * 7 + d);
      shifts.set(r.employment_id + '|' + date, d === 4 && base === 'E' ? 'N' : base);
    }
  }
  for (const b of D.branches) { published.set(b.id + '|' + addDay(W0, -7), true); published.set(b.id + '|' + W0, true); }
  const branchesFor = (m: Me) => D.branches.filter((b: Any) => b.code !== 'HO' && (m.isCeo || isHr(m, b.entity_id) || m.grants.some((g: Any) => g.role === 'BRANCH_MANAGER' && g.scope_id === b.id)));

  // ---------- attendance (past days) ----------
  const att: Any[] = [];
  for (const r of allRows()) for (let i = 1; i <= 9; i++) {
    const date = addDay(T, -i); const tid = shifts.get(r.employment_id + '|' + date); if (!tid) continue;
    const t = TEMPL.find(z => z.id === tid)!; const g = rng('att' + r.employment_id + date)(); const start = t.segments[0][0];
    let exc: string[] = [], inT = start, outT = t.segments[t.segments.length - 1][1], late = 0, ot = 0;
    if (g < .08) { exc = ['late']; late = 12 + Math.floor(g * 300); const mm = +start.slice(3) + late; inT = `${String(+start.slice(0, 2) + Math.floor(mm / 60)).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`; }
    else if (g < .11) { exc = ['missed_punch']; outT = '—'; }
    else if (g < .125) { exc = ['absent']; inT = '—'; outT = '—'; }
    else if (g > .95) { exc = ['overtime']; ot = 60 + Math.floor((g - .95) * 2000); }
    att.push({ key: r.employment_id + '|' + date, emp: r.employment_id, date, shift: t.name, in: inT, out: outT, late, ot, exceptions: exc, status: exc.length ? 'open' : 'approved', hours: hours(t) });
  }
  const clock = new Map<string, Any>();

  // ---------- lifecycle ----------
  const ONB = [
    ['Signed contract and offer letter', 'عقد العمل وخطاب العرض موقّعان', 'hr', -3], ['Passport and visa copies', 'نسخ جواز السفر والإقامة', 'employee', 0],
    ['Emirates ID / resident card', 'الهوية / البطاقة الشخصية', 'employee', 7], ['Bank details form', 'نموذج بيانات البنك', 'employee', 3],
    ['Health / food handler card', 'البطاقة الصحية', 'hr', 14], ['Uniform and locker', 'الزي الموحد والخزانة', 'manager', 1],
    ['HR orientation and handbook', 'التعريف بالموارد البشرية ودليل الموظف', 'hr', 2], ['Food safety training', 'تدريب سلامة الغذاء', 'manager', 14],
    ['System access (POS, Forka Apps)', 'صلاحيات الأنظمة', 'it', 3], ['30-day check-in', 'متابعة بعد 30 يوماً', 'manager', 30],
  ] as const;
  const EXIT = [
    ['Resignation letter received', 'استلام خطاب الاستقالة', 'hr', 0], ['Handover plan agreed', 'الاتفاق على خطة التسليم', 'manager', 3],
    ['Uniform, keys and locker returned', 'إعادة الزي والمفاتيح والخزانة', 'manager', 18], ['System access removed', 'إلغاء صلاحيات الأنظمة', 'it', 21],
    ['Exit interview', 'مقابلة نهاية الخدمة', 'hr', 19], ['Final settlement inputs to payroll', 'إرسال مدخلات المخالصة النهائية للرواتب', 'hr', 21],
    ['Visa cancellation started', 'بدء إلغاء الإقامة', 'hr', 22],
  ] as const;
  const runs: Any[] = [];
  const mkRun = (kind: string, n: string, start: string, items: readonly (readonly [string, string, string, number])[], doneUpTo: number) => {
    const r = findEmp(n); if (!r) return;
    runs.push({ id: 'run-' + runs.length, kind, emp: r.employment_id, start, items: items.map(([en, ar, owner, off], i) => ({ id: `run-${runs.length}-${i}`, title: bi(en, ar), owner, due: addDay(start, off), done: i < doneUpTo ? addDay(start, Math.max(0, off - 1)) : null })) });
  };
  mkRun('onboarding', 'Layla Haddad', '2026-10-01', ONB, 8);
  mkRun('onboarding', 'Grace Santos', '2026-10-04', ONB, 5);
  mkRun('exit', 'Ram Thapa', addDay(T, -4), EXIT, 2);

  // ---------- payroll ----------
  const months = [addDay(T.slice(0, 8) + '01', -62).slice(0, 8) + '01', addDay(T.slice(0, 8) + '01', -31).slice(0, 8) + '01', T.slice(0, 8) + '01'];
  const STEPS = ['open', 'cut_off', 'exceptions', 'draft', 'approved', 'exported', 'released', 'closed'];
  const periods: Any[] = [];
  for (const e of D.entities) months.forEach((mo, i) => periods.push({ id: `pp-${e.id.slice(0, 6)}-${mo.slice(0, 7)}`, entityId: e.id, month: mo, status: i < 2 ? 'closed' : 'exceptions', approvals: [] as Any[] }));
  const inputsFor = (p: Any) => allRows().filter((r: Any) => r.entity_id === p.entityId && r.start_date <= addDay(p.month, 27)).map((r: Any) => {
    const lines = D.salaryLines.filter((s: Any) => s.employment_id === r.employment_id);
    const get = (code: string) => Number(lines.find((s: Any) => byId(D.payComponents, s.pay_component_id)?.code === code)?.amount || 0);
    const g = rng('pay' + r.employment_id + p.month);
    const otH = g() > .7 ? Math.round(g() * 14) : 0, unpaid = g() > .93 ? 1 : 0;
    const basic = get('BASIC'), housing = get('HOUSING'), transport = get('TRANSPORT');
    const otAmount = 0;  // overtime amount stays empty until the overtime rule is approved (AE-OT / OM-OT)
    const unpaidAmt = Math.round(((basic + housing + transport) / 30) * unpaid * 100) / 100;
    return { employee: person(r), currency: lines[0]?.currency, basic, housing, transport, overtimeHours: otH, overtimeAmount: otAmount, unpaidDays: unpaid, unpaidAmount: unpaidAmt,
      joiner: r.start_date >= p.month, gross: basic + housing + transport - unpaidAmt };
  });
  const canPayroll = (m: Me, ent: string) => has(m, ['HR_MANAGER', 'PAYROLL'], ent);

  // ---------- performance ----------
  const TEMPLATES: Record<string, Any[]> = {
    service: [['guest', 'Guest service', 'خدمة الضيوف', 25], ['speed', 'Speed and accuracy', 'السرعة والدقة', 20], ['team', 'Teamwork', 'العمل الجماعي', 20], ['grooming', 'Grooming and hygiene', 'المظهر والنظافة', 15], ['attendance', 'Attendance and punctuality', 'الحضور والالتزام بالمواعيد', 20]],
    culinary: [['quality', 'Food quality and consistency', 'جودة الطعام وثباتها', 30], ['hygiene', 'Hygiene and food safety', 'النظافة وسلامة الغذاء', 25], ['speed', 'Speed during service', 'السرعة أثناء الخدمة', 15], ['waste', 'Waste and cost control', 'التحكم في الهدر والتكلفة', 15], ['team', 'Teamwork', 'العمل الجماعي', 15]],
    management: [['sales', 'Sales and targets', 'المبيعات والأهداف', 25], ['people', 'Team leadership', 'قيادة الفريق', 25], ['cost', 'Cost control', 'ضبط التكاليف', 20], ['guest', 'Guest satisfaction', 'رضا الضيوف', 15], ['compliance', 'Compliance and standards', 'الالتزام والمعايير', 15]],
  };
  const cycles = [
    { id: 'cy-q4', name: bi('Q4 2026 review', 'تقييم الربع الرابع 2026'), kind: 'quarterly', starts: '2026-11-20', ends: '2026-12-15', status: 'open' },
    { id: 'cy-prob', name: bi('Probation reviews', 'تقييمات فترة التجربة'), kind: 'probation', starts: '2026-01-01', ends: '2026-12-31', status: 'open' },
  ];
  const reviews: Any[] = [];
  for (const r of allRows()) {
    if (r.job_en === 'Chief Executive Officer') continue;
    const g = rng('rev' + r.employment_id)();
    reviews.push({ id: 'rv-' + r.employment_id.slice(0, 8), cycle: 'cy-q4', emp: r.employment_id, family: family(r.job_en), status: g < .25 ? 'done' : g < .5 ? 'manager' : 'not_started',
      ratings: g < .25 ? Object.fromEntries(TEMPLATES[family(r.job_en)].map(c => [c[0], 3 + Math.round(g * 8) % 3])) : {}, comment: '' });
    if (r.probation_end_date && Math.abs(new Date(r.probation_end_date).getTime() - new Date(T).getTime()) < 75 * 864e5)
      reviews.push({ id: 'rp-' + r.employment_id.slice(0, 8), cycle: 'cy-prob', emp: r.employment_id, family: family(r.job_en), status: 'not_started', ratings: {}, comment: '', due: r.probation_end_date });
  }
  const scoreOf = (rv: Any) => { const crit = TEMPLATES[rv.family]; const vals = crit.filter(c => rv.ratings[c[0]]); if (!vals.length) return null; return Math.round(vals.reduce((s, c) => s + rv.ratings[c[0]] * c[3], 0) / vals.reduce((s, c) => s + c[3], 0) * 10) / 10; };

  // ---------- learning ----------
  const courses = [
    { code: 'FS', name: bi('Food safety basics', 'أساسيات سلامة الغذاء'), for: ['service', 'culinary', 'management'], months: 24 },
    { code: 'HACCP', name: bi('HACCP level 2', 'نظام الهاسب - المستوى 2'), for: ['culinary'], months: 36 },
    { code: 'FIRE', name: bi('Fire safety', 'السلامة من الحرائق'), for: ['service', 'culinary', 'management'], months: 12 },
    { code: 'ALG', name: bi('Allergen awareness', 'التوعية بمسببات الحساسية'), for: ['service', 'culinary'], months: 12 },
    { code: 'SVC', name: bi('Guest service standards', 'معايير خدمة الضيوف'), for: ['service'], months: null },
    { code: 'LEAD', name: bi('Supervisor essentials', 'أساسيات الإشراف'), for: ['management'], months: null },
  ];
  const training: Any[] = [];
  for (const r of allRows()) for (const c of courses.filter(c => c.for.includes(family(r.job_en)))) {
    const g = rng('tr' + r.employment_id + c.code)();
    if (g < .15) { training.push({ emp: r.employment_id, code: c.code, status: 'assigned', completed: null, expires: null }); continue; }
    const completed = addDay(T, -Math.floor(g * 700));
    const expires = c.months ? addDay(completed, c.months * 30) : null;
    training.push({ emp: r.employment_id, code: c.code, status: expires && expires < T ? 'expired' : 'completed', completed, expires });
  }

  // ---------- HR desk, policies, announcements ----------
  const cases: Any[] = [
    { id: 'c1', ref: 'HR-0012', emp: findEmp('Hassan Ali')?.employment_id, category: 'payslip', sensitive: false, title: 'Overtime missing from October pay', status: 'open', owner: 'Sara Nasser', created: addDay(T, -2), due: addDay(T, 1), notes: [{ by: 'Hassan Ali', at: addDay(T, -2), body: 'I worked 6 extra hours on 18 October.', internal: false }] },
    { id: 'c2', ref: 'HR-0011', emp: findEmp('Joy Reyes')?.employment_id, category: 'document', sensitive: false, title: 'New passport number', status: 'waiting', owner: 'Sara Nasser', created: addDay(T, -5), due: addDay(T, -1), notes: [] },
    { id: 'c3', ref: 'HR-0010', emp: findEmp('Tesfaye Bekele')?.employment_id, category: 'grievance', sensitive: true, title: 'Concern about shift allocation', status: 'open', owner: 'Layla Haddad', created: addDay(T, -7), due: addDay(T, 3), notes: [] },
  ];
  const policies = [
    { id: 'p1', code: 'HRP04', title: bi('Leave policy', 'سياسة الإجازات'), version: '1.0', requiresAck: true },
    { id: 'p2', code: 'HRP03', title: bi('Grievance and code of conduct', 'التظلمات ومدونة السلوك'), version: '1.0', requiresAck: true },
    { id: 'p3', code: 'HRP02', title: bi('Disciplinary policy and process', 'سياسة وإجراءات التأديب'), version: '1.0', requiresAck: true },
    { id: 'p4', code: 'HB', title: bi('Employee handbook', 'دليل الموظف'), version: '2.0', requiresAck: true },
  ];
  const acks = new Set<string>();
  allRows().forEach((r: Any) => policies.forEach(p => { if (rng('ack' + r.person_id + p.id)() < .55) acks.add(p.id + '|' + r.person_id); }));
  const announcements = [
    { id: 'a1', at: addDay(T, -1), title: bi('Q4 reviews start on 20 November', 'تبدأ تقييمات الربع الرابع في 20 نوفمبر'), body: bi('Managers will receive the scorecards in the app. Please complete your self-assessment by 30 November.', 'سيستلم المدراء نماذج التقييم في التطبيق. يرجى إكمال التقييم الذاتي قبل 30 نوفمبر.') },
    { id: 'a2', at: addDay(T, -6), title: bi('Health cards: renew before expiry', 'البطاقات الصحية: جدّدها قبل انتهائها'), body: bi('Check the Documents section. HR will contact anyone whose card expires within 30 days.', 'راجع قسم المستندات. ستتواصل الموارد البشرية مع كل من تنتهي بطاقته خلال 30 يوماً.') },
  ];

  // ---------- handlers ----------
  function handle(method: string, seg: string[], q: URLSearchParams, body: Any, m: Me): any {
    const [a, b, c] = seg;

    if (a === 'holidays') return holidays;

    // ----- leave -----
    if (a === 'leave' && b === 'balances') {
      const emp = q.get('emp') || m.employmentIds[0];
      const r = rowByEmp(emp); if (!r || !(isSelf(m, r) || can.seeWork(m, r))) deny();
      return balances(emp);
    }
    if (a === 'leave' && b === 'types') {
      const r = rowByEmp(q.get('emp') || m.employmentIds[0]); return leaveTypes.filter(l => l.country === country(r));
    }
    if (a === 'leave' && b === 'preview') {
      const r = rowByEmp(q.get('emp') || m.employmentIds[0]);
      const days = countDays(country(r), q.get('type')!, q.get('start')!, q.get('end')!, q.get('hs') === '1', q.get('he') === '1');
      const bal = balances(r.employment_id).find(x => x.code === q.get('type'));
      const overlaps = requests.some(x => x.type === 'leave' && x.employmentId === r.employment_id && ['pending', 'approved'].includes(x.status) && !(x.payload.end < q.get('start')! || x.payload.start > q.get('end')!));
      const hol = holidays.filter(h => h.country === country(r) && h.day >= q.get('start')! && h.day <= q.get('end')!);
      return { days, balanceBefore: bal?.balance ?? null, balanceAfter: bal?.tracked ? bal.balance - bal.pending - days : null, overlaps, holidays: hol, steps: rules('leave', { days, leaveType: q.get('type') }).map(s => ruleLabel(s, r)) };
    }
    if (a === 'leave' && b === 'requests' && method === 'POST') {
      const emp = body.employmentId || m.employmentIds[0]; const r = rowByEmp(emp);
      if (!r || !(isSelf(m, r) || isMgrOf(m, r) || isHr(m, r.entity_id))) deny();
      if (!body.leaveType || !body.start || !body.end || body.end < body.start) throw new E(400, 'invalid');
      const days = countDays(country(r), body.leaveType, body.start, body.end, !!body.halfStart, !!body.halfEnd);
      if (days <= 0) throw new E(400, 'no_days');
      if (requests.some(x => x.type === 'leave' && x.employmentId === emp && ['pending', 'approved'].includes(x.status) && !(x.payload.end < body.start || x.payload.start > body.end))) throw new E(409, 'overlap');
      const bal = balances(emp).find(x => x.code === body.leaveType)!;
      if (bal.tracked && bal.balance - bal.pending - days < 0 && body.leaveType !== 'unpaid') throw new E(400, 'not_enough_balance');
      const t = lt(country(r), body.leaveType);
      if (t.docAfter && days > t.docAfter && !body.attachment) throw new E(400, 'document_needed');
      return viewReq(m, createRequest(m, emp, 'leave', { leaveType: body.leaveType, start: body.start, end: body.end, days, reason: body.reason || '', halfStart: !!body.halfStart, halfEnd: !!body.halfEnd, attachment: body.attachment || null }));
    }
    if (a === 'leave' && b === 'calendar') {
      const month = q.get('month') || T.slice(0, 7);
      const first = month + '-01'; const last = addDay(addDay(first, 32).slice(0, 8) + '01', -1);
      const people = visibleRows(m).filter((r: Any) => r.branch_en !== 'Head office' || isHrAny(m));
      return { month, first, last, people: people.map((r: Any) => ({ ...person(r), days: requests.filter(x => x.type === 'leave' && x.employmentId === r.employment_id && ['pending', 'approved'].includes(x.status) && !(x.payload.end < first || x.payload.start > last))
        .map(x => ({ start: x.payload.start, end: x.payload.end, status: x.status, type: x.payload.leaveType })) })).filter((p: Any) => p.days.length || q.get('all') === '1'),
        holidays: holidays.filter(h => h.day >= first && h.day <= last) };
    }

    // ----- requests and approvals -----
    if (a === 'requests' && !b) {
      if (method === 'POST') {
        const emp = body.employmentId || m.employmentIds[0]; const r = rowByEmp(emp);
        if (!r || !(isSelf(m, r) || isMgrOf(m, r))) deny();
        if (!['attendance_correction', 'schedule_change', 'letter', 'profile_update', 'general'].includes(body.type)) throw new E(400, 'invalid');
        return viewReq(m, createRequest(m, emp, body.type, body.payload || {}));
      }
      const box = q.get('box') || 'mine';
      let list = requests;
      if (box === 'mine') list = requests.filter(r => m.employmentIds.includes(r.employmentId));
      else if (box === 'approve') list = requests.filter(r => r.status === 'pending' && inInbox(m, r.steps[r.currentStep - 1].rule, rowByEmp(r.employmentId)));
      else list = requests.filter(r => { const row = rowByEmp(r.employmentId); return m.entityIds.includes(row.entity_id) && (can.seeWork(m, row)); });
      return list.map(r => viewReq(m, r));
    }
    if (a === 'requests' && b && c === 'decide' && method === 'POST') {
      const req = requests.find(r => r.id === b); if (!req) throw new E(404, 'not_found');
      const r = rowByEmp(req.employmentId); const st = req.steps[req.currentStep - 1];
      if (req.status !== 'pending' || !canAct(m, st.rule, r)) deny();
      if (body.action === 'reject' && !String(body.comment || '').trim()) throw new E(400, 'reason_needed');
      decide(req, m.displayName, body.action === 'reject' ? 'rejected' : 'approved', body.comment);
      x.log(m, 'request.' + (body.action === 'reject' ? 'rejected' : 'approved'), r);
      return viewReq(m, req);
    }
    if (a === 'requests' && b && c === 'withdraw' && method === 'POST') {
      const req = requests.find(r => r.id === b); if (!req || !m.employmentIds.includes(req.employmentId) || req.status !== 'pending') deny();
      req!.status = 'withdrawn'; return viewReq(m, req);
    }

    // ----- time: my schedule and clock -----
    if (a === 'time' && b === 'my') {
      const r = self(m); if (!r) return { weekStart: W0, days: [], clock: null };
      const off = Number(q.get('week') || 0); const ws = addDay(W0, off * 7);
      const days = Array.from({ length: 7 }, (_, i) => { const date = addDay(ws, i); const tid = shifts.get(r.employment_id + '|' + date); const t = TEMPL.find(z => z.id === tid);
        const lv = requests.find(x => x.type === 'leave' && x.employmentId === r.employment_id && x.status === 'approved' && x.payload.start <= date && x.payload.end >= date);
        return { date, shift: t ? { name: t.name, segments: t.segments, color: t.color, hours: hours(t) } : null, leave: lv ? lt(country(r), lv.payload.leaveType).name : null, published: !!published.get(r.branch_id + '|' + ws) }; });
      const ck = clock.get(r.employment_id);
      const hist = att.filter(z => z.emp === r.employment_id).slice(0, 7).map(z => ({ date: z.date, in: z.in, out: z.out, exceptions: z.exceptions }));
      return { weekStart: ws, branch: bi(r.branch_en, r.branch_ar), days, clock: ck || { in: false }, history: hist, geofence: { branch: bi(r.branch_en, r.branch_ar), radius: 150 } };
    }
    if (a === 'time' && b === 'clock' && method === 'POST') {
      const r = self(m); if (!r) deny();
      const t = new Date(); const hhmm = t.toTimeString().slice(0, 5);
      if (body.kind === 'in') clock.set(r.employment_id, { in: true, since: hhmm, inside: true });
      else clock.set(r.employment_id, { in: false, last: hhmm });
      return clock.get(r.employment_id);
    }

    // ----- roster -----
    if (a === 'roster' && b === 'branches') return branchesFor(m).map((br: Any) => ({ id: br.id, name: bi(br.name_en, br.name_ar) }));
    if (a === 'roster' && b === 'templates') return TEMPL.map(t => ({ ...t, hours: hours(t) }));
    if (a === 'roster' && !b) {
      const brs = branchesFor(m); const br = brs.find((z: Any) => z.id === q.get('branch')) || brs[0]; if (!br) deny();
      const ws = addDay(W0, Number(q.get('week') || 0) * 7);
      const team = allRows().filter((r: Any) => r.branch_id === br.id && r.status !== 'exited');
      const dates = Array.from({ length: 7 }, (_, i) => addDay(ws, i));
      const warnings: Any[] = [];
      const people = team.map((r: Any) => {
        const cells: Any = {}; let total = 0;
        for (const d of dates) {
          const tid = shifts.get(r.employment_id + '|' + d); const t = TEMPL.find(z => z.id === tid);
          const lv = requests.find(x => x.type === 'leave' && x.employmentId === r.employment_id && ['approved', 'pending'].includes(x.status) && x.payload.start <= d && x.payload.end >= d);
          if (t) total += hours(t);
          if (t && lv) warnings.push({ kind: 'on_leave', employee: name(r), date: d });
          cells[d] = { shift: t ? { id: t.id, name: t.name, color: t.color, segments: t.segments } : null, leave: lv ? { status: lv.status } : null };
        }
        for (let i = 1; i < dates.length; i++) {
          const p = TEMPL.find(z => z.id === shifts.get(r.employment_id + '|' + dates[i - 1])), n = TEMPL.find(z => z.id === shifts.get(r.employment_id + '|' + dates[i]));
          if (p && n && ['E', 'N'].includes(p.id) && n.id === 'M') warnings.push({ kind: 'short_rest', employee: name(r), date: dates[i] });
        }
        if (total > 60) warnings.push({ kind: 'over_hours', employee: name(r), hours: total });
        return { ...person(r), cells, hours: total };
      });
      const coverage = dates.map(d => people.filter((p: Any) => p.cells[d].shift).length);
      dates.forEach((d, i) => { if (coverage[i] < Math.max(2, Math.ceil(team.length * .5))) warnings.push({ kind: 'low_cover', date: d, count: coverage[i] }); });
      return { branch: { id: br.id, name: bi(br.name_en, br.name_ar) }, weekStart: ws, dates, published: !!published.get(br.id + '|' + ws), people, coverage, warnings,
        canEdit: m.isCeo || m.grants.some((g: Any) => g.role === 'BRANCH_MANAGER' && g.scope_id === br.id) || has(m, ['HR_MANAGER'], br.entity_id) };
    }
    if (a === 'roster' && b === 'shift' && method === 'POST') {
      const r = rowByEmp(body.employmentId); if (!r || !(m.isCeo || m.grants.some((g: Any) => g.role === 'BRANCH_MANAGER' && g.scope_id === r.branch_id) || has(m, ['HR_MANAGER'], r.entity_id))) deny();
      if (body.date < T) throw new E(400, 'past_shift');
      const k = r.employment_id + '|' + body.date; if (body.templateId) shifts.set(k, body.templateId); else shifts.delete(k);
      return { ok: true };
    }
    if (a === 'roster' && b === 'publish' && method === 'POST') { published.set(body.branchId + '|' + body.weekStart, true); return { ok: true }; }

    // ----- attendance -----
    if (a === 'attendance' && !b) {
      const vis = new Set(visibleRows(m).filter((r: Any) => !isSelf(m, r)).map((r: Any) => r.employment_id));
      const list = att.filter(z => vis.has(z.emp) && (q.get('all') === '1' || z.exceptions.length));
      return list.sort((p, n) => n.date.localeCompare(p.date)).map(z => ({ ...z, employee: person(rowByEmp(z.emp)) }));
    }
    if (a === 'attendance' && b === 'resolve' && method === 'POST') {
      const z = att.find(y => y.key === body.key); if (!z) throw new E(404, 'not_found');
      const r = rowByEmp(z.emp); if (!isMgrOf(m, r) && !isHr(m, r.entity_id)) deny();
      if (body.action === 'correct') { if (!body.time || !body.note) throw new E(400, 'reason_needed'); if (z.out === '—') z.out = body.time; else z.in = body.time; z.correctedBy = m.displayName; z.note = body.note; }
      z.status = 'approved'; z.resolution = body.action; return z;
    }

    // ----- documents -----
    if (a === 'documents' && !b) {
      const mine = q.get('mine') === '1';
      const vis = mine ? allRows().filter((r: Any) => isSelf(m, r)) : visibleRows(m).filter((r: Any) => !isSelf(m, r) || isHrAny(m));
      const ids = new Set(vis.map((r: Any) => r.person_id));
      const f = q.get('filter') || 'all'; const lim = addDay(T, 60);
      return D.documents.filter((d: Any) => ids.has(d.person_id)).filter((d: Any) =>
        f === 'expiring' ? d.expiry_date && d.expiry_date >= T && d.expiry_date <= lim && d.status === 'valid' :
        f === 'expired' ? d.status === 'expired' || (d.expiry_date && d.expiry_date < T && d.status === 'valid') :
        f === 'pending' ? d.status === 'pending_verification' : d.status !== 'replaced')
        .sort((p: Any, n: Any) => (p.expiry_date || '9').localeCompare(n.expiry_date || '9'))
        .map((d: Any) => { const r = allRows().find((z: Any) => z.person_id === d.person_id && z.entity_id === d.entity_id) || allRows().find((z: Any) => z.person_id === d.person_id);
          const t = D.documentTypes.find((y: Any) => y.code === d.type_code);
          return { id: d.id, employee: person(r), type: bi(t.name_en, t.name_ar), typeCode: d.type_code, expiry: d.expiry_date, status: d.status,
            daysLeft: d.expiry_date ? Math.round((new Date(d.expiry_date).getTime() - new Date(T).getTime()) / 864e5) : null, canVerify: d.status === 'pending_verification' && isHr(m, r.entity_id) };
        });
    }
    if (a === 'documents' && b === 'upload' && method === 'POST') {
      const r = self(m); if (!r) deny();
      if (!body.type || !body.expiry) throw new E(400, 'invalid');
      if (body.expiry <= T) throw new E(400, 'expiry_in_past');
      D.documents.push({ id: 'doc-' + D.documents.length, person_id: r.person_id, entity_id: r.entity_id, type_code: body.type, expiry_date: body.expiry, status: 'pending_verification', fileName: body.fileName || null });
      return { ok: true };
    }
    if (a === 'documents' && b === 'verify' && method === 'POST') {
      const d = D.documents.find((y: Any) => y.id === body.id); if (!d) throw new E(404, 'not_found');
      if (!isHr(m, d.entity_id)) deny();
      if (body.action === 'reject') { d.status = 'rejected'; d.reason = body.reason; return { ok: true }; }
      D.documents.filter((y: Any) => y.person_id === d.person_id && y.type_code === d.type_code && y.id !== d.id && y.status !== 'replaced').forEach((y: Any) => { y.status = 'replaced'; });
      d.status = 'valid'; return { ok: true };
    }

    // ----- lifecycle -----
    if (a === 'lifecycle' && !b) {
      const vis = new Set(visibleRows(m).map((r: Any) => r.employment_id));
      const view = (run: Any) => { const r = rowByEmp(run.emp); const done = run.items.filter((i: Any) => i.done).length;
        return { id: run.id, kind: run.kind, start: run.start, employee: person(r), done, total: run.items.length, items: run.items, canTick: isHr(m, r.entity_id) || isMgrOf(m, r) }; };
      const prob = visibleRows(m).filter((r: Any) => r.probation_end_date && Math.abs(new Date(r.probation_end_date).getTime() - new Date(T).getTime()) < 75 * 864e5)
        .map((r: Any) => ({ ...person(r), ends: r.probation_end_date, daysLeft: Math.round((new Date(r.probation_end_date).getTime() - new Date(T).getTime()) / 864e5),
          review: reviews.find(v => v.cycle === 'cy-prob' && v.emp === r.employment_id)?.status || 'not_started' })).sort((p: Any, n: Any) => p.ends.localeCompare(n.ends));
      return { onboarding: runs.filter(z => z.kind === 'onboarding' && vis.has(z.emp)).map(view), exits: runs.filter(z => z.kind === 'exit' && vis.has(z.emp)).map(view), probation: prob };
    }
    if (a === 'lifecycle' && b === 'item' && method === 'POST') {
      for (const run of runs) { const it = run.items.find((i: Any) => i.id === body.id); if (it) { const r = rowByEmp(run.emp); if (!isHr(m, r.entity_id) && !isMgrOf(m, r)) deny(); it.done = it.done ? null : T; it.doneBy = m.displayName; return { ok: true }; } }
      throw new E(404, 'not_found');
    }

    // ----- payroll -----
    if (a === 'payroll' && b === 'periods' && !c) {
      return periods.filter(p => canPayroll(m, p.entityId)).map(p => { const ins = inputsFor(p); const e = byId(D.entities, p.entityId);
        return { id: p.id, entity: bi(e.legal_name_en, e.legal_name_ar), month: p.month, status: p.status, headcount: ins.length, currency: e.currency, total: ins.reduce((s: number, i: Any) => s + i.gross, 0) }; })
        .sort((p, n) => n.month.localeCompare(p.month) || p.entity.en.localeCompare(n.entity.en));
    }
    if (a === 'payroll' && b === 'periods' && c) {
      const p = periods.find(z => z.id === c); if (!p || !canPayroll(m, p.entityId)) throw new E(404, 'not_found');
      if (method === 'POST') {
        const i = STEPS.indexOf(p.status);
        if (p.status === 'approved') throw new E(409, 'export_not_enabled');
        if (p.status === 'draft' && !m.isCeo) throw new E(403, 'ceo_approval');
        if (i < STEPS.length - 1) p.status = STEPS[i + 1];
        p.approvals.push({ step: p.status, by: m.displayName, at: now() });
      }
      const ins = inputsFor(p); const prevP = periods.find(z => z.entityId === p.entityId && z.month === addDay(p.month, -1).slice(0, 8) + '01');
      const prev = prevP ? inputsFor(prevP) : [];
      const variance = ins.map((i: Any) => { const o = prev.find((z: Any) => z.employee.employmentId === i.employee.employmentId);
        const reasons = [] as string[]; if (!o) reasons.push('joiner'); if (i.unpaidDays) reasons.push('unpaid_leave'); if (i.overtimeHours) reasons.push('overtime_hours');
        return { employee: i.employee, last: o ? o.gross : 0, now: i.gross, delta: i.gross - (o ? o.gross : 0), reasons }; }).filter((v: Any) => Math.abs(v.delta) > .01 || v.reasons.length);
      const e = byId(D.entities, p.entityId);
      const openExc = att.filter(z => z.status === 'open' && rowByEmp(z.emp).entity_id === p.entityId).length;
      return { id: p.id, entity: bi(e.legal_name_en, e.legal_name_ar), month: p.month, status: p.status, currency: e.currency, steps: STEPS, approvals: p.approvals, openExceptions: openExc,
        inputs: ins, variance, totals: { gross: ins.reduce((s: number, i: Any) => s + i.gross, 0), overtimeHours: ins.reduce((s: number, i: Any) => s + i.overtimeHours, 0), unpaidDays: ins.reduce((s: number, i: Any) => s + i.unpaidDays, 0) } };
    }
    if (a === 'payslips') {
      const r = self(m); if (!r) return [];
      return periods.filter(p => p.entityId === r.entity_id && ['released', 'closed'].includes(p.status)).map(p => { const i = inputsFor(p).find((z: Any) => z.employee.employmentId === r.employment_id);
        return i ? { id: p.id, month: p.month, currency: i.currency, basic: i.basic, housing: i.housing, transport: i.transport, deductions: i.unpaidAmount, net: i.gross } : null; }).filter(Boolean);
    }

    // ----- performance -----
    if (a === 'performance' && !b) {
      const view = (rv: Any) => { const r = rowByEmp(rv.emp); return { id: rv.id, cycle: cycles.find(cy => cy.id === rv.cycle)!.name, cycleKind: rv.cycle === 'cy-prob' ? 'probation' : 'quarterly', employee: person(r), status: rv.status, score: scoreOf(rv), due: rv.due || null }; };
      const mine = reviews.filter(rv => m.employmentIds.includes(rv.emp)).map(view);
      const team = reviews.filter(rv => { const r = rowByEmp(rv.emp); return isMgrOf(m, r) || (isHr(m, r.entity_id) && !isSelf(m, r)); }).map(view);
      const done = team.filter(t => t.status === 'done').length;
      return { cycles, mine, team, completion: team.length ? Math.round(done / team.length * 100) : null };
    }
    if (a === 'performance' && b === 'review' && c) {
      const rv = reviews.find(z => z.id === c); if (!rv) throw new E(404, 'not_found');
      const r = rowByEmp(rv.emp); const mgr = isMgrOf(m, r) || isHr(m, r.entity_id); const mine = isSelf(m, r);
      if (!mgr && !mine) deny();
      if (method === 'POST') {
        if (!mgr) deny();
        const crit = TEMPLATES[rv.family];
        if (body.submit && crit.some(cr => !body.ratings?.[cr[0]])) throw new E(400, 'all_ratings_needed');
        rv.ratings = body.ratings || {}; rv.comment = body.comment || ''; rv.outcome = body.outcome || null; rv.status = body.submit ? 'done' : 'manager';
      }
      return { id: rv.id, cycle: cycles.find(cy => cy.id === rv.cycle)!.name, probation: rv.cycle === 'cy-prob', employee: person(r), status: rv.status, ratings: rv.ratings, comment: rv.comment, outcome: rv.outcome || null,
        criteria: TEMPLATES[rv.family].map(cr => ({ code: cr[0], name: bi(cr[1], cr[2]), weight: cr[3] })), score: scoreOf(rv), canEdit: mgr && rv.status !== 'done', family: rv.family };
    }

    // ----- learning -----
    if (a === 'learning') {
      const view = (t: Any) => ({ ...t, course: courses.find(cc => cc.code === t.code)!.name });
      const r = self(m);
      const vis = visibleRows(m).filter((z: Any) => !isSelf(m, z));
      const teamRows = vis.map((z: Any) => { const recs = training.filter(t => t.emp === z.employment_id); const ok = recs.filter(t => t.status === 'completed').length;
        return { ...person(z), done: ok, total: recs.length, missing: recs.filter(t => t.status !== 'completed').map(view) }; });
      const tot = teamRows.reduce((s: number, t: Any) => s + t.total, 0), ok = teamRows.reduce((s: number, t: Any) => s + t.done, 0);
      return { courses, mine: r ? training.filter(t => t.emp === r.employment_id).map(view) : [], team: teamRows, compliance: tot ? Math.round(ok / tot * 100) : null };
    }

    // ----- HR desk -----
    if (a === 'desk' && !b) {
      if (method === 'POST') {
        const r = self(m); if (!r) deny();
        if (!body.title || !body.category) throw new E(400, 'invalid');
        const sensitive = ['grievance', 'disciplinary', 'medical'].includes(body.category);
        const cs = { id: 'c' + (cases.length + 1), ref: 'HR-00' + (13 + cases.length), emp: r.employment_id, category: body.category, sensitive, title: body.title, status: 'open', owner: sensitive ? 'Layla Haddad' : 'Sara Nasser', created: T, due: addDay(T, sensitive ? 2 : 3), notes: body.body ? [{ by: m.displayName, at: T, body: body.body, internal: false }] : [] };
        cases.unshift(cs); return cs;
      }
      return cases.filter(cs => { const r = rowByEmp(cs.emp); if (!r) return false; if (isSelf(m, r)) return true; if (cs.sensitive) return has(m, ['HR_MANAGER'], r.entity_id); return isHr(m, r.entity_id); })
        .map(cs => ({ ...cs, employee: person(rowByEmp(cs.emp)), overdue: cs.status !== 'resolved' && cs.due < T, mine: m.employmentIds.includes(cs.emp) }));
    }
    if (a === 'desk' && b && c === 'status' && method === 'POST') {
      const cs = cases.find(z => z.id === b); if (!cs) throw new E(404, 'not_found');
      if (!isHr(m, rowByEmp(cs.emp).entity_id)) deny(); cs.status = body.status; if (body.note) cs.notes.push({ by: m.displayName, at: T, body: body.note, internal: !!body.internal }); return cs;
    }

    // ----- policies and announcements -----
    if (a === 'policies' && !b) {
      const r = self(m); const total = allRows().length;
      return { announcements, policies: policies.map(p => ({ ...p, acked: r ? acks.has(p.id + '|' + r.person_id) : false,
        ackRate: isHrAny(m) ? Math.round(allRows().filter((z: Any) => acks.has(p.id + '|' + z.person_id)).length / total * 100) : null })) };
    }
    if (a === 'policies' && b && c === 'ack' && method === 'POST') { const r = self(m); if (!r) deny(); acks.add(b + '|' + r.person_id); return { ok: true, at: now() }; }

    // ----- reports -----
    if (a === 'reports') {
      const vis = visibleRows(m); if (!vis.length || (!isHrAny(m) && !m.grants.some((g: Any) => g.role === 'BRANCH_MANAGER'))) deny();
      const ids = new Set(vis.map((r: Any) => r.employment_id));
      const by = (f: (r: Any) => string) => { const o: Record<string, number> = {}; vis.forEach((r: Any) => { const k = f(r); o[k] = (o[k] || 0) + 1; }); return Object.entries(o).map(([k, v]) => ({ key: k, value: v })).sort((p, n) => n.value - p.value); };
      const lvl = D.levels.map((l: Any) => ({ key: l.name_en, ar: l.name_ar, value: vis.filter((r: Any) => r.level_en === l.name_en).length })).filter((z: Any) => z.value);
      const attV = att.filter(z => ids.has(z.emp));
      const exc = ['late', 'missed_punch', 'absent', 'overtime'].map(k => ({ key: k, value: attV.filter(z => z.exceptions.includes(k)).length }));
      const docs = D.documents.filter((d: Any) => vis.some((r: Any) => r.person_id === d.person_id) && d.expiry_date);
      const buckets = [['expired', -9999, -1], ['0_30', 0, 30], ['31_60', 31, 60], ['61_90', 61, 90]].map(([k, lo, hi]) => ({ key: k as string, value: docs.filter((d: Any) => { const n = Math.round((new Date(d.expiry_date).getTime() - new Date(T).getTime()) / 864e5); return n >= (lo as number) && n <= (hi as number); }).length }));
      const leaveTaken = ['annual', 'sick'].map(k => ({ key: k, value: -ledger.filter(e => ids.has(e.emp) && e.code === k && e.kind === 'taken').reduce((s, e) => s + e.days, 0) }));
      const brs = [...new Set(vis.map((r: Any) => r.branch_id))].map(id => { const br = byId(D.branches, id as string); if (!br || br.code === 'HO') return null;
        const sch = attV.filter(z => rowByEmp(z.emp).branch_id === id).reduce((s, z) => s + z.hours, 0);
        const act = attV.filter(z => rowByEmp(z.emp).branch_id === id).reduce((s, z) => s + (z.exceptions.includes('absent') ? 0 : z.hours - z.late / 60 + z.ot / 60), 0);
        return { key: br.name_en, ar: br.name_ar, scheduled: Math.round(sch), actual: Math.round(act), overtime: Math.round(attV.filter(z => rowByEmp(z.emp).branch_id === id).reduce((s, z) => s + z.ot, 0) / 60) }; }).filter(Boolean);
      const revs = reviews.filter(rv => ids.has(rv.emp) && rv.cycle === 'cy-q4'); const trs = training.filter(t => ids.has(t.emp));
      return {
        meta: { from: addDay(T, -9), to: T, generated: now(), source: 'Forka People demo data (made-up)', scope: m.isCeo ? 'all' : isHrAny(m) ? 'entities' : 'branch', people: vis.length },
        headcountByEntity: by((r: Any) => r.entity_en), headcountByBranch: by((r: Any) => r.branch_en || '—'), headcountByLevel: lvl,
        joiners90: vis.filter((r: Any) => r.start_date >= addDay(T, -90)).length, leavers90: 0, attendance: exc, documents: buckets, leave: leaveTaken, hours: brs,
        reviews: { done: revs.filter(rv => rv.status === 'done').length, total: revs.length }, training: { done: trs.filter(t => t.status === 'completed').length, total: trs.length },
      };
    }

    // ----- settings -----
    if (a === 'settings') {
      if (!isHrAny(m)) deny();
      return {
        leaveTypes, holidays, documentTypes: D.documentTypes,
        approvals: [
          { type: 'leave', when: bi('Up to 5 days', 'حتى 5 أيام'), steps: ['line_manager'] }, { type: 'leave', when: bi('More than 5 days, unpaid, maternity or Hajj', 'أكثر من 5 أيام أو بدون راتب أو أمومة أو حج'), steps: ['line_manager', 'hr'] },
          { type: 'attendance_correction', when: null, steps: ['line_manager'] }, { type: 'schedule_change', when: null, steps: ['line_manager'] },
          { type: 'letter', when: bi('Salary certificate', 'شهادة راتب'), steps: ['hr', 'hr_manager'] }, { type: 'letter', when: bi('Other letters', 'خطابات أخرى'), steps: ['hr'] },
          { type: 'profile_update', when: null, steps: ['hr'] }, { type: 'general', when: null, steps: ['hr'] },
        ],
        templates: TEMPL.map(t => ({ ...t, hours: hours(t) })),
        access: D.users.map((u: Any) => ({ name: u.display_name, email: u.email, grants: u.grants.map((g: Any) => ({ role: g.role, scope: g.scope_type === 'group' ? bi('Whole group', 'المجموعة كاملة') : g.scope_type === 'entity' ? (() => { const e = byId(D.entities, g.scope_id); return bi(e.legal_name_en, e.legal_name_ar); })() : (() => { const b2 = byId(D.branches, g.scope_id); return bi(b2.name_en, b2.name_ar); })() })) })),
        rules: [
          { code: 'AE-LEAVE-ANNUAL', status: 'draft', source: 'Company policy HRP04; UAE labour law to confirm' }, { code: 'AE-OT', status: 'draft', source: 'To confirm with adviser' },
          { code: 'AE-EOSB', status: 'draft', source: 'To confirm with adviser' }, { code: 'AE-WPS', status: 'draft', source: 'Format from WPS agent' },
          { code: 'OM-LEAVE-ANNUAL', status: 'draft', source: 'Oman policy not yet shared' }, { code: 'OM-SPF', status: 'draft', source: 'To confirm with adviser' },
        ],
      };
    }
    return undefined;
  }
  return { handle };
}
