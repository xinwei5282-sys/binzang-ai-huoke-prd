(() => {
  const stages=[
    ['售前','方案与报价确认','客户确认合作意向和初步范围'],
    ['合同','合同签署','签署版合同明确范围、时间和验收约定'],
    ['项目启动','交付与项目分工确认','项目负责人已接手，团队分工与交付计划已确认'],
    ['产品设计','产品方案评审','需求、产品方案和开发范围已确认'],
    ['开发与联调','开发完成并提测','功能完成，关键接口与依赖通过联调'],
    ['测试与上线准备','测试通过及上线评审','严重问题已关闭，上线条件已确认'],
    ['上线','生产发布与运行验证','生产发布完成，关键功能运行正常'],
    ['验收与移交','客户验收和交付移交','验收结果、资料及后续支持责任已确认']
  ];
  const dateAfter = (days=0) => {
    const date=new Date();
    date.setDate(date.getDate()+days);
    return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
  };
  const accountName=id=>Object.values(WORK_HUB_ACCOUNT_TEMPLATES).find(account=>account.id===id)?.name || AI_HUOKE_MEMBERS.find(member=>member.accountId===id)?.name || '待指定';
  const storageKey=project=>`projectProgress.v1.${project.tenantId}.${project.id}`;
  const taskTemplates=[
    ['确认客户需求','提交方案与报价'],
    ['确认交付范围与验收标准','完成审批与客户签署'],
    ['移交合同与验收约定','确认项目负责人和团队分工'],
    ['澄清需求范围','完成产品方案评审','确认开发范围'],
    ['完成关键功能开发','完成接口联调并提测'],
    ['完成回归测试并关闭严重问题','确认上线方案与回退安排'],
    ['完成生产发布','验证关键功能与运行状态'],
    ['完成客户验收','移交资料和后续支持责任']
  ];
  function keyTasks(step,index,project){
    if(step.tasks)return step.tasks.map(task=>task.id==='stage-task-'+index
      ? {...task,start:task.start??step.start,plan:task.plan??step.plan}:task);
    const sample=['proj-growth','proj-ops'].includes(project.id);
    const start=Date.parse(step.start), end=Date.parse(step.plan);
    const titles=taskTemplates[index];
    return titles.map((title,i)=>{
      const bounds=Number.isFinite(start)&&Number.isFinite(end)&&start<=end;
      const dateAtOffset=offset=>dateAt(start+Math.round((end-start)/dayMs*offset/titles.length)*dayMs);
      return {id:'template-'+index+'-'+i,title,owner:step.owner,
        start:bounds?dateAtOffset(i):'',plan:bounds?dateAtOffset(i+1):i===titles.length-1?step.plan:'',
        required:true,status:step.status==='done'||(project.id==='proj-ops'&&index===4&&i===0)?'done':i===titles.length-1&&step.status==='blocked'?'blocked':sample&&i===0&&step.status==='active'?'active':'waiting',
        forecast:i===titles.length-1?step.forecast:'',impact:i===titles.length-1&&step.reason?step.reason:'',
        dependency:i?'template-'+index+'-'+(i-1):''};
    });
  }
  function migrateSteps(saved,project){
    const old=saved.steps;
    const empty=(reference,done)=>({owner:reference.owner||project.ownerAccountId,status:done?'done':'waiting',
      start:'',plan:'',forecast:'',reason:'',evidence:''});
    // Preserve old records and only infer predecessor status where the old flow already progressed.
    const starting=old[2].status==='handoff';
    const kickoff=empty(old[2],!['waiting','handoff'].includes(old[2].status));
    if(starting)kickoff.status='handoff';
    const deliveryStarted=old[4].status!=='waiting';
    return {...saved,steps:[
      old[0],old[1],kickoff,starting?{...old[2],status:'waiting'}:old[2],old[3],
      empty(old[4],deliveryStarted),empty(old[4],deliveryStarted),old[4]
    ]};
  }
  function withBaseline(state){
    return {...state,steps:state.steps.map(step=>({...step,baseline:step.baseline||{start:step.start||'',plan:step.plan||''}}))};
  }
  function repairTeamDemoSnapshot(project, saved) {
    const demo = window.projectTeamDailyDemo;
    if (project.id !== demo?.project.id || !saved.stageMaterials) return saved;
    const borrowed = window.projectAcceptanceDemo?.progress;
    let repaired = false;
    for (const [index, entry] of Object.entries(saved.stageMaterials)) {
      if (entry.evidence !== borrowed?.stageMaterials?.[index]?.evidence || !entry.evidence) continue;
      const seed = demo.progress.stageMaterials[index];
      if (seed) saved.stageMaterials[index] = { ...structuredClone(seed), items: { ...seed.items, ...entry.items } };
      else if (Object.keys(entry.items || {}).length) saved.stageMaterials[index] = { ...entry, evidence: saved.steps[index].evidence || '本项目草稿' };
      else delete saved.stageMaterials[index];
      repaired = true;
    }
    if (repaired) {
      const oldEntries = new Set(borrowed.history.map(entry => JSON.stringify(entry)));
      saved.history = [...demo.progress.history, ...(saved.history || []).filter(entry => !oldEntries.has(JSON.stringify(entry)))];
    }
    return saved;
  }
  function read(project){
    try {
      const saved=JSON.parse(localStorage.getItem(storageKey(project)));
      if(saved?.steps?.length===stages.length){
        if(project.stageOwners){
          for(const step of saved.steps){
            if(step.status!=='waiting')continue;
            step.status='active';
            step.tasks=step.tasks.map(task=>({...task,status:'active'}));
          }
        }
        return withBaseline(repairTeamDemoSnapshot(project,saved));
      }
      if(saved?.steps?.length===5)return withBaseline(migrateSteps(saved,project));
    } catch {}
    if(project.id===window.projectAcceptanceDemo?.project.id)return withBaseline(structuredClone(window.projectAcceptanceDemo.progress));
    if(project.id===window.projectTeamDailyDemo?.project.id)return withBaseline(structuredClone(window.projectTeamDailyDemo.progress));
    if(project.stageOwners)return withBaseline({steps:stages.map(([label],index)=>{
      const {start='',plan=''}=project.stageSchedule?.[index]||{};
      return {
        owner:project.stageOwners[index],status:'active',start,plan,forecast:'',reason:'',evidence:'',
        tasks:[{id:'stage-task-'+index,title:'完成'+label,owner:project.stageOwners[index],status:'active',required:true}]
      };
    }),history:[],stageReports:[]});
    const growth=project.id==='proj-growth', ops=project.id==='proj-ops';
    const acceptance=project.id==='proj-portal-demo';
    const sample=growth||ops||acceptance;
    const current=growth?2:ops?4:acceptance?7:0;
    return withBaseline({steps:stages.map((_,index)=>({
      status:index<current?'done':index>current?'waiting':growth?'handoff':ops?'blocked':'active',
      owner:growth && (index===2||index===3)?'acct-supervisor':(index===5 && ops || index===7 && acceptance)?'acct-other-supervisor':project.ownerAccountId,
      start:sample?dateAfter((index-current)*7+(ops?-8:-3)):'',
      plan:sample?dateAfter((index-current)*7+(ops?-2:3)):'',
      forecast:index===current && ops?dateAfter(1):'',
      completed:acceptance&&index<current?dateAfter((index-current)*7+3):'',
      evidence:index<current?'演示记录 · '+stages[index][2]:'',
      reason:index===current && ops?'联调环境待确认，影响提测和上线计划':''
    })),history:[]});
  }
  const handoffFields=[['signedContract','已签合同编号或链接'],['scope','交付范围'],['acceptance','验收约定']];
  function needsContract(project,state,index){
    return index===2&&Boolean(project.customerId)&&!handoffFields.every(([key])=>String(state.contractHandoff?.[key]||'').trim());
  }
  function pendingTasks(project,step,index){
    return keyTasks(step,index,project).filter(task=>task.required!==false&&task.status!=='done');
  }
  function projectedFinish(project,step,index){
    if(step.status==='done')return '';
    const forecasts=pendingTasks(project,step,index).map(task=>task.forecast).filter(Boolean);
    if(step.forecast)forecasts.push(step.forecast);
    return forecasts.sort().at(-1)||'';
  }
  function affectedStages(state,index,forecast){
    const affected=[];
    let previous=forecast;
    for(let i=index+1;i<state.steps.length&&previous;i++){
      const next=state.steps[i];
      if(next.status==='done')continue;
      if(!next.start||!next.plan)break;
      const delay=Math.max(0,Math.round((Date.parse(previous)-Date.parse(next.start))/dayMs)+1);
      if(!delay)break;
      const finish=dateAt(Date.parse(next.plan)+delay*dayMs);
      affected.push({index:i,delay,start:dateAt(Date.parse(next.start)+delay*dayMs),finish});
      previous=finish;
    }
    return affected;
  }
  function summary(project){
    const state=read(project);
    const index=state.steps.findIndex(step=>step.status!=='done');
    if(index<0){
      const waiting=project.stageOwners&&project.lifecycleStage==='待验收';
      return {state,index,stage:waiting?'待验收':'已交付',signals:waiting?['结项条件待满足']:[],impact:[],severity:waiting?2:0};
    }
    const step=state.steps[index], signals=[];
    const tasks=keyTasks(step,index,project);
    const blocked=step.status==='blocked'||tasks.some(task=>task.status==='blocked');
    if(state.pause)signals.push('项目已暂停');
    if(state.releaseRecovery)signals.push('上线回退，待重新验证');
    if(blocked)signals.push('有阻塞');
    if(tasks.some(task=>task.status!=='done'&&task.plan&&task.plan<dateAfter()))signals.push('关键任务逾期');
    if(step.plan && step.plan<dateAfter())signals.push('已逾期');
    const forecast=projectedFinish(project,step,index);
    const baseline=step.baseline.plan||step.plan;
    if(baseline&&forecast>baseline)signals.push('预计延期 '+Math.round((Date.parse(forecast)-Date.parse(baseline))/dayMs)+' 天');
    if(step.intervention?.status==='handling')signals.push('已安排处理');
    const impact=affectedStages(state,index,forecast);
    if(step.status==='handoff')signals.push('待接手');
    if(!step.owner)signals.push('待指定负责人');
    return {state,index,step,forecast,impact,stage:stages[index][0],milestone:stages[index][1],signals,severity:(blocked?8:0)+(signals.includes('已逾期')?4:0)+signals.length};
  }
  const statuses={done:'已完成',waiting:'未开始',handoff:'待接手',blocked:'阻塞',active:'进行中'};
  const dayMs=86400000;
  const dateLabel=date=>date.slice(5).replace('-','/');
  const dateAt=day=>new Date(day).toISOString().slice(0,10);
  const viewPreferences=new Map();
  const expandedStages=new Set();
  document.addEventListener('toggle',event=>{
    const key=event.target.dataset?.schedulePhase;
    if(!key || !event.target.isConnected)return;
    if(event.target.open)expandedStages.add(key);else expandedStages.delete(key);
  },true);
  const events=[
    ['plan','计划截止','planned'],['forecast','预计完成','forecast'],['completed','实际完成','complete']
  ];
  const calendarEventsTypes=[['start','计划开始','start'],...events];
  function preference(key){
    if(!viewPreferences.has(key))viewPreferences.set(key,{mode:key==='portfolio'?'list':'gantt',month:'',showTasks:false});
    return viewPreferences.get(key);
  }
  function viewButtons(key){
    const {mode}=preference(key);
    const options=key==='portfolio'?[['list','列表']]:[];
    options.push(['gantt','甘特图'],['calendar','日历']);
    return `<div class="schedule-switch" role="group" aria-label="排期视图">${options.map(([value,label])=>`<button type="button" class="btn sm gho view-toggle" data-act="progress-view" data-view-key="${safeText(key)}" data-view-value="${value}" aria-pressed="${mode===value}">${label}</button>`).join('')}</div>`;
  }
  const legend=items=>`<div class="schedule-legend">${items.map(([tone,label])=>`<span><i class="schedule-key ${tone}"></i>${label}</span>`).join('')}</div>`;
  function scheduleRows(project,progress){
    return progress.state.steps.map((step,index)=>({step,project,index,current:index===progress.index,tasks:keyTasks(step,index,project)}));
  }
  function projectScheduleWorkTasks(project){
    syncProjectMilestoneTasks(project);
    const tasks=WORK_HUB_TASKS.filter(task=>task.projectId===project.id&&canScheduleWorkTask(task)&&canCurrentAccountSeeWorkItem(task));
    return tasks.concat(window.projectFlowDemo.tasks().filter(task=>task.projectId===project.id&&task.scheduledDate));
  }
  function gantt(groups,portfolio){
    const sharedTasks=new Map(groups.map(({project})=>[project.id,projectScheduleWorkTasks(project)]));
    const entries=groups.flatMap(group=>group.rows);
    const today=Date.parse(dateAfter());
    const dates=entries.flatMap(({step,tasks})=>[step,...tasks]).flatMap(item=>[item.start,item.plan,item.forecast,item.completed,item.baseline?.plan]).concat([...sharedTasks.values()].flat().map(task=>task.scheduledDate)).map(Date.parse).filter(Number.isFinite);
    const first=Math.min(today,...dates)-2*dayMs;
    const last=Math.max(today+5*dayMs,...dates)+2*dayMs;
    const tickEvery=Math.max(1,Math.ceil((last-first)/dayMs/7));
    const ticks=Array.from({length:Math.floor((last-first)/dayMs/tickEvery)+1},(_,i)=>first+i*tickEvery*dayMs);
    const position=date=>100*(Date.parse(date)-first)/(last-first);
    const mark=(date,tone,label)=>date?`<span class="schedule-mark ${tone}" style="left:${position(date)}%" title="${label} ${safeText(date)}"></span>`:'';
    const grid=ticks.map(day=>`<i class="schedule-gridline" style="left:${position(dateAt(day))}%" aria-hidden="true"></i>`).join('');
    const todayLine=`<i class="schedule-today" style="left:${position(dateAt(today))}%" aria-hidden="true"></i>`;
    function track(item,dragData,phase=false){
      const period=item.start && item.plan && item.start<=item.plan;
      const handle=(field,label)=>dragData&&item[field]?`<span class="gantt-drag-handle ${field}${item.start===item.plan?' same-day':''}" data-gantt-gesture="${field}" ${dragData} style="left:${position(item[field])}%" title="${label} ${safeText(item[field])}"></span>`:'';
      const bar=period?`<span class="schedule-bar ${item.status}" ${dragData?'data-gantt-gesture="move" '+dragData:''} style="left:${position(item.start)}%;width:max(3px,calc(${Math.max(0.6,position(item.plan)-position(item.start))}% + var(--gesture-width,0px)))" title="${safeText(item.start+' 至 '+item.plan)}"></span>`:'';
      const delay=item.plan && item.forecast>item.plan?`<i class="schedule-delay" style="left:${position(item.plan)}%;width:${position(item.forecast)-position(item.plan)}%"></i>`:'';
      const dates=[item.start&&'开始 '+item.start,...events.map(([field,label])=>item[field]&&label+' '+item[field])].filter(Boolean).join(' · ');
      return `<div class="schedule-track" data-gantt-days="${(last-first)/dayMs}" data-start-date="${safeText(item.start||'')}" data-plan-date="${safeText(item.plan||'')}" data-forecast-date="${safeText(item.forecast||'')}" aria-label="${safeText(dates||'未排期')}">${grid}${todayLine}${bar}${delay}${phase?mark(item.completed,'complete','实际完成'):events.map(([field,label,tone])=>mark(item[field],tone,label)).join('')}${handle('start','拖动开始')}${handle('plan','拖动截止')}${dates?'':'<small class="schedule-unplanned">未排期</small>'}</div>`;
    }
    function row({step,index,current,project,tasks}){
      const key=(portfolio?'portfolio:':'detail:')+project.id+':'+index;
      const canSchedule=canManageProjectLifecycle(project);
      const manage=!portfolio&&canSchedule;
      const dragData=(taskId='')=>canSchedule?`data-project-id="${safeText(project.id)}" data-stage-index="${index}" data-key-task-id="${safeText(taskId)}" data-schedule-surface="${portfolio?'portfolio':'detail'}"`:'';

      const button=(label,taskId='')=>`<button class="btn sm gho" data-act="progress-task-edit" data-project-id="${safeText(project.id)}" data-stage-index="${index}" data-key-task-id="${safeText(taskId)}">${label}</button>`;
      const scheduleButton=(taskId='')=>canSchedule?`<button type="button" class="btn sm gho schedule-date-button" data-act="progress-schedule" data-project-id="${safeText(project.id)}" data-stage-index="${index}" data-key-task-id="${safeText(taskId)}" data-schedule-surface="${portfolio?'portfolio':'detail'}" aria-label="改排期 · ${safeText(taskId?tasks.find(item=>item.id===taskId)?.title:stages[index][0])}">改排期</button>`:'';
      const required=tasks.filter(task=>task.required!==false);
      const finished=tasks.filter(task=>task.status==='done').length;
      const milestoneStatus=step.status==='done'?'已确认':!current?'未到确认节点':step.status==='active'&&required.every(task=>task.status==='done')?'待确认':'未确认';
      const forecast=projectedFinish(project,step,index);
      const baseline=step.baseline.plan||step.plan;
      const slip=baseline&&forecast>baseline?Math.round((Date.parse(forecast)-Date.parse(baseline))/dayMs):0;
      const next=stages[index+1]?.[0];
      const milestoneDates=[baseline&&'原定 '+baseline,step.plan&&step.plan!==baseline&&'当前 '+step.plan,forecast&&'预计 '+forecast,step.completed&&'实际 '+step.completed].filter(Boolean);
      const milestone=`<div class="schedule-row schedule-milestone-row"><div class="schedule-row-title"><b><i class="schedule-inline-diamond"></i>${stages[index][1]}</b><span class="bdg ${step.status==='done'?'ok':slip?'warn':'mut'}">${milestoneStatus}</span>
        <small>${stages[index][2]}</small><small>${safeText(milestoneDates.join(' · ')||'日期待确认')}</small>
        ${slip?`<small class="schedule-impact">预计晚 ${slip} 天${next?' · 关注'+next+'排期':''}</small>`:''}</div>
        <div class="schedule-track" aria-label="${safeText(milestoneDates.join(' · ')||'日期待确认')}">${grid}${todayLine}
        ${baseline&&baseline!==step.plan?mark(baseline,'milestone baseline','原定截止'):''}${events.map(([field,label,tone])=>mark(field==='forecast'?forecast:step[field],'milestone '+tone,label)).join('')}${milestoneDates.length?'':'<small class="schedule-unplanned">日期待确认</small>'}</div></div>`;
      const alerts=tasks.filter(task=>task.status!=='done'&&(task.status==='blocked'||(task.plan&&task.plan<dateAfter())||task.forecast>task.plan&&task.plan)).length;
      return `<div class="schedule-phase-wrap">${scheduleButton()}<details class="schedule-phase" data-schedule-phase="${safeText(key)}" ${expandedStages.has(key)?'open':''}>
        <summary class="schedule-row" ${current?'aria-current="step"':''}><div class="schedule-row-title schedule-phase-title"><b>${stages[index][0]}</b><small>阶段负责人 ${safeText(accountName(step.owner))} · 节点 ${stages[index][1]}${step.completed?' · 实际完成 '+safeText(step.completed):''}</small><span class="bdg ${step.status==='blocked'||step.status==='handoff'?'warn':'mut'}">${statuses[step.status]}</span><span class="schedule-task-count">${finished}/${tasks.length} 项任务完成${alerts?' · '+alerts+' 项需关注':''}</span></div>${track(step,dragData(),true)}</summary>
        ${tasks.map(task=>{
          const previous=tasks.find(item=>item.id===task.dependency);
          const waiting=previous && previous.status!=='done' && task.status!=='done';
          const overdue=task.status!=='done'&&task.plan&&task.plan<dateAfter();
          const influence=task.impact || (task.plan&&task.forecast>task.plan?'预计晚于计划，关注'+stages[index][1]:'');
          return `<div class="schedule-row schedule-task-row"><div class="schedule-row-title"><b>${safeText(task.title)}</b>${task.required===false?'<span class="mini">可并行</span>':''}<span class="bdg ${waiting||overdue||task.status==='blocked'?'warn':'mut'}">${task.status==='blocked'?'阻塞':overdue?'已逾期':waiting?'待前置任务':statuses[task.status]}</span><small>${safeText(accountName(task.owner))}${task.originalPlan&&task.originalPlan!==task.plan?' · 原定 <time>'+safeText(task.originalPlan)+'</time>':''}${task.plan?' · 截止 <time>'+safeText(task.plan)+'</time>':''}${task.forecast?' · 预计 <time>'+safeText(task.forecast)+'</time>':''}${task.completed?' · 实际完成 <time>'+safeText(task.completed)+'</time>':''}</small>${previous?`<small>依赖 ${safeText(previous.title)}${waiting?'（待完成）':''}</small>`:''}${influence?`<small>影响 ${safeText(influence)}</small>`:''}${manage?button('编辑任务',task.id):''}</div>${track(task,dragData(task.id))}${scheduleButton(task.id)}</div>`;
        }).join('')}
        ${manage?`<div class="schedule-add-task">${button('添加关键任务')}</div>`:''}${milestone}</details></div>`;
    }
    function sharedRows(project){
      const tasks=sharedTasks.get(project.id);
      if(!tasks.length)return '';
      return `<div class="schedule-group"><b>工作台待办</b></div>${tasks.map(task=>{
        const date=task.scheduledDate||'';
        const editable=canEditWorkTaskSchedule(task);
        const action=`${workTaskCalendarAction(task)} data-task-id="${safeText(task.id)}"`;
        const gesture=editable&&date?`<span class="gantt-drag-handle plan" data-gantt-gesture="plan" data-shared-task-id="${safeText(task.id)}" style="left:${position(date)}%" title="拖动截止 ${safeText(date)}"></span>`:'';
        return `<div class="schedule-row schedule-task-row" data-shared-task-row="${safeText(task.id)}"><div class="schedule-row-title">
          <b>${safeText(task.title)}</b><small>${safeText(accountName(task.ownerAccountId))} · ${safeText(task.dueAt||'未排期')}${task.decisionTarget?' · '+safeText(task.decisionTarget.label):''}</small>
          <button type="button" class="btn sm gho" ${action}>${editable?'改排期':'查看'}</button></div>
          <div class="schedule-track" data-gantt-days="${(last-first)/dayMs}" data-plan-date="${safeText(date)}" aria-label="${safeText(task.dueAt||'未排期')}">${grid}${todayLine}
            ${date?mark(date,'milestone planned','截止'):'<small class="schedule-unplanned">未排期</small>'}${gesture}</div></div>`;
      }).join('')}`;
    }
    return `${legend([['phase','阶段排期'],['task','任务排期'],['milestone planned','计划里程碑'],['milestone forecast','预计节点'],['milestone complete','实际确认'],['today','今天']])}
      ${groups.some(({project})=>canManageProjectLifecycle(project))?'<p class="mini schedule-drag-note">拖动条身移动排期，拖动两端调整开始或截止。</p>':''}
      <div class="schedule-scroll" tabindex="0" role="region" aria-label="甘特图时间轴"><div class="schedule-gantt">
      <div class="schedule-row schedule-axis"><b>阶段、关键任务与里程碑</b><div class="schedule-track">${todayLine}${ticks.map(day=>`<time style="left:${position(dateAt(day))}%">${dateLabel(dateAt(day))}</time>`).join('')}</div></div>
      ${groups.map(({project,rows})=>`<section>${portfolio?`<div class="schedule-group"><button class="btn sm gho" data-act="open-work-project" data-project-id="${safeText(project.id)}">${safeText(project.name)}</button></div>`:''}${rows.map(row).join('')}${sharedRows(project)}</section>`).join('')}</div></div>`;
  }
  function calendar(groups,key){
    const selection=preference(key);
    const month=selection.month||dateAfter().slice(0,7);
    const first=Date.parse(month+'-01');
    const firstDay=new Date(first);
    const offset=(firstDay.getUTCDay()+6)%7;
    const next=Date.UTC(firstDay.getUTCFullYear(),firstDay.getUTCMonth()+1,1);
    const length=Math.ceil((offset+(next-first)/dayMs)/7)*7;
    const calendarEvents=new Map();
    for(const {rows} of groups){
      for(const {step,index,project,tasks} of rows){
        const items=[{item:step,title:stages[index][0]},...(selection.showTasks?tasks.map(item=>({item,title:item.title,taskId:item.id})):[])];
        for(const {item,title,taskId} of items){
          for(const [field,label,tone] of calendarEventsTypes){
            if(!item[field])continue;
            const entries=calendarEvents.get(item[field])||[];
            entries.push({name:(key==='portfolio'?project.name+' · ':'')+title,label,tone,project,index,taskId,field,
              editable:field!=='completed'&&canManageProjectLifecycle(project)});
            calendarEvents.set(item[field],entries);
          }
        }
      }
      if(selection.showTasks){
        const project=rows[0]?.project;
        if(project)for(const task of projectScheduleWorkTasks(project)){
          if(!task.scheduledDate)continue;
          const entries=calendarEvents.get(task.scheduledDate)||[];
          entries.push({name:(key==='portfolio'?project.name+' · ':'')+task.title,label:task.scheduledTime||'截止',tone:'planned',sharedTask:task});
          calendarEvents.set(task.scheduledDate,entries);
        }
      }
    }
    function calendarEvent(event){
      const {name,label,tone,project,index,taskId,field,editable}=event;
      const body=`<b>${safeText(name)}</b><span>${safeText(label)}</span>`;
      if(event.sharedTask){
        const task=event.sharedTask;
        return `<button type="button" class="schedule-event ${tone}" ${workTaskCalendarAction(task)} data-task-id="${safeText(task.id)}">${body}</button>`;
      }
      const action=key==='portfolio'?'data-act="open-work-project"':editable?'data-act="progress-schedule"':'';
      const data=`data-project-id="${safeText(project.id)}" data-stage-index="${index}" data-key-task-id="${safeText(taskId||'')}" data-calendar-field="${field}" data-schedule-surface="${key==='portfolio'?'portfolio':'detail'}"`;
      return action?`<button type="button" class="schedule-event ${tone}" ${action} ${data} ${editable?'draggable="true" title="拖拽修改日期"':''}>${body}</button>`:
        `<span class="schedule-event ${tone}">${body}</span>`;
    }
    return `<div class="schedule-calendar-head"><h4>${month.slice(0,4)} 年 ${Number(month.slice(5))} 月</h4><div class="schedule-switch" aria-label="切换月份">
      ${[[-1,'上个月'],[0,'本月'],[1,'下个月']].map(([offset,label])=>`<button class="btn sm" data-act="progress-month" data-view-key="${safeText(key)}" data-view-value="${offset}">${label}</button>`).join('')}</div></div>
      ${legend(calendarEventsTypes.map(([,label,tone])=>[tone,label]))}
      <button class="btn sm gho" data-act="progress-calendar-tasks" data-view-key="${safeText(key)}" data-view-value="tasks" aria-pressed="${selection.showTasks}">${selection.showTasks?'隐藏关键任务':'显示关键任务'}</button>
      ${groups.some(({project})=>canManageProjectLifecycle(project))?'<p class="mini schedule-drag-note">拖动计划开始、计划截止或预计完成节点可改日期。</p>':''}
      <div class="schedule-scroll" tabindex="0" role="region" aria-label="项目排期日历"><div class="schedule-calendar">
      ${['周一','周二','周三','周四','周五','周六','周日'].map(day=>`<b>${day}</b>`).join('')}
      ${Array.from({length},(_,i)=>{
        const date=dateAt(first+(i-offset)*dayMs);
        const entries=calendarEvents.get(date)||[];
        return `<div data-schedule-date="${date}" class="schedule-day ${date.slice(0,7)!==month?'outside':''}" ${date===dateAfter()?'aria-current="date"':''}><time datetime="${date}">${Number(date.slice(-2))}</time>
          ${entries.map(calendarEvent).join('')}</div>`;
      }).join('')}</div></div>`;
  }
  function visual(key,groups){
    return preference(key).mode==='calendar'?calendar(groups,key):gantt(groups,key==='portfolio');
  }
  function changeView(action,key,value){
    const portfolio=key==='portfolio';
    if(!portfolio && (key!==workHubState.selectedProjectId || !canCurrentAccountAccessProject(WORK_HUB_PROJECTS.find(project=>project.id===key))))return;
    if(portfolio&&workHubState.selectedProjectId)return;
    const setting=preference(key);
    if(action==='progress-view'){
      if(!['gantt','calendar',...(portfolio?['list']:[])].includes(value))return;
      setting.mode=value;
    }else if(action==='progress-calendar-tasks'){
      setting.showTasks=!setting.showTasks;
    }else{
      const offset=Number(value);
      if(![-1,0,1].includes(offset))return;
      const current=new Date((setting.month||dateAfter().slice(0,7))+'-01T00:00:00Z');
      setting.month=offset?dateAt(Date.UTC(current.getUTCFullYear(),current.getUTCMonth()+offset,1)).slice(0,7):dateAfter().slice(0,7);
    }
    if(portfolio)renderWorkProjectList();else renderWorkProjectDetail();
    const controls=Array.from(document.querySelectorAll('[data-view-key]'));
    controls.find(control=>control.dataset.viewKey===key&&control.dataset.act===action&&control.dataset.viewValue===value)?.focus({preventScroll:true});
  }
  function portfolio(rows,table){
    const content=preference('portfolio').mode==='list'||!rows.length?table:
      visual('portfolio',rows.map(({project,progress})=>({project,rows:scheduleRows(project,progress)})));
    return `<section class="card pad schedule-portfolio"><div class="schedule-heading"><h2>项目进度</h2>${viewButtons('portfolio')}</div>${content}</section>`;
  }
  const interventionStatus={handling:'处理中',resolved:'已处理'};
  function isDelivered(project,progress=summary(project)){
    return ['已交付','已完成','已归档'].includes(project.lifecycleStage||project.status)||progress.stage==='已交付';
  }
  function overviewSummary(project,progress,primary,button,ordered){
    const {state,step,stage,milestone,forecast,impact,signals}=progress;
    const blockedTask=step?.status==='handoff'?null:ordered.find(task=>task.status==='blocked');
    const record=step?.intervention;
    const delay=signals.find(signal=>signal.startsWith('预计延期'))?.replace('预计延期','预计晚');
    const blocked=signals.includes('有阻塞');
    const ready=primary?.[0]==='progress-complete';
    const taskTitle=blockedTask?.id==='template-4-1'&&blockedTask.title===taskTemplates[4][1]?'接口联调':blockedTask?.title;
    const delivered=isDelivered(project,progress);
    const headline=delivered?'项目已交付':!step?stage:step.status==='handoff'?`${stage}${step.handoffReturn?'交接已退回':'待接手'}`:
      ready?`${milestone}待确认`:blocked?`${taskTitle||stage}阻塞`:`${stage}进行中`;
    const impactLabel=impact.length?`影响${impact.map(row=>stages[row.index][0]).join('、')}`:'';
    const responsible=blockedTask?.owner||step?.owner;
    const context=step?[accountName(responsible)+(step.status==='handoff'?'待接手':'负责'),impactLabel].filter(Boolean).join(' · '):'所有关键里程碑已确认';
    const plan=step?`<dl class="project-baseline"><div><dt>原定截止</dt><dd>${safeText(step.baseline.plan||'待排期')}</dd></div><div><dt>当前计划</dt><dd>${safeText(step.plan||'待排期')}</dd></div><div><dt>预计完成</dt><dd>${safeText(forecast||'待更新')}</dd></div></dl>`:'';
    const recordInfo=record?`<p class="mini">${interventionStatus[record.status]||'待介入'} · ${safeText(record.decision)} · 处理人 ${safeText(accountName(record.owner))} · 截止 ${safeText(record.due)} · 确认人 ${safeText(record.approvedBy)}</p><p class="mini">${safeText(record.reason)}</p>`:'';
    const review=impact.length?`<details open class="project-impact-details"><summary>查看影响明细</summary><ul class="project-impact-list">${impact.map(row=>`<li><b>${stages[row.index][0]}</b><span class="bdg warn">推迟 ${row.delay} 天</span><span class="project-impact-dates">原计划开始 ${safeText(state.steps[row.index].start)} · 推演 ${row.start} 至 ${row.finish}</span></li>`).join('')}</ul></details>`:'';
    const nextIndex=progress.index+1;
    const next=step?state.steps[nextIndex]:null;
    const latest=state.history.at(-1);
    const reason=blocked&&(blockedTask?.impact||step?.reason);
    const tabLink=(tab,label)=>delivered&&['work-items','schedule'].includes(tab)?'':`<button class="btn sm gho" data-act="open-project-detail-tab" data-tab="${tab}">${label}</button>`;
    const handoff=step?.status==='handoff'?`接手后推进${milestone}`:'';
    const currentTask=step?.status==='handoff'?null:ordered[0];
    const openDecisions=(project.items||[]).filter(item=>item.type==='decision'&&item.status!=='resolved').length;
    const rows=[
      step&&['当前里程碑',milestone,`由${accountName(project.ownerAccountId)}确认 · ${state.steps.filter(item=>item.status==='done').length}/${stages.length} 个阶段已完成`],
      currentTask&&['优先跟进',currentTask.title,`${accountName(currentTask.owner)} · 截止 ${currentTask.plan||'待排期'} · 共 ${ordered.length} 项必需任务待完成`,tabLink('work-items','查看待办')],
      handoff&&['交接事项',handoff,`${accountName(step.owner)}待确认接手`,tabLink('work-items','查看待办')],
      next&&['下一阶段',stages[nextIndex][0],`计划 ${next.start||'待排期'} · ${accountName(next.owner)}负责`,tabLink('schedule','查看排期')],
      openDecisions>0&&['待决策',`${openDecisions} 项`,'',tabLink('decisions','查看决策')],
      latest&&['最近进展',latest.note,`${latest.actor} · ${latest.at}`,tabLink('reports','动态与汇报')]
    ].filter(Boolean);
    return `<section class="project-management-panel" aria-label="项目摘要">
      <div class="project-summary-main"><div class="project-summary-lead"><div class="project-summary-heading"><h3>${safeText(headline)}</h3>${delay?`<span class="bdg warn">${safeText(delay)}</span>`:""}</div><p>${safeText(context)}</p></div>
      <div class="project-summary-actions">${primary?button(...primary,'pri'):''}${!currentTask&&!handoff?tabLink('work-items','查看待办'):''}${!next?tabLink('schedule','查看排期'):''}</div></div>
      ${plan}${step?.handoffReturn?`<p class="project-blocker-reason"><b>退回原因</b> ${safeText(step.handoffReturn)}</p>`:''}${step?.status==='handoff'&&progress.index===2&&state.contractHandoff?tabLink('stage','查看合同交接资料'):''}${reason?`<p class="project-blocker-reason"><b>阻塞原因</b> ${safeText(reason)}</p>`:''}${recordInfo}${state.scope?`<p class="mini">当前交付范围 · ${safeText(state.scope)}</p>`:''}${impact.length?`<p class="project-impact-summary"><b>延期影响</b> ${impact.map(row=>`${stages[row.index][0]}预计推迟 ${row.delay} 天`).join(' · ')}</p>`:''}${review}
      </section>
      ${rows.length?`<section aria-label="项目跟进" class="project-overview-followup"><div class="project-compact-heading"><h4>项目跟进</h4>${!latest?tabLink('reports','动态与汇报'):''}</div><dl>${rows.map(([label,title,meta,link])=>{
        const content=`<b>${safeText(title)}</b>${meta?`<span class="mini">${safeText(meta)}</span>`:''}`;
        const recent=label==='最近进展';
        return `<div ${recent?'class="project-recent-row"':''}><dt>${label}</dt><dd>${recent?`<div class="project-recent-copy">${content}</div>`:content}${link||''}</dd></div>`;
      }).join('')}</dl></section>`:''}`;
  }
  function dailySuggestions(project,progress){
    const {state,index,step}=progress;
    if(!step||step.status==='handoff'||state.pause||state.releaseRecovery)return [];
    const tasks=keyTasks(step,index,project).filter(task=>task.status!=='done');
    const rows=[],observedStatuses=new Map();
    const channelRows=window.officeWorkflowDemo?.dailyRows(project).summaries||[];
    const sources=[...channelEvidence(project).filter(item=>item.kind==='daily'&&item.native&&!item.classification&&!item.autoDaily),...channelRows];
    for(const source of sources){
      for(const item of (source.items||source.text.split(/\r?\n/).map(text=>({text})))){
        const line=item.text;
        const match=line.trim().match(/^(.+?)[：:]\s*(已完成|阻塞|预计延期)(?:$|[，,。；;\s]|[：:])/);
        if(!match)continue;
        const matches=tasks.filter(task=>item.taskId?task.id===item.taskId:task.title===match[1].trim());
        const task=matches.length===1?matches[0]:null;
        if(task){
          if(!observedStatuses.has(task.id))observedStatuses.set(task.id,new Set());
          observedStatuses.get(task.id).add(match[2]);
        }
        const key=JSON.stringify([source.provider,source.ref,task?.id||match[1].trim(),match[2]]);
        const legacyKey=JSON.stringify([source.provider,source.ref,task?.id]);
        if(state.dailySuggestionReviews?.includes(legacyKey))continue;
        if(rows.some(row=>row.key===key)||state.dailySuggestionReviews?.includes(key))continue;
        rows.push({key,task,source,line,status:match[2],title:match[1].trim(),manual:!task});
      }
    }
    for(const row of rows){
      if(row.task&&observedStatuses.get(row.task.id).size>1)row.manual=true;
    }
    return rows;
  }
  function renderDailySuggestions(suggestions,button){
    if(!suggestions.length)return '';
    return `<section class="project-tab-section" data-project-resource="daily-suggestions"><div class="project-panel"><h3>日报状态建议</h3>
      ${suggestions.map(({title,source,line,status,manual},index)=>`<div class="project-row project-row-action"><div><b>${safeText(title)} · ${manual?'需人工匹配或核对冲突':status==='已完成'?'建议标为完成':status+'待核对'}</b><small>${safeText(source.author)} · ${safeText(source.date)} · ${safeText(source.ref)}</small><p>${safeText(line)}</p></div><div class="rowact">
      ${button('progress-daily-review','核对建议','',`data-suggestion-index="${index}"`)}
      </div></div>`).join('')}</div></section>`;
  }
  function detail(project,otherTasks,milestones){
    const progress=summary(project);
    const {state,index,step,stage,milestone,signals}=progress;
    const manage=canManageProjectLifecycle(project);
    const mine=step?.owner===getCurrentWorkAccount().id;
    const todo=step?pendingTasks(project,step,index):[];
    const ordered=[...todo].sort((a,b)=>Number(b.status==='blocked')-Number(a.status==='blocked')||
      (a.plan||'9999').localeCompare(b.plan||'9999'));
    const button=(action,label,tone='',attrs='')=>`<button class="btn sm ${tone}" data-act="${action}" data-project-id="${safeText(project.id)}" ${attrs}>${label}</button>`;
    const suggestions=dailySuggestions(project,progress);
    const riskCount=suggestions.filter(item=>item.status!=='已完成').length;
    const taskAttrs=task=>`data-stage-index="${index}" data-key-task-id="${safeText(task.id)}"`;
    const contractMissing=step?.status==='handoff'&&needsContract(project,state,index);
    let primary=null;
    if(state.pause)primary=manage?['progress-pause','恢复项目']:null;
    else if(state.releaseRecovery)primary=manage||mine?['progress-release-recovery','提交重新验证']:null;
    else if(step?.status==='handoff'){
      if((step.handoffReturn||contractMissing)&&manage)primary=['progress-handoff-revise','补齐后重新交接'];
      else if(mine&&!step.handoffReturn&&!contractMissing)primary=['progress-accept','确认接手'];
      else if(manage&&!contractMissing)primary=['progress-remind','催办接手'];
    }else if(manage&&step?.status==='active'&&!todo.length&&!signals.includes('有阻塞')){
      primary=['progress-complete','确认里程碑完成'];
    }else if(manage&&step&&(signals.length||step.intervention)){
      primary=['progress-intervention',step.intervention?'更新处理决定':signals.includes('有阻塞')?'处理阻塞':'处理排期偏差'];
    }else if(manage&&ordered.length){
      primary=['progress-task-edit','更新任务'];
    }
    const summaryButton=(action,label,tone)=>button(action,label,tone,action==='progress-task-edit'?taskAttrs(ordered[0]):'');
    const evidence=state.steps.flatMap((item,i)=>item.evidence?[`<li><b>${stages[i][0]}</b> · ${safeText(item.evidence)}</li>`]:[]).join('');
    const history=state.history.slice().reverse();
    const latestHandoff=history.find(row=>/接手/.test(row.note));
    const recent=latestHandoff||history[0];
    const historyLine=row=>`<time>${safeText(row.at)}</time> · ${safeText(row.actor)} · ${safeText(row.note)}`;
    const earlierHistory=history.filter(row=>row!==recent);
    const taskRows=ordered.map(task=>{
      const overdue=task.plan&&task.plan<dateAfter();
      return {
        title:task.title,owner:accountName(task.owner),due:task.plan||'待排期',
        status:task.status==='blocked'?'阻塞':overdue?'已逾期':statuses[task.status],
        tone:task.status==='blocked'||overdue?'warn':'mut',
        action:manage?button('progress-task-edit','更新任务','gho',taskAttrs(task)):''
      };
    });
    const tasksPanel=step?`<section class="project-current-tasks" aria-label="当前待办">
      <div class="project-compact-heading"><h4>当前待办</h4><div class="project-schedule-controls">${['progress-accept','progress-complete','progress-handoff-revise'].includes(primary?.[0])?button(...primary,'pri'):''}${step?.status==='handoff'&&mine&&!step.handoffReturn?button('progress-handoff-return','退回交接','gho'):''}</div></div>
      ${contractMissing?'<p class="mini">缺少已签合同、交付范围或验收约定，资料补齐后才能确认接手。</p>':''}
      <div class="project-current-milestone"><span class="mini">当前里程碑</span><b>${safeText(milestone)}</b><span class="mini">计划 ${safeText(step.plan||'待排期')} · 由 ${safeText(accountName(project.ownerAccountId))} 确认</span></div>
      ${taskRows.length?renderProjectTaskTable('当前待办',taskRows):'<p class="mini">本阶段必需任务已完成。</p>'}
      ${manage&&primary?.[0]==='progress-complete'&&step.intervention?.status==='handling'?button('progress-intervention','更新处理决定','gho'):''}
    </section>`:'';

    return {
      overview:`<div id="projectLifecycleProgress">${riskCount?`<section class="project-risk-notice" aria-label="日报风险待核对"><b>日报风险待核对 · ${riskCount} 条</b><button class="btn sm gho" data-act="open-project-detail-tab" data-tab="daily-suggestions">查看建议</button></section>`:''}${overviewSummary(project,progress,primary,summaryButton,ordered)}</div>`,
      workItems:`${tasksPanel}${renderDailySuggestions(suggestions,button)}${milestones?`<div class="project-tab-section">${milestones}</div>`:''}${otherTasks||''}
        ${recent?`<section class="project-tab-section"><div class="project-panel"><h3>${latestHandoff?'最近交接':'最近进展'}</h3><div class="project-recent-entry"><b>${safeText(recent.note)}</b><span class="mini"><time>${safeText(recent.at)}</time> · ${safeText(recent.actor)}</span></div></div></section>`:''}
        ${evidence?`<details open class="project-resource"><summary>阶段完成依据</summary><ul>${evidence}</ul></details>`:''}
        ${earlierHistory.length?`<details open class="project-resource"><summary>更多进度与交接记录</summary><ul>${earlierHistory.map(row=>`<li>${historyLine(row)}</li>`).join('')}</ul></details>`:''}`,
      schedule:`<div class="schedule-heading" id="projectSchedule"><h4>阶段排期</h4><div class="project-schedule-controls">${manage&&step?button('progress-edit','调整排期','gho'):''}${viewButtons(project.id)}</div></div>
        ${visual(project.id,[{project,rows:scheduleRows(project,progress)}])}
        ${project.milestones?.length?`<section class="project-tab-section"><div class="project-panel"><div class="project-compact-heading"><h3>项目里程碑日期</h3><button class="btn sm gho" data-act="open-project-detail-tab" data-tab="work-items">查看里程碑</button></div>
          ${[...project.milestones].sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999')).map(item=>`<div class="project-row"><b>${safeText(item.name)}</b><small>${safeText(item.dueDate||'待排期')} · ${safeText(item.status)}</small></div>`).join('')}</div></section>`:''}`
    };
  }

  function stageHistory(project){
    const history=read(project).history||[];
    if(!history.length)return '';
    return `<section class="project-panel" aria-label="项目阶段动态"><div class="project-compact-heading"><h3>项目阶段动态</h3><span class="mini">${history.length} 条进度与交接记录</span></div>
      <ol>${history.slice().reverse().map(row=>`<li><b>${safeText(row.note)}</b> <small class="mini">${safeText(row.actor)} · ${safeText(row.at)}</small></li>`).join('')}</ol></section>`;
  }
  const stageDrafts=[
    [['presale-summary','售前评审摘要']],
    [['contract-check','合同交接清单']],
    [['kickoff-plan','项目启动交接清单']],
    [['design','产品方案评审记录']],
    [['integration','联调及提测记录']],
    [['test','测试报告'],['release-plan','上线与回退方案']],
    [['release','发布与运行验证记录'],['release-script','上线协调话术']],
    [['delivery','交付清单'],['acceptance','客户验收摘要']]
  ];
  const seededPresaleMaterials = [['deck','客户提案 PPT'],['quote','报价单确认记录'],['script','客户沟通话术']];
  function materialDefinitions(index, items) {
    return index===0 ? [...stageDrafts[0], ...seededPresaleMaterials.filter(([key])=>items?.[key])] : stageDrafts[index]||[];
  }
  function stageMaterialRows(project,state){
    return state.steps.flatMap((step,index)=>{
      const explicit=state.stageMaterials?.[index];
      if(!explicit)return [];
      return materialDefinitions(index, explicit.items).map(([key,name])=>{
        const item=explicit.items?.[key]||{};
        return {stage:stages[index][0],key,name,status:item.approved?'已确认':'待审阅',version:'v'+(item.version||1),
          source:explicit.ref||'节点确认记录',detail:item.text||explicit.evidence,
          action:`<button type="button" class="btn sm gho" data-act="progress-stage-material" data-project-id="${safeText(project.id)}" data-stage-index="${index}" data-material-key="${key}">${item.approved?'查看依据':'审阅草稿'}</button>`};
      });
    });
  }
  function tasks(){
    const account=getCurrentWorkAccount();
    return WORK_HUB_PROJECTS.filter(canCurrentAccountAccessProject).flatMap(project=>{
      const {state,index,step,milestone,stage}=summary(project);
      if(project.stageOwners){
        if(state.pause)return [];
        return state.steps.flatMap((item,stageIndex)=>{
          if(!['active','blocked'].includes(item.status)||item.owner!==account.id)return [];
          const handoff=(state.stageHandoffs||[]).some(row=>row.to===stageIndex);
          const reason=stagePending(state,stageIndex).join('、');
          const date=item.tasks[0]?.plan||item.plan;
          return [{id:'flow-stage-'+project.id+'-'+stageIndex,progressTask:true,projectId:project.id,ownerAccountId:account.id,
            title:stages[stageIndex].slice(0,2).join(' · ')+(handoff?' · 已收到上游交接':'')+(item.percent===100?' · 待确认':''),
            stageIndex,reason,dueAt:date,scheduledDate:date,status:item.status==='blocked'||item.percent===100?'pending':item.percent?'running':'pending'}];
        });
      }
      const waiting=dailySuggestions(project,{state,index,step}).filter(row=>row.status==='预计延期'&&!row.manual&&(canManageProjectLifecycle(project)||row.task.owner===account.id));
      const forecastTasks=waiting.map((row,i)=>({id:'daily-delay-'+project.id+'-'+i,progressTask:true,projectId:project.id,ownerAccountId:account.id,title:'确认延期建议 · '+row.title,status:'pending'}));
      const latestPlan=step?pendingTasks(project,step,index).flatMap(task=>{
        const result=state.dailyScheduleResults?.[task.id];
        const date=result?.mode==='plan'?task.plan:task.forecast;
        return result&&task.owner===account.id&&date?[{id:'daily-plan-'+project.id+'-'+task.id,
          progressTask:true,projectId:project.id,ownerAccountId:account.id,title:task.title+' · '+(result.mode==='plan'?'计划截止 ':'预计完成 ')+date,
          status:'confirmed',dueAt:date,scheduledDate:date}]:[];
      }):[];
      if(state.pause)return [];
      if(state.releaseRecovery)return step?.owner===account.id?[{id:'release-recovery-'+project.id,progressTask:true,projectId:project.id,ownerAccountId:account.id,title:'关闭上线回退并重新验证',status:'pending',dueAt:state.releaseRecovery.nextDate,scheduledDate:state.releaseRecovery.nextDate}]:[];
      if((step?.handoffReturn||step?.status==='handoff'&&needsContract(project,state,index))&&project.ownerAccountId===account.id)return [{id:'progress-revise-'+project.id,progressTask:true,title:'补齐交接资料 · '+stage,ownerAccountId:account.id,projectId:project.id,status:'pending'}];
      if(step?.owner!==account.id||step.handoffReturn)return [...forecastTasks,...latestPlan];
      return [...forecastTasks,...latestPlan,{id:'progress-'+project.id,progressTask:true,title:(step.status==='handoff'?'确认接手 · ':'推进里程碑 · ')+stage+' · '+milestone,ownerAccountId:account.id,projectId:project.id,customerId:project.customerId,status:step.status==='handoff'?'pending':'confirmed'}];
    });
  }
  function act(action,projectId,element){
    const project=WORK_HUB_PROJECTS.find(item=>item.id===projectId);
    if(!canCurrentAccountAccessProject(project))return;
    const progress=summary(project),{state}=progress;
    const scoped=Boolean(project.stageOwners&&element.dataset.stageIndex!==undefined&&['progress-reassign','progress-release-recovery','progress-confirm-stage','progress-view-handoff'].includes(action));
    const index=scoped?Number(element.dataset.stageIndex):progress.index;
    const step=state.steps[index],stage=stages[index]?.[0],milestone=stages[index]?.[1];
    if(!step&&!['progress-task-edit','progress-schedule','progress-stage-material'].includes(action))return;
    const account=getCurrentWorkAccount(),manage=canManageProjectLifecycle(project),mine=step?.owner===account.id;
    function save(note,portfolio=false){
      if(getCurrentWorkAccount().id!==account.id || !canCurrentAccountAccessProject(project) || JSON.stringify(read(project))!==original){
        closeModal();toast('项目进度已变化，请刷新后再操作','warn');return;
      }
      state.history.push({at:new Date().toLocaleString('zh-CN'),actor:account.name,note,stage,source:'项目操作'});
      localStorage.setItem(storageKey(project),JSON.stringify(state));
      const lifecycle=deriveProjectLifecycle(project,summary(project));
      if(lifecycle!==project.lifecycleStage||project.acceptances?.some(item=>item.stageAcceptance&&item.status==='待提交'&&state.steps.at(-1).status==='done'))persistProjectWorkspace(project);
      closeModal();if(portfolio)renderWorkProjectList();else renderWorkProjectDetail();renderWorkTaskCenter();toast('进度记录已保存','ok');
    }
    const original=JSON.stringify(state);
    if(action==='progress-view-handoff'&&scoped&&(manage||mine)){
      const handoff=(state.stageHandoffs||[]).find(row=>row.to===index);
      const report=(state.stageReports||[]).find(row=>row.ref===handoff?.ref&&row.provider===handoff?.provider);
      if(!handoff||!report)return;
      modal('上游交接 · '+stages[handoff.from][0],
        `<p>${safeText(OFFICE_CHANNELS[handoff.provider]?.name||'渠道日报')} · 原单 ${safeText(handoff.ref)}</p>
        <p>提交人 ${safeText(accountName(report.owner))}</p><blockquote class="oa-quote">${safeText(report.note)}</blockquote>
        ${report.completionRef?`<p>业务依据 ${safeText(report.completionRef)}</p>`:''}`,'关闭',closeModal,true);
      return;
    }
    const readActions=['progress-stage-material'];
    if(state.pause&&action!=='progress-pause'&&!readActions.includes(action))return toast('项目已暂停，请先恢复后再继续','warn');
    if(state.releaseRecovery&&(!project.stageOwners||index===6)&&!['progress-release-recovery','progress-pause',...readActions].includes(action))return toast('请先提交回退后的重新验证记录','warn');
    if(action==='progress-confirm-stage'&&project.stageOwners&&(manage||mine)&&step?.status==='active'){
      const report=latestStageReport(state,index);
      if(report?.percent!==100)return;
      const gate=completionGate(state,index);
      if(gate.missingStages.length)return toast('请先完成 '+gate.missingStages.join('、'),'warn');
      modal('核对完成 · '+stage,`<p>原日报 ${safeText(report.ref)} · ${safeText(report.note)}</p>
        ${gate.requiredEvidence?`<label for="stage-confirm-ref">${safeText(gate.requiredEvidence)} *</label><input class="inp" id="stage-confirm-ref" value="${safeText(report.completionRef||'')}">`:''}`,'确认完成',()=>{
        const evidence=$('#stage-confirm-ref')?.value.trim()||'';
        if(gate.requiredEvidence&&!evidence)return toast('请填写业务记录','warn');
        finishStage(state,index,report,evidence);
        save('核对完成 · '+stage+' · 原日报 '+report.ref);
      },true);
      return;
    }
    if(action==='progress-pause'&&manage){
      const resume=Boolean(state.pause);
      modal(resume?'恢复项目':'暂停项目',
        `<label for="progress-exception-note">${resume?'恢复依据与排期核对结果':'暂停原因及影响'} *</label><textarea class="inp" id="progress-exception-note"></textarea>`,
        resume?'确认恢复':'确认暂停',()=>{
          const note=$('#progress-exception-note').value.trim();
          if(!note)return toast('请填写说明','warn');
          if(resume)delete state.pause;
          else state.pause={note,by:account.id,at:new Date().toISOString()};
          save((resume?'恢复项目 · ':'暂停项目 · ')+note);
        },true);
      return;
    }
    if(action==='progress-release-recovery'&&((index===6&&(manage||mine))||(state.releaseRecovery&&(manage||mine)))){
      const reviewing=Boolean(state.releaseRecovery);
      modal(reviewing?'重新验证上线':'记录上线回退',
        `<label for="progress-exception-note">${reviewing?'重新发布版本、运行验证结果及依据':'回退版本、影响及回退结果'} *</label><textarea class="inp" id="progress-exception-note"></textarea>${reviewing?'<label for="release-review-result">验证结论</label><select id="release-review-result" class="inp"><option value="passed">通过</option><option value="failed">未通过</option></select><label for="release-review-date">下次验证日期（未通过必填）</label><input class="inp" type="date" id="release-review-date">':''}`,
        reviewing?'保存验证结果':'记录回退结果',()=>{
          const note=$('#progress-exception-note').value.trim();
          if(!note)return toast('请填写处理结果及依据','warn');
          if(reviewing&&$('#release-review-result').value==='failed'){
            const nextDate=$('#release-review-date').value;
            if(!nextDate||nextDate<dateAfter())return toast('请填写有效的下次验证日期','warn');
            state.releaseRecovery={...state.releaseRecovery,failedNote:note,nextDate};
            step.reason='复验未通过 · '+note+' · 下次验证 '+nextDate;
            save(step.reason);
            return;
          }
          if(reviewing){
            delete state.releaseRecovery;
            step.status='active';step.reason='';
          }else{
            state.releaseRecovery={note,by:account.id,at:new Date().toISOString()};
            step.status='blocked';step.reason='发布回退 · '+note;
          }
          save((reviewing?'上线重新验证通过 · ':'已记录发布回退 · ')+note);
        },true);
      return;
    }
    if(action==='progress-reassign'&&manage&&step&&step.status!=='done'){
      const previous=step.owner;
      const choices=projectMembershipOptions(project.tenantId).filter(member=>project.memberIds.includes(member.accountId)&&member.accountId!==previous);
      if(!choices.length)return toast('请先添加可接手的项目成员','warn');
      modal('转派阶段与未完成待办',
        `<label for="progress-new-owner">新负责人</label><select class="inp" id="progress-new-owner">${choices.map(member=>`<option value="${safeText(member.accountId)}">${safeText(member.name)}</option>`).join('')}</select>
        <label for="progress-exception-note">调整原因 *</label><textarea class="inp" id="progress-exception-note"></textarea>`,'转派并等待接手',()=>{
          const owner=$('#progress-new-owner').value, note=$('#progress-exception-note').value.trim();
          if(!note)return toast('请填写调整原因','warn');
          step.tasks=keyTasks(step,index,project).map(task=>task.status!=='done'&&task.owner===previous?{...task,owner}:task);
          step.owner=owner;if(!project.stageOwners)step.status='handoff';delete step.handoffReturn;
          save('阶段转派 · '+accountName(previous)+' → '+accountName(owner)+' · '+note);
        },true);
      return;
    }
    if(action==='progress-stage-material'){
      const phase=Number(element.dataset.stageIndex),key=element.dataset.materialKey;
      const draft=state.stageMaterials?.[phase];
      const material=materialDefinitions(phase, draft?.items).find(item=>item[0]===key);
      if(!material||!draft)return;
      const current=draft.items?.[key];
      const evidence=`<p><b>节点证据</b> ${safeText(draft.evidence)}</p>${draft.ref?'<p class="mini">来源 '+safeText(draft.ref)+'</p>':''}`;
      if(!manage||current?.approved)return modal(material[1],evidence+`<p>${safeText(current?.text||'待负责人审阅')}</p>`,'关闭',closeModal,true);
      modal(material[1],evidence+`<div class="field"><label for="stageMaterialText">核对并补齐交付物内容 *</label><textarea class="inp" id="stageMaterialText" rows="7"></textarea></div>`,'保存已审阅版本',()=>{
        const text=$('#stageMaterialText').value.trim();
        if(!text)return toast('请填写经过核对的交付物内容','warn');
        (draft.items||={})[key]={text,approved:true,version:2,reviewer:account.id};
        save('确认交付物 · '+material[1]);
      },true);
      return;
    }
    if(action==='progress-daily-review'){
      const suggestion=dailySuggestions(project,summary(project))[Number(element.dataset.suggestionIndex)];
      if(!suggestion)return;
      const {task,source,line,status,key,manual}=suggestion;
      const mayConfirm=manage||task?.owner===account.id;
      const proposedDate=line.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0]||'';
      const canComplete=mayConfirm&&status==='已完成';
      const canDelay=mayConfirm&&status==='预计延期';
      const origin=`<button class="btn sm gho" data-act="oa-record" data-provider="${safeText(source.provider)}" data-kind="daily" data-ref="${safeText(source.ref)}" data-project-id="${safeText(project.id)}">查看日报原文</button>`;
      if(manual){
        const mayAcknowledge=manage||window.projectFlowDemo.roleFor(project)==='supervisor';
        modal('人工核对日报',`<p>${safeText(line)}</p><p class="mini">任务匹配不唯一、无匹配或存在相反说法。核对原文后，在项目任务中人工记录结果。</p>${origin}`,
          mayAcknowledge?'标记已人工核对':'关闭',()=>{
            if(!mayAcknowledge)return closeModal();
            (state.dailySuggestionReviews||=[]).push(key);
            save('人工核对日报 '+source.ref+' · '+line);
          },true);
        return;
      }
      modal('核对日报建议',`<p><b>${safeText(task.title)}</b></p><p>${safeText(line)}</p><p class="mini">${safeText(source.author)} · ${safeText(source.date)} · ${safeText(source.ref)}</p>${origin}${canDelay?'<div class="field"><label for="dailyForecast">核准完成日期</label><input class="inp" id="dailyForecast" type="date" value="'+safeText(proposedDate)+'"></div><label for="dailyScheduleMode">确认结果</label><select class="inp" id="dailyScheduleMode"><option value="forecast">只更新预计完成</option><option value="plan">调整正式计划</option><option value="keep">维持原计划</option></select><label for="dailyScheduleReason">正式改期原因</label><input class="inp" id="dailyScheduleReason">':''}`,
        canComplete?'确认任务完成':mayConfirm?'确认并更新任务':'关闭',()=>{
          if(!mayConfirm)return closeModal();
          const tasks=keyTasks(step,index,project);
          if(canComplete&&task.dependency&&tasks.some(item=>item.id===task.dependency&&item.status!=='done')){
            return toast('请先完成前置任务','warn');
          }
          if(canComplete){
            step.tasks=tasks.map(item=>item.id===task.id?{...item,status:'done',completed:dateAfter(),
              completionSource:{provider:source.provider,ref:source.ref}}:item);
          }
          if(!canComplete){
            const forecast=canDelay?$('#dailyForecast').value:'';
            const mode=canDelay?$('#dailyScheduleMode').value:'';
            const reason=canDelay?$('#dailyScheduleReason').value.trim():'';
            if(canDelay&&mode!=='keep'&&(!forecast||(task.start&&forecast<task.start)))return toast('请选择有效的完成日期','warn');
            if(mode==='plan'&&(!manage||!reason))return toast('正式改期需要排期权限和调整原因','warn');
            if(mode!=='keep'){
              step.tasks=tasks.map(item=>item.id!==task.id?item:{...item,...(canDelay?{forecast}:{status:'blocked'}),
                ...(mode==='plan'?{plan:forecast,originalPlan:item.originalPlan??item.plan}:{}),impact:line,
                statusSource:{provider:source.provider,ref:source.sourceRef||source.ref}});
              if(canDelay)(state.dailyScheduleResults||={})[task.id]={mode};
            }
            if(canDelay){
              (state.dailySuggestionReviews||=[]).push(key);
              save(`核对日报 ${source.sourceRef||source.ref} · ${task.title} · ${mode==='keep'?'维持原计划':mode==='forecast'?'更新预计至 '+forecast:'正式改期至 '+forecast+' · '+reason}`);
              return;
            }
          }
          (state.dailySuggestionReviews||=[]).push(key);
          save(`核对日报 ${source.ref} · ${task.title} · ${canComplete?'确认完成':canDelay?'更新预计完成时间':'记录阻塞'}`);
        },true);
      return;
    }
    if(action==='progress-remind'&&manage&&step.status==='handoff')return save('已记录催办 '+accountName(step.owner)+' 确认接手'+stage);
    if(action==='progress-accept'&&mine&&step.status==='handoff'&&!step.handoffReturn){
      if(needsContract(project,state,index))return toast('请先补齐已签合同、交付范围和验收约定','warn');
      step.status=step.reason?'blocked':'active';return save('已确认接手'+stage);
    }
    if(action==='progress-handoff-return'&&mine&&step.status==='handoff'&&!step.handoffReturn){
      modal('退回交接','<div class="field"><label for="handoffReturnReason">缺项或退回原因 *</label><textarea class="inp" id="handoffReturnReason"></textarea></div>','确认退回',()=>{
        const reason=$('#handoffReturnReason').value.trim();
        if(!reason)return toast('请填写退回原因','warn');
        step.handoffReturn=reason;
        save(`退回${stage}交接 · ${reason}`);
      },true);
      return;
    }
    if(action==='progress-handoff-revise'&&manage&&step.status==='handoff'&&(step.handoffReturn||needsContract(project,state,index))){
      const contract=index===2&&project.customerId?(state.contractHandoff||{}):null;
      const fields=handoffFields;
      modal('补齐交接资料',`<p>${safeText(step.handoffReturn||'请补齐客户项目启动所需的合同资料。')}</p>${contract?fields.map(([key,label])=>`<div class="field"><label for="handoff-${key}">${label}</label><textarea class="inp" id="handoff-${key}">${safeText(contract[key])}</textarea></div>`).join(''):''}<div class="field"><label for="handoffRevision">补充说明或依据 *</label><textarea class="inp" id="handoffRevision"></textarea></div>`,'重新交接',()=>{
        const note=$('#handoffRevision').value.trim();
        const revised=contract?Object.fromEntries(fields.map(([key])=>[key,$('#handoff-'+key).value.trim()])):null;
        if(!note||(revised&&Object.values(revised).some(value=>!value)))return toast('请补齐交接信息和依据','warn');
        if(revised)state.contractHandoff={...contract,...revised,confirmedBy:account.id};
        delete step.handoffReturn;
        save(`重新提交${stage}交接 · ${note}`);
      },true);
      return;
    }
    const memberOptions=selected=>[...new Set([project.ownerAccountId,...(project.memberIds||[])])].filter(Boolean)
      .map(id=>`<option value="${safeText(id)}" ${id===selected?'selected':''}>${safeText(accountName(id))}</option>`).join('');
    if(action==='progress-intervention'&&manage){
      const prior=step.intervention||{};
      const date=projectedFinish(project,step,index);
      const options=memberOptions(prior.owner||step.owner);
      const decisions=['协调资源','调整预计日期','调整交付计划'];
      modal('处理进度偏差',`<div class="field"><label for="interventionDecision">处理决定</label><select class="inp" id="interventionDecision">${decisions.map(value=>`<option ${value===prior.decision?'selected':''}>${value}</option>`).join('')}</select></div>
        <div class="field"><label for="interventionOwner">处理人</label><select class="inp" id="interventionOwner">${options}</select></div>
        <div class="field"><label for="interventionDue">处理期限</label><input class="inp" type="date" id="interventionDue" value="${safeText(prior.due||dateAfter(1))}"></div>
        <div class="field"><label for="interventionForecast">预计完成日期</label><input class="inp" type="date" id="interventionForecast" value="${safeText(date)}"></div>
        <div class="field"><label for="interventionPlan">调整后的当前计划（选填）</label><input class="inp" type="date" id="interventionPlan" value="${safeText(step.plan||'')}"></div>
        <div class="field"><label for="interventionScope">交付范围变更（选填）</label><textarea class="inp" id="interventionScope">${safeText(state.scope||project.scope||'')}</textarea></div>
        <div class="field"><label for="interventionReason">原因与下一步</label><textarea class="inp" id="interventionReason">${safeText(prior.reason||'')}</textarea></div>
        <label class="lcheck"><input type="checkbox" id="interventionResolved" ${prior.status==='resolved'?'checked':''}> 已处理</label>`,'保存处理决定',()=>{
          const reason=$('#interventionReason').value.trim(), due=$('#interventionDue').value, owner=$('#interventionOwner').value;
          const decision=$('#interventionDecision').value;
          if(!reason||!due||!owner)return toast('请填写原因、处理人和处理期限','warn');
          const forecast=$('#interventionForecast').value;
          const plan=decision==='调整交付计划'?$('#interventionPlan').value:step.plan;
          if(step.start&&[forecast,plan].some(value=>value&&value<step.start))return toast('日期不能早于计划开始','warn');
          if(decision==='调整交付计划'&&!plan)return toast('请填写调整后的当前计划','warn');
          const before=step.plan, forecastBefore=projectedFinish(project,step,index);
          const status=$('#interventionResolved').checked?'resolved':'handling';
          if(status==='resolved'&&pendingTasks(project,step,index).some(task=>task.status==='blocked'))
            return toast('还有必需任务阻塞，请更新任务后再关闭处理记录','warn');
          const previousScope=state.scope||project.scope||'';
          const revisedScope=$('#interventionScope').value.trim();
          const scopeChanged=decision==='调整交付计划'&&revisedScope&&revisedScope!==previousScope;
          if(scopeChanged)state.scope=revisedScope;
          if(!step.tasks)step.tasks=keyTasks(step,index,project);
          Object.assign(step,{plan,forecast,intervention:{decision,reason,due,owner,status,approvedBy:account.name}});
          if(status==='resolved'&&step.status==='blocked'&&!pendingTasks(project,step,index).some(task=>task.status==='blocked')){
            step.status='active';step.reason='';
          }
          save(`${decision} · ${reason} · 处理人 ${accountName(owner)} · 截止 ${due} · 计划 ${before||'待定'} → ${plan||'待定'} · 预计 ${forecastBefore||'待定'} → ${projectedFinish(project,step,index)||'待定'}${scopeChanged?' · 交付范围 '+previousScope+' → '+revisedScope:''}`);
        },true);
      return;
    }
    if(action==='progress-schedule'&&manage){
      const stageIndex=Number(element.dataset.stageIndex);
      const phase=state.steps[stageIndex];
      if(!phase)return;
      const taskId=element.dataset.keyTaskId;
      const tasks=taskId?keyTasks(phase,stageIndex,project):null;
      const item=taskId?tasks.find(task=>task.id===taskId):phase;
      if(!item)return;
      const label=taskId?item.title:stages[stageIndex][0];
      function setDates(dates){
        if(dates.start&&dates.plan&&dates.start>dates.plan)return toast('计划开始不能晚于计划截止','warn');
        if(dates.start&&dates.forecast&&dates.start>dates.forecast)return toast('预计完成不能早于计划开始','warn');
        if(!tasks && !phase.tasks)phase.tasks=keyTasks(phase,stageIndex,project);
        Object.assign(item,dates);
        if(tasks)phase.tasks=tasks;
        save(`调整${label}排期 · ${dates.start||'开始待定'} 至 ${dates.plan||'截止待定'} · 预计 ${dates.forecast||'待更新'}`,element.dataset.scheduleSurface==='portfolio');
      }
      if(element.dataset.ganttGesture){
        const {ganttGesture,shiftDays,originalStart,originalPlan,originalForecast}=element.dataset;
        if((item.start||'')!==originalStart||(item.plan||'')!==originalPlan||(item.forecast||'')!==originalForecast)
          return toast('排期已变化，请重新拖动','warn');
        const delta=Number(shiftDays);
        if(!Number.isInteger(delta)||!delta)return;
        setDates(shiftSchedule(item,ganttGesture,delta));
        return;
      }
      const field=element.dataset.calendarField;
      const droppedDate=element.dataset.dropDate;
      if(droppedDate){
        if(item[field]!==element.dataset.originalDate)return toast('日期已变化，请刷新后重试','warn');
        if(!['start','plan','forecast'].includes(field)||!item[field]||!/^\d{4}-\d{2}-\d{2}$/.test(droppedDate)||item[field]===droppedDate)return;
        setDates({start:item.start,plan:item.plan,forecast:item.forecast,[field]:droppedDate});
        return;
      }
      const fields=[['start','计划开始'],['plan','计划截止'],['forecast','预计完成']];
      modal('改排期 · '+safeText(label),fields.map(([field,title])=>`<div class="field"><label for="gantt-date-${field}">${title}</label><input class="inp" type="date" id="gantt-date-${field}" value="${safeText(item[field]||'')}"></div>`).join(''),'保存',()=>{
        setDates(Object.fromEntries(fields.map(([field])=>[field,$('#gantt-date-'+field).value])));
      },true);
      return;
    }
    if(action==='progress-task-edit'&&manage){
      const stageIndex=Number(element.dataset.stageIndex);
      const phase=state.steps[stageIndex];
      if(!phase)return;
      const tasks=keyTasks(phase,stageIndex,project);
      const taskId=element.dataset.keyTaskId;
      const existing=tasks.find(task=>task.id===taskId);
      if(taskId&&!existing)return;
      const task=existing||{id:crypto.randomUUID(),title:'',owner:phase.owner,status:'waiting',dependency:'',impact:''};
      const earlier=existing?tasks.slice(0,tasks.indexOf(existing)):tasks;
      const options=earlier.map(item=>`<option value="${safeText(item.id)}" ${item.id===task.dependency?'selected':''}>${safeText(item.title)}</option>`).join('');
      const input=(id,label,type,value)=>`<div class="field"><label for="${id}">${label}</label><input class="inp" id="${id}" type="${type}" value="${safeText(value||'')}"></div>`;
      modal(existing?'编辑关键任务':'添加关键任务',`
        ${input('keyTaskTitle','任务名称','text',task.title)}
        <div class="field"><label for="keyTaskOwner">负责人</label><select class="inp" id="keyTaskOwner"><option value="">待指定</option>${memberOptions(task.owner)}</select></div>
        <div class="field"><label for="keyTaskStatus">状态</label><select class="inp" id="keyTaskStatus">${Object.entries(statuses).filter(([value])=>value!=='handoff').map(([value,label])=>`<option value="${value}" ${task.status===value?'selected':''}>${label}</option>`).join('')}</select></div>
        <label class="lcheck"><input type="checkbox" id="keyTaskRequired" ${task.required!==false?'checked':''}> 确认里程碑前必须完成</label>
        ${input('keyTaskStart','计划开始','date',task.start)}${input('keyTaskPlan','计划截止','date',task.plan)}${input('keyTaskForecast','预计完成','date',task.forecast)}
        <div class="field"><label for="keyTaskDependency">前置任务</label><select class="inp" id="keyTaskDependency"><option value="">无</option>${options}</select></div>
        ${input('keyTaskImpact','对后续节点的影响','text',task.impact)}`,'保存',()=>{
          const title=$('#keyTaskTitle').value.trim(), start=$('#keyTaskStart').value, plan=$('#keyTaskPlan').value;
          if(!title)return toast('请填写任务名称','warn');
          if(start&&plan&&start>plan)return toast('计划开始不能晚于计划截止','warn');
          const status=$('#keyTaskStatus').value, dependency=$('#keyTaskDependency').value;
          if(status==='done'&&earlier.some(item=>item.id===dependency&&item.status!=='done'))return toast('请先完成前置任务','warn');
          Object.assign(task,{title,start,plan,status,dependency,required:$('#keyTaskRequired').checked,owner:$('#keyTaskOwner').value,forecast:$('#keyTaskForecast').value,
            impact:$('#keyTaskImpact').value.trim(),completed:status==='done'?(task.completed||dateAfter()):''});
          if(!existing)tasks.push(task);
          phase.tasks=tasks;
          save(`${stages[stageIndex][0]} · ${existing?'更新':'添加'}关键任务 ${title}`);
        },true);
      return;
    }
    if(action==='progress-edit'&&manage){
      const options=memberOptions(step.owner);
      modal('调整 · '+safeText(milestone),`<div class="field"><label for="progressOwner">责任人</label><select class="inp" id="progressOwner"><option value="">待指定</option>${options}</select></div>
      <div class="field"><label for="progressStart">计划开始</label><input class="inp" id="progressStart" type="date" value="${safeText(step.start||'')}"></div>
      <div class="field"><label for="progressPlan">计划截止</label><input class="inp" id="progressPlan" type="date" value="${safeText(step.plan)}"></div>
      <div class="field"><label for="progressForecast">预计完成日期</label><input class="inp" id="progressForecast" type="date" value="${safeText(step.forecast)}"></div>
      <div class="field"><label for="progressBlock">阻塞原因及影响</label><textarea class="inp" id="progressBlock">${safeText(step.reason)}</textarea></div>`,'保存',()=>{
        const owner=$('#progressOwner').value, reason=$('#progressBlock').value.trim();
        const start=$('#progressStart').value, plan=$('#progressPlan').value;
        if(start&&plan&&start>plan)return toast('计划开始不能晚于计划截止','warn');
        step.status=!project.stageOwners&&(owner!==step.owner||step.status==='handoff')?'handoff':reason?'blocked':'active';
        Object.assign(step,{owner,start,plan,forecast:$('#progressForecast').value,reason});
        save(`调整${stage}安排 · ${accountName(owner)} · 计划 ${step.plan||'待排期'}`);
      },true);
    }
    if(action==='progress-complete'&&manage&&step.status==='active'&&!pendingTasks(project,step,index).length){
      const next=state.steps[index+1];
      if(!next){
        const required=(project.acceptances||[]).filter(item=>item.required!==false);
        if(!required.length||required.some(item=>item.status!=='已验收')){
          toast('请先在阶段交付物记录所有必需成果的验收结果','warn');
          switchWorkProjectTab('deliverables');
          return;
        }
      }
      const handoff=next&&manage?`<div class="field"><label for="progressNextOwner">${stages[index+1][0]}阶段接手人</label><select class="inp" id="progressNextOwner"><option value="">待指定</option>${memberOptions(next.owner)}</select></div>`:'';
      const contractFields=index===1?`<div class="field"><label for="signedContractRef">已签合同编号或链接 *</label><input class="inp" id="signedContractRef"></div>
        <div class="field"><label for="signedDeliveryScope">已确认交付范围 *</label><textarea class="inp" id="signedDeliveryScope" rows="2"></textarea></div>
        <div class="field"><label for="signedAcceptanceCriteria">已确认验收约定 *</label><textarea class="inp" id="signedAcceptanceCriteria" rows="2"></textarea></div>`:'';
      const sources=channelEvidence(project);
      const options=sources.map((item,i)=>`<option value="${i}">${safeText(item.title)} · ${safeText(item.ref||'')}</option>`).join('');
      modal('确认完成 · '+safeText(milestone),`<p>${stages[index][2]}</p><div class="field"><label for="progressSource">引用已归集的协作记录</label><select class="inp" id="progressSource"><option value="">选择记录</option>${options}</select></div><div class="field"><label for="progressEvidence">完成依据或链接</label><textarea id="progressEvidence" class="inp"></textarea></div>${contractFields}${handoff}`,'确认完成',()=>{
        const selected=$('#progressSource').value, source=selected===''?null:sources[Number(selected)];
        const note=$('#progressEvidence').value.trim();
        if(next&&!$('#progressNextOwner').value)return toast('请选择下一阶段接手人','warn');
        if(index===1){
          const signedContract=$('#signedContractRef').value.trim(),scope=$('#signedDeliveryScope').value.trim(),acceptance=$('#signedAcceptanceCriteria').value.trim();
          if(!signedContract||!scope||!acceptance)return toast('请核对并填写已签合同、交付范围及验收约定','warn');
          state.contractHandoff={signedContract,scope,acceptance,confirmedBy:account.id};
        }
        if(!note&&!source&&!contractFields)return toast('请填写完成依据，或选择已归集记录','warn');
        step.status='done';step.completed=dateAfter();step.evidence=[note||((index===1&&state.contractHandoff?.signedContract)||''),source&&['协作记录',source.ref].filter(Boolean).join(' · ')].filter(Boolean).join(' · ');
        (state.stageMaterials||={})[index]={evidence:step.evidence,ref:source?.ref||'',items:{}};
        if(next){
          next.status='handoff';
          if(manage)next.owner=$('#progressNextOwner').value;
        }
        save(`${milestone}已完成${next?'，待'+accountName(next.owner)+'接手'+stages[index+1][0]:''}`);
      },true);
    }
  }
  function shiftSchedule(item,gesture,days){
    const shift=date=>date?dateAt(Date.parse(date)+days*dayMs):'';
    return {
      start:gesture==='start'||gesture==='move'?shift(item.start):item.start||'',
      plan:gesture==='plan'||gesture==='move'?shift(item.plan):item.plan||'',
      forecast:gesture==='move'?shift(item.forecast):item.forecast||''
    };
  }
  let ganttDrag=null;
  document.addEventListener('pointerdown',event=>{
    const handle=event.target.closest('[data-gantt-gesture]');
    if(!handle||event.button!==0||!event.isPrimary)return;
    const track=handle.closest('.schedule-track');
    const {startDate:start,planDate:plan,forecastDate:forecast,ganttDays}=track.dataset;
    const pixelsPerDay=track.getBoundingClientRect().width/Number(ganttDays);
    if(!pixelsPerDay)return;
    event.preventDefault();
    handle.setPointerCapture(event.pointerId);
    ganttDrag={handle,track,pointerId:event.pointerId,x:event.clientX,pixelsPerDay,dates:{start,plan,forecast},shift:0};
  });
  document.addEventListener('pointermove',event=>{
    if(ganttDrag?.pointerId!==event.pointerId)return;
    const {track,handle,x,pixelsPerDay,dates}=ganttDrag;
    const shift=Math.round((event.clientX-x)/pixelsPerDay);
    ganttDrag.shift=shift;
    const gesture=handle.dataset.ganttGesture;
    const adjusted=shiftSchedule(dates,gesture,shift);
    track.dataset.dragPreview=[adjusted.start,adjusted.plan].filter(Boolean).join(' 至 ');
    const bar=track.querySelector('.schedule-bar');
    const startHandle=track.querySelector('.gantt-drag-handle.start');
    const planHandle=track.querySelector('.gantt-drag-handle.plan');
    if(gesture!=='plan')startHandle?.style.setProperty('--gesture-offset',shift*pixelsPerDay+'px');
    if(gesture!=='start')planHandle?.style.setProperty('--gesture-offset',shift*pixelsPerDay+'px');
    if(gesture!=='plan')bar?.style.setProperty('--gesture-offset',shift*pixelsPerDay+'px');
    if(gesture!=='move')bar?.style.setProperty('--gesture-width',(gesture==='start'?-1:1)*shift*pixelsPerDay+'px');
  });
  function finishGanttDrag(event){
    if(ganttDrag?.pointerId!==event.pointerId)return;
    const {track,handle,shift,dates}=ganttDrag;
    ganttDrag=null;
    delete track.dataset.dragPreview;
    track.querySelectorAll('[data-gantt-gesture]').forEach(node=>{node.style.removeProperty('--gesture-offset');node.style.removeProperty('--gesture-width');});
    if(event.type==='pointercancel'||!shift)return;
    const dataset={...handle.dataset,shiftDays:shift,originalStart:dates.start,originalPlan:dates.plan,originalForecast:dates.forecast};
    if(dataset.sharedTaskId){
      const task=WORK_HUB_TASKS.find(item=>item.id===dataset.sharedTaskId);
      if(task?.scheduledDate!==dates.plan)return toast('日期已变化，请重新拖动','warn');
      rescheduleWorkTask(task.id,shiftSchedule(dates,'plan',shift).plan,task.scheduledTime||'09:00');
      return;
    }
    act('progress-schedule',dataset.projectId,{dataset});
  }
  document.addEventListener('pointerup',finishGanttDrag);
  document.addEventListener('pointercancel',finishGanttDrag);
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-gantt-gesture]'))event.preventDefault();
  });
  let draggedEvent=null;
  let dropTarget=null;
  function clearDropTarget(){
    dropTarget?.classList.remove('schedule-drop-target');
    dropTarget=null;
  }
  document.addEventListener('dragstart',event=>{
    const node=event.target.closest('.schedule-event[draggable="true"]');
    if(!node)return;
    draggedEvent={...node.dataset,originalDate:node.closest('[data-schedule-date]').dataset.scheduleDate};
    event.dataTransfer.effectAllowed='move';
    event.dataTransfer.setData('text/plain',node.textContent);
  });
  document.addEventListener('dragover',event=>{
    const cell=event.target.closest('[data-schedule-date]');
    if(!draggedEvent||!cell){clearDropTarget();return;}
    event.preventDefault();
    event.dataTransfer.dropEffect='move';
    if(cell===dropTarget)return;
    clearDropTarget();dropTarget=cell;
    cell.classList.add('schedule-drop-target');
  });
  document.addEventListener('drop',event=>{
    const cell=event.target.closest('[data-schedule-date]');
    if(!draggedEvent||!cell)return;
    event.preventDefault();
    const dataset={...draggedEvent,dropDate:cell.dataset.scheduleDate};
    draggedEvent=null;clearDropTarget();
    act('progress-schedule',dataset.projectId,{dataset});
  });
  document.addEventListener('dragend',()=>{
    draggedEvent=null;clearDropTarget();
  });
  window.addEventListener('storage',event=>{
    if(!event.key?.startsWith('projectProgress.v1.')||!document.querySelector('.page[data-p="projects"].show')||workHubState.selectedProjectId)return;
    renderWorkProjectList();
  });
  function exceptionActions(project){
    const {state,index,step}=summary(project);
    if(!step)return '';
    const manage=canManageProjectLifecycle(project);
    const mine=step.owner===getCurrentWorkAccount().id;
    const button=(action,label)=>`<button type="button" class="btn sm gho" data-act="${action}" data-project-id="${safeText(project.id)}">${label}</button>`;
    if(project.stageOwners)return manage?button('progress-pause',state.pause?'恢复项目':'暂停项目'):'';
    return (manage?button('progress-pause',state.pause?'恢复项目':'暂停项目'):'')
      + (!state.pause&&!state.releaseRecovery&&manage?button('progress-reassign','转派阶段待办'):'')
      + (!state.pause&&(index===6||state.releaseRecovery)&&(manage||mine)?button('progress-release-recovery',state.releaseRecovery?'提交重新验证':'记录上线回退'):'');
  }
  const completionRules={
    1:{predecessors:[0],evidence:'已签合同编号或链接'},
    5:{predecessors:[4],evidence:'测试报告编号或链接'},
    6:{predecessors:[5],evidence:'上线发布与验证记录编号或链接'},
    7:{predecessors:[6],evidence:'客户验收记录编号或链接'}
  };

  function completionGate(state,index){
    const rule=completionRules[index];
    return {
      requiredEvidence:rule?.evidence||'',
      missingStages:(rule?.predecessors||[]).filter(i=>state.steps[i].status!=='done').map(i=>stages[i][0])
    };
  }

  function channelStage(project,requestedIndex){
    if(!project?.stageOwners||!canCurrentAccountAccessProject(project))return null;
    const {state}=summary(project);
    if(state.pause)return null;
    const owner=getCurrentWorkAccount().id;
    const eligible=state.steps.flatMap((step,index)=>step.status==='active'&&step.owner===owner&&(!state.releaseRecovery||index!==6)
      ? [{index,stage:stages[index][0],percent:step.percent||0,...completionGate(state,index)}]:[]);
    return (requestedIndex===undefined?eligible[0]:eligible.find(row=>row.index===requestedIndex))||null;
  }

  function latestStageReport(state,index){
    return (state.stageReports||[]).findLast(row=>row.index===index);
  }

  function stagePending(state,index){
    const step=state.steps[index],report=latestStageReport(state,index);
    if(step.status!=='active'||report?.percent!==100)return [];
    const gate=completionGate(state,index);
    return [...gate.missingStages.map(name=>'等待'+name+'完成'),...(gate.requiredEvidence&&!report.completionRef?['待补充'+gate.requiredEvidence]:[])];
  }

  function finishStage(state,index,report,evidence){
    const step=state.steps[index];
    step.status='done';step.completed=dateAfter();
    step.evidence=[evidence,report.ref,report.note].filter(Boolean).join(' · ');
    step.tasks=step.tasks.map(task=>({...task,status:'done',completed:step.completed}));
    report.pending=[];
    report.completionRef=evidence;
    if(state.steps[index+1]){
      (state.stageHandoffs||=[]).push({from:index,to:index+1,ref:report.ref,provider:report.provider,at:new Date().toISOString()});
    }
  }

  function parallelOverview(state){
    const stats={done:0,running:0,waiting:0,blocked:0,queue:0,attention:[]};
    state.steps.forEach((step,index)=>{
      const label=stages[index][0],report=latestStageReport(state,index);
      if(step.status==='done')stats.done++;
      else if(step.status==='blocked'){stats.blocked++;stats.attention.push(label+'阻塞');}
      else if(report?.percent===100){stats.waiting++;stats.attention.push(label+'待确认');}
      else if(step.percent)stats.running++;
      else stats.queue++;
    });
    return stats;
  }

  function receiveStageReport(project,record){
    const current=channelStage(project,record.stageIndex);
    if(!current||record.stageIndex!==current.index||record.accountId!==getCurrentWorkAccount().id)return false;
    const {state}=summary(project),step=state.steps[current.index];
    if(state.stageReports.some(row=>row.provider===record.provider&&row.ref===record.ref))return {completed:step.status==='done'};
    const {percent,text,provider,ref}=record;
    if(!Number.isInteger(percent)||percent<0||percent>100||!text?.trim())return false;
    const evidence=String(record.completionRef||'').trim();
    const pending=percent===100?[...current.missingStages.map(name=>name+'待完成'),...(current.requiredEvidence&&!evidence?['待补充'+current.requiredEvidence]:[])]:[];
    const completed=percent===100&&!pending.length;
    const report={stage:current.stage,index:current.index,owner:record.accountId,percent,note:text,provider,ref,at:record.createdAt,completionRef:evidence,pending};
    state.stageReports.push(report);
    step.percent=percent;
    if(completed)finishStage(state,current.index,report,evidence);
    state.history.push({at:new Date().toLocaleString('zh-CN'),actor:getCurrentWorkAccount().name,note:current.stage+'日报 · '+percent+'% · '+ref,stage:current.stage,source:'员工日报'});
    localStorage.setItem(storageKey(project),JSON.stringify(state));
    if(deriveProjectLifecycle(project,summary(project))!==project.lifecycleStage||(completed&&current.index===state.steps.length-1))persistProjectWorkspace(project);
    return {completed,pending};
  }

  function simpleWorkflow(project){
    const {state,step}=summary(project);
    const reports=state.stageReports||[];
    const active=state.steps.filter(item=>item.status==='active').length;
    const stats=parallelOverview(state);
    const title=step?'阶段任务':project.lifecycleStage==='待验收'?'结项条件待满足':'项目已完成';
    const manage=canManageProjectLifecycle(project),account=getCurrentWorkAccount();
    return `<section class="project-panel" aria-label="阶段任务">
      <div class="project-panel-head"><div><h3>${title}</h3>
      <p>${step?active+' 个阶段可并行处理':'所有阶段任务已完成'}</p></div></div>
      ${stats.attention.length?`<p class="mini">需要关注：${safeText(stats.attention.join('、'))}</p>`:''}
      ${state.steps.map((item,i)=>{
        const handoff=(state.stageHandoffs||[]).find(row=>row.to===i);
        const gate=completionGate(state,i);
        const evidenceLabel=item.status==='done'?'':[...gate.missingStages.map(name=>'完成前需'+name+'结束'),gate.requiredEvidence?'完成依据：'+gate.requiredEvidence:''].filter(Boolean).join(' · ');
        const stageButton=(action,label)=>`<button class="btn sm gho" data-act="${action}" data-stage-index="${i}" data-project-id="${safeText(project.id)}">${label}</button>`;
        const mutable=!state.pause&&item.status!=='done';
        const canAct=manage||item.owner===account.id;
        const report=latestStageReport(state,i);
        const reassign=mutable&&manage?stageButton('progress-reassign','转派'):'';
        const recovery=mutable&&canAct&&i===6?stageButton('progress-release-recovery',state.releaseRecovery?'提交重新验证':'记录上线回退'):'';
        const confirm=mutable&&canAct&&item.status==='active'&&report?.percent===100&&!gate.missingStages.length?stageButton('progress-confirm-stage','核对完成'):'';
        const handoffLink=handoff&&canAct?stageButton('progress-view-handoff','查看交接'):'';
        const pending=stagePending(state,i);
        const channels=channelStage(project,i)?`<details class="project-stage-channels"><summary class="btn sm">提交日报</summary><div class="rowact">${window.officeWorkflowDemo.launchers(project,null,i)}</div></details>`:'';
        return `<div class="project-row project-row-action" data-project-stage-row="${i}" tabindex="-1"><div><b>${safeText(stages[i][0])}</b><small>${safeText(accountName(item.owner))} · ${item.plan?'截止 '+safeText(item.plan):'待排期'} · ${item.status==='active'&&report?.percent===100?'待确认':item.status==='active'&&!item.percent?'待处理':statuses[item.status]}${item.status!=='waiting'?' · 日报进度 '+(item.percent||0)+'%':''}</small>
          ${pending.length?`<small>${safeText(pending.join('、'))}</small>`:''}
          ${evidenceLabel?`<small>${safeText(evidenceLabel)}</small>`:''}
          ${handoff?`<small>已接收${safeText(stages[handoff.from][0])}交接 · ${safeText(handoff.ref)}</small>`:''}</div>
          <div class="rowact">${channels}${confirm}${handoffLink}${reassign}${recovery}</div></div>`;
      }).join('')}
      </section><section class="project-panel"><h3>阶段日报</h3>${reports.length?[...reports].reverse().map(row=>`<div class="project-row"><b>${safeText(row.stage)} · ${row.percent}%</b><small>${safeText(accountName(row.owner))} · ${safeText(OFFICE_CHANNELS[row.provider]?.name||"历史日报")} ${safeText(row.ref||"")} · ${safeText(row.note)}</small>${row.pending?.length?`<small>待确认 · ${safeText(row.pending.join("、"))}</small>`:row.completionRef?`<small>完成依据 · ${safeText(row.completionRef)}</small>`:''}</div>`).join(''):'<p class="mini">暂无阶段日报</p>'}</section>`;
  }
  function dailyTaskCatalog(projects){
    return projects.flatMap(project=>read(project).steps.flatMap((step,index)=>
      keyTasks(step,index,project).map(task=>({id:task.id,title:task.title,projectId:project.id}))));
  }
  window.projectProgressDemo={parallelOverview,channelStage,receiveStageReport,simpleWorkflow,stageNames:stages.map(([name])=>name),dailyTaskCatalog,exceptionActions,summary,isDelivered,detail,tasks,act,accountName,portfolio,changeView,stageMaterialRows,stageHistory};
})();
