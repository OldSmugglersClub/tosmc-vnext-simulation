const assert = require('node:assert/strict');
const nowDates = [
  ['vor 72h + 1ms','2026-11-21T17:29:59.999','2026-11-24T17:30:00',false],
  ['genau 72h','2026-11-21T17:30:00','2026-11-24T17:30:00',true],
  ['71h','2026-11-21T18:30:00','2026-11-24T17:30:00',true],
  ['1h','2026-11-24T16:30:00','2026-11-24T17:30:00',true],
  ['mo in 4t','2026-11-20T17:30:00','2026-11-24T17:30:00',false],
  ['sam in 4t','2026-11-24T15:30:00','2026-11-28T15:30:00',false],
  ['sam in 3t','2026-11-25T15:30:00','2026-11-28T15:30:00',true],
  ['mi in 3t','2026-11-22T21:00:00','2026-11-25T21:00:00',true],
  ['fr in 4t','2026-11-23T20:30:00','2026-11-27T20:30:00',false],
];
function rule(now,eventsForDay) { const day={}; const firstEventStart=Math.min(...eventsForDay.map(event=>event._start.getTime()));
            day.open=(firstEventStart-now.getTime()<=3*24*60*60*1000); return day.open; }
for(const [name,n,e,want] of nowDates) assert.equal(rule(new Date(n),[{_start:new Date(e)}]),want,name);
assert.equal(rule(new Date('2026-11-21T11:00:00'),[{_start:new Date('2026-11-24T18:00:00')},{_start:new Date('2026-11-24T10:00:00')}]),true,'earliest in group');
assert.equal(rule(new Date('2026-11-21T09:59:59'),[{_start:new Date('2026-11-24T18:00:00')},{_start:new Date('2026-11-24T10:00:00')}]),false,'earliest boundary');
console.log('11/11 Zeitgrenz- und Gruppentests bestanden');
