// Runs Accounts.gs against simulated Google services. node tests/server_test.js
const fs=require('fs'),vm=require('vm'),crypto=require('crypto'),path=require('path');
class Range{constructor(sh,r,c,nr,nc){Object.assign(this,{sh,r,c,nr,nc})}
  getValues(){const o=[];for(let i=0;i<this.nr;i++){const row=[];for(let j=0;j<this.nc;j++)row.push((this.sh.d[this.r-1+i]||[])[this.c-1+j]??'');o.push(row)}return o}
  setValues(v){v.forEach((row,i)=>{const R=this.sh.d[this.r-1+i]=this.sh.d[this.r-1+i]||[];row.forEach((x,j)=>R[this.c-1+j]=x)});return this}
  setFontWeight(){return this}}
class Sheet{constructor(n){this.n=n;this.d=[]}getName(){return this.n}getLastRow(){return this.d.length}
  getRange(r,c,nr,nc){return new Range(this,r,c,nr||1,nc||1)}appendRow(r){this.d.push(r.slice())}setFrozenRows(){}}
const sheets={};const ss={getSheetByName:n=>sheets[n]||null,insertSheet:n=>(sheets[n]=new Sheet(n))};
const props={GOOGLE_CLIENT_ID:'CID.apps.googleusercontent.com'};const cache={};
const tokens={'tok-ceo':{email:'ceo@forka.com'},'tok-hamim':{email:'store@kuwaitikitchen.com'},'tok-new':{email:'new.person@forka.com',name:'Sara'},'tok-other':{email:'other@forka.com'},'tok-badaud':{email:'ceo@forka.com',aud:'X'},'tok-unver':{email:'ceo@forka.com',ev:'false'}};
const ctx={SpreadsheetApp:{getActive:()=>ss,openById:()=>ss},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]??null,setProperty:(k,v)=>{props[k]=v}})},
 CacheService:{getScriptCache:()=>({put:(k,v)=>cache[k]=v,get:k=>cache[k]??null,remove:k=>delete cache[k]})},
 LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
 ContentService:{createTextOutput:t=>({setMimeType(){return this},t}),MimeType:{JSON:1}},
 UrlFetchApp:{fetch:u=>{const t=decodeURIComponent(u.split('id_token=')[1]);const x=tokens[t];if(!x)return{getResponseCode:()=>400,getContentText:()=>'{}'};
   return{getResponseCode:()=>200,getContentText:()=>JSON.stringify({aud:x.aud||'CID.apps.googleusercontent.com',iss:'https://accounts.google.com',email:x.email,email_verified:x.ev||'true',exp:String(Math.floor(Date.now()/1000)+600),name:x.name||''})}}},
 Utilities:{getUuid:()=>crypto.randomUUID(),DigestAlgorithm:{SHA_256:1},computeDigest:(a,s)=>[...crypto.createHash('sha256').update(s).digest()].map(b=>b>127?b-256:b)},console,Date};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../server/Accounts.gs'),'utf8')+';this.setup=setup;this.doPost=doPost;',ctx);
const call=o=>JSON.parse(ctx.doPost({postData:{contents:JSON.stringify(o)}}).t);
const res=[];const ck=(n,ok,i)=>{res.push(!!ok);console.log((ok?'PASS ':'FAIL ')+n+(ok?'':' - '+JSON.stringify(i)))};
ctx.setup();
ck('Setup creates People/Requests/Activity with 10 people',sheets.People&&sheets.Requests&&sheets.Activity&&sheets.People.d.length===11);
let r=call({action:'google',idToken:'tok-ceo'});ck('CEO signs in with Google',r.ok&&r.token&&r.me.level==='ceo',r);
const ceo=r.token;
ck('CEO opens every app and every Procurement section without ticking (Oman included)',r.me.apps.proc&&r.me.apps.hire&&r.me.apps.branch&&['plan','ops','fin','dept','ceo','oman'].every(x=>r.me.sides.includes(x)),r.me);
{const w=call({action:'who',token:r.token});ck('Procurement "who" gives the CEO every section',w.ok&&w.me.sides.includes('oman'),w)}
ck('CEO receives people, requests and activity',Array.isArray(r.people)&&r.people.length===10&&Array.isArray(r.activity));
ck('No PIN hashes ever sent to the browser',!JSON.stringify(r).includes('pinHash'));
ck('Wrong client id refused',call({action:'google',idToken:'tok-badaud'}).error==='token');
ck('Unverified email refused',call({action:'google',idToken:'tok-unver'}).error==='unverified');
ck('Forged token refused',call({action:'google',idToken:'forged'}).error==='token');
r=call({action:'google',idToken:'tok-hamim'});ck('To-confirm person cannot enter',!r.ok&&r.status==='pending',r);
r=call({action:'setStatus',token:ceo,id:'store@kuwaitikitchen.com',status:'active'});ck('CEO confirms Hamim',r.ok&&r.people.find(p=>p.email==='store@kuwaitikitchen.com').status==='active');
r=call({action:'google',idToken:'tok-hamim'});const ham=r.token;ck('Hamim signs in after confirm',r.ok&&r.me.name==='Hamim',r);
ck('Staff get only themselves (no people list, no activity)',!r.people&&!r.activity&&!r.requests);
ck('Staff cannot change people',call({action:'setStatus',token:ham,id:'ceo@forka.com',status:'blocked'}).error==='role');
r=call({action:'google',idToken:'tok-new'});ck('Unknown email -> request form',r.status==='unknown'&&r.email==='new.person@forka.com',r);
ck('Request needs name and reason',call({action:'request',idToken:'tok-new',name:'',why:''}).error==='need');
r=call({action:'request',idToken:'tok-new',name:'Sara Ali',title:'Accountant',why:'Payments'});ck('Request saved',r.ok&&r.status==='waiting');
ck('Asking again shows waiting',call({action:'google',idToken:'tok-new'}).status==='waiting');
r=call({action:'request',idToken:'tok-other',name:'Omar',why:'x'});
r=call({action:'me',token:ceo});ck('CEO sees 2 waiting requests',r.requests.filter(q=>q.state==='waiting').length===2,r.requests);
r=call({action:'savePerson',token:ceo,id:'',fromReq:'new.person@forka.com',person:{email:'new.person@forka.com',name:'Sara Ali',level:'staff',status:'active',apps:{proc:1},sides:['fin','dept'],method:'google'}});
ck('CEO allows request with Procurement Finance',r.ok&&r.people.find(p=>p.email==='new.person@forka.com').sides.join()==='fin,dept',r);
ck('Request marked approved',r.requests.find(q=>q.email==='new.person@forka.com').state==='approved');
ck('Approved person signs in',call({action:'google',idToken:'tok-new'}).ok);
r=call({action:'reject',token:ceo,id:'other@forka.com',reason:'Not part of the team'});ck('CEO rejects with reason',r.ok);
r=call({action:'google',idToken:'tok-other'});ck('Rejected person sees reason',r.status==='rejected'&&r.reason==='Not part of the team',r);
r=call({action:'savePerson',token:ceo,id:'',person:{name:'Store Helper',method:'pin',pinNew:'12',status:'active',apps:{branch:1}}});ck('Short PIN refused',r.error==='pinBad');
r=call({action:'savePerson',token:ceo,id:'',person:{name:'Store Helper',method:'pin',pinNew:'482916',status:'active',apps:{branch:1}}});ck('PIN person added',r.ok&&r.people.some(p=>p.name==='Store Helper'&&p.method==='pin'&&p.hasPin));
ck('PIN stored only as hash',!JSON.stringify(sheets.People.d).includes('482916'));
r=call({action:'savePerson',token:ceo,id:'',person:{name:'Other',method:'pin',pinNew:'482916',status:'active',apps:{}}});ck('Duplicate PIN refused',r.error==='pinDupe');
r=call({action:'pin',pin:'482916'});ck('PIN person signs in',r.ok&&r.me.name==='Store Helper'&&r.me.apps.branch===1,r);
ck('Wrong PIN refused',call({action:'pin',pin:'000000'}).error==='pin');
for(let i=0;i<9;i++)call({action:'pin',pin:'111'+i+'11'});ck('Ten wrong PINs lock PIN sign-in',call({action:'pin',pin:'482916'}).error==='locked');
props.PIN_LOCK='0';
r=call({action:'savePerson',token:ceo,id:'ceo@forka.com',person:{name:'Khaled Alamer',email:'x@y.com',level:'staff',status:'active',apps:{proc:1},sides:['ceo'],method:'google'}});ck('Cannot remove the last CEO',r.error==='lastCeo');
r=call({action:'savePerson',token:ceo,id:'arman@kuwaitikitchen.com',person:{name:'Arman',email:'hacker@x.com',level:'manager',status:'active',apps:{proc:1,branch:1},sides:['ops','fin'],method:'google'}});
const ar=r.people.find(p=>p.name==='Arman');ck('Clearance change saved and email cannot be swapped',ar&&ar.email==='arman@kuwaitikitchen.com'&&ar.level==='manager'&&ar.apps.branch===1&&ar.sides.join()==='ops,fin',ar);
r=call({action:'setStatus',token:ceo,id:'store@kuwaitikitchen.com',status:'blocked'});
ck('Blocked person session stops working',call({action:'me',token:ham}).error==='session');
call({action:'open',token:ceo,app:'proc'});
const acts=call({action:'me',token:ceo}).activity.map(a=>a.verb);
ck('Activity has sign-ins, confirm, allow, reject, add, edit, block, open',['signin','confirm','allow','reject','add','edit','block','open','req'].every(v=>acts.includes(v)),acts);
{const r1=call({action:'me',token:ceo});ck('Refresh with the same stamp answers "same" without the lists',r1.ver&&(()=>{const r2=call({action:'me',token:ceo,ver:r1.ver});return r2.ok&&r2.same&&!r2.people&&!r2.activity})(),r1.ver);
 call({action:'open',token:ceo,app:'hire'});const r3=call({action:'me',token:ceo,ver:r1.ver});ck('Any change gives a new stamp and the full lists again',r3.ok&&!r3.same&&Array.isArray(r3.people)&&r3.ver!==r1.ver);
 const w=call({action:'who',token:ceo});ck('"who" answers with the person only (for Procurement and Hiring)',w.ok&&w.me.email==='ceo@forka.com'&&!w.people&&!w.activity&&!JSON.stringify(w).includes('pinHash'));
 ck('"who" refuses an unknown session',call({action:'who',token:'nope'}).error==='session');
 let locks=0;const L=ctx.LockService.getScriptLock;ctx.LockService.getScriptLock=()=>{locks++;return L()};call({action:'me',token:ceo});call({action:'who',token:ceo});call({action:'open',token:ceo,app:'proc'});
 ck('Reading and opening apps never wait in the queue',locks===0,locks);
 call({action:'setStatus',token:ceo,id:'arman@kuwaitikitchen.com',status:'active'});ck('Changes still wait in the queue',locks===1,locks);ctx.LockService.getScriptLock=L;
 sheets.People.d.forEach(r=>{if(r[0]==='arman@kuwaitikitchen.com')r[4]='blocked'});ck('People list is cached (Sheet read at most every 5 minutes)',call({action:'who',token:ceo}).ok);}
{const r=call({action:'savePerson',token:ceo,id:'arman@kuwaitikitchen.com',person:{name:'Arman',email:'arman@kuwaitikitchen.com',level:'manager',status:'active',apps:{proc:1},sides:['oman'],method:'google'}});
 ck('CEO can give someone the Oman store section in Procurement',r.ok&&r.people.find(p=>p.email==='arman@kuwaitikitchen.com').sides.join()==='oman',r.error);}
ck('Sign out ends the session',call({action:'signout',token:ceo}).ok&&call({action:'me',token:ceo}).error==='session');
ck('Without a script property the client id in the code is used (other ids refused)',(delete props.GOOGLE_CLIENT_ID,call({action:'google',idToken:'tok-ceo'}).error==='token'));
console.log(`${res.filter(Boolean).length}/${res.length} server checks passed`);process.exit(res.every(Boolean)?0:1);
