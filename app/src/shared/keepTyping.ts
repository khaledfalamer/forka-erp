// @ts-nocheck
/* Keep what people type (same code in every Forka app).
   When a screen is redrawn (a click, moving a card, a refresh from the server), any box that
   still holds text the app has not saved gets that text back, with the cursor where it was.
   Text the app has read and saved (it shows on the page after the redraw) is not put back. */
(function(){
  if(window.__fkKeep||!window.MutationObserver)return;window.__fkKeep=1;
  const TEXT=/^(text|search|email|tel|url|number)$/;
  const isBox=el=>el&&(el.tagName==='TEXTAREA'||(el.tagName==='INPUT'&&TEXT.test(el.type||'text')));
  const GET={},read=new WeakSet();let inInput=0;
  [HTMLInputElement.prototype,HTMLTextAreaElement.prototype].forEach(pr=>{const d=Object.getOwnPropertyDescriptor(pr,'value');GET[pr===HTMLInputElement.prototype?'INPUT':'TEXTAREA']=d.get;
    Object.defineProperty(pr,'value',{configurable:true,enumerable:d.enumerable,get(){if(!inInput)read.add(this);return d.get.call(this)},set(v){d.set.call(this,v)}})});
  const val=el=>GET[el.tagName].call(el);
  addEventListener('input',()=>{inInput=1},true);addEventListener('input',()=>{inInput=0});   // reading while someone types (e.g. @mentions) is not saving
  let last=null;
  // the box someone is in right now (a redraw removes it without a focusout, so it stays set)
  addEventListener('focusin',e=>{if(isBox(e.target))last=e.target},true);
  // leaving for another button or box clears it at once; a redraw removing the box fires focusout with
  // nothing to go to, so it is cleared only after the redraw has been handled
  const caretOf=b=>{try{return [b.selectionStart,b.selectionEnd]}catch(_){return null}};let lastCaret=null;
  addEventListener('focusout',e=>{if(e.target!==last)return;lastCaret=caretOf(last);if(e.relatedTarget)last=null;else{const was=last;setTimeout(()=>{if(last===was&&document.activeElement!==was)last=null},0)}},true);
  const sig=el=>{let s=el.tagName+'|'+(el.type||'')+'|'+(el.id||'')+'|'+(el.getAttribute('name')||'')+'|'+(el.getAttribute('placeholder')||'');
    for(const a of el.attributes)if(a.name.startsWith('data-'))s+='|'+a.name+'='+a.value;return s};
  const ctx=(el,stop)=>{let s='',n=el.parentElement;while(n&&n!==stop){let p=n.id?'#'+n.id:'';for(const a of n.attributes)if(a.name.startsWith('data-'))p+='['+a.name+'='+a.value+']';if(p)s=p+'>'+s;n=n.parentElement}return s};
  const keyOf=(el,stop,base)=>base+'/'+ctx(el,stop)+'/'+sig(el);
  const boxesIn=n=>n.nodeType!==1?[]:(isBox(n)?[n]:[...n.querySelectorAll('input,textarea')].filter(isBox));
  const norm=s=>String(s).replace(/\s+/g,' ').trim();
  new MutationObserver(recs=>{
    const gone=new Map(),seen={};
    recs.forEach(r=>{const base=ctx(r.target,null)+(r.target.id?'#'+r.target.id:'');
      r.removedNodes.forEach(n=>{
        // a removed box keeps its value; its ancestors above the removed node are gone, so the key starts at the parent (r.target)
        boxesIn(n).forEach(b=>{if(b.isConnected)return;const v=val(b);if(v===b.defaultValue||!norm(v))return;
          let k=keyOf(b,null,base);const i=seen[k]=(seen[k]||0)+1;k+='#'+i;gone.set(k,{b,v,def:b.defaultValue,wasRead:read.has(b),focus:b===last,caret:b===last?(lastCaret||caretOf(b)):null})})})});
    if(!gone.size)return;
    const page=norm(document.body.innerText||'');const used={};
    recs.forEach(r=>{const base=ctx(r.target,null)+(r.target.id?'#'+r.target.id:'');
      r.addedNodes.forEach(n=>boxesIn(n).forEach(b=>{if(!b.isConnected)return;let k=keyOf(b,r.target,base);const i=used[k]=(used[k]||0)+1;k+='#'+i;
        const o=gone.get(k);if(!o||val(b)!==b.defaultValue||b.defaultValue!==o.def)return;
        if(o.wasRead&&page.includes(norm(o.v).slice(0,200)))return;     // the app saved it and shows it: do not put it back
        b.value=o.v;read.delete(b);
        if(o.focus&&(document.activeElement===document.body||!document.activeElement)){try{b.focus({preventScroll:true});if(o.caret)b.setSelectionRange(o.caret[0],o.caret[1])}catch(_){}}
      }))});
  }).observe(document.documentElement,{childList:true,subtree:true});
})();
export {};
