import {priority,cycleCase,short} from './rules.js';
const $ = id => document.getElementById(id);
const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statuses=['open','waiting on us','waiting on warehouse','waiting on engineering','waiting on customer','closed'];
const key=id=>'lila-oct5-v1/'+id;
let tickets=[], selected, timer;
const drafts=new Map();
function current(t){
  const edits=JSON.parse(localStorage.getItem(key(t.ticket_id))||'{}');
  return {...t,status:edits.status||t.status,history:edits.history||[]};
}
function announce(message){
  $('feedback').textContent=message;
  clearTimeout(timer); timer=setTimeout(()=>$('feedback').textContent='',4500);
}
function openTicket(id){
  selected=id;
  if($('filter').value!=='All' && !visible(current(tickets.find(t=>t.ticket_id===id)))) $('filter').value='All';
  render();
  if(innerWidth<761) $('detail').scrollIntoView({behavior:'smooth'});
}
function visible(t){return $('filter').value==='All'||(($('filter').value==='Closed')===(t.status==='closed'));}
function render(){
  const all=tickets.map(current);
  const rows=all.filter(visible).map(t=>({...t,p:priority(t)})).sort((a,b)=>a.p.rank-b.p.rank || (a.p.due||'').localeCompare(b.p.due||'') || a.ticket_id.localeCompare(b.ticket_id));
  if(!rows.some(t=>t.ticket_id===selected)) selected=rows[0]?.ticket_id;
  $('count').textContent=all.filter(t=>t.status!=='closed').length+' active · '+all.length+' tickets';
  $('list').innerHTML=rows.map(t=>`<button type="button" class="item" data-id="${t.ticket_id}" aria-pressed="${t.ticket_id===selected}"><span class="rowtop"><span class="rowname">${esc(t.customer)}</span><span class="tag ${t.p.rank<4?'urgent':''}">${t.p.label}</span></span><span class="id">${t.ticket_id} · ${esc(t.status)}</span><p>${esc(t.p.action)}</p><span class="sub">${esc(t.p.reply)}</span></button>`).join('')||'<p class="empty">No tickets in this view.</p>';
  const t=rows.find(t=>t.ticket_id===selected);
  if(!t){$('detail').innerHTML='<p>Select another view to see tickets.</p>';return;}
  const links=all.filter(x=>x.ticket_id!==selected && (x.customer===t.customer || (cycleCase(t)&&cycleCase(x))));
  const draft=drafts.get(selected)||{};
  $('detail').innerHTML=`<small>CASE DETAIL</small><h2>${esc(t.customer)}</h2><div class="meta">${t.ticket_id} · ${t.country} · Firmware ${t.firmware}</div>
  <h3>Customer report</h3><p>${esc(t.issue)}</p><div class="sub">Delivered ${short(t.delivered)} · Opened ${short(t.opened)} · Last message ${short(t.last_reply_date)} (${t.last_reply_from})</div>
  <h3>Next action</h3><p class="action">${esc(t.p.action)} ${esc(t.p.reply)}</p>
  ${links.length?'<h3>Related tickets</h3>'+links.map(x=>`<button class="related" data-id="${x.ticket_id}">${x.ticket_id} · ${x.customer===t.customer?'Same customer':'Similar cycle failure'}</button>`).join(''):''}
  <h3>Case notes</h3>${[t.notes,...t.history].filter(Boolean).map(n=>`<p class="note">${esc(n)}</p>`).join('')||'<p class="sub">No notes yet.</p>'}
  <form class="form" id="edit"><label for="status">Status</label><select id="status">${statuses.map(s=>`<option ${s===(draft.status||t.status)?'selected':''}>${s}</option>`).join('')}</select><label for="note">Add an internal note</label><textarea id="note" placeholder="Record an action or handoff…">${esc(draft.note||'')}</textarea><button class="save">Save changes</button><span class="sub">Saved in this browser. Internal notes do not count as replies.</span></form>`;
  $('edit').oninput=()=>drafts.set(selected,{status:$('status').value,note:$('note').value});
  $('edit').onsubmit=e=>{
    e.preventDefault();
    try{
      const latest=current(t), note=$('note').value.trim();
      const status=$('status').value===t.status?latest.status:$('status').value;
      localStorage.setItem(key(selected),JSON.stringify({status,history:note?[...latest.history,note]:latest.history}));
      drafts.delete(selected); render(); announce('Saved changes to '+t.ticket_id+'.');
    }catch{announce('Save failed. Your note is still in the editor.');}
  };
}
document.addEventListener('click',e=>{const btn=e.target.closest('[data-id]');if(btn)openTicket(btn.dataset.id);});
$('filter').onchange=render;
try{
  const response=await fetch('./tickets.csv');
  if(!response.ok) throw Error();
  const lines=(await response.text()).trimEnd().split(/\r?\n/);
  const headers=lines.shift().split(',');
  tickets=lines.map(line=>{
    const fields=Array.from((','+line).matchAll(/,(?:"((?:[^"]|"")*)"|([^,]*))/g),m=>(m[1]??m[2]).replaceAll('""','"'));
    return Object.fromEntries(headers.map((h,i)=>[h,fields[i]]));
  });
  render();
}catch{$('list').textContent='Queue unavailable. Enable browser storage and reload this page.';}
