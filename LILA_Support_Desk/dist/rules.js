export const TODAY = '2026-10-05';
export function addDays(day, n) {
  const date = new Date(day + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
}
export function replyDue(day) {
  let due = addDays(day, 1);
  while ([0,6].includes(new Date(due+'T12:00:00Z').getUTCDay())) due = addDays(due, 1);
  return due;
}
export const short = date => new Date(date+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'});
export function cycleCase(t) {
  return t.firmware === '2.4.1' && /stop|pauses/i.test(t.issue);
}
// Operator triage of the supplied cases. Lower rank is handled first.
export function priority(t) {
  let due = t.last_reply_from === 'customer' ? replyDue(t.last_reply_date) : '';
  let rank = due && due < TODAY ? 4 : 6;
  let action = '';
  switch (t.ticket_id) {
    case 'T-104': rank=0; action='File carrier claim with attached photos by '+short(addDays(t.delivered,14))+'.'; break;
    case 'T-101': case 'T-109': rank=1; action='Third contact. Reply once across both threads. Refund window ended '+short(addDays(t.delivered,30))+'.'; break;
    case 'T-108': rank=2; action='Send return label. Request is in window through '+short(addDays(t.delivered,30))+'.'; break;
    case 'T-110': rank=3; action='Sep 26 replacement promise missed. Ask fulfillment to allocate a unit and update Hannah.'; break;
    case 'T-105': rank=5; action='Ask warehouse to confirm Sep 26 delivery before releasing refund. Update Grace.'; break;
    case 'T-106': action='Help Samir complete Wi-Fi setup.'; break;
    case 'T-107': action='Offer onboarding times this week.'; break;
    case 'T-111': action='Send ordering instructions.'; break;
    case 'T-112': action='Check amber indicator on 2.4.0. Cycle still runs.'; break;
    default: action=cycleCase(t) ? 'Collect cycle diagnostics for Wei.' : 'Review customer request.';
  }
  if(t.status==='closed') return {rank:9,label:'Closed',action:'Review case history.',due:'',reply:''};
  const labels=['Claim deadline','Repeat contact','Refund window','Missed promise','Reply overdue','Refund on hold','Reply today'];
  let reply = due ? (due<TODAY ? 'Reply overdue since '+short(due) : 'Reply due '+short(due)) : 'Last reply by support · '+short(t.last_reply_date);
  return {rank,label:labels[rank],action,due,reply};
}
