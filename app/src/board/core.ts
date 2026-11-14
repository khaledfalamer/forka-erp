// @ts-nocheck
/* Forka Board - logic: data, who may do what, saving to the Board server, and every action.
   Moved from boards/index.html without changing behaviour. The screens are in ./views (React).
   Types are added step by step; until then this file is not type-checked (see app/README.md). */

/* ---------- drawing (React) ---------- */
let renderer = (_mode) => {};
/** Board's screens register here (see main.tsx). */
export function setRenderer(f) { renderer = f; }
/** What the sign-in / loading screen shows: null = the app, or 'load' | 'signin' | 'net'. */
export let GATE = null;
export function setLang(l) { lang = l; try { localStorage.setItem('fb-lang', l); } catch (e) {} }
export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/** Same as the original page: redraw everything from the data. */
export function render() {
  GATE = null;
  document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  if (V.view === 'board' && !canSee(B())) home();
  if (V.view === 'progress' && !isCEO()) home();
  if (['ports', 'report', 'res'].includes(V.view) && !lead()) home();
  const cv = document.querySelector('.canvas'), sx = cv ? cv.scrollLeft : 0, ys = {};
  document.querySelectorAll('.list[data-id] .cards').forEach(e => ys[e.closest('.list').dataset.id] = e.scrollTop);
  const pg = document.querySelector('.page'), py = pg ? pg.scrollTop : 0;
  renderer('app');
  const c2 = document.querySelector('.canvas'); if (c2) c2.scrollLeft = sx;
  document.querySelectorAll('.list[data-id] .cards').forEach(e => { const y = ys[e.closest('.list').dataset.id]; if (y) e.scrollTop = y; });
  const p2 = document.querySelector('.page'); if (p2) p2.scrollTop = py;
  if (V.pop) placePop();
  const mt = document.getElementById('mt'); if (mt) { mt.style.height = 'auto'; mt.style.height = mt.scrollHeight + 'px'; }
  hydrate();
  if (V.view === 'chat' && V.chScroll !== V.ch) { V.chScroll = V.ch; scrollChat(); }
}
/** Loading, "please sign in" or "no connection" screen. */
export function gate(k) {
  SV.ready = false; GATE = k;
  document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  renderer('gate');
}
/** Avatar as page text (only for the @-mention list, which is built outside React). */
export const avHtml = (id, cls) => { const p = person(id); return `<span class="av ${cls || ''}" style="background:${p.color}" title="${esc(pname(id))}">${esc(p.ini)}</span>`; };

export const ICON: Record<string,string>={
  search:'<path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', x:'<path d="M18 6 6 18M6 6l12 12"/>',
  dots:'<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
  collapse:'<path d="M4 12h6M20 12h-6M7 9l3 3-3 3M17 9l-3 3 3 3"/>', expand:'<path d="M10 12H4M14 12h6M7 9l-3 3 3 3M17 9l3 3-3 3"/>',
  desc:'<path d="M4 6h16M4 12h16M4 18h10"/>', check:'<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  tick:'<path d="M5 12l5 5L20 7"/>', clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  chat:'<path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.2A8 8 0 1 1 21 12z"/>', repeat:'<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
  filter:'<path d="M4 5h16l-6 8v5l-4 2v-7z"/>', board:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v10"/>',
  card:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/>', trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
  tag:'<path d="M20 12l-8 8-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.3"/>',
  down:'<path d="M6 9l6 6 6-6"/>', back:'<path d="M15 6l-6 6 6 6"/>', activity:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',clip:'<path d="M21 11l-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7"/>',
  bell:'<path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  archive:'<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v12h14V8M10 12h4"/>',copy:'<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  left:'<path d="M15 6l-6 6 6 6"/>',right:'<path d="M9 6l6 6-6 6"/>', inbox:'<path d="M3 13h5l2 3h4l2-3h5"/><path d="M5 5h14l2 8v6H3v-6z"/>', menu:'<path d="M4 6h16M4 12h16M4 18h16"/>', target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  folders:'<path d="M3 8a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M7 4h4l2 2"/>', gantt:'<path d="M4 6h9M8 12h10M6 18h7"/>', download:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', print:'<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/>', flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  diamond:'<path d="M12 3l9 9-9 9-9-9z"/>', subs:'<path d="M5 4v9a3 3 0 0 0 3 3h11"/><path d="M15 12l4 4-4 4"/>',
  link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  stamp:'<path d="M9 3h6l-1 7h-4z"/><path d="M5 14h14v3H5zM4 21h16"/>', up:'<path d="M18 15l-6-6-6 6"/>', updown:'<path d="M8 9l4-4 4 4M8 15l4 4 4-4"/>', alert:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>', list:'<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>'
};
export const uid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
export const T: any={
en:{app:'Boards',search:'Search this board',addCard:'Add a card',addCardBtn:'Add card',cardPh:'Enter a title for this card',addList:'Add another list',listPh:'Enter list name',addListBtn:'Add list',cancel:'Cancel',
  newBoard:'Create board',boardPh:'Board name',create:'Create',filter:'Filter',clear:'Clear filter',members:'Members',labels:'Labels',due:'Due date',repeat:'Repeats',
  r_:'Does not repeat',r_daily:'Daily',r_weekly:'Weekly',r_monthly:'Monthly',desc:'Description',descPh:'Add more detail: what needs doing, who to call, links…',checklist:'Checklist',itemPh:'Add an item',
  activity:'Activity',commentPh:'Write a comment…',save:'Save',inList:'in list',move:'Move to list',complete:'Complete',del:'Delete card',delQ:'Delete this card? This cannot be undone.',
  delList:'Delete list',delListQ:'Delete this list and all its cards?',collapse:'Collapse list',expand:'Expand list',sortDue:'Sort by due date',listMenu:'List actions',boardMenu:'Board menu',
  reset:'Reset preview data',resetQ:'Put the sample boards back? Your changes in this preview will be lost.',preview:'Preview: changes are kept only in this browser. Nothing is shared yet.',
  dueWeek:'Due this week',overdueF:'Overdue',noMatch:'No cards match the filter.',close:'Close',add:'Add',
  l_added:'added this card to {a}',l_moved:'moved this card from {a} to {b}',l_done:'marked this card complete',l_undone:'marked this card not complete',now:'just now',mAgo:'{n} min ago',hAgo:'{n} h ago',
  lb_fin:'Finance',lb_proc:'Procurement',lb_mnt:'Maintenance',lb_hr:'HR',lb_urg:'Urgent',lb_mkt:'Marketing',actions:'Actions',deleteBoard:'Delete board',deleteBoardQ:'Delete this board and everything on it?',yes:'Delete',
  theme:'Theme',light:'Light',dark:'Dark',
  mine:'My tasks',progress:'Company progress',departments:'Departments',viewAs:'View as',
  progLead:'Every department and project at a glance. Updated as people work.',mineLead:'Everything assigned to you, on every board.',
  k_open:'Open tasks',k_over:'Overdue',k_week:'Due this week',k_done:'Done in the last 7 days',
  t_dept:'Department',t_head:'Head',t_boards:'Boards',t_open:'Open',t_over:'Overdue',t_week:'This week',t_done:'Done (7 days)',t_prog:'Progress',
  projects:'Projects',t_board:'Project board',t_status:'Status',t_note:'Latest update',t_members:'People',workload:'Workload',t_person:'Person',
  st_on:'On track',st_risk:'At risk',st_off:'Off track',st_none:'No status',setStatus:'Set status',statusNote:'What changed this week? (one or two lines)',
  g_over:'Overdue',g_today:'Today',g_week:'This week',g_later:'Later',g_none:'No due date',nothingMine:'Nothing is assigned to you. When someone adds you to a card it shows here.',
  deptLead:'{n} boards. The department head creates boards and chooses who works on each.',deptLeadStaff:'Boards you were added to.',noBoards:'No boards here yet.',
  pickMembers:'People on this board',memberHint:'Only these people see this board. The department head and the CEO always do.',head:'Head',ceoRole:'CEO',staff:'Staff',
  headLabel:'Department head',onlyAdmin:'Only the department head can change this.',cards:'cards',openN:'{n} open',overN:'{n} overdue',updated:'Updated {t}',
  back:'Back',boardsOf:'{d} boards',you:'you',
  newTask:'New task',collapse:'Collapse or expand the menu',ntTitle:'Task',ntTitlePh:'What needs to be done?',forDept:'Department',onBoard:'Board',inListL:'List',assignTo:'Who will do it',
  assignHint:'Leave empty and the {d} head will assign it.',priority:'Priority',p_low:'Low',p_normal:'Normal',p_high:'High',p_urgent:'Urgent',
  checkLines:'Checklist (one item per line)',createTask:'Create task',need:'Fill in the boxes in red.',reqBoard:'Requests to {d}',asReq:'Request to {d}',
  reqNote:'This goes to {d} as a request. Their head sees it first and assigns it. You can follow it in My tasks.',requested:'My requests to other departments',
  fromD:'From {d}',reqBy:'requested by {p} ({d})',moveBoard:'Move to board',l_req:'sent this request from {a}',roNote:'You asked for this task. You can follow it and comment.',
  stateL:'Where it is',doneTag:'Done',
  teamTab:'Team',teamLead:'Everyone in {d}. Add someone who already uses Forka Apps, or invite someone new. They see only the boards you add them to, or boards open to everyone in {d}.',
  addExisting:'Add someone who already uses Forka Apps',addExistingHint:'Anyone with a Forka Apps account who is not in {d} yet. They stay in their other departments too.',addToTeam:'Add to team',noFree:'Everyone with an account is already in a department. Invite someone new instead.',
  inviteNew:'Invite someone new',inviteHint:'Their name and company email. They sign in at erp.forka.com with Google.',fullName:'Full name',sendInvite:'Send invite',inviteAuto:'In the live app the invite email is sent automatically.',
  roleL:'Role',emailL:'Email',statusL:'Status',invited:'Invite sent',active:'Active',copyInvite:'Copy invite',remove:'Remove',copied:'Invite copied. Paste it in WhatsApp or email.',
  inviteText:'Hello {p}, you have been added to Forka Boards ({d}). Open https://erp.forka.com and sign in with Google using {e}.',
  inviteSent:'Invite sent to {p}.',addedTo:'{p} added to {d}.',removeQ:'Remove {p} from {d}? They lose access to its boards. Their tasks stay.',
  allDept:'Everyone in {d}',allDeptHint:'{n} people now, and anyone who joins later',inviteTo:'Invite someone new to {d}',otherDepts:'People from other departments, for this board only',
  attach:'Attachments',addFile:'Add a file',attHint:'Photos, PDF or Office files, up to 5 MB each. In this preview, files stay in this browser; in the live app they are saved in a private Google Drive folder.',
  tooBig:'{f} is bigger than 5 MB.',openF:'Open',makeCover:'Make cover',noCover:'Remove cover',removeF:'Remove',
  archive:'Archive',archiveCard:'Archive card',archiveList:'Archive list',archived:'Archived items',restore:'Restore',delForever:'Delete for good',noArch:'Nothing archived.',
  archivedOk:'Archived. Restore it any time from the board menu, Archived items.',l_arch:'archived this card',l_restore:'restored this card',
  boardV:'Board',calV:'Calendar',todayB:'Today',noDate:'{n} cards have no due date.',
  alerts:'Alerts',noAlerts:'Nothing new.',markRead:'Mark all as read',emailMe:'Also email me',emailNote:'In the live app these alerts are also emailed.',
  n_assign:'{p} gave you a card',n_mention:'{p} mentioned you',n_req:'{p} sent a request to {d}',n_done:'{p} finished your request',n_due:'Due {w}',w_today:'today',w_tomorrow:'tomorrow',w_over:'overdue',
  editLabels:'Labels',addLabel:'Add label',labelName:'Label name',labelsHint:'Rename or recolour. Changes apply to every card on this board.',delLabelQ:'Remove this label from the board and its cards?',
  templates:'Templates',startFrom:'Start from',tpl_blank:'Blank (To do, In progress, Done)',tpl_weekly:'Weekly plan',tpl_opening:'Branch opening',tpl_hiring:'Hiring a role',tpl_maint:'Maintenance requests',
  saveTpl:'Save board as template',tplSaved:'Saved as a template. Use it when you create a board.',cardTpl:'Save card as template',cardTplSaved:'Saved. Pick it in New task, "Start from a template".',fromTpl:'Start from a template',none:'None',mineTpl:'Saved: {n}',
  copyTo:'Copy to board',copyBtn:'Copy',copied2:'Copied to {b}.',moveTo:'Move to board',moveBtn:'Move',moved:'Moved to {b}.',
  mentionHint:'Type @ to mention someone.',fileGone:'This file is not in this browser.',colour:'Change colour',
  projectsNav:'Projects',projLead:'Every board you can see, in one list. Search, filter and sort.',findProj:'Find a project',anyDept:'All departments',anyOwner:'Any owner',anyMember:'Any member',anyStatus:'Any status',
  sortMod:'Last changed',sortName:'Name',sortProg:'Progress',sortOver:'Most overdue',sortL:'Sort',t_owner:'Owner',t_last:'Last change',noProj:'No projects match.',
  startD:'Start date',startAfter:'The start date is after the due date.',owner:'Owner',ownerHint:'The one person responsible.',followers:'Followers',follow:'Follow',unfollow:'Stop following',addFollower:'Add a follower',
  followHint:'Followers get alerts on comments and when it is done.',type:'Type',ty_task:'Task',ty_milestone:'Milestone',ty_approval:'Approval',approvers:'Who approves',
  ap_pending:'Waiting for approval',ap_approved:'Approved',ap_changes:'Changes requested',ap_rejected:'Rejected',approve:'Approve',reqChanges:'Request changes',reject:'Reject',
  apOnly:'Only the people who approve, or the CEO, can decide.',apBy:'{s} by {p}',subtasks:'Subtasks',subPh:'Add a subtask',nobody:'Nobody yet',subOf:'in: {x}',
  waitingOn:'Waiting on',waitHint:'This task cannot be completed until these are done.',addWait:'Add',blocking:'Other tasks waiting for this one',waitTag:'Waiting',
  waitFirst:'Waiting on "{x}". Finish that first.',waitLoop:'That would make the two tasks wait for each other.',pickTask:'Choose a task…',
  fields:'Custom fields',addField:'Add field',fieldName:'Field name',fieldsHint:'Your own fields for this board, such as Branch, Cost or Area. Choice fields can be used in the filter.',
  fk_select:'Choice',fk_text:'Text',fk_number:'Number',optsPh:'Choices, separated by commas',delFieldQ:'Remove this field from the board and its cards?',
  myList:'List',myBoard:'Board',myCal:'Calendar',myFiles:'Files',groupBy:'Group by',gSec:'My sections',gDue:'Due date',addSec:'Add section',secPh:'Section name',
  sec_recent:'Recently assigned',sec_today:'Do today',sec_next:'Do next week',sec_later:'Do later',delSecQ:'Remove this section? Its tasks go back to Recently assigned.',moveSec:'Section',
  noFiles:'No files on your tasks yet.',t_file:'File',t_task:'Task',emptySec:'Drag tasks here.',renameSec:'Rename',delSec:'Remove section',
  n_comment:'{p} commented',n_unblocked:'Ready to start: "{x}" is done',n_subassign:'{p} gave you a subtask',n_ap_approved:'{p} approved it',n_ap_changes:'{p} asked for changes',n_ap_rejected:'{p} rejected it',n_fdone:'{p} completed a task you follow',
  l_ap:'decided: {a}',l_wait:'set it to wait for "{a}"',
  strategy:'Strategy',goals:'Goals',ports:'Portfolios',report:'Reporting',resourcing:'Resourcing',
  goalsLead:'What the company and each department are working towards. Progress comes from the boards linked to each goal.',
  newGoal:'New goal',editGoal:'Goal',gTitle:'Goal',gTitlePh:'For example: Open the Ajman branch on time',gLevel:'For',companyLvl:'The whole company',gOwner:'Owner',gDue:'Target date',
  gBoards:'Linked boards (progress is worked out from their tasks)',gPct:'Progress (%) when no boards are linked',gStatus:'Status',gNote:'Latest update',companyGoals:'Company goals',
  noGoals:'No goals yet.',delGoal:'Delete goal',delGoalQ:'Delete this goal?',saveB:'Save',gRo:'Only the CEO or this department\'s head can change this goal.',linked:'{n} boards',
  portsLead:'Your own groups of projects, to follow them together.',newPort:'New portfolio',portPh:'Portfolio name',addProj:'Add a project…',t_due:'Due date',t_pri:'Priority',
  noPorts:'No portfolios yet. Make one for the projects you follow most.',delPort:'Delete portfolio',delPortQ:'Delete this portfolio? The boards are not touched.',projN:'{n} projects',removeP:'Remove',
  tlV:'Timeline',listV:'List',noDates:'{n} tasks have no dates.',legDone:'Done',legOpen:'Open',legOver:'Overdue',legMs:'Milestone',
  reportLead:'How the work is going, in numbers and charts.',reportLeadHead:'How {d} is doing, in numbers and charts.',k_done30:'Done in the last 30 days',k_ontime:'Finished on time (30 days)',
  ch_status:'Tasks by department',ch_statusB:'Tasks by board',ch_weeks:'Tasks completed per week',ch_pri:'Open tasks by priority',ch_overP:'Overdue tasks by person',
  asTable:'Show the numbers',exportCsv:'Export to Excel (CSV)',printB:'Print or save as PDF',weekOf:'Week of {d}',nothingOver:'Nothing overdue.',
  resLead:'Who has how much work, and how it is going.',wlTab:'Workload',perfTab:'Performance',wlLead:'Open tasks due each week. Red means more than the weekly limit for that person.',
  limitL:'Weekly limit',overdueCol:'Overdue',thisWeek:'This week',perfLead:'From the tasks recorded in Boards only. Use it to start a conversation, not as the whole picture.',
  period:'Period',p30:'Last 30 days',p90:'Last 90 days',pmonth:'This month',pf_done:'Completed',pf_ontime:'On time',pf_late:'Late',pf_avgLate:'Avg. days late',pf_overNow:'Overdue now',pf_subs:'Subtasks done',
  vsPrev:'vs previous period',noTasksP:'No finished tasks with a due date in this period.',perfOf:'{p}: finished in this period',onTimeTag:'On time',lateBy:'{n} days late',noDue:'No due date',
  doneOn:'Done',close2:'Close',stillOver:'Overdue now',tasksIn:'{p}, {w}',
  people:'People',peopleLead:'Everyone in Forka Apps. Open a profile for contact details, to send a message, or to see what they are working on.',findPerson:'Find a person',
  editProfile:'Edit my profile',phone:'Phone',about:'About me',aboutPh:'For example: I work 9am to 6pm, Sunday to Thursday.',ooo:'Out of office',oooFrom:'From',oooTo:'Until',oooNote:'Note',
  oooBad:'"Until" must be on or after "From".',awayUntil:'Away until {d}',sendMsg:'Send a message',openTasks:'Open tasks',whatsapp:'WhatsApp',call:'Call',emailB:'Email',
  noContact:'No contact details yet.',myProfileHint:'Everyone in Forka Apps can see your profile.',
  chat:'Chat',channels:'Channels',dms:'Direct messages',everyone:'Everyone',newDm:'Message someone…',msgPh:'Write a message… (type @ to mention someone)',sendB:'Send',
  chatLead:'Channel for {d}',chatAll:'For everyone at Forka',noMsgs:'No messages yet. Say hello.',pickChat:'Choose a channel or a person.',
  chatNote:'Preview: messages stay in this browser. In the live app everyone in the channel sees them straight away.',n_chat:'{p} mentioned you in {x}',n_dm:'{p} sent you a message',
  today2:'Today',yesterday:'Yesterday',lblNames:'Show label names on cards',lblColours:'Show label colours only',newSpace:'New space',spLead:'A space is a department or team of its own: its boards, its team and its chat channel. You become its head.',spName:'Name (English)',spNamePh:'For example: Events, Central Kitchen',spNameAr:'Name (Arabic)',spColour:'Colour',spCreate:'Create space',editSpace:'Edit space',delSpace:'Remove space',delSpaceQ:'Remove this space? People stay in their other departments.',spHasBoards:'Delete or move its boards first.',pDepts:'Departments and role',pDeptsH:'Someone can be in several departments. Heads manage their department\'s boards and team.',notIn:'Not in it',alsoIn:'Also in: {d}',fromL:'Sent from',
  sSaved:'Saved',sSaving:'Saving…',sOff:'Offline: changes will be sent when the connection is back',notAllowed:'You cannot change this. It was put back as it was.',
  signinNeed:'Please sign in at Forka Apps first, then open Boards from there.',signinBtn:'Sign in at Forka Apps',netErr:'Boards could not reach the server. Check the connection and try again.',retry:'Try again',loading:'Opening your boards…',
  noDept:'Not in a department yet',inviteLive:'They are added to Forka Apps as "To confirm". The CEO confirms them, then they sign in with Google.',
  scopeAll:'All company',scopeMine:'My department',pickDept:'Choose a department',rangeL:'Period',r7:'Last 7 days',k_weekN:'Due in the next {n} days',k_doneN:'Done in the last {n} days',t_weekN:'Next {n} days',t_doneN:'Done ({n} days)',
  kpiHint:'Click a number to show only the matching rows below.',showing:'Showing only: {x}',showAll:'Show all',projSum:'Projects by status',noRows:'Nothing matches this filter.',openRow:'Open',sortBy:'Sort by {x}',clearF:'Clear filters',
  anyPri:'Any priority',ownerF:'Owner',priF:'Priority',searchingFor:'Search: {x}',clearSearch:'Clear search',cardsN:'{n} cards',addTo:'Add a card to {x}',moreN:'+{n} more',dayTitle:'Tasks due {d}',noTasksDay:'No tasks are due on this day.',newOnDay:'New task on this day',openDay:'Open {d}',
  tlNow:'Today',tlTasks:'Task',tlProjects:'Project',g_ess:'Essentials',g_sched:'Schedule',g_det:'Details',optional:'optional',reqd:'Required',e_title:'Write what needs to be done.',e_owner:'Choose who will do it.',e_due:'Choose a due date.',ownerNote:'The first person you choose is the owner.',
  attHintLive:'Photos, PDF or Office files, up to 5 MB each. Saved in a private Google Drive folder; only people who can see this task can open them.'},
ar:{app:'اللوحات',search:'بحث في هذه اللوحة',addCard:'إضافة بطاقة',addCardBtn:'إضافة',cardPh:'اكتب عنوان البطاقة',addList:'إضافة قائمة أخرى',listPh:'اسم القائمة',addListBtn:'إضافة القائمة',cancel:'إلغاء',
  newBoard:'إنشاء لوحة',boardPh:'اسم اللوحة',create:'إنشاء',filter:'تصفية',clear:'مسح التصفية',members:'الأعضاء',labels:'التصنيفات',due:'تاريخ الاستحقاق',repeat:'التكرار',
  r_:'لا يتكرر',r_daily:'يومي',r_weekly:'أسبوعي',r_monthly:'شهري',desc:'الوصف',descPh:'أضف تفاصيل: ما المطلوب، من نتواصل معه، روابط…',checklist:'قائمة المهام',itemPh:'إضافة بند',
  activity:'النشاط',commentPh:'اكتب تعليقاً…',save:'حفظ',inList:'في قائمة',move:'نقل إلى قائمة',complete:'مكتملة',del:'حذف البطاقة',delQ:'حذف هذه البطاقة؟ لا يمكن التراجع.',
  delList:'حذف القائمة',delListQ:'حذف هذه القائمة وكل بطاقاتها؟',collapse:'طي القائمة',expand:'فتح القائمة',sortDue:'ترتيب حسب التاريخ',listMenu:'إجراءات القائمة',boardMenu:'قائمة اللوحة',
  reset:'إعادة بيانات المعاينة',resetQ:'إرجاع اللوحات النموذجية؟ ستضيع تعديلاتك في هذه المعاينة.',preview:'معاينة: التعديلات محفوظة في هذا المتصفح فقط، ولا تُشارك مع أحد بعد.',
  dueWeek:'مستحقة هذا الأسبوع',overdueF:'متأخرة',noMatch:'لا توجد بطاقات مطابقة.',close:'إغلاق',add:'إضافة',
  l_added:'أضاف هذه البطاقة إلى {a}',l_moved:'نقل هذه البطاقة من {a} إلى {b}',l_done:'حدّد البطاقة كمكتملة',l_undone:'ألغى اكتمال البطاقة',now:'الآن',mAgo:'قبل {n} دقيقة',hAgo:'قبل {n} ساعة',
  lb_fin:'مالية',lb_proc:'مشتريات',lb_mnt:'صيانة',lb_hr:'موارد بشرية',lb_urg:'عاجل',lb_mkt:'تسويق',actions:'إجراءات',deleteBoard:'حذف اللوحة',deleteBoardQ:'حذف هذه اللوحة وكل ما فيها؟',yes:'حذف',
  theme:'المظهر',light:'فاتح',dark:'داكن',
  mine:'مهامي',progress:'تقدّم الشركة',departments:'الأقسام',viewAs:'عرض باسم',
  progLead:'كل الأقسام والمشاريع في نظرة واحدة. تتحدث أثناء العمل.',mineLead:'كل ما أُسند إليك في جميع اللوحات.',
  k_open:'مهام مفتوحة',k_over:'متأخرة',k_week:'مستحقة هذا الأسبوع',k_done:'أُنجزت في آخر 7 أيام',
  t_dept:'القسم',t_head:'المسؤول',t_boards:'اللوحات',t_open:'مفتوحة',t_over:'متأخرة',t_week:'هذا الأسبوع',t_done:'منجزة (7 أيام)',t_prog:'التقدّم',
  projects:'المشاريع',t_board:'لوحة المشروع',t_status:'الحالة',t_note:'آخر تحديث',t_members:'الفريق',workload:'حجم العمل',t_person:'الشخص',
  st_on:'على المسار',st_risk:'معرّض للتأخير',st_off:'متأخر',st_none:'بدون حالة',setStatus:'تحديد الحالة',statusNote:'ما الجديد هذا الأسبوع؟ (سطر أو سطران)',
  g_over:'متأخرة',g_today:'اليوم',g_week:'هذا الأسبوع',g_later:'لاحقاً',g_none:'بدون تاريخ',nothingMine:'لا يوجد شيء مُسند إليك. عندما يضيفك أحد إلى بطاقة تظهر هنا.',
  deptLead:'{n} لوحات. مسؤول القسم ينشئ اللوحات ويختار فريق كل لوحة.',deptLeadStaff:'اللوحات التي أُضفت إليها.',noBoards:'لا توجد لوحات هنا بعد.',
  pickMembers:'فريق هذه اللوحة',memberHint:'هؤلاء فقط يرون هذه اللوحة. مسؤول القسم والرئيس التنفيذي يرونها دائماً.',head:'مسؤول',ceoRole:'الرئيس التنفيذي',staff:'موظف',
  headLabel:'مسؤول القسم',onlyAdmin:'مسؤول القسم فقط يستطيع تغيير هذا.',cards:'بطاقات',openN:'{n} مفتوحة',overN:'{n} متأخرة',updated:'تحديث {t}',
  back:'رجوع',boardsOf:'لوحات {d}',you:'أنت',
  newTask:'مهمة جديدة',collapse:'طي القائمة أو فتحها',ntTitle:'المهمة',ntTitlePh:'ما المطلوب إنجازه؟',forDept:'القسم',onBoard:'اللوحة',inListL:'القائمة',assignTo:'من سينفّذها',
  assignHint:'اتركها فارغة وسيُسندها مسؤول {d}.',priority:'الأولوية',p_low:'منخفضة',p_normal:'عادية',p_high:'عالية',p_urgent:'عاجلة',
  checkLines:'قائمة المهام (بند في كل سطر)',createTask:'إنشاء المهمة',need:'عبّئ الخانات الحمراء.',reqBoard:'طلبات إلى {d}',asReq:'طلب إلى {d}',
  reqNote:'تُرسل إلى {d} كطلب. يراها مسؤول القسم أولاً ويُسندها. يمكنك متابعتها في مهامي.',requested:'طلباتي من الأقسام الأخرى',
  fromD:'من {d}',reqBy:'طلبها {p} ({d})',moveBoard:'نقل إلى لوحة',l_req:'أرسل هذا الطلب من {a}',roNote:'أنت طلبت هذه المهمة. يمكنك متابعتها والتعليق.',
  stateL:'أين وصلت',doneTag:'منجزة',
  teamTab:'الفريق',teamLead:'كل أعضاء {d}. أضف شخصاً يستخدم تطبيقات فوركا، أو ادعُ شخصاً جديداً. يرون فقط اللوحات التي تضيفهم إليها، أو اللوحات المفتوحة لكل {d}.',
  addExisting:'أضف شخصاً يستخدم تطبيقات فوركا',addExistingHint:'أي شخص لديه حساب في تطبيقات فوركا وليس في {d} بعد. يبقى في أقسامه الأخرى أيضاً.',addToTeam:'أضف إلى الفريق',noFree:'كل من لديه حساب موجود في قسم. ادعُ شخصاً جديداً بدلاً من ذلك.',
  inviteNew:'ادعُ شخصاً جديداً',inviteHint:'الاسم وبريد الشركة. يدخل إلى erp.forka.com بحساب Google.',fullName:'الاسم الكامل',sendInvite:'إرسال الدعوة',inviteAuto:'في التطبيق الفعلي تُرسل رسالة الدعوة تلقائياً.',
  roleL:'الدور',emailL:'البريد',statusL:'الحالة',invited:'أُرسلت الدعوة',active:'نشط',copyInvite:'نسخ الدعوة',remove:'إزالة',copied:'تم نسخ الدعوة. الصقها في واتساب أو البريد.',
  inviteText:'مرحباً {p}، تمت إضافتك إلى لوحات فوركا ({d}). افتح https://erp.forka.com وادخل بحساب Google باستخدام {e}.',
  inviteSent:'أُرسلت الدعوة إلى {p}.',addedTo:'تمت إضافة {p} إلى {d}.',removeQ:'إزالة {p} من {d}؟ سيفقد الوصول إلى لوحاتها. تبقى مهامه.',
  allDept:'كل أعضاء {d}',allDeptHint:'{n} أشخاص الآن، وكل من ينضم لاحقاً',inviteTo:'ادعُ شخصاً جديداً إلى {d}',otherDepts:'أشخاص من أقسام أخرى، لهذه اللوحة فقط',
  attach:'المرفقات',addFile:'إضافة ملف',attHint:'صور أو PDF أو ملفات Office، حتى 5 ميغابايت لكل ملف. في هذه المعاينة تبقى الملفات في هذا المتصفح؛ وفي التطبيق الفعلي تُحفظ في مجلد خاص على Google Drive.',
  tooBig:'{f} أكبر من 5 ميغابايت.',openF:'فتح',makeCover:'صورة الغلاف',noCover:'إزالة الغلاف',removeF:'إزالة',
  archive:'أرشفة',archiveCard:'أرشفة البطاقة',archiveList:'أرشفة القائمة',archived:'العناصر المؤرشفة',restore:'استعادة',delForever:'حذف نهائي',noArch:'لا يوجد شيء مؤرشف.',
  archivedOk:'تمت الأرشفة. يمكنك استعادتها في أي وقت من قائمة اللوحة، العناصر المؤرشفة.',l_arch:'أرشف هذه البطاقة',l_restore:'استعاد هذه البطاقة',
  boardV:'اللوحة',calV:'التقويم',todayB:'اليوم',noDate:'{n} بطاقات بدون تاريخ استحقاق.',
  alerts:'التنبيهات',noAlerts:'لا جديد.',markRead:'تحديد الكل كمقروء',emailMe:'أرسلها لي بالبريد أيضاً',emailNote:'في التطبيق الفعلي تُرسل هذه التنبيهات بالبريد أيضاً.',
  n_assign:'أسند إليك {p} بطاقة',n_mention:'ذكرك {p}',n_req:'أرسل {p} طلباً إلى {d}',n_done:'أنجز {p} طلبك',n_due:'مستحقة {w}',w_today:'اليوم',w_tomorrow:'غداً',w_over:'متأخرة',
  editLabels:'التصنيفات',addLabel:'إضافة تصنيف',labelName:'اسم التصنيف',labelsHint:'غيّر الاسم أو اللون. التغيير يشمل كل بطاقات هذه اللوحة.',delLabelQ:'إزالة هذا التصنيف من اللوحة وبطاقاتها؟',
  templates:'القوالب',startFrom:'البدء من',tpl_blank:'فارغة (للعمل، قيد التنفيذ، منجز)',tpl_weekly:'خطة أسبوعية',tpl_opening:'افتتاح فرع',tpl_hiring:'توظيف لوظيفة',tpl_maint:'طلبات الصيانة',
  saveTpl:'حفظ اللوحة كقالب',tplSaved:'حُفظت كقالب. استخدمه عند إنشاء لوحة.',cardTpl:'حفظ البطاقة كقالب',cardTplSaved:'حُفظت. اخترها في مهمة جديدة، "البدء من قالب".',fromTpl:'البدء من قالب',none:'بدون',mineTpl:'محفوظة: {n}',
  copyTo:'نسخ إلى لوحة',copyBtn:'نسخ',copied2:'نُسخت إلى {b}.',moveTo:'نقل إلى لوحة',moveBtn:'نقل',moved:'نُقلت إلى {b}.',
  mentionHint:'اكتب @ لذكر شخص.',fileGone:'هذا الملف غير موجود في هذا المتصفح.',colour:'تغيير اللون',
  projectsNav:'المشاريع',projLead:'كل اللوحات التي تراها في قائمة واحدة. ابحث وصفِّ ورتّب.',findProj:'ابحث عن مشروع',anyDept:'كل الأقسام',anyOwner:'أي مسؤول',anyMember:'أي عضو',anyStatus:'أي حالة',
  sortMod:'آخر تغيير',sortName:'الاسم',sortProg:'التقدّم',sortOver:'الأكثر تأخراً',sortL:'الترتيب',t_owner:'المسؤول',t_last:'آخر تغيير',noProj:'لا توجد مشاريع مطابقة.',
  startD:'تاريخ البدء',startAfter:'تاريخ البدء بعد تاريخ الاستحقاق.',owner:'المسؤول',ownerHint:'شخص واحد مسؤول عنها.',followers:'المتابعون',follow:'متابعة',unfollow:'إلغاء المتابعة',addFollower:'إضافة متابع',
  followHint:'يصل للمتابعين تنبيه عند كل تعليق وعند الإنجاز.',type:'النوع',ty_task:'مهمة',ty_milestone:'محطة رئيسية',ty_approval:'موافقة',approvers:'من يوافق',
  ap_pending:'بانتظار الموافقة',ap_approved:'تمت الموافقة',ap_changes:'مطلوب تعديلات',ap_rejected:'مرفوضة',approve:'موافقة',reqChanges:'طلب تعديلات',reject:'رفض',
  apOnly:'فقط من يوافق، أو الرئيس التنفيذي، يستطيع القرار.',apBy:'{s} من {p}',subtasks:'المهام الفرعية',subPh:'إضافة مهمة فرعية',nobody:'لم يُحدد بعد',subOf:'ضمن: {x}',
  waitingOn:'بانتظار',waitHint:'لا يمكن إنجاز هذه المهمة قبل إنجاز هذه.',addWait:'إضافة',blocking:'مهام أخرى تنتظر هذه المهمة',waitTag:'بانتظار',
  waitFirst:'بانتظار "{x}". أنجزها أولاً.',waitLoop:'هذا سيجعل المهمتين تنتظر كل منهما الأخرى.',pickTask:'اختر مهمة…',
  fields:'حقول مخصصة',addField:'إضافة حقل',fieldName:'اسم الحقل',fieldsHint:'حقولك الخاصة لهذه اللوحة، مثل الفرع أو التكلفة أو المنطقة. حقول الاختيار تظهر في التصفية.',
  fk_select:'اختيار',fk_text:'نص',fk_number:'رقم',optsPh:'الخيارات، مفصولة بفواصل',delFieldQ:'إزالة هذا الحقل من اللوحة وبطاقاتها؟',
  myList:'قائمة',myBoard:'لوحة',myCal:'التقويم',myFiles:'الملفات',groupBy:'التجميع حسب',gSec:'أقسامي',gDue:'تاريخ الاستحقاق',addSec:'إضافة قسم',secPh:'اسم القسم',
  sec_recent:'أُسندت مؤخراً',sec_today:'لليوم',sec_next:'للأسبوع القادم',sec_later:'لاحقاً',delSecQ:'إزالة هذا القسم؟ تعود مهامه إلى "أُسندت مؤخراً".',moveSec:'القسم',
  noFiles:'لا توجد ملفات على مهامك بعد.',t_file:'الملف',t_task:'المهمة',emptySec:'اسحب المهام إلى هنا.',renameSec:'إعادة تسمية',delSec:'إزالة القسم',
  n_comment:'علّق {p}',n_unblocked:'جاهزة للبدء: أُنجزت "{x}"',n_subassign:'أسند إليك {p} مهمة فرعية',n_ap_approved:'وافق {p}',n_ap_changes:'طلب {p} تعديلات',n_ap_rejected:'رفض {p}',n_fdone:'أنجز {p} مهمة تتابعها',
  l_ap:'قرّر: {a}',l_wait:'جعلها بانتظار "{a}"',
  strategy:'الاستراتيجية',goals:'الأهداف',ports:'المحافظ',report:'التقارير',resourcing:'الموارد',
  goalsLead:'ما تعمل الشركة وكل قسم على تحقيقه. التقدّم يُحسب من اللوحات المرتبطة بكل هدف.',
  newGoal:'هدف جديد',editGoal:'الهدف',gTitle:'الهدف',gTitlePh:'مثال: افتتاح فرع عجمان في موعده',gLevel:'لـ',companyLvl:'الشركة كلها',gOwner:'المسؤول',gDue:'التاريخ المستهدف',
  gBoards:'اللوحات المرتبطة (يُحسب التقدّم من مهامها)',gPct:'التقدّم (%) إذا لم تُربط لوحات',gStatus:'الحالة',gNote:'آخر تحديث',companyGoals:'أهداف الشركة',
  noGoals:'لا توجد أهداف بعد.',delGoal:'حذف الهدف',delGoalQ:'حذف هذا الهدف؟',saveB:'حفظ',gRo:'فقط الرئيس التنفيذي أو مسؤول هذا القسم يستطيع تغيير هذا الهدف.',linked:'{n} لوحات',
  portsLead:'مجموعاتك الخاصة من المشاريع لمتابعتها معاً.',newPort:'محفظة جديدة',portPh:'اسم المحفظة',addProj:'إضافة مشروع…',t_due:'تاريخ الاستحقاق',t_pri:'الأولوية',
  noPorts:'لا توجد محافظ بعد. أنشئ واحدة للمشاريع التي تتابعها أكثر.',delPort:'حذف المحفظة',delPortQ:'حذف هذه المحفظة؟ لن تتأثر اللوحات.',projN:'{n} مشاريع',removeP:'إزالة',
  tlV:'المخطط الزمني',listV:'قائمة',noDates:'{n} مهام بدون تواريخ.',legDone:'منجزة',legOpen:'مفتوحة',legOver:'متأخرة',legMs:'محطة رئيسية',
  reportLead:'كيف يسير العمل، بالأرقام والرسوم.',reportLeadHead:'كيف يسير {d}، بالأرقام والرسوم.',k_done30:'أُنجزت في آخر 30 يوماً',k_ontime:'أُنجزت في موعدها (30 يوماً)',
  ch_status:'المهام حسب القسم',ch_statusB:'المهام حسب اللوحة',ch_weeks:'المهام المنجزة أسبوعياً',ch_pri:'المهام المفتوحة حسب الأولوية',ch_overP:'المهام المتأخرة حسب الشخص',
  asTable:'عرض الأرقام',exportCsv:'تصدير إلى Excel (CSV)',printB:'طباعة أو حفظ PDF',weekOf:'أسبوع {d}',nothingOver:'لا يوجد شيء متأخر.',
  resLead:'من لديه كم من العمل، وكيف يسير.',wlTab:'حجم العمل',perfTab:'الأداء',wlLead:'المهام المفتوحة المستحقة كل أسبوع. الأحمر يعني أكثر من الحد الأسبوعي لهذا الشخص.',
  limitL:'الحد الأسبوعي',overdueCol:'متأخرة',thisWeek:'هذا الأسبوع',perfLead:'من المهام المسجلة في اللوحات فقط. استخدمه لبدء حوار، وليس كصورة كاملة.',
  period:'الفترة',p30:'آخر 30 يوماً',p90:'آخر 90 يوماً',pmonth:'هذا الشهر',pf_done:'منجزة',pf_ontime:'في الموعد',pf_late:'متأخرة',pf_avgLate:'متوسط أيام التأخير',pf_overNow:'متأخرة الآن',pf_subs:'مهام فرعية منجزة',
  vsPrev:'مقارنة بالفترة السابقة',noTasksP:'لا توجد مهام منجزة لها تاريخ استحقاق في هذه الفترة.',perfOf:'{p}: ما أُنجز في هذه الفترة',onTimeTag:'في الموعد',lateBy:'متأخرة {n} أيام',noDue:'بدون تاريخ',
  doneOn:'أُنجزت',close2:'إغلاق',stillOver:'متأخرة الآن',tasksIn:'{p}، {w}',
  people:'الأشخاص',peopleLead:'كل من في تطبيقات فوركا. افتح الملف الشخصي لبيانات التواصل أو لإرسال رسالة أو لرؤية ما يعمل عليه.',findPerson:'ابحث عن شخص',
  editProfile:'تعديل ملفي',phone:'الهاتف',about:'نبذة عني',aboutPh:'مثال: أعمل من 9 صباحاً إلى 6 مساءً، من الأحد إلى الخميس.',ooo:'خارج المكتب',oooFrom:'من',oooTo:'حتى',oooNote:'ملاحظة',
  oooBad:'تاريخ "حتى" يجب أن يكون في يوم "من" أو بعده.',awayUntil:'غائب حتى {d}',sendMsg:'إرسال رسالة',openTasks:'المهام المفتوحة',whatsapp:'واتساب',call:'اتصال',emailB:'بريد',
  noContact:'لا توجد بيانات تواصل بعد.',myProfileHint:'يرى ملفك كل من في تطبيقات فوركا.',
  chat:'المحادثة',channels:'القنوات',dms:'رسائل مباشرة',everyone:'الجميع',newDm:'راسل شخصاً…',msgPh:'اكتب رسالة… (اكتب @ لذكر شخص)',sendB:'إرسال',
  chatLead:'قناة {d}',chatAll:'لكل فريق فوركا',noMsgs:'لا رسائل بعد. ابدأ بالتحية.',pickChat:'اختر قناة أو شخصاً.',
  chatNote:'معاينة: الرسائل تبقى في هذا المتصفح. في التطبيق الفعلي يراها كل أعضاء القناة فوراً.',n_chat:'ذكرك {p} في {x}',n_dm:'أرسل لك {p} رسالة',
  today2:'اليوم',yesterday:'أمس',lblNames:'إظهار أسماء التصنيفات على البطاقات',lblColours:'إظهار ألوان التصنيفات فقط',newSpace:'مساحة جديدة',spLead:'المساحة قسم أو فريق مستقل: لوحاته وفريقه وقناة محادثته. ستكون أنت المسؤول عنها.',spName:'الاسم (بالإنجليزية)',spNamePh:'مثال: الفعاليات، المطبخ المركزي',spNameAr:'الاسم (بالعربية)',spColour:'اللون',spCreate:'إنشاء المساحة',editSpace:'تعديل المساحة',delSpace:'إزالة المساحة',delSpaceQ:'إزالة هذه المساحة؟ يبقى الأشخاص في أقسامهم الأخرى.',spHasBoards:'احذف لوحاتها أو انقلها أولاً.',pDepts:'الأقسام والدور',pDeptsH:'يمكن أن يكون الشخص في أكثر من قسم. مسؤول القسم يدير لوحات القسم وفريقه.',notIn:'ليس فيه',alsoIn:'أيضاً في: {d}',fromL:'مُرسل من',
  sSaved:'تم الحفظ',sSaving:'جارٍ الحفظ…',sOff:'غير متصل: ستُرسل التعديلات عند عودة الاتصال',notAllowed:'لا يمكنك تغيير هذا. أُعيد كما كان.',
  signinNeed:'يرجى تسجيل الدخول في تطبيقات فوركا أولاً، ثم افتح اللوحات من هناك.',signinBtn:'تسجيل الدخول في تطبيقات فوركا',netErr:'تعذّر الوصول إلى الخادم. تحقق من الاتصال وحاول مرة أخرى.',retry:'حاول مرة أخرى',loading:'جارٍ فتح لوحاتك…',
  noDept:'ليس في قسم بعد',inviteLive:'يُضاف إلى تطبيقات فوركا بحالة "للتأكيد". يؤكده الرئيس التنفيذي ثم يدخل بحساب Google.',
  scopeAll:'كل الشركة',scopeMine:'قسمي',pickDept:'اختر قسماً',rangeL:'الفترة',r7:'آخر 7 أيام',k_weekN:'مستحقة خلال {n} يوماً القادمة',k_doneN:'أُنجزت في آخر {n} يوماً',t_weekN:'خلال {n} يوماً',t_doneN:'منجزة ({n} يوماً)',
  kpiHint:'اضغط على رقم لعرض الصفوف المطابقة فقط أدناه.',showing:'المعروض فقط: {x}',showAll:'عرض الكل',projSum:'المشاريع حسب الحالة',noRows:'لا يوجد ما يطابق هذه التصفية.',openRow:'فتح',sortBy:'ترتيب حسب {x}',clearF:'مسح التصفية',
  anyPri:'أي أولوية',ownerF:'المسؤول',priF:'الأولوية',searchingFor:'بحث: {x}',clearSearch:'مسح البحث',cardsN:'{n} بطاقات',addTo:'إضافة بطاقة إلى {x}',moreN:'+{n} أخرى',dayTitle:'المهام المستحقة {d}',noTasksDay:'لا توجد مهام مستحقة في هذا اليوم.',newOnDay:'مهمة جديدة في هذا اليوم',openDay:'فتح {d}',
  tlNow:'اليوم',tlTasks:'المهمة',tlProjects:'المشروع',g_ess:'الأساسيات',g_sched:'المواعيد',g_det:'التفاصيل',optional:'اختياري',reqd:'مطلوب',e_title:'اكتب ما المطلوب إنجازه.',e_owner:'اختر من سينفّذها.',e_due:'اختر تاريخ الاستحقاق.',ownerNote:'أول شخص تختاره هو المسؤول.',
  attHintLive:'صور أو PDF أو ملفات Office حتى 5 ميغابايت لكل ملف. تُحفظ في مجلد خاص على Google Drive، ولا يفتحها إلا من يرى هذه المهمة.'}};
export let lang: any=(()=>{try{return localStorage.getItem('fb-lang')==='ar'?'ar':'en'}catch(e){return 'en'}})();
export const t=(k,v)=>{let s=(T[lang][k]??T.en[k]??k);if(v)Object.keys(v).forEach(x=>{s=s.split('{'+x+'}').join(v[x])});return s};
export const DEPTS0=[{id:'adm',en:'Executive & Administration',ar:'الإدارة التنفيذية',tint:'#ece6dc',dot:'#7a6a55'},{id:'ops',en:'Operations',ar:'العمليات',tint:'#e3e8dc',dot:'#6f8a5a'},{id:'mkt',en:'Marketing',ar:'التسويق',tint:'#e2e7ec',dot:'#5b7896'},
  {id:'proc',en:'Procurement',ar:'المشتريات',tint:'#ebe1d1',dot:'#9a6b3f'},{id:'fin',en:'Finance',ar:'المالية',tint:'#e7e4ee',dot:'#6d5f8f'},
  {id:'hr',en:'HR',ar:'الموارد البشرية',tint:'#efe3df',dot:'#a8655a'},{id:'mnt',en:'Maintenance',ar:'الصيانة',tint:'#dfe7e5',dot:'#4f7f78'},
  {id:'dev',en:'Development',ar:'التطوير',tint:'#e4e5ec',dot:'#5c6680'},{id:'oman',en:'Oman',ar:'عُمان',tint:'#eee6d5',dot:'#a88a4a'}];
export let DEPTS: any[]=DEPTS0.slice();
export const SPCOL=[['#e9e3f0','#7a5aa6'],['#e1ecea','#2f8a85'],['#f1e4dc','#b05a3a'],['#e6e9df','#6b7d3a'],['#e3e6ee','#3e6aa1'],['#efe6d6','#a8732c'],['#ece2e8','#9a4f78'],['#e4e4e4','#5f5f5f']];
export function rebuildDepts(){DEPTS=DEPTS0.concat(((typeof D!=='undefined'&&D&&D.spaces)||[]).filter(x=>!x.off).map(x=>({id:x.id,en:x.en,ar:x.ar||x.en,tint:x.tint,dot:x.dot,space:true,by:x.by})))}
export const pD=p=>(p&&p.depts)||{};
export const inD=(p,d)=>!!pD(p)[d];
export const isHd=(p,d)=>pD(p)[d]==='head';
export const headAny=p=>Object.values(pD(p)).includes('head');
export const dlist=p=>Object.keys(pD(p)).filter(d=>DEPTS.some(x=>x.id===d));
export const dnames=p=>dlist(p).map(d=>deptName(d)).join(', ');
export function normP(p){if(!p.depts){p.depts={};if(p.dept)p.depts[p.dept]=p.role||'staff'}delete p.dept;delete p.role;return p}
export const deptName=id=>{if(id==='ceo')return t('ceoRole');const d=DEPTS.find(x=>x.id===id);return d?d[lang]:id};
export const dept=id=>DEPTS.find(x=>x.id===id)||DEPTS[0];
export const PEOPLE0=[
  {id:'ka',en:'Khaled Alamer',ar:'خالد العامر',ini:'KA',color:'#c27a2c',ceo:true},
  {id:'ea',en:'Executive Administrator',ar:'المسؤولة الإدارية التنفيذية',ini:'EA',dept:'adm',role:'head',color:'#7a6a55'},
  {id:'oh',en:'Operations Head',ar:'مسؤول العمليات',ini:'OH',dept:'ops',role:'head',color:'#6f8a5a'},{id:'os',en:'Operations Supervisor',ar:'مشرف العمليات',ini:'OS',depts:{ops:'staff',adm:'staff'},color:'#869b74'},
  {id:'mh',en:'Marketing Head',ar:'مسؤول التسويق',ini:'MH',dept:'mkt',role:'head',color:'#5b7896'},{id:'md',en:'Designer',ar:'المصمم',ini:'DS',dept:'mkt',role:'staff',color:'#7891ab'},
  {id:'ph',en:'Procurement Head',ar:'مسؤول المشتريات',ini:'PH',dept:'proc',role:'head',color:'#9a6b3f'},{id:'pb',en:'Buyer',ar:'المشتري',ini:'BY',dept:'proc',role:'staff',color:'#b0855a'},
  {id:'fh',en:'Finance Head',ar:'مسؤول المالية',ini:'FH',dept:'fin',role:'head',color:'#6d5f8f'},{id:'fa',en:'Accountant',ar:'المحاسب',ini:'AC',dept:'fin',role:'staff',color:'#8678a6'},
  {id:'hh',en:'HR Head',ar:'مسؤول الموارد البشرية',ini:'HR',dept:'hr',role:'head',color:'#a8655a'},
  {id:'nh',en:'Maintenance Head',ar:'مسؤول الصيانة',ini:'MN',dept:'mnt',role:'head',color:'#4f7f78'},{id:'nt',en:'Technician',ar:'الفني',ini:'TC',dept:'mnt',role:'staff',color:'#6a9a93'},
  {id:'dh',en:'Development Head',ar:'مسؤول التطوير',ini:'DH',dept:'dev',role:'head',color:'#5c6680'},
  {id:'om',en:'Oman Manager',ar:'مدير عُمان',ini:'OM',dept:'oman',role:'head',color:'#a88a4a'},
  {id:'u1',en:'Cashier',ar:'الكاشير',ini:'CA',dept:null,role:'staff',color:'#8a8178'},{id:'u2',en:'Driver',ar:'السائق',ini:'DR',dept:null,role:'staff',color:'#7d8a8a'}];
export let PEOPLE: any[]=PEOPLE0.map(p=>Object.assign({},p));
export const person=id=>PEOPLE.find(p=>p.id===id)||{id,en:id,ar:id,ini:'?',color:'#777'};
export const pname=id=>{const p=person(id);return p[lang]||p.en};
export const headOfDept=d=>PEOPLE.find(p=>isHd(p,d));
export const LABELS=[{id:'fin',color:'#4f8a3c'},{id:'proc',color:'#9a6b3f'},{id:'mnt',color:'#3e6aa1'},{id:'hr',color:'#7a5aa6'},{id:'urg',color:'#b8432f'},{id:'mkt',color:'#2f8a85'}];
export const labelsOf=b=>(b&&b.labels)||LABELS;
export const label=(id,b)=>labelsOf(b||B()).find(l=>l.id===id)||LABELS.find(l=>l.id===id);
export const lname=l=>l?(l.name||T[lang]['lb_'+l.id]||T.en['lb_'+l.id]||''):'';
export const PALETTE=['#4f8a3c','#9a6b3f','#3e6aa1','#7a5aa6','#b8432f','#2f8a85','#a8732c','#5c6680','#b05a7a','#6b655c'];
export const day=864e5,today=()=>{const d=new Date();d.setHours(0,0,0,0);return d.getTime()};
export const DONE_RX=/^(done|completed?|finished|مكتمل|منجز|تم)/i;
export const SYS={todo:['To do','للعمل'],doing:['In progress','قيد التنفيذ'],done:['Done','منجز'],week:['This week','هذا الأسبوع'],now:['Doing','نعمل عليه'],wait:['Waiting on others','بانتظار الآخرين'],
  waiting:['Waiting','بالانتظار'],newreq:['New requests','طلبات جديدة'],acc:['Accepted','مقبولة'],reported:['Reported','تم الإبلاغ'],sched:['Scheduled','مجدولة'],inprog:['In progress','قيد التنفيذ'],fixed:['Fixed','تم الإصلاح']};
export const sysKey=name=>Object.keys(SYS).find(k=>SYS[k][0]===name);
export const LN=l=>!l?'':l.sys&&SYS[l.sys]?SYS[l.sys][lang==='ar'?1:0]:l.name;
export function seed(){
  const D={boards:{},lists:{},cards:{},order:[],me:'ka',dark:{},people:PEOPLE0.map(p=>Object.assign({},p))};
  const mk=(dep,name,members,status,lists)=>{const b={id:uid('b'),dept:dep,name,members,status,lists:[]};D.boards[b.id]=b;D.order.push(b.id);
    lists.forEach(([ln,cards])=>{const l={id:uid('l'),name:ln,sys:sysKey(ln),cards:[],col:false};D.lists[l.id]=l;b.lists.push(l.id);
      cards.forEach(c=>{const o=Object.assign({id:uid('c'),title:'',desc:'',labels:[],members:[],due:null,done:false,doneAt:null,repeat:'',check:[],log:[]},typeof c==='string'?{title:c}:c);
        if(typeof o.due==='number'&&Math.abs(o.due)<400)o.due=today()+o.due*day;
        if(typeof o.start==='number'&&Math.abs(o.start)<400)o.start=today()+o.start*day;
        (o.subs||[]).forEach(s=>{s.id=s.id||uid('s');if(typeof s.due==='number'&&Math.abs(s.due)<400)s.due=today()+s.due*day});
        if(!o.owner&&o.members.length)o.owner=o.members[0];
        if(DONE_RX.test(ln)&&!o.done){o.done=true}if(o.done&&!o.doneAt)o.doneAt=Date.now()-(2+(Object.keys(D.cards).length*7)%40)*day;
        o.log=o.log.length?o.log:[{at:Date.now()-3*day,by:members[0]||'ka',k:'l_added',a:ln}];D.cards[o.id]=o;l.cards.push(o.id)})});return b};
  const st=(s,note,by,daysAgo)=>({s,note,by,at:Date.now()-(daysAgo||1)*day});
  mk('adm','Executive Admin Task Board',['ka','ea','os'],st('on','Weekly meetings with each department are now booked.','ea',2),[
    ['To do',[{title:'Research Ways to Improve Administrative Operations',labels:['urg'],members:['os'],due:5},{title:'Identify Administrative Support Needs in Marketing Department',labels:['mkt'],members:['ea']}]],
    ['In-progress',[{title:'Coordinate with Mr. Adam to set a Weekly Meeting with Maintenance',labels:['mnt'],members:['ka'],due:2},
      {title:'Schedule 1-hour Google Meet with Bilal (Pixel Accounting) to review October 2026 financial reports',labels:['fin'],members:['ka','ea'],due:1,desc:'Send the October reports before the call.',
        check:[{t:'Send the meeting invite',d:true},{t:'Share October P&L',d:false},{t:'Agree next steps',d:false}],log:[{at:Date.now()-2*3600e3,by:'ea',c:'Reports are ready in the shared folder.'},{at:Date.now()-2*day,by:'ka',k:'l_added',a:'In-progress'}]},
      {title:'Confirm Weekly Finance and Bookkeeping Meetings with Ahmed',labels:['fin'],members:['os'],due:-1},
      {title:'Consolidated Processes and Reports every Department',desc:'One process document and one monthly report per department.',members:['ea'],due:9}]],
    ['Completed',[{title:'Update Monthly November Training Schedules',labels:['hr'],members:['os']},{title:'Schedule Weekly Procurement Meetings',labels:['proc'],members:['ea']}]],
    ['Daily',[{title:'Daily Inbox Sweep',repeat:'daily',members:['os']},{title:'Daily Log - Operations',repeat:'daily',members:['os']}]],
    ['Weekly',[{title:'Weekly Forka Admins Meetings',repeat:'weekly',members:['ka']},{title:'Weekly Maintenance Meetings with Omar',repeat:'weekly',labels:['mnt'],members:['ea']}]],
    ['Monthly',[{title:'Monthly Forka Admin Meeting',repeat:'monthly',members:['ka']}]]]);
  const aj=mk('ops','Ajman Branch Opening',['oh','os','nt'],st('risk','Kitchen hood delivery slipped one week.','oh',1),[
    ['To do',[{title:'Staff rota for opening week',members:['os'],due:6,f:{area:'foh'}},{title:'Hood installation sign-off',labels:['mnt','urg'],members:['nt'],due:-2,f:{area:'kit',cost:'4500'}},
      {title:'Soft opening day',type:'milestone',members:['oh'],due:12},{title:'Approve the opening budget',type:'approval',members:['ka'],follow:['oh'],due:2,desc:'AED 85,000 for stock, uniforms and the first month of marketing.',f:{cost:'85000'}}]],
    ['In progress',[{title:'POS and printers set up',members:['os'],start:-2,due:3,f:{area:'foh'}},{title:'Opening stock order',labels:['proc'],members:['oh'],start:0,due:4,f:{area:'store'},
      subs:[{t:'Dry store order',who:'os',due:2,done:true},{t:'Chiller and freezer order',who:'oh',due:3},{t:'Cleaning supplies',who:'os',due:4}]}]],
    ['Done',[{title:'Trade licence renewed',members:['oh']},{title:'Signage approved',members:['oh']}]]]);
  aj.fields=[{id:'area',name:'Area',type:'select',opts:[{id:'kit',name:'Kitchen',color:'#b8432f'},{id:'foh',name:'Front of house',color:'#3e6aa1'},{id:'store',name:'Store',color:'#9a6b3f'}]},{id:'cost',name:'Cost (AED)',type:'number'}];
  {const byT=x=>aj.lists.flatMap(l=>D.lists[l].cards).map(id=>D.cards[id]).find(c=>c.title===x),so=byT('Soft opening day');so.waits=[byT('Hood installation sign-off').id,byT('POS and printers set up').id]}
  mk('mkt','December Campaign',['mh','md'],st('on','Visuals approved; posting starts 1 Dec.','mh',1),[
    ['To do',[{title:'Influencer shortlist',members:['mh'],due:5},{title:'Menu photos - new dishes',members:['md'],due:8}]],
    ['In progress',[{title:'Instagram posts - week 1',labels:['mkt'],members:['md'],due:2,check:[{t:'Post 1',d:true},{t:'Post 2',d:true},{t:'Post 3',d:false}]}]],
    ['Done',[{title:'Campaign brief approved',members:['mh']},{title:'Budget agreed',members:['mh']},{title:'Hashtag and tone guide',members:['md']}]]]);
  mk('proc','November Purchasing',['ph','pb'],st('on','All November LPOs issued.','ph',3),[
    ['To do',[{title:'Compare 3 chicken suppliers for December',labels:['proc'],members:['pb'],due:4}]],
    ['In progress',[{title:'Oman store first order',labels:['proc'],members:['ph'],due:1}]],
    ['Done',[{title:'November LPOs issued',members:['pb']},{title:'Supplier payment terms list',members:['ph']}]]]);
  mk('fin','October Month-end Close',['fh','fa'],st('off','Bank reconciliation for two accounts is late.','fh',1),[
    ['To do',[{title:'Accruals review',labels:['fin'],members:['fh'],due:-3},{title:'Fixed asset register update',labels:['fin'],members:['fa'],due:-1}]],
    ['In progress',[{title:'Bank reconciliation - 2 accounts',labels:['fin','urg'],members:['fa'],due:-4},{title:'VAT return draft',labels:['fin'],members:['fh'],due:6}]],
    ['Done',[{title:'Payroll posted',members:['fa']}]]]);
  mk('hr','Hiring - Line Cooks',['hh'],st('on','12 applicants screened, 4 interviews booked.','hh',2),[
    ['To do',[{title:'Reference checks for 2 finalists',labels:['hr'],members:['hh'],due:3}]],
    ['In progress',[{title:'Interviews this week',labels:['hr'],members:['hh'],due:2}]],
    ['Done',[{title:'Job ad posted',members:['hh']},{title:'Scorecard approved',members:['hh']}]]]);
  mk('mnt','Sharjah Maintenance',['nh','nt'],st('risk','Cold room repair waiting for a spare part.','nh',1),[
    ['To do',[{title:'Monthly fire extinguisher check',labels:['mnt'],members:['nt'],due:2}]],
    ['In progress',[{title:'Cold room compressor repair',labels:['mnt','urg'],members:['nt'],due:-1},{title:'AC service - dining area',labels:['mnt'],members:['nh'],due:5}]],
    ['Done',[{title:'Fryer thermostat replaced',members:['nt']}]]]);
  mk('dev','Forka Apps Roadmap',['dh','ka'],st('on','Hiring ready for big job ads; Boards in preview.','dh',1),[
    ['To do',[{title:'Boards: connect to Forka Apps sign-in',members:['dh'],due:7},{title:'Import Asana projects',members:['dh'],due:10}]],
    ['In progress',[{title:'Boards: departments and CEO progress',members:['dh','ka'],due:2}]],
    ['Done',[{title:'Hiring ready for a big job ad',members:['dh']},{title:'Procurement opens at once',members:['dh']}]]]);
  const rq=(dep,from,by,title,due,members,list)=>{const b=reqBoard(dep,true,D),l=D.lists[b.lists[list||0]];const c={id:uid('c'),title,desc:'',labels:[],members:members||[],due:today()+due*day,done:false,doneAt:null,repeat:'',priority:'normal',check:[],requester:by,fromDept:from,
      log:[{at:Date.now()-day,by,k:'l_req',a:deptName(from)}]};D.cards[c.id]=c;l.cards.push(c.id)};
  rq('mnt','mkt','md','Fix the lightbox sign at the Sharjah branch',3);
  rq('fin','ops','oh','Approve petty cash top-up for Ajman opening',2,['fh'],1);
  const omB=mk('oman','Oman Store Setup',['om'],null,[
    ['To do',[{title:'Add Oman suppliers to Procurement',labels:['proc'],members:['om'],due:3},{title:'First stock count',members:['om'],due:8}]],
    ['In progress',[]],['Done',[{title:'Oman section opened in Procurement',members:['om']}]]]);
  /* finished work from the last weeks, so Reporting and Performance have something to show */
  const bn=n=>Object.values(D.boards).find(b=>b.name===n);
  const H={'December Campaign':[['Mood board for the campaign','md'],['Shot list for the photographer','md'],['Influencer brief','mh'],['November menu posts','md'],['Reply to Google reviews','mh'],['Story highlights refresh','md']],
    'November Purchasing':[['Weekly vegetable order - week 1','pb'],['Weekly vegetable order - week 2','pb'],['Packaging supplier quotes','ph'],['Price check: dairy','pb'],['Monthly stock count review','ph'],['Close October LPOs','pb']],
    'October Month-end Close':[['Sales reconciliation - all branches','fa'],['Supplier statements matched','fa'],['Petty cash count','fa'],['Management accounts draft','fh'],['Payroll accruals','fh']],
    'Hiring - Line Cooks':[['Interview panel booked','hh'],['Shortlist from the careers page','hh'],['Trade test menu agreed','hh'],['Offer letters sent - October','hh']],
    'Sharjah Maintenance':[['Grease trap cleaning','nt'],['Walk-in freezer door seal','nt'],['Dining AC filters','nt'],['Monthly generator test','nh'],['Hood cleaning','nt']],
    'Forka Apps Roadmap':[['Hiring: AI CV summary','dh'],['Guide for the team (PDF)','dh'],['Procurement: roles instead of names','dh']],
    'Oman Store Setup':[['Oman supplier list','om'],['Oman price list in OMR','om']]};
  Object.keys(H).forEach((name,j)=>{const b=bn(name),l=D.lists[b.lists.filter(id=>DONE_RX.test(D.lists[id].name)).pop()];
    H[name].forEach(([title,who],i)=>{const due=-(4+((i*9+j*5)%50)),late=[-2,-1,0,0,1,3][(i+j)%6];
      const c={id:uid('c'),title,desc:'',labels:[],members:[who],owner:who,due:today()+due*day,done:true,doneAt:today()+(due+late)*day+15*3600e3,repeat:'',check:[],log:[{at:today()+(due-6)*day,by:who,k:'l_added',a:l.name}]};
      D.cards[c.id]=c;l.cards.push(c.id)})});
  const sAt=(s,note,by,d)=>({s,note,by,at:Date.now()-(d||1)*day});
  D.goals=[{id:'g1',title:'Open the Ajman branch on time',lvl:'company',owner:'ka',due:today()+30*day,boards:[aj.id],status:sAt('risk','Hood delivery slipped one week; opening date still holds.','oh',1)},
    {id:'g2',title:'Launch Forka Boards for every department',lvl:'company',owner:'ka',due:today()+45*day,boards:[bn('Forka Apps Roadmap').id],status:sAt('on','Preview with Ruby this week.','dh',2)},
    {id:'g3',title:'Close every month within 5 working days',lvl:'fin',owner:'fh',due:today()+50*day,boards:[bn('October Month-end Close').id],status:sAt('off','October is late: two bank accounts not reconciled.','fh',1)},
    {id:'g4',title:'Keep Sharjah equipment downtime under one day',lvl:'mnt',owner:'nh',due:today()+60*day,boards:[bn('Sharjah Maintenance').id],status:sAt('risk','Cold room waiting for a spare part.','nh',1)},
    {id:'g5',title:'Grow December sales with the campaign',lvl:'mkt',owner:'mh',due:today()+40*day,boards:[bn('December Campaign').id],status:sAt('on','Visuals approved.','mh',1)},
    {id:'g6',title:'Hire 6 line cooks before Ramadan',lvl:'hr',owner:'hh',due:today()+70*day,boards:[],pct:40,status:sAt('on','Four interviews booked.','hh',2)}];
  const m=(k,by,ago,tx)=>{D.msgs=D.msgs||{};(D.msgs[k]=D.msgs[k]||[]).push({id:uid('m'),by,at:Date.now()-ago*60e3,t:tx})};
  m('all','ka',1500,'Good morning team. From today we follow our work in Forka Boards. Ask your head if you cannot see your board.');
  m('all','hh',1440,'Reminder: the November training schedule is on the HR board.');
  m('adm','ea',300,'Weekly meetings with every department are booked. Invites are in your calendars.');
  m('adm','ka',240,'Thank you. Please add the minutes to each card after the meeting.');
  m('mkt','mh',180,'Visuals for the December campaign are approved. @Designer please start the week 1 posts.');
  m('ops','oh',120,'Ajman: hood delivery slipped one week. Soft opening date stays the same for now.');
  D.prof={ea:{about:'Executive Administrator. I book meetings, follow up on tasks and keep the boards up to date.'},oh:{about:'Operations Head for the UAE branches.'},
    nt:{about:'Maintenance technician for Sharjah and Ajman.',ooo:{from:new Date(today()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10),to:new Date(today()+2*day-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10),note:'On site in Fujairah. Call the Maintenance Head for urgent jobs.'}}};
  D.ports=[{id:'pf1',name:'CEO Admins',owner:'ka',items:[{b:aj.id,pri:'high'},{b:bn('October Month-end Close').id,pri:'urgent'},{b:bn('Forka Apps Roadmap').id,pri:'normal'}]}];
  return D;
}
export const KEY='forka-boards-preview-v5';
export let fkI=0;
export const CFG: any=window.FORKA_APPS||{};
export const LIVE=!!CFG.BOARDS_URL&&!/^(127\.0\.0\.1|localhost)$/.test(location.hostname)&&!/[?&]demo\b/.test(location.search);
export let D: any=(()=>{if(LIVE)return {boards:{},lists:{},cards:{},order:[],me:'',people:[]};try{const d=JSON.parse(localStorage.getItem(KEY)||'null');if(d&&d.boards&&d.me)return d}catch(e){}return seed()})();
if(!D.people)D.people=PEOPLE0.map(p=>Object.assign({},p));
PEOPLE=D.people;
PEOPLE.forEach(normP);
rebuildDepts();
export function save(){if(LIVE){syncQueue();return}try{localStorage.setItem(KEY,JSON.stringify(D))}catch(e){}}
export const ME=()=>D.me, meP=()=>person(D.me), isCEO=()=>!!meP().ceo;
export const headOf=dep=>isCEO()||isHd(meP(),dep);
export const canSee=b=>!!b&&(isCEO()||headOf(b.dept)||b.members.includes(ME())||(b.allDept&&inD(meP(),b.dept)));
export const boardPeople=b=>[...new Set((b.allDept?PEOPLE.filter(p=>inD(p,b.dept)&&!p.ceo).map(p=>p.id):[]).concat(b.members))];
export const canAdmin=b=>!!b&&headOf(b.dept);
export const boards=()=>D.order.map(id=>D.boards[id]).filter(canSee);
export const depts=()=>DEPTS.filter(d=>isCEO()||inD(meP(),d.id)||boards().some(b=>b.dept===d.id));
export const theme=()=>D.dark&&D.dark[ME()]?'dark':'light';
export const V: any={view:null,dept:null,board:null,comp:null,addList:false,editList:null,editBoard:false,pop:null,card:null,filter:false,side:false,f:{q:'',members:[],labels:[],due:'',fields:[]}};
export let ASK: any=null;
export function ask(msg,go){ASK={msg,go};V.pop=null;render();setTimeout(()=>{const b=document.querySelector('[data-a=ask-no]');b&&b.focus()},0)}
export function home(){V.view=isCEO()?'progress':'mine';V.board=null;V.dept=null}
home();
export const B=()=>D.boards[V.board];
export const myDept=()=>meP().ceo?'ceo':(V.nt&&V.nt.from&&inD(meP(),V.nt.from)?V.nt.from:dlist(meP())[0]||null);
export function reqBoard(dep,create,X){X=X||D;let b=Object.values(X.boards).find(x=>x.dept===dep&&x.kind==='requests');
  if(!b&&create){b={id:uid('b'),dept:dep,name:'',kind:'requests',members:[],status:null,lists:[]};['newreq','acc','done'].forEach(k=>{const l={id:uid('l'),name:SYS[k][0],sys:k,cards:[],col:false};X.lists[l.id]=l;b.lists.push(l.id)});X.boards[b.id]=b;X.order.unshift(b.id)}
  return b}
export const bname=b=>b.kind==='requests'?t('reqBoard',{d:deptName(b.dept)}):b.name;
export const allCards=()=>Object.values(D.boards).flatMap(b=>cardsOf(b).map(c=>({c,b})));
export const fmtDay=ts=>new Date(ts).toLocaleDateString(lang==='ar'?'ar-AE':'en-GB',{day:'numeric',month:'short'});
export function dueCls(c){if(!c.due)return '';if(c.done)return 'ok';const d=c.due-today();return d<0?'over':d<=day?'soon':''}
export function ago(ts){const m=Math.round((Date.now()-ts)/6e4);if(m<1)return t('now');if(m<60)return t('mAgo',{n:m});const h=Math.round(m/60);if(h<24)return t('hAgo',{n:h});return fmtDay(ts)}
export const listOf=cid=>Object.values(D.lists).find(l=>l.cards.includes(cid));
export const boardOfList=lid=>Object.values(D.boards).find(b=>b.lists.includes(lid));
export const liveLists=b=>b.lists.filter(id=>D.lists[id]&&!D.lists[id].archived);
export const cardsOf=b=>liveLists(b).flatMap(l=>D.lists[l].cards.map(id=>D.cards[id])).filter(c=>c&&!c.archived);
export function stats(cards,rd){rd=rd||7;const t0=today(),wk=t0+rd*day,a7=Date.now()-rd*day;const s={open:0,over:0,week:0,doneW:0,done:0,total:cards.length};
  cards.forEach(c=>{if(c.done){s.done++;if((c.doneAt||0)>=a7)s.doneW++}else{s.open++;if(c.due&&c.due<t0)s.over++;else if(c.due&&c.due<wk)s.week++}});
  s.pct=s.total?Math.round(s.done/s.total*100):0;return s}
export function match(c){const f=V.f;
  if(f.q&&!(c.title+' '+c.desc).toLowerCase().includes(f.q.toLowerCase()))return false;
  if(f.members.length&&!f.members.some(m=>c.members.includes(m)))return false;
  if(f.labels.length&&!f.labels.some(l=>c.labels.includes(l)))return false;
  if(f.owner&&own(c)!==f.owner)return false;
  if(f.pri&&(c.priority||'normal')!==f.pri)return false;
  if(f.due==='week'&&!(c.due&&!c.done&&c.due>=today()&&c.due<today()+7*day))return false;
  if(f.due==='over'&&!(c.due&&!c.done&&c.due<today()))return false;
  if((f.fields||[]).length&&!f.fields.some(k=>{const [fid,oid]=k.split(':');return (c.f||{})[fid]===oid}))return false;
  return true}
export const filtering=()=>{const f=V.f;return !!(f.q||f.owner||f.pri||f.members.length||f.labels.length||f.due||(f.fields||[]).length)};
export const own=c=>c.owner&&c.members.includes(c.owner)?c.owner:c.members[0];
export const fmtRange=c=>c.start&&c.due&&c.start<c.due?fmtDay(c.start)+' – '+fmtDay(c.due):c.due?fmtDay(c.due):'';
export const openWaits=c=>(c.waits||[]).map(id=>D.cards[id]).filter(x=>x&&!x.done&&!x.archived);
export const blockingOf=c=>Object.values(D.cards).filter(x=>!x.archived&&(x.waits||[]).includes(c.id));
export function waitsOn(a,b,seen){seen=seen||{};if(!a||seen[a.id])return false;seen[a.id]=1;return (a.waits||[]).some(id=>id===b.id||waitsOn(D.cards[id],b,seen))}
export function canFinish(c){const w=openWaits(c);if(w.length){flash(t('waitFirst',{x:w[0].title}));return false}return true}
export function afterDone(c,quiet){if(!quiet){if(c.requester)notify(c.requester,'done',c.id);
  (c.follow||[]).filter(f=>f!==c.requester&&!c.members.includes(f)).forEach(f=>notify(f,'fdone',c.id))}
  blockingOf(c).forEach(w=>{if(!openWaits(w).length)w.members.forEach(m=>notify(m,'unblocked',w.id,{x:c.title}))})}
export const apS=c=>(c.appr&&c.appr.s)||'pending';
export const canDecide=c=>isCEO()||c.members.includes(ME());
export const numFmt=v=>isNaN(+v)?v:Number(v).toLocaleString('en-GB');
export function bMini(on){const b=document.body;on=on===undefined?!b.classList.contains('bside-mini'):on;b.classList.toggle('bside-mini',on);try{localStorage.setItem('fb-side',on?'mini':'full')}catch(_){}}
try{if(localStorage.getItem('fb-side')==='mini')document.addEventListener('DOMContentLoaded',()=>document.body.classList.add('bside-mini'))}catch(_){}
export const PRANGES=[7,30,90];
export function pgState(){if(!V.pg){let o={};try{o=JSON.parse(localStorage.getItem('fb-pg:'+ME())||'{}')||{}}catch(e){}V.pg={range:PRANGES.includes(+o.range)?+o.range:7,scope:o.scope==='mine'?'mine':'all',dept:o.dept||'',k:''}}return V.pg}
export function pgSave(){const P=V.pg;if(!P)return;try{localStorage.setItem('fb-pg:'+ME(),JSON.stringify({range:P.range,scope:P.scope,dept:P.dept}))}catch(e){}}
export const SECS0=['recent','today','next','later'];
export function myState(){D.my=D.my||{};return D.my[ME()]=D.my[ME()]||{secs:SECS0.map(k=>({id:k,sys:k})),at:{}}}
export const secName=s=>s.name||t('sec_'+s.sys);
export function myItems(){const me=ME(),out=[];allCards().forEach(({c,b})=>{if(c.done)return;if(c.members.includes(me))out.push({k:c.id,c,b,title:c.title,due:c.due});
  (c.subs||[]).forEach(s=>{if(!s.done&&s.who===me)out.push({k:c.id+'~'+s.id,c,b,s,title:s.t,due:s.due})})});return out.sort((x,y)=>(x.due||9e15)-(y.due||9e15))}
export const itCls=x=>!x.due?'':x.due<today()?'over':x.due<today()+day?'soon':'';
export const itDate=x=>x.s?fmtDay(x.due):fmtRange(x.c);
export function lastMod(b){let m=(b.status&&b.status.at)||0;b.lists.forEach(l=>{const L=D.lists[l];if(L)L.cards.forEach(id=>{const c=D.cards[id];if(c)c.log.forEach(x=>{if(x.at>m)m=x.at})})});return m}
export const bOwner=b=>b.owner||(headOfDept(b.dept)||{}).id;
export const PSORT={mod:'desc',name:'asc',status:'asc',owner:'asc',prog:'desc',over:'desc'};
export function pfState(){if(!V.pf){let o={};try{o=JSON.parse(localStorage.getItem('fb-pf:'+ME())||'{}')||{}}catch(e){}
  V.pf=Object.assign({q:'',dept:'',owner:'',member:'',status:'',sort:'mod',dir:''},o);if(!PSORT[V.pf.sort])V.pf.sort='mod';if(!['asc','desc'].includes(V.pf.dir))V.pf.dir=PSORT[V.pf.sort]}return V.pf}
export function pfSave(){if(V.pf)try{localStorage.setItem('fb-pf:'+ME(),JSON.stringify(V.pf))}catch(e){}}
export const lead=()=>isCEO()||headAny(meP());
export const scopeD=()=>isCEO()?DEPTS.map(d=>d.id):dlist(meP()).filter(d=>isHd(meP(),d));
export const scopeBoards=()=>boards().filter(b=>scopeD().includes(b.dept));
export const scopePeople=()=>PEOPLE.filter(p=>!p.ceo&&!p.invited&&dlist(p).some(d=>scopeD().includes(d)));
export const pct=(a,b)=>b?Math.round(a/b*100):0;
export const mondayOf=ts=>{const d=new Date(ts);d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d.getTime()};
export const goalsSeen=()=>(D.goals||[]).filter(g=>isCEO()||g.lvl==='company'||inD(meP(),g.lvl));
export const canGoal=g=>isCEO()||(g.lvl!=='company'&&headOf(g.lvl));
export function goalPct(g){const bs=(g.boards||[]).map(id=>D.boards[id]).filter(Boolean);if(!bs.length)return Math.max(0,Math.min(100,+g.pct||0));return stats(bs.flatMap(cardsOf)).pct}
export function gfSync(){const f=V.gf,g=id=>document.getElementById(id);if(!f||!g('gf-title'))return;f.title=g('gf-title').value;f.lvl=g('gf-lvl').value;f.owner=g('gf-owner').value;f.due=g('gf-due').value;f.s=g('gf-s').value;f.note=g('gf-note').value;if(g('gf-pct'))f.pct=g('gf-pct').value}
export function gfOpen(id){const g=id&&(D.goals||[]).find(x=>x.id===id);
  V.gf=g?{id:g.id,title:g.title,lvl:g.lvl,owner:g.owner||'',due:g.due?ymd(g.due):'',boards:(g.boards||[]).slice(),pct:g.pct||'',s:(g.status&&g.status.s)||'on',note:(g.status&&g.status.note)||'',bad:[]}
    :{id:null,title:'',lvl:isCEO()?'company':scopeD()[0],owner:ME(),due:'',boards:[],pct:'',s:'on',note:'',bad:[]};render();focusSel('#gf-title')}
export function gfSave(){gfSync();const f=V.gf,bad=[];if(!f.title.trim())bad.push('title');if(!f.owner)bad.push('owner');if(!f.due)bad.push('due');f.bad=bad;if(bad.length){render();return}
  D.goals=D.goals||[];let g=D.goals.find(x=>x.id===f.id);if(!g){g={id:uid('g')};D.goals.push(g)}
  const old=g.status||{};Object.assign(g,{title:f.title.trim(),lvl:f.lvl,owner:f.owner,due:new Date(f.due+'T00:00:00').getTime(),boards:f.boards.slice(),pct:+f.pct||0,
    status:{s:f.s,note:f.note.trim(),by:(old.s===f.s&&old.note===f.note.trim())?old.by||ME():ME(),at:(old.s===f.s&&old.note===f.note.trim())?old.at||Date.now():Date.now()}});
  V.gf=null;save();render()}
export const portsSeen=()=>(D.ports||[]).filter(x=>isCEO()||x.owner===ME());
export const bDue=b=>b.due||Math.max(0,...cardsOf(b).map(c=>c.due||0))||null;
export const bStart=b=>{const v=cardsOf(b).map(c=>c.start||c.due).filter(Boolean);return v.length?Math.min(...v):null};
export function exportCsv(){const q=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"',d=ts=>ts?ymd(ts):'';
  const rows=[['Board','Department','List','Task','Type','Owner','People','Start','Due','Done','Done date','Priority','Overdue']];
  scopeBoards().forEach(b=>cardsOf(b).forEach(c=>rows.push([bname(b),deptName(b.dept),LN(listOf(c.id)),c.title,t('ty_'+(c.type||'task')),own(c)?pname(own(c)):'',c.members.map(pname).join('; '),d(c.start),d(c.due),c.done?'Yes':'No',d(c.doneAt),t('p_'+(c.priority||'normal')),!c.done&&c.due&&c.due<today()?'Yes':''])));
  const blob=new Blob(['﻿'+rows.map(r=>r.map(q).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='forka-boards-'+ymd(Date.now())+'.csv';document.body.appendChild(a);a.click();a.remove()}
export function wlItems(pid){const out=[];scopeBoards().forEach(b=>cardsOf(b).forEach(c=>{if(c.done)return;if(c.members.includes(pid))out.push({c,due:c.due,title:c.title});(c.subs||[]).forEach(s=>{if(!s.done&&s.who===pid)out.push({c,due:s.due,title:s.t})})}));return out}
export function perfOf(pid,from,to){const cs=Object.values(D.cards).filter(c=>!c.archived&&c.members.includes(pid)&&listOf(c.id));
  const done=cs.filter(c=>c.done&&c.doneAt>=from&&c.doneAt<to),wd=done.filter(c=>c.due),ot=wd.filter(c=>c.doneAt<c.due+day),late=wd.filter(c=>c.doneAt>=c.due+day);
  const avgLate=late.length?Math.round(late.reduce((a,c)=>a+Math.ceil((c.doneAt-c.due-day)/day),0)/late.length*10)/10:0;
  const subs=Object.values(D.cards).flatMap(c=>(c.subs||[]).filter(s=>s.who===pid&&s.done&&s.doneAt>=from&&s.doneAt<to)).length;
  return {done,n:done.length,wd:wd.length,ot:ot.length,late:late.length,rate:wd.length?pct(ot.length,wd.length):null,avgLate,over:cs.filter(c=>!c.done&&c.due&&c.due<today()).length,subs}}
export function perRange(){const k=V.pper||'30',now=Date.now();if(k==='month'){const d=new Date();const f=new Date(d.getFullYear(),d.getMonth(),1).getTime(),pf=new Date(d.getFullYear(),d.getMonth()-1,1).getTime();return [f,now,pf,f]}
  const n=+k*day;return [now-n,now,now-2*n,now-n]}
export const lblNames=()=>!(D.lblOff||{})[ME()];
export const prof=id=>(D.prof||{})[id]||{};
export const away=id=>{const o=prof(id).ooo;return o&&o.to&&o.from&&today()>=new Date(o.from+'T00:00:00').getTime()&&today()<=new Date(o.to+'T00:00:00').getTime()?o:null};
export const chMembers=k=>k==='all'?PEOPLE.filter(p=>!p.invited).map(p=>p.id):k.startsWith('dm:')?k.slice(3).split('|'):PEOPLE.filter(p=>inD(p,k)||p.ceo).map(p=>p.id);
export const canCh=k=>chMembers(k).includes(ME());
export const myChans=()=>['all'].concat(DEPTS.map(d=>d.id).filter(canCh));
export const dmKey=(a,b)=>'dm:'+[a,b].sort().join('|');
export const myDms=()=>Object.keys(D.msgs||{}).filter(k=>k.startsWith('dm:')&&canCh(k)&&(D.msgs[k]||[]).length).sort((a,b)=>lastAt(b)-lastAt(a));
export const lastAt=k=>{const m=(D.msgs||{})[k]||[];return m.length?m[m.length-1].at:0};
export const chName=k=>k==='all'?t('everyone'):k.startsWith('dm:')?pname(k.slice(3).split('|').find(x=>x!==ME())||ME()):deptName(k);
export const chUnread=k=>{const seen=((D.seen||{})[ME()]||{})[k]||0;return ((D.msgs||{})[k]||[]).filter(m=>m.by!==ME()&&m.at>seen).length};
export const chatUnread=()=>myChans().concat(myDms()).reduce((a,k)=>a+chUnread(k),0);
export function markSeen(k){D.seen=D.seen||{};D.seen[ME()]=D.seen[ME()]||{};D.seen[ME()][k]=Date.now()}
export function chSend(){const ta=document.getElementById('chin'),tx=ta&&ta.value.trim(),k=V.ch;if(!tx||!k)return;D.msgs=D.msgs||{};(D.msgs[k]=D.msgs[k]||[]).push({id:uid('m'),by:ME(),at:Date.now(),t:tx});
  if(D.msgs[k].length>400)D.msgs[k]=D.msgs[k].slice(-400);markSeen(k);
  if(k.startsWith('dm:'))chMembers(k).forEach(m=>notify(m,'dm',null,{ch:k}));else mentioned(tx).filter(m=>chMembers(k).includes(m)).forEach(m=>notify(m,'chat',null,{ch:k,x:'#'+chName(k)}));
  save();render();focusSel('#chin');scrollChat()}
export function scrollChat(){const el=document.getElementById('chs');if(el)el.scrollTop=el.scrollHeight}
export const SV: any={tok:'',snap:{},docs:{},pend:{},since:0,t:null,busy:false,ready:false,people:[],me:{email:''}};
export const DELETABLE=['board','list','card','goal','port','tpl','ctpl','space'];
export const iniOf=n=>String(n||'').split(/[\s@._-]+/).filter(Boolean).map(w=>w[0]).join('').slice(0,2).toUpperCase()||'?';
export const HCOL=['#6f8a5a','#5b7896','#9a6b3f','#6d5f8f','#a8655a','#4f7f78','#5c6680','#a88a4a','#7a6a55'];
export const hcol=s=>HCOL[[...String(s)].reduce((a,c)=>a+c.charCodeAt(0),0)%HCOL.length];
export function api(action,p){return fetch(CFG.BOARDS_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(Object.assign({action,token:SV.tok},p||{}))}).then(r=>r.json()).catch(()=>({ok:false,error:'net'}))}
export function toDocs(){const out={},put=(id,kind,json)=>{out[id]={kind,json}},cl={},me=ME();
  Object.values(D.lists).forEach(l=>l.cards.forEach(c=>{cl[c]=l.id}));
  D.order.forEach((id,i)=>{const b=D.boards[id];if(b)put(id,'board',Object.assign({},b,{id,ord:i}))});
  Object.keys(D.lists).forEach(id=>put(id,'list',Object.assign({},D.lists[id],{id})));
  Object.keys(D.cards).forEach(id=>put(id,'card',Object.assign({},D.cards[id],{id,l:cl[id]||D.cards[id].l||null})));
  (D.goals||[]).forEach(g=>put('goal:'+g.id,'goal',g));(D.ports||[]).forEach(p=>put('port:'+p.id,'port',p));
  Object.keys(D.msgs||{}).forEach(k=>D.msgs[k].forEach(m=>put('msg:'+m.id,'msg',Object.assign({k},m))));
  (D.notes||[]).forEach(n=>put('note:'+n.id,'note',n));
  if(me)put('user:'+me,'user',{my:(D.my||{})[me]||null,seen:(D.seen||{})[me]||null,dark:!!(D.dark||{})[me],lblOff:!!(D.lblOff||{})[me],emailOff:!!(D.emailOff||{})[me]});
  Object.keys(D.prof||{}).forEach(e=>put('prof:'+e,'prof',D.prof[e]));Object.keys(D.cap||{}).forEach(e=>put('cap:'+e,'cap',{n:D.cap[e]}));
  PEOPLE.forEach(p=>{if(p.ceo)return;const id='member:'+p.id,j={depts:Object.assign({},pD(p))};if(p.inv)j.inv=p.inv;if(SV.snap[id]||Object.keys(j.depts).length||j.inv)put(id,'member',j)});
  (D.spaces||[]).forEach(x=>put('space:'+x.id,'space',x));
  (D.tpls||[]).forEach(x=>put('tpl:'+x.id,'tpl',x));(D.cardTpl||[]).forEach(x=>put('ctpl:'+x.id,'ctpl',x));
  return out}
export function syncQueue(){if(!SV.ready)return;const cur=toDocs();
  Object.keys(cur).forEach(id=>{const s=JSON.stringify(cur[id].json);if(SV.snap[id]!==s){SV.pend[id]={id,kind:cur[id].kind,json:cur[id].json};SV.snap[id]=s;SV.docs[id]={kind:cur[id].kind,json:JSON.parse(s)}}});
  Object.keys(SV.snap).forEach(id=>{if(!cur[id]){const k=SV.docs[id]&&SV.docs[id].kind;if(DELETABLE.includes(k))SV.pend[id]={id,kind:k,del:true};delete SV.snap[id];delete SV.docs[id]}});
  if(Object.keys(SV.pend).length){setSync('saving');clearTimeout(SV.t);SV.t=setTimeout(flush,500)}}
export async function flush(){if(SV.busy){clearTimeout(SV.t);SV.t=setTimeout(flush,700);return}
  const all=Object.values(SV.pend);if(!all.length){setSync('ok');return}
  const docs=all.slice(0,250);docs.forEach(d=>delete SV.pend[d.id]);SV.busy=true;
  const r=await api('save',{docs});SV.busy=false;
  if(!r.ok){docs.forEach(d=>{if(!SV.pend[d.id])SV.pend[d.id]=d});if(r.error==='session')return gate('signin');setSync('off');clearTimeout(SV.t);SV.t=setTimeout(flush,8000);return}
  if(r.rejected&&r.rejected.length){flash(t('notAllowed'));await pull(false)}
  if(Object.keys(SV.pend).length){clearTimeout(SV.t);SV.t=setTimeout(flush,300)}else setSync('ok')}
export async function flushAll(){for(let i=0;i<20&&(Object.keys(SV.pend).length||SV.busy);i++){clearTimeout(SV.t);await flush();if(SV.busy)await new Promise(r=>setTimeout(r,300))}}
export async function pull(delta){syncQueue();if(SV.pulling)return;SV.pulling=true;const r=await api('load',delta?{since:SV.since}:{});SV.pulling=false;
  if(!r.ok){if(r.error==='session')return gate('signin');setSync('off');return}
  if(!delta){Object.keys(SV.docs).forEach(id=>{if(!SV.pend[id]){delete SV.docs[id];delete SV.snap[id]}});SV.people=r.people||SV.people}
  if(r.me)SV.me=r.me;SV.since=r.now;let ch=!delta;
  r.docs.forEach(d=>{if(SV.pend[d.id])return;if(d.del){if(SV.docs[d.id]){delete SV.docs[d.id];delete SV.snap[d.id];ch=true}return}
    const s=JSON.stringify(d.json);if(SV.snap[d.id]===s)return;SV.docs[d.id]={kind:d.kind,json:d.json};SV.snap[d.id]=s;ch=true});
  if(ch){fromDocs();soft()}
  setSync(Object.keys(SV.pend).length?'saving':'ok')}
export const mDepts=m=>m&&m.depts?Object.assign({},m.depts):m&&m.dept?{[m.dept]:m.role||'staff'}:{};
export function fromDocs(){const me=SV.me.email,N={boards:{},lists:{},cards:{},order:[],me,dark:{},lblOff:{},emailOff:{},my:{},seen:{},goals:[],ports:[],msgs:{},notes:[],prof:{},cap:{},tpls:[],cardTpl:[]},bs=[],mem={};
  Object.keys(SV.docs).forEach(id=>{const d=SV.docs[id],j=JSON.parse(JSON.stringify(d.json));
    switch(d.kind){case 'board':N.boards[id]=j;bs.push(Object.assign({},j,{id}));break;case 'list':N.lists[id]=j;break;case 'card':N.cards[id]=j;break;
      case 'goal':N.goals.push(j);break;case 'port':N.ports.push(j);break;case 'msg':(N.msgs[j.k]=N.msgs[j.k]||[]).push(j);break;case 'note':N.notes.push(j);break;
      case 'user':if(id==='user:'+me){if(j.my)N.my[me]=j.my;if(j.seen)N.seen[me]=j.seen;N.dark[me]=!!j.dark;N.lblOff[me]=!!j.lblOff;N.emailOff[me]=!!j.emailOff}break;
      case 'prof':N.prof[id.slice(5)]=j;break;case 'cap':N.cap[id.slice(4)]=j.n;break;case 'member':mem[id.slice(7)]=j;break;case 'tpl':N.tpls.push(j);break;case 'ctpl':N.cardTpl.push(j);break;case 'space':(N.spaces=N.spaces||[]).push(j);break}});
  // a card belongs to the list it names, so two people moving cards at the same moment never lose one
  Object.keys(N.lists).forEach(id=>{const l=N.lists[id];l.cards=(l.cards||[]).filter(c=>N.cards[c]&&N.cards[c].l===id)});
  Object.keys(N.cards).forEach(id=>{const l=N.lists[N.cards[id].l];if(l&&!l.cards.includes(id))l.cards.push(id)});
  Object.values(N.msgs).forEach(a=>a.sort((x,y)=>x.at-y.at));N.notes.sort((x,y)=>x.at-y.at);
  N.order=bs.sort((a,b)=>(a.ord??1e9)-(b.ord??1e9)).map(b=>b.id);
  N.people=SV.people.map(p=>{const m=mem[p.email]||{},nm=p.name||p.email;return {id:p.email,en:nm,ar:nm,ini:iniOf(nm),color:p.ceo?'#c27a2c':dlist({depts:mDepts(m)}).length?dept(dlist({depts:mDepts(m)})[0]).dot:hcol(p.email),
    depts:p.ceo?{}:mDepts(m),email:p.email,ceo:!!p.ceo,invited:!!p.invited,title:p.title||''}});
  Object.keys(mem).forEach(e=>{if(mem[e].inv&&!N.people.some(p=>p.id===e)){const nm=mem[e].inv.name||e;N.people.push({id:e,en:nm,ar:nm,ini:iniOf(nm),color:hcol(e),depts:mDepts(mem[e]),email:e,invited:true,inv:mem[e].inv})}});
  D=N;PEOPLE=D.people;rebuildDepts()}
export function soft(){const a=document.activeElement;if(DR.d||ASK||(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&!['q','pq','pq2'].includes(a.id))){V.stale=true;return}render()}
export function setSync(s){SV.state=s;const el=document.getElementById('sync');if(el){el.className='sync '+s;el.textContent=s==='ok'?t('sSaved'):s==='saving'?t('sSaving'):t('sOff')}}
export function openHash(){const h=decodeURIComponent(location.hash.slice(1));if(h.startsWith('card=')&&D.cards[h.slice(5)])V.card=h.slice(5);if(h.startsWith('chat=')){V.view='chat';V.ch=h.slice(5)}}
export async function bootLive(){try{SV.tok=localStorage.getItem('fa-token')||''}catch(e){}
  if(!SV.tok)return gate('signin');gate('load');
  const r=await api('load');if(!r.ok)return gate(r.error==='session'?'signin':'net');
  SV.people=r.people||[];SV.me=r.me;SV.since=r.now;r.docs.forEach(d=>{SV.docs[d.id]={kind:d.kind,json:d.json};SV.snap[d.id]=JSON.stringify(d.json)});
  fromDocs();SV.ready=true;home();openHash();render();setSync('ok');
  setInterval(()=>{if(!document.hidden&&SV.ready)pull(true)},20000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&SV.ready)pull(true)});
  window.addEventListener('beforeunload',e=>{if(Object.keys(SV.pend).length){flush();e.preventDefault();e.returnValue=''}})}
export const b64=f=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]||'');r.onerror=rej;r.readAsDataURL(f)});
export function spSync(){const f=V.sp,g=id=>document.getElementById(id);if(f&&g('sp-en')){f.en=g('sp-en').value;f.ar=g('sp-ar').value}}
export function spSave(){spSync();const f=V.sp;f.bad=f.en.trim()?[]:['en'];if(f.bad.length){render();focusSel('#sp-en');return}
  D.spaces=D.spaces||[];const c=SPCOL[f.col]||SPCOL[0];
  if(f.id){const x=D.spaces.find(z=>z.id===f.id);if(x)Object.assign(x,{en:f.en.trim(),ar:f.ar.trim(),tint:c[0],dot:c[1]})}
  else{const id='sp'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);D.spaces.push({id,en:f.en.trim(),ar:f.ar.trim(),tint:c[0],dot:c[1],by:ME(),at:Date.now()});
    if(!isCEO())meP().depts=Object.assign({},pD(meP()),{[id]:'head'});V.view='dept';V.dept=id;V.dtab='team';V.board=null}
  rebuildDepts();V.sp=null;save();render()}
export const ymd=d=>{const x=new Date(d);return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')};
export function ntTargets(dep){return boards().filter(b=>b.dept===dep&&(b.kind!=='requests'||headOf(dep)))}
export function ntDefaults(n){const ts=ntTargets(n.dept).filter(b=>!b.kind);if(!n.board||(n.board!=='__req'&&!ts.some(b=>b.id===n.board)))n.board=ts.length?ts[0].id:'__req';
  const b=D.boards[n.board];if(b&&!b.lists.includes(n.list))n.list=b.lists[0];return n}
export function openNew(o){V.nt=null;const md=myDept();V.nt=ntDefaults(Object.assign({dept:md==='ceo'||!md?'ops':md,from:md,board:null,list:null,title:'',members:[],due:'',start:'',type:'task',pri:'normal',labels:[],desc:'',check:'',bad:[],tpl:''},o||{}));V.pop=null;V.side=false;render();focusSel('#nt-title')}
export function ntSync(){const n=V.nt;if(!n)return;const g=id=>document.getElementById(id);if(g('nt-title')){n.title=g('nt-title').value;n.due=g('nt-due').value;if(g('nt-from'))n.from=g('nt-from').value;n.start=g('nt-start').value;n.type=g('nt-type').value;n.pri=g('nt-pri').value;n.desc=g('nt-desc').value;n.check=g('nt-check').value}}
export function ntPool(n){const req=n.board==='__req',b=D.boards[n.board];return req?PEOPLE.filter(x=>inD(x,n.dept)).map(x=>x.id):[...new Set(boardPeople(b).concat(PEOPLE.filter(x=>isHd(x,n.dept)).map(x=>x.id)))]}
export function ntLive(){const n=V.nt;if(!n||!n.bad.length)return;ntSync();
  n.bad=n.bad.filter(k=>k==='title'?!n.title.trim():k==='due'?!n.due:k==='members'?!n.members.length:k==='start'?!!(n.start&&n.due&&n.start>n.due):true);
  [['title','#nt-title'],['due','#nt-due'],['start','#nt-start'],['members','.ntf .lchips.own']].forEach(([k,sel])=>{const on=n.bad.includes(k),el=document.querySelector(sel),er=document.getElementById('nt-e-'+k);
    if(el){el.classList.toggle('miss',on);if(el.hasAttribute('aria-invalid'))el.setAttribute('aria-invalid',on)}if(er)er.hidden=!on});
  if(!n.bad.length){const eb=document.querySelector('.ntf .errbox');if(eb)eb.remove()}}
export function ntCreate(){ntSync();const n=V.nt,req=n.board==='__req',bad=[];
  if(!n.title.trim())bad.push('title');if(!n.due)bad.push('due');if(!req&&!n.members.length)bad.push('members');if(n.start&&n.due&&n.start>n.due)bad.push('start');
  n.bad=bad;if(bad.length){render();const el=document.querySelector('.ntf .miss');if(el&&el.focus)el.focus();return}
  const b=req?reqBoard(n.dept,true):D.boards[n.board],l=req?D.lists[b.lists[0]]:(D.lists[n.list]||D.lists[b.lists[0]]);
  const c={id:uid('c'),title:n.title.trim().replace(/\s+/g,' '),desc:n.desc.trim(),labels:n.labels.slice(),members:n.members.slice(),due:new Date(n.due+'T00:00:00').getTime(),
    done:DONE_RX.test(l.name),doneAt:DONE_RX.test(l.name)?Date.now():null,repeat:'',priority:n.pri,check:n.check.split('\n').map(x=>x.trim()).filter(Boolean).map(x=>({t:x,d:false})),log:[],
    start:n.start?new Date(n.start+'T00:00:00').getTime():null,by:ME(),owner:n.members[0]||null,follow:[ME()]};
  if(n.type!=='task')c.type=n.type;
  if(req||(isCEO()?true:!inD(meP(),b.dept))){c.requester=ME();c.fromDept=myDept()}
  if(c.members.includes(ME()))c.follow=[];
  logTo(c,req?{k:'l_req',a:deptName(myDept())}:{k:'l_added',a:LN(l)});D.cards[c.id]=c;l.cards.push(c.id);V.nt=null;
  c.members.forEach(m=>notify(m,'assign',c.id));if(req){const h=headOfDept(n.dept);if(h)notify(h.id,'req',c.id,{d:n.dept})}
  save();render()}
export function placePop(){const el=document.getElementById('pop'),a=V.pop.anchor&&document.querySelector(V.pop.anchor);if(!el)return;
  const r=a?a.getBoundingClientRect():{left:20,bottom:60,right:20},w=el.offsetWidth;
  let x=lang==='ar'?r.right-w:r.left;x=Math.max(8,Math.min(x,innerWidth-w-8));el.style.left=x+'px';el.style.top=Math.max(8,Math.min(r.bottom+6,innerHeight-el.offsetHeight-8))+'px'}
export function logTo(c,e){c.log.push(Object.assign({at:Date.now(),by:ME()},e))}
export function notify(to,k,card,x){if(!to||to===ME())return;(D.notes=D.notes||[]).push(Object.assign({id:uid('n'),to,by:ME(),k,card,at:Date.now(),read:false},x||{}));if(D.notes.length>500)D.notes=D.notes.slice(-500)}
export function notesFor(){const me=ME(),out=(D.notes||[]).filter(x=>x.to===me&&(D.cards[x.card]||x.ch)).map(x=>Object.assign({},x,{title:x.ch?chName(x.ch):D.cards[x.card].title,
    txt:t('n_'+x.k,{p:pname(x.by),d:deptName(x.d||''),x:x.x||''})}));
  const t0=today();allCards().forEach(({c})=>{if(!c.done&&c.due&&c.members.includes(me)&&c.due<t0+2*day){const w=c.due<t0?'w_over':c.due<t0+day?'w_today':'w_tomorrow';
    out.push({card:c.id,k:'due',title:c.title,txt:t('n_due',{w:t(w)}),at:0,read:true,by:me})}});
  return out.sort((a,b)=>(b.at||0)-(a.at||0)).slice(0,60)}
export const unread=()=>(D.notes||[]).filter(x=>x.to===ME()&&!x.read&&(D.cards[x.card]||x.ch)).length;
export function withMentions(txt){let h=esc(txt);PEOPLE.forEach(p=>[p.en,p.ar].forEach(nm=>{if(nm){const e=esc('@'+nm);h=h.split(e).join(`<span class="ment">${e}</span>`)}}));return h}
export function mentioned(txt){return PEOPLE.filter(p=>[p.en,p.ar].some(nm=>nm&&txt.includes('@'+nm))).map(p=>p.id)}
export const TPLS=[{id:'blank',lists:['todo','doing','done']},{id:'weekly',lists:['week','now','wait','done']},
  {id:'opening',lists:['todo','doing','waiting','done'],cards:[['Trade licence renewed','تجديد الرخصة التجارية'],['Signage approved','اعتماد اللوحات'],['Kitchen equipment installed','تركيب معدات المطبخ'],['POS and printers set up','تجهيز نقاط البيع والطابعات'],['Staff rota for opening week','جدول الموظفين لأسبوع الافتتاح'],['Opening stock order','طلب مخزون الافتتاح'],['Health and safety check','فحص الصحة والسلامة']]},
  {id:'hiring',lists:['todo','now','done'],cards:[['Write the job ad','كتابة إعلان الوظيفة'],['Post on the careers page','النشر في صفحة الوظائف'],['Screen CVs','فرز السير الذاتية'],['Interviews','المقابلات'],['References','التحقق من المراجع'],['Offer and contract','العرض والعقد']]},
  {id:'maint',lists:['reported','sched','inprog','fixed']}];
export const allTpls=()=>TPLS.map(x=>({id:x.id,name:t('tpl_'+x.id)})).concat((D.tpls||[]).map(x=>({id:x.id,name:t('mineTpl',{n:x.name})})));
export function makeBoard(dep,name,tplId){const h=headOfDept(dep);const b={id:uid('b'),dept:dep,name,members:[...new Set([h?h.id:null,ME()].filter(x=>x&&!person(x).ceo))],status:null,lists:[]};
  const saved=(D.tpls||[]).find(x=>x.id===tplId),bi=TPLS.find(x=>x.id===tplId)||TPLS[0];
  const lists=saved?saved.lists:bi.lists.map((k,i)=>({name:SYS[k][0],sys:k,cards:i===0?(bi.cards||[]).map(x=>({title:x[lang==='ar'?1:0]})):[]}));
  if(saved)b.labels=saved.labels?JSON.parse(JSON.stringify(saved.labels)):undefined;
  lists.forEach(L=>{const ln=typeof L==='string'?L:L.name,l={id:uid('l'),name:ln,sys:L.sys||undefined,cards:[],col:false};D.lists[l.id]=l;b.lists.push(l.id);
    (L.cards||[]).forEach(x=>{const c={id:uid('c'),title:x.title,desc:x.desc||'',labels:(x.labels||[]).slice(),members:[],due:null,done:DONE_RX.test(ln),doneAt:null,repeat:'',priority:x.priority||'normal',check:(x.check||[]).map(k=>({t:k.t,d:false})),log:[]};
      logTo(c,{k:'l_added',a:LN(l)});D.cards[c.id]=c;l.cards.push(c.id)})});
  D.boards[b.id]=b;D.order.push(b.id);return b}
export function boardAsTpl(b){return {id:uid('t'),name:b.name,labels:b.labels?JSON.parse(JSON.stringify(b.labels)):null,lists:liveLists(b).map(id=>({name:D.lists[id].name,sys:D.lists[id].sys,
  cards:D.lists[id].cards.map(cid=>D.cards[cid]).filter(c=>c&&!c.archived).map(c=>({title:c.title,desc:c.desc,labels:c.labels,priority:c.priority,check:c.check}))}))}}
export function ensureLabels(b){if(!b.labels)b.labels=LABELS.map(l=>({id:l.id,color:l.color,name:lname(l)}));return b.labels}
export const FILES: any={p:null,open(){return this.p||(this.p=new Promise(res=>{try{const q=indexedDB.open('forka-boards-files',1);q.onupgradeneeded=()=>q.result.createObjectStore('f');q.onsuccess=()=>res(q.result);q.onerror=()=>res(null)}catch(e){res(null)}}))},
  async get(k){const loc=await this.get0(k);if(loc||!LIVE||!/^d:/.test(k))return loc;const r=await api('file',{id:k});if(!r.ok)return null;
    const bl=new Blob([Uint8Array.from(atob(r.data),c=>c.charCodeAt(0))],{type:r.type});await this.put0(k,bl);return bl},
  async put(k,v){if(!LIVE)return (await this.put0(k,v))?k:false;if(SV.pend[V.card])await flushAll();
    const r=await api('upload',{card:V.card,name:v.name,type:v.type,data:await b64(v)});if(!r.ok){flash(t(r.error==='size'?'tooBig':'notAllowed',{f:v.name}));return false}await this.put0(r.id,v);return r.id},
  async get0(k){const d=await this.open();if(!d)return null;return new Promise(res=>{try{const q=d.transaction('f').objectStore('f').get(k);q.onsuccess=()=>res(q.result||null);q.onerror=()=>res(null)}catch(e){res(null)}})},
  async put0(k,v){const d=await this.open();if(!d)return false;return new Promise(res=>{try{const tx=d.transaction('f','readwrite');tx.objectStore('f').put(v,k);tx.oncomplete=()=>res(true);tx.onerror=()=>res(false)}catch(e){res(false)}})}};
export const URLS: Record<string,string>={};
export async function hydrate(){for(const img of document.querySelectorAll('img[data-att]')){const k=img.dataset.att;if(!URLS[k]){const bl=await FILES.get(k);if(bl)URLS[k]=URL.createObjectURL(bl)}if(URLS[k]&&img.src!==URLS[k])img.src=URLS[k]}}
export function copyCard(c,b2){const l2=D.lists[liveLists(b2).find(id=>D.lists[id].name===(listOf(c.id)||{}).name)||liveLists(b2)[0]];if(!l2)return;
  const ppl=boardPeople(b2),x={id:uid('c'),title:c.title,desc:c.desc,labels:c.labels.filter(id=>labelsOf(b2).some(l=>l.id===id)),members:c.members.filter(m=>ppl.includes(m)),due:c.due,done:false,doneAt:null,repeat:c.repeat,priority:c.priority||'normal',
    check:c.check.map(k=>({t:k.t,d:k.d})),atts:(c.atts||[]).map(a=>Object.assign({},a)),cover:c.cover||null,log:[]};
  logTo(x,{k:'l_added',a:l2.name});D.cards[x.id]=x;l2.cards.push(x.id);return x}
export function addCard(lid,title){title=title.trim();if(!title)return;const l=D.lists[lid];const c={id:uid('c'),title,desc:'',labels:[],members:[],due:null,done:DONE_RX.test(l.name),doneAt:DONE_RX.test(l.name)?Date.now():null,repeat:'',check:[],log:[]};
  logTo(c,{k:'l_added',a:LN(l)});D.cards[c.id]=c;l.cards.push(c.id);save()}
export function moveCard(cid,toL,idx){const from=listOf(cid);if(!from)return;
  if(from.id!==toL&&DONE_RX.test(D.lists[toL].name)&&!D.cards[cid].done&&!canFinish(D.cards[cid]))return false;
  from.cards.splice(from.cards.indexOf(cid),1);const to=D.lists[toL];idx=Math.max(0,Math.min(idx,to.cards.length));to.cards.splice(idx,0,cid);
  const c=D.cards[cid];if(from.id!==toL){logTo(c,{k:'l_moved',a:LN(from),b:LN(to)});
    if(DONE_RX.test(to.name)&&!c.done){c.done=true;c.doneAt=Date.now();logTo(c,{k:'l_done'});afterDone(c)}else if(DONE_RX.test(from.name)&&!DONE_RX.test(to.name)&&c.done){c.done=false;c.doneAt=null;logTo(c,{k:'l_undone'})}}save()}
export function commitModalFields(){const c=D.cards[V.card];if(!c)return;const mt=document.getElementById('mt'),de=document.getElementById('cdesc');
  if(mt&&mt.value.trim())c.title=mt.value.trim().replace(/\s+/g,' ');if(de)c.desc=de.value;save()}
document.addEventListener('click',e=>{
  if(DR.justDropped){DR.justDropped=false;return}
  const a=e.target.closest('[data-a]');
  if(V.side&&!e.target.closest('.side')&&!(a&&a.dataset.a==='side')){V.side=false;render();if(!a)return}
  if(V.pop&&!e.target.closest('#pop')&&!(a&&['bmenu','lmenu','members','status','bell','labels','archv','fieldsed','wlc'].includes(a.dataset.a))){V.pop=null;render();if(!a)return}
  if(e.target.closest('select.msec,select.ppri'))return;
  if(!a){const card=e.target.closest('.card[data-id]');if(card&&!V.nt){V.card=card.dataset.card||card.dataset.id;V.comp=null;render()}
    if(V.editList&&!e.target.closest('.lhead'))saveListName();
    return}
  const k=a.dataset.a,id=a.dataset.id,v=a.dataset.v;
  const c=V.card?D.cards[V.card]:null;
  switch(k){
    case '':break;
    case 'side':V.side=!V.side;render();break;
    case 'lang':lang=v;try{localStorage.setItem('fb-lang',v)}catch(x){}render();break;
    case 'pgk':{const P=pgState();P.k=P.k===v?'':v;render();break}
    case 'pgscope':{const P=pgState();P.scope=v;P.k='';pgSave();render();break}
    case 'psort':{const P=pfState();if(P.sort===v)P.dir=P.dir==='asc'?'desc':'asc';else{P.sort=v;P.dir=PSORT[v]}pfSave();render();break}
    case 'pfclear':{const P=pfState();Object.assign(P,{q:'',dept:'',owner:'',member:'',status:''});pfSave();render();break}
    case 'fq':V.f.q='';render();break;
    case 'addct':openNew({dept:boardOfList(id).dept,board:boardOfList(id).id,list:id});break;
    case 'calday':V.calDay=v;render();setTimeout(()=>focusSel('.dayd [data-a=caldx]'),0);break;
    case 'caldov':if(e.target!==a)break;
    case 'caldx':{const k0=V.calDay;V.calDay=null;render();const el=document.querySelector(`.dnb[data-v="${k0}"]`);if(el)el.focus();break}
    case 'go':V.calDay=null;if(v==='chat'&&V.ch)markSeen(V.ch);V.view=v;V.dept=null;V.board=null;V.side=false;if(v==='ports')V.port=null;V.perfP=null;render();break;
    case 'gnew':gfOpen(null);break;
    case 'spnew':V.sp={id:null,en:'',ar:'',col:(D.spaces||[]).length%SPCOL.length,bad:[]};V.side=false;render();focusSel('#sp-en');break;
    case 'spedit':{const x=(D.spaces||[]).find(z=>z.id===V.dept);if(!x)break;V.sp={id:x.id,en:x.en,ar:x.ar||'',col:Math.max(0,SPCOL.findIndex(c=>c[1]===x.dot)),bad:[]};render();break}
    case 'spcol':spSync();V.sp.col=+v;render();break;
    case 'spx':V.sp=null;render();break;
    case 'spsave':spSave();break;
    case 'spdel':{const id=V.sp.id;if(Object.values(D.boards).some(b=>b.dept===id)){flash(t('spHasBoards'));break}
      ask(t('delSpaceQ'),()=>{D.spaces=(D.spaces||[]).filter(z=>z.id!==id);PEOPLE.forEach(p=>{if(inD(p,id)){const z=Object.assign({},pD(p));delete z[id];p.depts=z}});V.sp=null;home();rebuildDepts();save()});break}
    case 'lbltog':D.lblOff=D.lblOff||{};D.lblOff[ME()]=lblNames();V.pop=null;save();render();break;
    case 'prof':V.prof=v;V.profEdit=false;V.oooBad=false;V.pop=null;render();break;
    case 'profx':if(k==='profx'&&a.classList.contains('ov')&&e.target!==a)break;V.prof=null;V.profEdit=false;render();break;
    case 'profedit':V.profEdit=true;render();focusSel('#pr-phone');break;
    case 'profcancel':V.profEdit=false;V.oooBad=false;V.prDraft=null;render();break;
    case 'profsave':{const g=x=>document.getElementById(x).value.trim(),f=g('pr-from'),to=g('pr-to');if(f&&to&&to<f||(!!f!==!!to)){V.oooBad=true;V.prDraft={phone:g('pr-phone'),about:g('pr-about'),ooo:{from:f,to,note:g('pr-note')}};render();break}
      D.prof=D.prof||{};D.prof[ME()]=Object.assign({},prof(ME()),{phone:g('pr-phone'),about:g('pr-about'),ooo:f?{from:f,to,note:g('pr-note')}:null});V.profEdit=false;V.oooBad=false;V.prDraft=null;save();render();break}
    case 'dm':{const k2=dmKey(ME(),v);V.prof=null;V.view='chat';V.ch=k2;V.side=false;markSeen(k2);save();render();focusSel('#chin');break}
    case 'chopen':V.ch=v||null;if(v)markSeen(v);save();render();scrollChat();if(v)focusSel('#chin');break;
    case 'chsend':chSend();break;
    case 'gopen':gfOpen(id);break;
    case 'gx':V.gf=null;render();break;
    case 'gsave':gfSave();break;
    case 'gdel':ask(t('delGoalQ'),()=>{D.goals=(D.goals||[]).filter(x=>x.id!==V.gf.id);V.gf=null;save()});break;
    case 'gfb':{gfSync();const f=V.gf;f.boards=f.boards.includes(v)?f.boards.filter(x=>x!==v):f.boards.concat(v);render();break}
    case 'popen':V.port=id;V.ptab='list';render();break;
    case 'pnew':{const n=(document.getElementById('newport').value||'').trim();if(!n){focusSel('#newport');break}const x={id:uid('pf'),name:n,owner:ME(),items:[]};(D.ports=D.ports||[]).push(x);V.port=x.id;save();render();break}
    case 'pdel':ask(t('delPortQ'),()=>{D.ports=(D.ports||[]).filter(x=>x.id!==V.port);V.port=null;save()});break;
    case 'ptab':V.ptab=v;render();break;
    case 'prm':{const x=(D.ports||[]).find(q=>q.id===V.port);x.items=x.items.filter(i=>i.b!==v);save();render();break}
    case 'csv':exportCsv();break;
    case 'print':window.print();break;
    case 'rtab':V.rtab=v;render();break;
    case 'pper':V.pper=v;render();break;
    case 'pfp':V.perfP=v||null;render();if(v){const el=document.getElementById('perfdet');el&&el.scrollIntoView({block:'start'})}break;
    case 'wlc':V.pop={kind:'wl',v,anchor:`[data-wl="${v}"]`};render();break;
    case 'dept':V.calDay=null;V.view='dept';if(V.dept!==id)V.dtab='boards';V.dept=id;V.board=null;V.side=false;V.newBoard=false;V.inv=null;render();break;
    case 'board':V.calDay=null;V.view='board';V.board=id;V.dept=D.boards[id].dept;V.side=false;V.f={q:'',members:[],labels:[],due:'',fields:[]};V.filter=false;V.comp=null;render();break;
    case 'open':V.calDay=null;if(V.card)commitModalFields();V.card=id;V.dateErr=false;V.pop=null;render();break;
    case 'bname':V.editBoard=true;render();focusSel('#bname');break;
    case 'bmenu':V.pop=V.pop&&V.pop.kind==='bmenu'?null:{kind:'bmenu',anchor:'[data-a=bmenu]'};render();break;
    case 'members':V.pop=V.pop&&V.pop.kind==='members'?null:{kind:'members',anchor:'[data-a=members]'};render();break;
    case 'status':V.pop=V.pop&&V.pop.kind==='status'?null:{kind:'status',anchor:'.bbar [data-a=status]',s:(B().status||{}).s};render();break;
    case 'alldept':{const b=B();b.allDept=!b.allDept;save();render();break}
    case 'goteam':V.pop=null;V.view='dept';V.dept=id;V.dtab='team';V.board=null;render();focusSel('#ivname');break;
    case 'dtab':V.dtab=v;render();break;
    case 'addp':{const x=person(document.getElementById('addp').value);x.depts=Object.assign({},pD(x),{[V.dept]:'staff'});if(!LIVE)x.invited=false;save();flash(t('addedTo',{p:pname(x.id),d:deptName(V.dept)}));break}
    case 'invite':{const nm=document.getElementById('ivname').value.trim(),em=document.getElementById('ivemail').value.trim().toLowerCase(),bad=[];
      if(!nm)bad.push('name');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)||PEOPLE.some(x=>(x.email||'')===em))bad.push('email');
      if(bad.length){V.inv={name:nm,email:em,bad};render();return}
      const ini=nm.split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase()||'?';
      PEOPLE.push({id:LIVE?em:uid('p'),en:nm,ar:nm,ini,depts:{[V.dept]:'staff'},color:dept(V.dept).dot,email:em,invited:true,inv:LIVE?{name:nm}:undefined});V.inv=null;save();flash(t('inviteSent',{p:nm}));break}
    case 'copyinv':{const x=person(v),txt=t('inviteText',{p:pname(v),d:dnames(x),e:x.email});try{navigator.clipboard.writeText(txt).then(()=>flash(t('copied')),()=>flash(txt))}catch(err){flash(txt)}break}
    case 'rmteam':{const x=person(v),dd=V.dept;ask(t('removeQ',{p:pname(v),d:deptName(dd)}),()=>{Object.values(D.boards).filter(b=>b.dept===dd).forEach(b=>{b.members=b.members.filter(m=>m!==v)});const z=Object.assign({},pD(x));delete z[dd];x.depts=z;save()});break}
    case 'mtoggle':{const b=B();b.members=b.members.includes(v)?b.members.filter(x=>x!==v):b.members.concat(v);save();render();break}
    case 'stset':{const b=B();b.status=Object.assign({},b.status||{},{s:v,by:ME(),at:Date.now()});save();render();break}
    case 'stsave':{const b=B(),n=document.getElementById('stnote').value.trim();b.status=Object.assign({s:'on'},b.status||{},{note:n,by:ME(),at:Date.now()});V.pop=null;save();render();break}
    case 'bnew-open':V.newBoard=true;render();focusSel('#newb');break;
    case 'bnew-x':V.newBoard=false;render();break;
    case 'bnew':{const n=document.getElementById('newb').value.trim();if(!n)return;const tp=(document.getElementById('newbtpl')||{}).value||'blank';
      const b=makeBoard(V.dept,n,tp);V.newBoard=false;V.view='board';V.board=b.id;V.bview='board';save();render();break}
    case 'bview':V.calDay=null;V.bview=v;render();break;
    case 'calm':{const m=V.calM?new Date(V.calM):new Date();V.calM=v==='0'?null:new Date(m.getFullYear(),m.getMonth()+(+v),1).getTime();render();break}
    case 'calnew':{V.calDay=null;if(V.view==='mine'){openNew({due:v});break}const b=B();openNew({dept:b.dept,board:b.kind?null:b.id,due:v});break}
    case 'bell':V.pop=V.pop&&V.pop.kind==='notes'?null:{kind:'notes',anchor:'[data-a=bell]'};render();break;
    case 'nopen':{const x=(D.notes||[]).find(n=>n.id===v);if(x)x.read=true;V.pop=null;if(a.dataset.ch){V.view='chat';V.ch=a.dataset.ch;markSeen(V.ch);save();render();scrollChat();break}V.card=id;save();render();break}
    case 'nread':(D.notes||[]).forEach(x=>{if(x.to===ME())x.read=true});save();render();break;
    case 'labels':V.pop={kind:'labels',anchor:'[data-a=bmenu]'};render();break;
    case 'labcol':{const L=ensureLabels(B()),l=L.find(x=>x.id===v);l.color=PALETTE[(PALETTE.indexOf(l.color)+1)%PALETTE.length];save();render();break}
    case 'labadd':{const L=ensureLabels(B());L.push({id:uid('lb'),color:PALETTE[L.length%PALETTE.length],name:''});save();render();setTimeout(()=>{const i=[...document.querySelectorAll('.labname')].pop();i&&i.focus()},0);break}
    case 'labdel':{const b=B();ask(t('delLabelQ'),()=>{ensureLabels(b);b.labels=b.labels.filter(x=>x.id!==v);cardsOf(b).forEach(c=>{c.labels=c.labels.filter(x=>x!==v)});save();V.pop={kind:'labels',anchor:'[data-a=bmenu]'}});break}
    case 'btpl':{(D.tpls=D.tpls||[]).push(boardAsTpl(B()));V.pop=null;save();flash(t('tplSaved'));break}
    case 'archv':V.pop={kind:'archive',anchor:'[data-a=bmenu]'};render();break;
    case 'larch':{const l=D.lists[id];l.archived=true;l.archivedAt=Date.now();V.pop=null;save();flash(t('archivedOk'));break}
    case 'lrestore':D.lists[v].archived=false;save();render();break;
    case 'lgone':ask(t('delListQ'),()=>{D.lists[v].cards.forEach(cid=>delete D.cards[cid]);delete D.lists[v];B().lists=B().lists.filter(x=>x!==v);save();V.pop={kind:'archive',anchor:'[data-a=bmenu]'}});break;
    case 'crestore':{const x=D.cards[v];x.archived=false;logTo(x,{k:'l_restore'});save();render();break}
    case 'cgone':ask(t('delQ'),()=>{const l=listOf(v);if(l)l.cards.splice(l.cards.indexOf(v),1);delete D.cards[v];save();V.pop={kind:'archive',anchor:'[data-a=bmenu]'}});break;
    case 'carch':commitModalFields();c.archived=true;c.archivedAt=Date.now();logTo(c,{k:'l_arch'});V.card=null;save();flash(t('archivedOk'));break;
    case 'ctpl':commitModalFields();(D.cardTpl=D.cardTpl||[]).push({id:uid('ct'),title:c.title,desc:c.desc,labels:c.labels.slice(),priority:c.priority||'normal',check:c.check.map(k=>k.t)});save();flash(t('cardTplSaved'));break;
    case 'ccopy':{commitModalFields();const b2=D.boards[document.getElementById('ccopy').value];if(b2&&copyCard(c,b2)){save();flash(t('copied2',{b:bname(b2)}))}break}
    case 'cboardgo':{commitModalFields();const nb=D.boards[document.getElementById('cboard').value],cur=listOf(c.id);if(!nb||nb.lists.includes(cur.id))return;
      const same=liveLists(nb).find(id=>D.lists[id].name===cur.name)||liveLists(nb)[0];c.members=c.members.filter(m=>boardPeople(nb).includes(m)||inD(person(m),nb.dept));
      c.labels=c.labels.filter(id=>labelsOf(nb).some(l=>l.id===id));moveCard(c.id,same,1e9);save();flash(t('moved',{b:bname(nb)}));break}
    case 'attopen':{const bl=await_(v);break}
    case 'attcover':commitModalFields();c.cover=c.cover===v?null:v;save();render();break;
    case 'attdel':commitModalFields();c.atts=(c.atts||[]).filter(x=>x.id!==v);if(c.cover===v)c.cover=null;save();render();break;
    case 'theme':D.dark=D.dark||{};D.dark[ME()]=v==='dark';save();render();break;
    case 'ask-no':ASK=null;render();break;
    case 'ask-yes':{const go=ASK&&ASK.go;ASK=null;if(go)go();render();break}
    case 'reset':ask(t('resetQ'),()=>{const me=D.me;D=seed();PEOPLE=D.people;PEOPLE.forEach(normP);rebuildDepts();D.me=PEOPLE.some(x=>x.id===me)?me:'ka';V.card=null;home();save()});break;
    case 'bdel':ask(t('deleteBoardQ'),()=>{const b=B();b.lists.forEach(lid=>{D.lists[lid].cards.forEach(cid=>delete D.cards[cid]);delete D.lists[lid]});delete D.boards[b.id];D.order=D.order.filter(x=>x!==b.id);V.view='dept';V.board=null;save()});break;
    case 'filter':V.filter=!V.filter;render();break;
    case 'fm':V.f.members=V.f.members.includes(v)?V.f.members.filter(x=>x!==v):V.f.members.concat(v);render();break;
    case 'fl':V.f.labels=V.f.labels.includes(v)?V.f.labels.filter(x=>x!==v):V.f.labels.concat(v);render();break;
    case 'fd':V.f.due=V.f.due===v?'':v;render();break;
    case 'fclear':V.f={q:'',members:[],labels:[],due:'',fields:[]};render();break;
    case 'ff':V.f.fields=(V.f.fields||[]).includes(v)?V.f.fields.filter(x=>x!==v):(V.f.fields||[]).concat(v);render();break;
    case 'addl':V.addList=true;render();focusSel('#newl');break;
    case 'addl-x':V.addList=false;render();break;
    case 'addl-go':addList();break;
    case 'addc':openNew({dept:boardOfList(id).dept,board:boardOfList(id).id,list:id});break;
    case 'newtask':{const b=V.view==='board'&&B()&&!B().kind?B():null;openNew(b?{dept:b.dept,board:b.id}:V.view==='dept'?{dept:V.dept}:{});break}
    case 'ntx':V.nt=null;render();break;
    case 'ntgo':ntCreate();break;
    case 'ntm':{ntSync();const n=V.nt;n.members=n.members.includes(v)?n.members.filter(x=>x!==v):n.members.concat(v);n.bad=n.bad.filter(x=>x!=='members');render();break}
    case 'ntl':{ntSync();const n=V.nt;n.labels=n.labels.includes(v)?n.labels.filter(x=>x!==v):n.labels.concat(v);render();break}
    case 'addc-x':V.comp=null;render();break;
    case 'addc-go':{const ta=document.getElementById('newc');addCard(id,ta.value);render();focusSel('#newc');scrollListEnd(id);break}
    case 'lname':V.editList=id;render();focusSel('#lname');break;
    case 'lcol':D.lists[id].col=!D.lists[id].col;V.pop=null;save();render();break;
    case 'lmenu':V.pop=V.pop&&V.pop.kind==='lmenu'&&V.pop.id===id?null:{kind:'lmenu',id,anchor:`.list[data-id="${id}"] [data-a=lmenu]`};render();break;
    case 'lsort':D.lists[id].cards.sort((x,y)=>(D.cards[x].due||9e15)-(D.cards[y].due||9e15));V.pop=null;save();render();break;
    case 'ldel':ask(t('delListQ'),()=>{D.lists[id].cards.forEach(cid=>delete D.cards[cid]);delete D.lists[id];B().lists=B().lists.filter(x=>x!==id);save()});break;
    case 'ov':if(e.target===a){commitModalFields();V.card=null;V.dateErr=false;render()}break;
    case 'mclose':commitModalFields();V.card=null;V.dateErr=false;render();break;
    case 'cm':commitModalFields();if(c.members.includes(v))c.members=c.members.filter(x=>x!==v);else{c.members=c.members.concat(v);notify(v,'assign',c.id)}
      if(!c.members.includes(c.owner))c.owner=c.members[0]||null;save();render();break;
    case 'appr':{commitModalFields();if(!canDecide(c))break;c.appr={s:v,by:ME(),at:Date.now()};logTo(c,{k:'l_ap',a:t('ap_'+v)});
      [c.by,c.requester].concat(c.follow||[]).filter((x,i,arr)=>x&&arr.indexOf(x)===i).forEach(m=>notify(m,'ap_'+v,c.id));
      if(v!=='changes'&&!c.done){c.done=true;c.doneAt=Date.now();logTo(c,{k:'l_done'});afterDone(c,true)}else if(v==='changes'&&c.done){c.done=false;c.doneAt=null}
      save();render();break}
    case 'subadd':addSub();break;
    case 'subck':{commitModalFields();const sb=c.subs[+a.dataset.i];sb.done=a.checked;sb.doneAt=a.checked?Date.now():null;save();render();break}
    case 'subdel':commitModalFields();c.subs.splice(+a.dataset.i,1);save();render();break;
    case 'waitadd':{commitModalFields();const w=D.cards[document.getElementById('wadd').value];if(!w)break;if(w.id===c.id||waitsOn(w,c)){flash(t('waitLoop'));break}
      (c.waits=c.waits||[]).push(w.id);logTo(c,{k:'l_wait',a:w.title});save();render();break}
    case 'waitdel':commitModalFields();c.waits=(c.waits||[]).filter(x=>x!==v);save();render();break;
    case 'follow':commitModalFields();c.follow=(c.follow||[]).includes(ME())?c.follow.filter(x=>x!==ME()):(c.follow||[]).concat(ME());save();render();break;
    case 'fdel':commitModalFields();c.follow=(c.follow||[]).filter(x=>x!==v);save();render();break;
    case 'fieldsed':V.pop={kind:'fields',anchor:'[data-a=bmenu]'};render();break;
    case 'faddf':{const b=B();(b.fields=b.fields||[]).push({id:uid('f'),name:'',type:'select',opts:[]});save();render();setTimeout(()=>{const i=[...document.querySelectorAll('.fname')].pop();i&&i.focus()},0);break}
    case 'fdelf':{const b=B();ask(t('delFieldQ'),()=>{b.fields=(b.fields||[]).filter(x=>x.id!==v);cardsOf(b).forEach(x=>{if(x.f)delete x.f[v]});V.f.fields=(V.f.fields||[]).filter(k=>!k.startsWith(v+':'));save();V.pop={kind:'fields',anchor:'[data-a=bmenu]'}});break}
    case 'mtab':V.calDay=null;V.mtab=v;render();break;
    case 'mgrp':V.mgrp=v;render();break;
    case 'secadd':{const inp=document.getElementById('secnew'),n=inp&&inp.value.trim();if(!n){focusSel('#secnew');break}myState().secs.push({id:uid('s'),name:n});save();render();break}
    case 'secren':V.secEdit=v;render();focusSel('#secname');break;
    case 'secdel':ask(t('delSecQ'),()=>{const M=myState();M.secs=M.secs.filter(x=>x.id!==v);Object.keys(M.at).forEach(k=>{if(M.at[k]===v)delete M.at[k]});save()});break;
    case 'cl':commitModalFields();c.labels=c.labels.includes(v)?c.labels.filter(x=>x!==v):c.labels.concat(v);save();render();break;
    case 'cdone':commitModalFields();if(!c.done&&!canFinish(c))break;c.done=!c.done;c.doneAt=c.done?Date.now():null;logTo(c,{k:c.done?'l_done':'l_undone'});if(c.done)afterDone(c);save();render();break;
    case 'ck':commitModalFields();c.check[+a.dataset.i].d=a.checked;save();render();break;
    case 'ckdel':commitModalFields();c.check.splice(+a.dataset.i,1);save();render();break;
    case 'ckadd':addCheck();break;
    case 'cmt':{const tx=document.getElementById('cmt').value.trim();if(!tx)return;commitModalFields();logTo(c,{c:tx});const ms=mentioned(tx);ms.forEach(m=>notify(m,'mention',c.id));
      [...new Set(c.members.concat(c.follow||[],c.requester?[c.requester]:[]))].filter(m=>!ms.includes(m)).forEach(m=>notify(m,'comment',c.id));save();render();break}
    case 'ment':{const mi=V.mentIn||'cmt',ta=document.getElementById(mi),pos=ta.selectionStart,before=ta.value.slice(0,pos).replace(/@[^@\n]{0,30}$/,''),after=ta.value.slice(pos);ta.value=before+'@'+pname(v)+' '+after;V.pop=null;
      const keep=ta.value;render();const t2=document.getElementById(mi);t2.value=keep;t2.focus();t2.setSelectionRange(before.length+pname(v).length+2,before.length+pname(v).length+2);break}
    case 'cdel':commitModalFields();ask(t('delQ'),()=>{const l=listOf(c.id);if(l)l.cards.splice(l.cards.indexOf(c.id),1);delete D.cards[c.id];V.card=null;save()});break;
  }
});
export async function await_(k){const bl=await FILES.get(k);if(!bl){flash(t('fileGone'));return}const w=window.open(URL.createObjectURL(bl),'_blank');if(!w)location.href=URL.createObjectURL(bl)}
export function flash(m){V.toast=m;render();clearTimeout(flash.t);flash.t=setTimeout(()=>{V.toast=null;const el=document.querySelector('.toast');if(el)el.remove()},2600)}
export function focusSel(s){const el=document.querySelector(s);if(el){el.focus();if(el.select&&el.tagName==='INPUT')el.select()}}
export function scrollListEnd(id){const el=document.querySelector(`.list[data-id="${id}"] .cards`);if(el)el.scrollTop=el.scrollHeight}
export function addList(){const inp=document.getElementById('newl');const n=inp&&inp.value.trim();if(!n)return;const l={id:uid('l'),name:n,cards:[],col:false};D.lists[l.id]=l;B().lists.push(l.id);save();render();focusSel('#newl');const cv=document.querySelector('.canvas');cv.scrollLeft=lang==='ar'?-cv.scrollWidth:cv.scrollWidth}
export function addSub(){const inp=document.getElementById('subin'),v=inp&&inp.value.trim();if(!v)return;commitModalFields();const c=D.cards[V.card];(c.subs=c.subs||[]).push({id:uid('s'),t:v,who:'',due:null,done:false});save();render();focusSel('#subin')}
export function saveSec(){const inp=document.getElementById('secname');if(inp){const s=myState().secs.find(x=>x.id===inp.dataset.v);if(s&&inp.value.trim()){s.name=inp.value.trim()}}V.secEdit=null;save();render()}
export function addCheck(){const inp=document.getElementById('ckin');const v=inp&&inp.value.trim();if(!v)return;commitModalFields();D.cards[V.card].check.push({t:v,d:false});save();render();focusSel('#ckin')}
export function saveListName(){const inp=document.getElementById('lname'),l=V.editList&&D.lists[V.editList];if(inp&&l&&inp.value.trim()&&inp.value.trim()!==LN(l)){l.name=inp.value.trim();delete l.sys}V.editList=null;save();render()}
export function saveBoardName(){const inp=document.getElementById('bname');if(inp&&inp.value.trim())B().name=inp.value.trim();V.editBoard=false;save();render()}
document.addEventListener('keydown',e=>{
  const id=e.target.id;
  if(id==='newc'&&e.key==='Enter'&&!e.shiftKey){e.preventDefault();const lid=V.comp;addCard(lid,e.target.value);render();focusSel('#newc');scrollListEnd(lid);return}
  if(id==='newl'&&e.key==='Enter'){e.preventDefault();addList();return}
  if(id==='newb'&&e.key==='Enter'){e.preventDefault();document.querySelector('[data-a=bnew]').click();return}
  if(id==='lname'&&e.key==='Enter'){e.preventDefault();saveListName();return}
  if(id==='bname'&&e.key==='Enter'){e.preventDefault();saveBoardName();return}
  if(id==='ckin'&&e.key==='Enter'){e.preventDefault();addCheck();return}
  if(id==='chin'&&e.key==='Enter'&&!e.shiftKey){e.preventDefault();chSend();return}
  if(id==='subin'&&e.key==='Enter'){e.preventDefault();addSub();return}
  if(id==='secnew'&&e.key==='Enter'){e.preventDefault();document.querySelector('[data-a=secadd]').click();return}
  if(id==='secname'&&e.key==='Enter'){e.preventDefault();saveSec();return}
  if(id==='mt'&&e.key==='Enter'){e.preventDefault();e.target.blur();return}
  if(e.key==='Enter'&&e.target.classList&&e.target.classList.contains('card')){V.card=e.target.dataset.card||e.target.dataset.id;render();return}
  if(e.key==='Escape'&&V.calDay&&!V.card&&!V.nt){const k0=V.calDay;V.calDay=null;render();const el=document.querySelector(`.dnb[data-v="${k0}"]`);if(el)el.focus();return}
  if(e.key==='Escape'&&V.gf){V.gf=null;render();return}
  if(e.key==='Escape'&&V.sp){V.sp=null;render();return}
  if(e.target.id==='sp-en'&&e.key==='Enter'){e.preventDefault();spSave();return}
  if(e.key==='Escape'&&V.prof){V.prof=null;V.profEdit=false;render();return}
  if(e.key==='Escape'){if(V.secEdit){V.secEdit=null;render()}else if(ASK){ASK=null;render()}else if(V.nt){V.nt=null;render()}else if(V.pop){V.pop=null;render()}else if(V.card){commitModalFields();V.card=null;render()}else if(V.comp){V.comp=null;render()}else if(V.addList){V.addList=false;render()}else if(V.editList){V.editList=null;render()}else if(V.editBoard){V.editBoard=false;render()}else if(V.side){V.side=false;render()}}
});
document.addEventListener('input',e=>{
  if(e.target.id==='cmt'||e.target.id==='chin'){const m=e.target.value.slice(0,e.target.selectionStart).match(/@([^@\n]{0,30})$/);V.mentIn=e.target.id;
    if(m){const q=m[1].toLowerCase(),pool=e.target.id==='chin'?chMembers(V.ch).filter(x=>x!==ME()):(b=>[...new Set(boardPeople(b).concat(PEOPLE.filter(p=>inD(p,b.dept)||p.ceo).map(p=>p.id)))])(boardOfList(listOf(V.card).id)),L=pool.filter(id=>pname(id).toLowerCase().includes(q)).slice(0,6);
      let el=document.getElementById('mentpop');if(!el){el=document.createElement('div');el.id='mentpop';el.className='pop';document.querySelector('.shell').appendChild(el)}
      el.innerHTML=L.length?L.map(id=>`<button class="mrow" data-a="ment" data-v="${id}">${avHtml(id)}<span>${esc(pname(id))}</span></button>`).join(''):'';
      const r=e.target.getBoundingClientRect();el.style.left=Math.max(8,lang==='ar'?r.right-270:r.left)+'px';el.style.display=L.length?'block':'none';el.style.top=(r.bottom+4+el.offsetHeight>innerHeight?r.top-el.offsetHeight-4:r.bottom+4)+'px'}
    else{const el=document.getElementById('mentpop');if(el)el.remove()}}
  if(e.target.id==='pq2'){V.pq2=e.target.value;const pos=e.target.selectionStart;render();const q=document.getElementById('pq2');q.focus();q.setSelectionRange(pos,pos)}
  if(e.target.id==='nt-title')ntLive();
  if(e.target.id==='pq'){V.pf.q=e.target.value;pfSave();const pos=e.target.selectionStart;render();const q=document.getElementById('pq');q.focus();q.setSelectionRange(pos,pos)}
  if(e.target.id==='q'){V.f.q=e.target.value;const pos=e.target.selectionStart;render();const q=document.getElementById('q');q.focus();q.setSelectionRange(pos,pos)}
  if(e.target.id==='mt'){e.target.style.height='auto';e.target.style.height=e.target.scrollHeight+'px'}});
document.addEventListener('change',e=>{
  if(e.target.id==='viewas'||e.target.id==='viewas2'){V.pf=null;V.pg=null;V.calDay=null;D.me=e.target.value;V.side=false;V.card=null;V.pop=null;V.nt=null;home();save();render();return}
  if(V.nt&&e.target.id==='nt-type'){ntSync();render();return}
  if(V.nt&&['nt-due','nt-start','nt-title'].includes(e.target.id)){ntLive();return}
  if(e.target.id==='pg-range'){const P=pgState();P.range=+e.target.value||7;pgSave();render();return}
  if(e.target.id==='pg-dept'){const P=pgState();P.dept=e.target.value;P.k='';pgSave();render();return}
  if(e.target.id==='fb-owner'){V.f.owner=e.target.value;render();return}
  if(e.target.id==='fb-pri'){V.f.pri=e.target.value;render();return}
  if(V.nt&&['nt-dept','nt-board','nt-list'].includes(e.target.id)){ntSync();const n=V.nt;
    if(e.target.id==='nt-dept'){n.dept=e.target.value;n.board=null;n.members=[]}
    if(e.target.id==='nt-board'){n.board=e.target.value;n.list=null;n.members=n.members.filter(m=>ntPool(Object.assign({},n)).includes(m))}
    if(e.target.id==='nt-list')n.list=e.target.value;
    ntDefaults(n);n.members=n.members.filter(m=>ntPool(n).includes(m));n.labels=n.labels.filter(id=>labelsOf(D.boards[n.board]).some(l=>l.id===id));render();return}
  if(e.target.classList&&e.target.classList.contains('prd')&&V.prof&&isCEO()){const x=person(V.prof),dd=Object.assign({},pD(x));if(e.target.value)dd[e.target.dataset.d]=e.target.value;else delete dd[e.target.dataset.d];x.depts=dd;save();render();return}
  if(e.target.id==='dmnew'&&e.target.value){const k2=dmKey(ME(),e.target.value);V.ch=k2;markSeen(k2);save();render();focusSel('#chin');return}
  if(V.gf&&e.target.id==='gf-lvl'){gfSync();V.gf.boards=V.gf.boards.filter(id=>{const b=D.boards[id];return b&&(V.gf.lvl==='company'||b.dept===V.gf.lvl)});render();return}
  if(e.target.classList&&e.target.classList.contains('ppri')){const x=(D.ports||[]).find(q=>q.id===V.port),i=x&&x.items.find(q=>q.b===e.target.dataset.b);if(i){i.pri=e.target.value;save()}return}
  if(e.target.id==='padd'&&e.target.value){const x=(D.ports||[]).find(q=>q.id===V.port);x.items.push({b:e.target.value,pri:'normal'});save();render();return}
  if(e.target.classList&&e.target.classList.contains('capin')){const n=Math.max(1,Math.min(40,+e.target.value||6));(D.cap=D.cap||{})[e.target.dataset.p]=n;save();render();return}
  if(e.target.id&&e.target.id.startsWith('pf-')){const P=pfState(),k=e.target.id.slice(3);P[k]=e.target.value;if(k==='sort')P.dir=PSORT[P.sort]||'desc';pfSave();render();return}
  if(e.target.classList&&e.target.classList.contains('msec')){myState().at[e.target.dataset.k]=e.target.value;save();render();return}
  if(e.target.classList&&(e.target.classList.contains('fname')||e.target.classList.contains('ftype')||e.target.classList.contains('fopts'))){const b=B(),f=(b.fields||[]).find(x=>x.id===e.target.dataset.f);if(!f)return;
    if(e.target.classList.contains('fname'))f.name=e.target.value.trim();
    if(e.target.classList.contains('ftype')){f.type=e.target.value;f.opts=f.opts||[]}
    if(e.target.classList.contains('fopts')){const old=f.opts||[];f.opts=[...new Set(e.target.value.split(/[,،]/).map(x=>x.trim()).filter(Boolean))].map((nm,i)=>{const o=old.find(y=>y.name===nm);return o||{id:uid('o'),name:nm,color:PALETTE[(old.length+i)%PALETTE.length]}})}
    save();render();return}
  if(e.target.id==='emailme'){D.emailOff=D.emailOff||{};D.emailOff[ME()]=!e.target.checked;save();return}
  if(e.target.classList&&e.target.classList.contains('labname')){const L=ensureLabels(B()),l=L.find(x=>x.id===e.target.dataset.lab);if(l){l.name=e.target.value.trim()}save();render();return}
  if(V.nt&&e.target.id==='nt-tpl'){ntSync();const x=(D.cardTpl||[]).find(k=>k.id===e.target.value),n=V.nt;n.tpl=e.target.value;
    if(x){n.title=x.title;n.desc=x.desc||'';n.labels=x.labels.filter(id=>labelsOf(D.boards[n.board]).some(l=>l.id===id));n.pri=x.priority||'normal';n.check=(x.check||[]).join('\n')}render();return}
  const c=V.card&&D.cards[V.card];if(!c)return;
  if(e.target.id==='fileup'){commitModalFields();const fs=[...e.target.files],cid=c.id;(async()=>{for(const f of fs){if(f.size>5*1024*1024){flash(t('tooBig',{f:f.name}));continue}
      const id=await FILES.put(uid('f'),f),c2=D.cards[cid];if(id&&c2){(c2.atts=c2.atts||[]).push({id,name:f.name,type:f.type||'application/octet-stream',size:f.size,by:ME(),at:Date.now()});if(!c2.cover&&/^image\//.test(f.type))c2.cover=id}}
    save();render()})();return}
  if(e.target.id==='cdue'||e.target.id==='cstart'){commitModalFields();const sv=document.getElementById('cstart').value,dv=document.getElementById('cdue').value,tm=x=>x?new Date(x+'T00:00:00').getTime():null;
    if(sv&&dv&&sv>dv){V.dateErr={s:sv,d:dv};render();return}V.dateErr=false;c.start=tm(sv);c.due=tm(dv);save();render()}
  if(e.target.id==='cown'){commitModalFields();c.owner=e.target.value;save();render()}
  if(e.target.id==='ctype'){commitModalFields();if(e.target.value==='task')delete c.type;else c.type=e.target.value;save();render()}
  if(e.target.id==='fadd'&&e.target.value){commitModalFields();(c.follow=c.follow||[]).push(e.target.value);save();render()}
  if(e.target.classList&&e.target.classList.contains('cf')){commitModalFields();(c.f=c.f||{})[e.target.dataset.f]=e.target.value.trim();save();render()}
  if(e.target.classList&&e.target.classList.contains('subw')){commitModalFields();const sb=c.subs[+e.target.dataset.i];sb.who=e.target.value;if(sb.who)notify(sb.who,'subassign',c.id);save();render()}
  if(e.target.classList&&e.target.classList.contains('subd')){commitModalFields();c.subs[+e.target.dataset.i].due=e.target.value?new Date(e.target.value+'T00:00:00').getTime():null;save();render()}
  if(e.target.id==='crep'){commitModalFields();c.repeat=e.target.value;save();render()}
  if(e.target.id==='cpri'){commitModalFields();c.priority=e.target.value;save();render()}
  if(e.target.id==='cmove'){commitModalFields();const to=D.lists[e.target.value];moveCard(c.id,to.id,to.cards.length);render()}
  if(e.target.id==='mt'||e.target.id==='cdesc'){commitModalFields()}});
document.addEventListener('toggle',e=>{if(e.target.id==='nt-det'&&V.nt)V.nt.det=e.target.open},true);
document.addEventListener('focusout',e=>{
  if(V.stale)setTimeout(()=>{const a=document.activeElement;if(V.stale&&!(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))){V.stale=false;render()}},50);
  if(e.target.id==='lname')setTimeout(()=>{if(V.editList&&document.activeElement.id!=='lname')saveListName()},0);
  if(e.target.id==='bname')setTimeout(()=>{if(V.editBoard)saveBoardName()},0);
  if(e.target.id==='secname')setTimeout(()=>{if(V.secEdit&&document.activeElement.id!=='secname')saveSec()},0)});
export const DR: any={d:null,justDropped:false,timer:null,auto:null,x:0,y:0};
document.addEventListener('pointerdown',e=>{
  const myB=V.view==='mine'&&V.mtab==='board';
  if(e.button!==0||V.card||(V.view!=='board'&&!myB))return;
  if(e.target.closest('input,textarea,button,select'))return;
  const card=e.target.closest('.card[data-id]'),head=e.target.closest('.lhead'),col=e.target.closest('.list.col');
  let type,el;if(card){type='card';el=card}else if(!myB&&(head||col)&&canAdmin(B())){type='list';el=(head||col).closest('.list')}else return;
  DR.d={type,id:el.dataset.id,el,sx:e.clientX,sy:e.clientY,started:false,touch:e.pointerType!=='mouse'};DR.x=e.clientX;DR.y=e.clientY;
  if(DR.d.touch)DR.timer=setTimeout(()=>{if(DR.d&&!DR.d.started)start()},300);
});
document.addEventListener('pointermove',e=>{const d=DR.d;if(!d)return;DR.x=e.clientX;DR.y=e.clientY;
  if(!d.started){const m=Math.hypot(e.clientX-d.sx,e.clientY-d.sy);if(d.touch){if(m>10){clearTimeout(DR.timer);DR.d=null}return}if(m<6)return;start()}
  over()});
document.addEventListener('pointerup',end);
document.addEventListener('pointercancel',()=>{if(DR.d&&DR.d.started)end();else{clearTimeout(DR.timer);DR.d=null}});
document.addEventListener('touchmove',e=>{if(DR.d&&DR.d.started)e.preventDefault()},{passive:false});
document.addEventListener('contextmenu',e=>{if(DR.d)e.preventDefault()});
export function start(){const d=DR.d;d.started=true;const r=d.el.getBoundingClientRect();d.ox=d.sx-r.left;d.oy=d.sy-r.top;
  const g=d.el.cloneNode(true);g.classList.add('ghost');g.style.width=r.width+'px';g.style.height=r.height+'px';document.body.appendChild(g);d.g=g;
  const ph=document.createElement('div');ph.className=d.type==='card'?'ph':'lph';ph.style.height=(d.type==='card'?r.height:Math.min(r.height,300))+'px';d.el.after(ph);d.ph=ph;d.el.style.display='none';
  document.body.classList.add('dragging');if(navigator.vibrate&&d.touch)try{navigator.vibrate(15)}catch(x){}
  DR.auto=setInterval(autoScroll,16);over()}
export function over(){const d=DR.d;if(!d||!d.started)return;const x=DR.x,y=DR.y;d.g.style.left=(x-d.ox)+'px';d.g.style.top=(y-d.oy)+'px';
  const cv=document.getElementById('canvas');
  if(d.type==='card'){
    let L=null;document.querySelectorAll('.canvas .list:not(.col)').forEach(l=>{const r=l.getBoundingClientRect();if(x>=r.left-6&&x<=r.right+6)L=l});
    if(!L)return;const box=L.querySelector('.cards');const cs=[...box.querySelectorAll('.card[data-id]')].filter(c=>c!==d.el);
    const before=cs.find(c=>{const r=c.getBoundingClientRect();return y<r.top+r.height/2});
    if(before){if(d.ph.nextSibling!==before)box.insertBefore(d.ph,before)}else{const comp=box.querySelector('.comp,.empty');comp?box.insertBefore(d.ph,comp):box.appendChild(d.ph)}
  }else{
    const ls=[...cv.querySelectorAll(':scope > .list')].filter(l=>l!==d.el);const rtl=lang==='ar';
    const before=ls.find(l=>{const r=l.getBoundingClientRect(),mid=r.left+r.width/2;return rtl?x>mid:x<mid});
    if(before){if(d.ph.nextSibling!==before)cv.insertBefore(d.ph,before)}else{const add=cv.querySelector('.addl');add?cv.insertBefore(d.ph,add):cv.appendChild(d.ph)}
  }}
export function autoScroll(){const d=DR.d;if(!d||!d.started)return;const cv=document.getElementById('canvas');if(!cv)return;const r=cv.getBoundingClientRect(),e=70;
  if(DR.x<r.left+e)cv.scrollLeft-=14;else if(DR.x>r.right-e)cv.scrollLeft+=14;
  if(d.type==='card'){const box=d.ph&&d.ph.closest('.cards');if(box){const b=box.getBoundingClientRect();if(DR.y<b.top+40)box.scrollTop-=10;else if(DR.y>b.bottom-40)box.scrollTop+=10}}
  over()}
export function end(){clearTimeout(DR.timer);const d=DR.d;DR.d=null;if(!d||!d.started)return;clearInterval(DR.auto);document.body.classList.remove('dragging');
  if(d.type==='card'&&V.view==='mine'){const L=d.ph.closest('.list');if(L){myState().at[d.id]=L.dataset.id;save()}}
  else if(d.type==='card'){const L=d.ph.closest('.list');if(L){const idsInDom=[...L.querySelectorAll('.cards > .card[data-id], .cards > .ph')].filter(x=>x!==d.el);const vis=idsInDom.indexOf(d.ph);
      const list=D.lists[L.dataset.id],visIds=idsInDom.filter(x=>x!==d.ph).map(x=>x.dataset.id);const after=visIds[vis-1];
      const full=list.cards.filter(cid=>cid!==d.id);const idx=after?full.indexOf(after)+1:(visIds[0]?full.indexOf(visIds[0]):full.length);
      moveCard(d.id,list.id,idx<0?full.length:idx)}}
  else{const cv=document.getElementById('canvas');const order=[...cv.querySelectorAll(':scope > .list, :scope > .lph')].filter(x=>x!==d.el).map(x=>x===d.ph?d.id:x.dataset.id);B().lists=order;save()}
  d.g.remove();DR.justDropped=true;setTimeout(()=>{DR.justDropped=false},50);render()}
if(LIVE)bootLive();else render();

/** For the browser checks and the console: change a top-level value from outside (as the old page allowed). */
export function __set(name, v) { if (name === 'lang') lang = v; else if (name === 'D') D = v; else if (name === 'PEOPLE') PEOPLE = v; else if (name === 'ASK') ASK = v; }
