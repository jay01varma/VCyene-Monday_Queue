import {priority,cycleCase,short,TODAY} from './rules.js';
import {isEmail,mailtoHref,draftEmail} from './email.js';
const $ = id => document.getElementById(id);
const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statuses=['open','waiting on us','waiting on warehouse','waiting on engineering','waiting on customer','closed'];
const key=id=>'lila-oct5-v1/'+id;
let tickets=[], selected, timer;
const drafts=new Map(), mails=new Map();
function edits(id){return JSON.parse(localStorage.getItem(key(id))||'{}');}
function current(t){
  const e=edits(t.ticket_id);
  // A logged email is a support reply, so it updates who spoke last.
  return {...t,status:e.status||t.status,history:e.history||[],email:e.email||'',
    last_reply_from:e.replied?'support':t.last_reply_from,last_reply_date:e.replied||t.last_reply_date};
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
  const mail=mails.get(selected)||{to:t.email,...draftEmail(t)};
  $('detail').innerHTML=`<small>CASE DETAIL</small><h2>${esc(t.customer)}</h2><div class="meta">${t.ticket_id} · ${t.country} · Firmware ${t.firmware}</div>
  <h3>Customer report</h3><p>${esc(t.issue)}</p><div class="sub">Delivered ${short(t.delivered)} · Opened ${short(t.opened)} · Last message ${short(t.last_reply_date)} (${t.last_reply_from})</div>
  <h3>Next action</h3><p class="action">${esc(t.p.action)} ${esc(t.p.reply)}</p>
  ${links.length?'<h3>Related tickets</h3>'+links.map(x=>`<button class="related" data-id="${x.ticket_id}">${x.ticket_id} · ${x.customer===t.customer?'Same customer':'Similar cycle failure'}</button>`).join(''):''}
  <h3>Case notes</h3>${[t.notes,...t.history].filter(Boolean).map(n=>`<p class="note">${esc(n)}</p>`).join('')||'<p class="sub">No notes yet.</p>'}
  <form class="form" id="edit"><label for="status">Status</label><select id="status">${statuses.map(s=>`<option ${s===(draft.status||t.status)?'selected':''}>${s}</option>`).join('')}</select><label for="note">Add an internal note</label><textarea id="note" placeholder="Record an action or handoff…">${esc(draft.note||'')}</textarea><button class="save">Save changes</button><span class="sub">Saved in this browser. Internal notes do not count as replies.</span></form>
  <form class="form" id="mail" novalidate><h3>Email customer</h3><label for="to">To</label><input id="to" type="email" autocomplete="off" placeholder="customer@example.com" value="${esc(mail.to||'')}"><label for="subject">Subject</label><input id="subject" value="${esc(mail.subject)}"><label for="body">Message</label><textarea id="body" rows="7">${esc(mail.body)}</textarea>
  <p class="sub" id="mailerror" role="alert"></p><button class="save">Open in email app</button>
  ${mail.opened?'<p class="sub">Sent it from your email app? Log it so the queue knows support replied.</p><button type="button" class="save secondary" id="logmail">Log as sent</button>':''}<span class="sub">Opens your email app with this message. Nothing is sent from the desk itself.</span></form>`;
  $('edit').oninput=()=>drafts.set(selected,{status:$('status').value,note:$('note').value});
  $('edit').onsubmit=e=>{
    e.preventDefault();
    try{
      const latest=current(t), note=$('note').value.trim();
      const status=$('status').value===t.status?latest.status:$('status').value;
      localStorage.setItem(key(selected),JSON.stringify({...edits(selected),status,history:note?[...latest.history,note]:latest.history}));
      drafts.delete(selected); render(); announce('Saved changes to '+t.ticket_id+'.');
    }catch{announce('Save failed. Your note is still in the editor.');}
  };
  const readMail=()=>({...mails.get(selected),to:$('to').value,subject:$('subject').value,body:$('body').value});
  $('mail').oninput=()=>mails.set(selected,readMail());
  $('mail').onsubmit=e=>{
    e.preventDefault();
    const m=readMail();
    const problem=!isEmail(m.to)?'Enter a valid customer email address.':!m.subject.trim()?'Add a subject.':!m.body.trim()?'Write a message.':'';
    if(problem){$('mailerror').textContent=problem;$(!isEmail(m.to)?'to':!m.subject.trim()?'subject':'body').focus();return;}
    mails.set(selected,{...m,opened:true});
    location.href=mailtoHref(m.to,m.subject,m.body);
    render(); announce('Opened your email app for '+t.ticket_id+'.');
  };
  if($('logmail')) $('logmail').onclick=()=>{
    try{
      const m=mails.get(selected), latest=current(t);
      const entry='Emailed '+m.to.trim()+' on '+short(TODAY)+' · '+m.subject.trim()+'\n'+m.body.trim();
      localStorage.setItem(key(selected),JSON.stringify({...edits(selected),email:m.to.trim(),replied:TODAY,history:[...latest.history,entry]}));
      mails.delete(selected); render(); announce('Logged email reply on '+t.ticket_id+'.');
    }catch{announce('Could not log the email. Your message is still in the editor.');}
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
