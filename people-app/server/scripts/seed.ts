// Demo data only. Every person here is made up. Real staff data comes later through the controlled import.
// The structure (units, levels, departments) follows the group's org structure file.
import pg from 'pg';
import { config } from '../src/config.js';

export async function seed(url = config.ownerUrl) {
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  const one = async (sql: string, params: unknown[] = []) => (await c.query(sql, params)).rows[0];
  await c.query('begin');

  await c.query(`truncate access_log, audit_event, role_grant, user_account, document, salary_line, assignment,
    employment, person, position, pay_component, job_title, job_level, department, branch, brand, legal_entity,
    country, document_type restart identity cascade`);

  await c.query(`insert into country values ('AE','United Arab Emirates','الإمارات العربية المتحدة','AED'),
                                            ('OM','Oman','سلطنة عُمان','OMR')`);

  const ent = async (cc: string, en: string, ar: string, cur: string) =>
    (await one('insert into legal_entity(country_code, legal_name_en, legal_name_ar, currency) values ($1,$2,$3,$4) returning id', [cc, en, ar, cur])).id as string;
  const E = {
    HQ: await ent('AE', 'Forka Collective (demo)', 'فوركا كولكتيف (تجريبي)', 'AED'),
    REST: await ent('AE', 'Kuwaiti Kitchen Restaurants (demo)', 'مطاعم المطبخ الكويتي (تجريبي)', 'AED'),
    CAFE: await ent('AE', 'Mayar Café & Bakery (demo)', 'مقهى ومخبز ميار (تجريبي)', 'AED'),
    OM: await ent('OM', 'Oman Restaurant (demo)', 'مطعم عُمان (تجريبي)', 'OMR'),
  };

  const brand = async (en: string, ar: string) => (await one('insert into brand(name_en, name_ar) values ($1,$2) returning id', [en, ar])).id as string;
  const B = {
    AMAK: await brand('Al Matbakh Al Kuwaiti', 'المطبخ الكويتي'),
    MAYAR: await brand('Mayar Café & Bakery', 'مقهى ومخبز ميار'),
    BAIT: await brand('Al Bait Al Kuwaiti', 'البيت الكويتي'),
  };

  const br = async (entity: string, brandId: string | null, code: string, en: string, ar: string, city: string, tz = 'Asia/Dubai') =>
    (await one('insert into branch(entity_id, brand_id, code, name_en, name_ar, city, timezone) values ($1,$2,$3,$4,$5,$6,$7) returning id',
      [entity, brandId, code, en, ar, city, tz])).id as string;
  const BR = {
    HO: await br(E.HQ, null, 'HO', 'Head office', 'الإدارة العامة', 'UAE'),
    SHJ: await br(E.REST, B.AMAK, 'SHJ', 'Sharjah', 'الشارقة', 'Sharjah'),
    FUJ: await br(E.REST, B.AMAK, 'FUJ', 'Fujairah', 'الفجيرة', 'Fujairah'),
    UAQ: await br(E.REST, B.AMAK, 'UAQ', 'Umm Al Quwain', 'أم القيوين', 'Umm Al Quwain'),
    AJM: await br(E.REST, null, 'AJM', 'Ajman Central Store', 'المستودع المركزي - عجمان', 'Ajman'),
    MYR: await br(E.CAFE, B.MAYAR, 'MYR', 'Mayar Café', 'مقهى ميار', 'Umm Al Quwain'),
    OMN: await br(E.OM, B.BAIT, 'OMN', 'Oman', 'عُمان', 'Oman', 'Asia/Muscat'),
  };

  const dept = async (entity: string, en: string, ar: string) =>
    (await one('insert into department(entity_id, name_en, name_ar) values ($1,$2,$3) returning id', [entity, en, ar])).id as string;
  const D: Record<string, Record<string, string>> = {};
  D.HQ = { EXEC: await dept(E.HQ, 'Executive', 'الإدارة التنفيذية'), HR: await dept(E.HQ, 'Human Resources', 'الموارد البشرية'), OPS: await dept(E.HQ, 'Service Operations', 'العمليات') };
  for (const k of ['REST', 'CAFE', 'OM'] as const) {
    D[k] = {
      SVC: await dept(E[k], 'Service Operations', 'عمليات الخدمة'),
      CUL: await dept(E[k], 'Culinary Operations', 'عمليات المطبخ'),
      LOG: await dept(E[k], 'Logistics', 'الخدمات اللوجستية'),
    };
  }

  // Levels from the group's position level framework.
  const levels: [string, string, string][] = [
    ['executive', 'Executive', 'تنفيذي'], ['head', 'Head', 'رئيس'], ['manager', 'Manager', 'مدير'],
    ['supervisor', 'Supervisor', 'مشرف'], ['officer', 'Officer', 'موظف اختصاصي'],
    ['senior_associate', 'Senior Associate', 'مساعد أول'], ['associate', 'Associate', 'مساعد'],
  ];
  for (const [i, [code, en, ar]] of levels.entries()) await c.query('insert into job_level values ($1,$2,$3,$4)', [code, en, ar, i + 1]);

  const jt = async (en: string, ar: string, level: string) => (await one('insert into job_title(name_en, name_ar, level_code) values ($1,$2,$3) returning id', [en, ar, level])).id as string;
  const J = {
    CEO: await jt('Chief Executive Officer', 'الرئيس التنفيذي', 'executive'),
    HRM: await jt('HR Manager', 'مدير الموارد البشرية', 'head'),
    OPSM: await jt('Operations Manager', 'مدير العمليات', 'head'),
    HRO: await jt('HR & Government Relations Officer', 'موظف موارد بشرية وعلاقات حكومية', 'officer'),
    FBS: await jt('F&B Supervisor', 'مشرف أغذية ومشروبات', 'supervisor'),
    CAFS: await jt('Café Supervisor', 'مشرف المقهى', 'supervisor'),
    CASH: await jt('Cashier', 'كاشير', 'senior_associate'),
    WAIT: await jt('Waiter', 'نادل', 'associate'),
    DRV: await jt('Driver', 'سائق', 'associate'),
    CHEF: await jt('Chef', 'طاهٍ', 'supervisor'),
    CDP: await jt('Chef de Partie', 'رئيس قسم المطبخ', 'supervisor'),
    GRILL: await jt('Grill Chef', 'طاهي مشاوي', 'associate'),
    ACOOK: await jt('Assistant Cook', 'مساعد طاهٍ', 'associate'),
    STEW: await jt('Steward', 'عامل نظافة المطبخ', 'associate'),
    BAR: await jt('Barista', 'باريستا', 'associate'),
    PAST: await jt('Pastry Chef', 'طاهي حلويات', 'supervisor'),
    STORE: await jt('Storekeeper', 'أمين مستودع', 'associate'),
  };

  // Pay components per entity.
  const PC: Record<string, Record<string, string>> = {};
  for (const [k, id] of Object.entries(E)) {
    PC[k] = {};
    for (const [code, en, ar] of [['BASIC', 'Basic salary', 'الراتب الأساسي'], ['HOUSING', 'Housing allowance', 'بدل السكن'], ['TRANSPORT', 'Transport allowance', 'بدل المواصلات']]) {
      PC[k][code] = (await one('insert into pay_component(entity_id, code, name_en, name_ar, kind) values ($1,$2,$3,$4,$5) returning id', [id, code, en, ar, 'earning'])).id;
    }
  }

  await c.query(`insert into document_type(code, name_en, name_ar, requires_expiry, data_class) values
    ('passport','Passport','جواز السفر',true,'D3'),
    ('emirates_id','Emirates ID','الهوية الإماراتية',true,'D3'),
    ('oman_id','Oman resident card','البطاقة الشخصية العمانية',true,'D3'),
    ('work_permit','Work permit','تصريح العمل',true,'D3'),
    ('health_card','Health / food handler card','البطاقة الصحية',true,'D2'),
    ('contract','Employment contract','عقد العمل',false,'D3')`);

  // ---------- made-up people ----------
  type P = { key: string; en: string; ar?: string; g: 'male' | 'female'; nat: string; ent: keyof typeof E; br: keyof typeof BR;
    dep: string; job: keyof typeof J; mgr?: string; start: string; pay: [number, number, number]; permit?: string };
  const people: P[] = [
    { key: 'ceo', en: 'Demo CEO', ar: 'الرئيس التنفيذي (تجريبي)', g: 'male', nat: 'Kuwait', ent: 'HQ', br: 'HO', dep: 'EXEC', job: 'CEO', start: '2018-01-01', pay: [30000, 10000, 2000] },
    { key: 'hrm', en: 'Layla Haddad', ar: 'ليلى حداد', g: 'female', nat: 'Jordan', ent: 'HQ', br: 'HO', dep: 'HR', job: 'HRM', mgr: 'ceo', start: '2026-10-01', pay: [12000, 4000, 1000] },
    { key: 'ops', en: 'Omar Farouk', ar: 'عمر فاروق', g: 'male', nat: 'Egypt', ent: 'HQ', br: 'HO', dep: 'OPS', job: 'OPSM', mgr: 'ceo', start: '2022-03-15', pay: [11000, 3500, 1000] },
    { key: 'hro', en: 'Sara Nasser', ar: 'سارة ناصر', g: 'female', nat: 'Lebanon', ent: 'HQ', br: 'HO', dep: 'HR', job: 'HRO', mgr: 'hrm', start: '2024-06-01', pay: [6000, 2000, 500] },
    { key: 'shj_sup', en: 'Ravi Menon', g: 'male', nat: 'India', ent: 'REST', br: 'SHJ', dep: 'SVC', job: 'FBS', mgr: 'ops', start: '2023-02-01', pay: [3000, 800, 200] },
    { key: 'shj_cash', en: 'Aisha Rahman', ar: 'عائشة رحمن', g: 'female', nat: 'Bangladesh', ent: 'REST', br: 'SHJ', dep: 'SVC', job: 'CASH', mgr: 'shj_sup', start: '2024-09-10', pay: [1800, 500, 200], permit: 'Sales Employee' },
    { key: 'emp', en: 'John Mensah', g: 'male', nat: 'Ghana', ent: 'REST', br: 'SHJ', dep: 'SVC', job: 'WAIT', mgr: 'shj_sup', start: '2025-05-14', pay: [1200, 300, 200], permit: 'Waiter' },
    { key: 'shj_w2', en: 'Hassan Ali', ar: 'حسن علي', g: 'male', nat: 'Sudan', ent: 'REST', br: 'SHJ', dep: 'SVC', job: 'WAIT', mgr: 'shj_sup', start: '2025-10-13', pay: [1200, 300, 200], permit: 'Waiter' },
    { key: 'shj_chef', en: 'Bilal Qureshi', ar: 'بلال قريشي', g: 'male', nat: 'Pakistan', ent: 'REST', br: 'SHJ', dep: 'CUL', job: 'CDP', mgr: 'shj_sup', start: '2026-05-08', pay: [3000, 800, 200], permit: 'Arabic Food Cook' },
    { key: 'shj_ac', en: 'Tesfaye Bekele', g: 'male', nat: 'Ethiopia', ent: 'REST', br: 'SHJ', dep: 'CUL', job: 'ACOOK', mgr: 'shj_chef', start: '2025-09-10', pay: [1100, 300, 200], permit: 'Kitchen Assistant' },
    { key: 'shj_st', en: 'Ram Thapa', g: 'male', nat: 'Nepal', ent: 'REST', br: 'SHJ', dep: 'CUL', job: 'STEW', mgr: 'shj_chef', start: '2026-01-27', pay: [1000, 250, 150], permit: 'Restaurant Worker' },
    { key: 'shj_drv', en: 'Imran Khan', ar: 'عمران خان', g: 'male', nat: 'Pakistan', ent: 'REST', br: 'SHJ', dep: 'LOG', job: 'DRV', mgr: 'shj_sup', start: '2019-10-16', pay: [1600, 400, 200], permit: 'Messenger' },
    { key: 'fuj_sup', en: 'Mariam Saleh', ar: 'مريم صالح', g: 'female', nat: 'Syria', ent: 'REST', br: 'FUJ', dep: 'SVC', job: 'FBS', mgr: 'ops', start: '2023-06-22', pay: [3000, 800, 200] },
    { key: 'fuj_w', en: 'Kofi Owusu', g: 'male', nat: 'Ghana', ent: 'REST', br: 'FUJ', dep: 'SVC', job: 'WAIT', mgr: 'fuj_sup', start: '2025-02-20', pay: [1200, 300, 200], permit: 'Waiter' },
    { key: 'fuj_grill', en: 'Nabil Darwish', ar: 'نبيل درويش', g: 'male', nat: 'Egypt', ent: 'REST', br: 'FUJ', dep: 'CUL', job: 'GRILL', mgr: 'fuj_sup', start: '2013-11-06', pay: [1800, 500, 200], permit: 'Grilled Meat Maker' },
    { key: 'fuj_ac', en: 'Dev Patel', g: 'male', nat: 'India', ent: 'REST', br: 'FUJ', dep: 'CUL', job: 'ACOOK', mgr: 'fuj_grill', start: '2024-09-12', pay: [1100, 300, 200], permit: 'Kitchen Assistant' },
    { key: 'uaq_cash', en: 'Youssef Adel', ar: 'يوسف عادل', g: 'male', nat: 'Egypt', ent: 'REST', br: 'UAQ', dep: 'SVC', job: 'CASH', mgr: 'ops', start: '2025-10-15', pay: [1500, 400, 200], permit: 'Sales Employee' },
    { key: 'uaq_chef', en: 'Suresh Kumar', g: 'male', nat: 'India', ent: 'REST', br: 'UAQ', dep: 'CUL', job: 'CHEF', mgr: 'ops', start: '2025-08-20', pay: [1500, 400, 200], permit: 'Foreign Food Cook' },
    { key: 'uaq_st', en: 'Abebe Girma', g: 'male', nat: 'Ethiopia', ent: 'REST', br: 'UAQ', dep: 'CUL', job: 'STEW', mgr: 'uaq_chef', start: '2025-05-10', pay: [1000, 250, 150], permit: 'Restaurant Worker' },
    { key: 'ajm_store', en: 'Rashed Karim', ar: 'راشد كريم', g: 'male', nat: 'Bangladesh', ent: 'REST', br: 'AJM', dep: 'LOG', job: 'STORE', mgr: 'ops', start: '2022-08-30', pay: [1600, 400, 200] },
    { key: 'myr_sup', en: 'Grace Santos', g: 'female', nat: 'Philippines', ent: 'CAFE', br: 'MYR', dep: 'SVC', job: 'CAFS', mgr: 'ops', start: '2026-10-04', pay: [2800, 700, 200] },
    { key: 'myr_bar', en: 'Joy Reyes', g: 'female', nat: 'Philippines', ent: 'CAFE', br: 'MYR', dep: 'SVC', job: 'BAR', mgr: 'myr_sup', start: '2024-05-27', pay: [1300, 300, 200], permit: 'Beverage Maker' },
    { key: 'myr_past', en: 'Ahmad Sami', ar: 'أحمد سامي', g: 'male', nat: 'Egypt', ent: 'CAFE', br: 'MYR', dep: 'CUL', job: 'PAST', mgr: 'myr_sup', start: '2024-12-16', pay: [2200, 600, 200], permit: 'Confectioner' },
    { key: 'om_sup', en: 'Salim Al Harthy', ar: 'سالم الحارثي', g: 'male', nat: 'Oman', ent: 'OM', br: 'OMN', dep: 'SVC', job: 'FBS', mgr: 'ops', start: '2024-01-07', pay: [700, 150, 50] },
    { key: 'om_w', en: 'Faisal Al Busaidi', ar: 'فيصل البوسعيدي', g: 'male', nat: 'Oman', ent: 'OM', br: 'OMN', dep: 'SVC', job: 'WAIT', mgr: 'om_sup', start: '2025-03-01', pay: [325, 75, 25] },
    { key: 'om_cdp', en: 'Khalid Mansoor', ar: 'خالد منصور', g: 'male', nat: 'Yemen', ent: 'OM', br: 'OMN', dep: 'CUL', job: 'CDP', mgr: 'om_sup', start: '2024-04-15', pay: [450, 100, 30] },
    { key: 'om_ac', en: 'Prakash Rai', g: 'male', nat: 'Nepal', ent: 'OM', br: 'OMN', dep: 'CUL', job: 'ACOOK', mgr: 'om_cdp', start: '2025-07-01', pay: [200, 50, 20] },
  ];

  const empId: Record<string, string> = {};
  const personId: Record<string, string> = {};
  const counters: Record<string, number> = {};
  const today = new Date();
  const addDays = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  let i = 0;
  for (const p of people) {
    i++;
    const pid = (await one(`insert into person(legal_name_en, legal_name_ar, gender, nationality, date_of_birth, mobile)
      values ($1,$2,$3,$4,$5,$6) returning id`, [p.en, p.ar ?? null, p.g, p.nat, `19${80 + (i % 18)}-0${1 + (i % 9)}-1${i % 9}`, `+97150000${String(1000 + i)}`])).id;
    personId[p.key] = pid;
    counters[p.ent] = (counters[p.ent] || 0) + 1;
    const no = `${p.ent}-${String(counters[p.ent]).padStart(4, '0')}`;
    const probation = new Date(p.start); probation.setMonth(probation.getMonth() + 6);
    empId[p.key] = (await one(`insert into employment(person_id, entity_id, employee_no, start_date, probation_end_date)
      values ($1,$2,$3,$4,$5) returning id`, [pid, E[p.ent], no, p.start, probation.toISOString().slice(0, 10)])).id;
  }
  // Second pass: assignments (managers now exist), salary and documents.
  const posCount: Record<string, number> = {};
  for (const p of people) {
    posCount[p.br] = (posCount[p.br] || 0) + 1;
    const pos = (await one(`insert into position(code, entity_id, branch_id, department_id, job_title_id) values ($1,$2,$3,$4,$5) returning id`,
      [`POS-${p.br}-${String(posCount[p.br]).padStart(2, '0')}`, E[p.ent], BR[p.br], D[p.ent][p.dep], J[p.job]])).id;
    await c.query(`insert into assignment(employment_id, entity_id, position_id, job_title_id, branch_id, department_id, manager_employment_id, permit_job_title, effective_from, reason)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'hire')`,
      [empId[p.key], E[p.ent], pos, J[p.job], BR[p.br], D[p.ent][p.dep], p.mgr ? empId[p.mgr] : null, p.permit ?? null, p.start]);
    const cur = p.ent === 'OM' ? 'OMR' : 'AED';
    for (const [k, amount] of [['BASIC', p.pay[0]], ['HOUSING', p.pay[1]], ['TRANSPORT', p.pay[2]]] as const) {
      await c.query('insert into salary_line(employment_id, entity_id, pay_component_id, amount, currency, effective_from) values ($1,$2,$3,$4,$5,$6)',
        [empId[p.key], E[p.ent], PC[p.ent][k], amount, cur, p.start]);
    }
  }
  // Documents with a spread of expiry dates, so the dashboard has something to show.
  let n = 0;
  for (const p of people) {
    n++;
    const types = p.ent === 'OM' ? ['passport', 'oman_id', 'health_card'] : ['passport', 'emirates_id', 'work_permit', 'health_card'];
    for (const [j, t] of types.entries()) {
      const offset = [400, 700, 20 + n * 9, -5 + n * 13][j] ?? 365;   // some expire soon, one already expired
      await c.query('insert into document(person_id, entity_id, type_code, number_last4, issue_date, expiry_date, status) values ($1,$2,$3,$4,$5,$6,$7)',
        [personId[p.key], E[p.ent], t, String(1000 + n * 7 + j).slice(-4), addDays(offset - 730), addDays(offset), offset < 0 ? 'expired' : 'valid']);
    }
  }

  // ---------- demo sign-in accounts ----------
  const user = async (key: string, email: string, name: string) =>
    (await one('insert into user_account(person_id, email, display_name) values ($1,$2,$3) returning id', [personId[key], email, name])).id as string;
  const grant = (u: string, role: string, scope: 'group' | 'entity' | 'branch', id: string | null = null) =>
    c.query('insert into role_grant(user_id, role, scope_type, scope_id) values ($1,$2,$3,$4)', [u, role, scope, id]);

  const ceo = await user('ceo', 'ceo@demo.forka.local', 'Demo CEO');
  await grant(ceo, 'CEO', 'group');
  const hrm = await user('hrm', 'hr.manager@demo.forka.local', 'Layla Haddad');
  for (const e of [E.HQ, E.REST, E.CAFE]) await grant(hrm, 'HR_MANAGER', 'entity', e);      // UAE only: shows entity separation
  const hro = await user('hro', 'hr.officer@demo.forka.local', 'Sara Nasser');
  for (const e of [E.HQ, E.REST, E.CAFE]) await grant(hro, 'HR_OFFICER', 'entity', e);
  const shj = await user('shj_sup', 'sharjah.manager@demo.forka.local', 'Ravi Menon');
  await grant(shj, 'BRANCH_MANAGER', 'branch', BR.SHJ);
  const om = await user('om_sup', 'oman.manager@demo.forka.local', 'Salim Al Harthy');
  await grant(om, 'BRANCH_MANAGER', 'branch', BR.OMN);
  await user('emp', 'employee@demo.forka.local', 'John Mensah');

  await c.query('commit');
  await c.end();
  return { entities: E, branches: BR };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await seed();
  console.log('Demo data loaded (made-up people only).');
}
