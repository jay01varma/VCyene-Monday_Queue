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
