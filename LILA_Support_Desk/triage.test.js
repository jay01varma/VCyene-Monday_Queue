import test from 'node:test';
import assert from 'node:assert/strict';
import {addDays,replyDue,cycleCase} from './dist/rules.js';
test('Friday, Saturday and Sunday replies are due Monday',()=>{
  for(const day of ['02','03','04']) assert.equal(replyDue('2026-10-'+day),'2026-10-05');
});
test('policy deadlines use calendar days',()=>{
  assert.equal(addDays('2026-09-22',14),'2026-10-06');
  assert.equal(addDays('2026-08-25',30),'2026-09-24');
});
test('engineering groups pauses and stops, not amber alone',()=>{
  const check=issue=>cycleCase({firmware:'2.4.1',issue});
  assert.ok(check('Unit pauses mid-cycle and the light blinks amber.'));
  assert.ok(check('Stops after about an hour.'));
  assert.equal(check('Amber light is blinking. Unit seems to run normally.'),false);
  assert.equal(check('Cannot connect to Wi-Fi during setup.'),false);
});
import {isEmail,mailtoHref,draftEmail} from './dist/email.js';
test('customer email addresses are validated',()=>{
  assert.ok(isEmail('maya.okafor@example.ca'));
  for(const bad of ['', 'maya', 'maya@', 'a@b', 'a b@c.com', 'a@b.com,c@d.com']) assert.equal(isEmail(bad),false,bad);
});
test('mailto links encode subject and body with CRLF line breaks',()=>{
  const href=mailtoHref(' maya@example.ca ','Re: refund & return (T-101)','Hi Maya,\nLine two?');
  assert.equal(href,'mailto:maya@example.ca?subject=Re%3A%20refund%20%26%20return%20(T-101)&body=Hi%20Maya%2C%0D%0ALine%20two%3F');
});
test('drafts greet the customer by first name and cite the ticket',()=>{
  const d=draftEmail({customer:'Maya Okafor',ticket_id:'T-101'});
  assert.match(d.subject,/T-101/);
  assert.match(d.body,/^Hi Maya,/);
});
