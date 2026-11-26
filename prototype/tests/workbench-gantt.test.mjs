import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync('prototype/index.html','utf8');
const start=html.indexOf('function buildWorkGanttTimeline('),end=html.indexOf('\nfunction ',start+10);
const build=Function(html.slice(start,end)+';return buildWorkGanttTimeline')();
test('uses one date scale for real project periods, today and milestones without mutating data',()=>{
 const projects=[{id:'a',startDate:'2026-09-01',targetDate:'2026-10-15',milestones:[{name:'方案',dueDate:'2026-09-10',status:'进行中'}]},{id:'b',startDate:'2026-09-01',targetDate:'2026-10-15'}];
 const original=JSON.stringify(projects),result=build(projects,'2026-09-18');
 assert.equal(JSON.stringify(projects),original);assert.equal(result.projects[0].startPosition,result.projects[1].startPosition);assert.equal(result.projects[0].endPosition,result.projects[1].endPosition);
 assert.ok(result.todayPosition>result.projects[0].startPosition&&result.todayPosition<result.projects[0].endPosition);assert.equal(result.projects[0].milestones[0].days,8);assert.equal(result.projects[0].milestones[0].overdue,true);
 assert.ok(result.ticks.every(t=>new Date(t.date+'T00:00:00Z').getUTCDay()===1));
});
test('missing, invalid and reversed periods stay unscheduled; same-day period remains valid',()=>{
 const result=build([{id:'none'},{id:'invalid',startDate:'2026-02-30',targetDate:'2026-03-04'},{id:'reversed',startDate:'2026-09-20',targetDate:'2026-09-01'},{id:'same',startDate:'2026-09-18',targetDate:'2026-09-18'}],'2026-09-18');
 assert.deepEqual(result.projects.map(p=>p.scheduled),[false,false,false,true]);assert.equal(result.projects[3].deliveryOverdue,false);assert.equal(build([],'invalid'),null);
});
test('finished milestones and closed projects are not overdue, and axis includes outlying nodes',()=>{
 const result=build([{id:'closed',status:'已完成',startDate:'2026-08-01',targetDate:'2026-09-01',milestones:[{dueDate:'2026-07-01',status:'进行中'}]},{id:'open',startDate:'2026-08-01',targetDate:'2026-09-17',milestones:[{dueDate:'2026-09-10',status:'已完成'},{dueDate:'2026-12-01',status:'未开始'}]}],'2026-09-18');
 assert.equal(result.projects[0].deliveryOverdue,false);assert.equal(result.projects[0].milestones[0].overdue,false);assert.equal(result.projects[1].deliveryDelay,1);assert.equal(result.projects[1].milestones[0].overdue,false);assert.ok(result.projects.flatMap(p=>p.milestones).every(m=>m.position>=0&&m.position<=100));
 assert.ok(result.ticks.length<=10);
});
