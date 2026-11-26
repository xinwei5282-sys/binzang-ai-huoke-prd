import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync('prototype/index.html','utf8');
const start=html.indexOf('function getWorkCalendarDays('),end=html.indexOf('\nfunction ',start+10);
assert.notEqual(start,-1,'getWorkCalendarDays must be present in prototype/index.html');
const getWorkCalendarDays=Function(html.slice(start,end)+';return getWorkCalendarDays')();

test('returns the Monday-to-Sunday week with Friday marked as today',()=>{
 const baseDate=new Date(2026,8,18);
 const original=baseDate.getTime();
 const days=getWorkCalendarDays(baseDate);
 assert.deepEqual(days.map(day=>day.date),['2026-09-14','2026-09-15','2026-09-16','2026-09-17','2026-09-18','2026-09-19','2026-09-20']);
 assert.deepEqual(days.map(day=>day.label),['9月14日','9月15日','9月16日','9月17日','9月18日','9月19日','9月20日']);
 assert.deepEqual(days.map(day=>day.weekday),['周一','周二','周三','周四','周五','周六','周日']);
 assert.deepEqual(days.map(day=>day.isToday),[false,false,false,false,true,false,false]);
 assert.equal(baseDate.getTime(),original);
});

test('keeps today semantics tied to the supplied date for both week offsets',()=>{
 const baseDate=new Date(2026,8,18);
 const previous=getWorkCalendarDays(baseDate,-1);
 const next=getWorkCalendarDays(baseDate,1);
 assert.equal(previous[0].date,'2026-09-07');
 assert.equal(previous[6].date,'2026-09-13');
 assert.equal(next[0].date,'2026-09-21');
 assert.equal(next[6].date,'2026-09-27');
 assert.ok(previous.every(day=>day.isToday===false));
 assert.ok(next.every(day=>day.isToday===false));
});

test('handles Sunday and Monday bases without shifting the week boundary',()=>{
 const monday=getWorkCalendarDays(new Date(2026,8,14));
 const sunday=getWorkCalendarDays(new Date(2026,8,20));
 assert.equal(monday[0].date,'2026-09-14');
 assert.equal(monday[0].isToday,true);
 assert.equal(sunday[0].date,'2026-09-14');
 assert.equal(sunday[6].isToday,true);
});

test('handles leap day across a year boundary',()=>{
 const days=getWorkCalendarDays(new Date(2020,1,29));
 assert.deepEqual(days.map(day=>day.date),['2020-02-24','2020-02-25','2020-02-26','2020-02-27','2020-02-28','2020-02-29','2020-03-01']);
 assert.equal(days[5].label,'2月29日');
 assert.equal(days[5].weekday,'周六');
 assert.equal(days[5].isToday,true);

 const yearBoundary=getWorkCalendarDays(new Date(2021,0,1));
 assert.deepEqual(yearBoundary.map(day=>day.date),['2020-12-28','2020-12-29','2020-12-30','2020-12-31','2021-01-01','2021-01-02','2021-01-03']);
});

test('agenda keeps date groups, orders exact times, and excludes other weeks',()=>{
 const from=html.indexOf('function renderWorkTaskCalendar('),to=html.indexOf('\nfunction ',from+10);
 const days=getWorkCalendarDays(new Date(2026,8,8));
 const render=Function('getWorkCalendarDays','workHubState','safeText','canEditWorkTaskSchedule','workTaskDragAttributes','workTaskCalendarAction',html.slice(from,to)+';return renderWorkTaskCalendar')(()=>days,{},String,()=>true,()=> ' draggable="true"',()=> 'data-act="schedule-work-task"');
 const tasks=[
  {id:'late',title:'下午任务',scheduledDate:'2026-09-08',scheduledTime:'14:30',status:'pending'},
  {id:'other-week',title:'其他周任务',scheduledDate:'2026-09-15',scheduledTime:'09:00',status:'pending'},
  {id:'early',title:'上午任务',scheduledDate:'2026-09-08',scheduledTime:'09:15',status:'pending'},
  {id:'no-time',title:'时间待定',scheduledDate:'2026-09-08',status:'pending'}
 ];
 const original=JSON.stringify(tasks),result=render(tasks);
 assert.equal((result.match(/data-task-calendar-date=/g)||[]).length,7);
 assert.ok(result.indexOf('data-task-id="early"')<result.indexOf('data-task-id="late"'));
 assert.ok(result.indexOf('data-task-id="late"')<result.indexOf('data-task-id="no-time"'));
 assert.match(result,/09:15/);assert.match(result,/14:30/);assert.match(result,/待定/);
 assert.doesNotMatch(result,/data-task-id="other-week"/);assert.match(result,/1 项待办不在所选周/);
 assert.match(render([]),/这一周暂无日程/);
 assert.equal(JSON.stringify(tasks),original);
});
