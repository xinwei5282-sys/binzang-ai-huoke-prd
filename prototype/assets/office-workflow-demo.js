/* Submitted records from the three simulated collaboration platforms. */
(() => {
  const prefix = project => 'officeWorkflowDemo.v1.' + project.tenantId + '.' + project.id + '.';
  const approvalStates = {pending:'审批中', approved:'已通过', rejected:'已驳回',withdrawn:'已撤回'};
  const names = {daily:'日报', approval:'审批', meeting:'会议纪要'};

  function records(project) {
    if (!project || !canCurrentAccountAccessProject(project)) return [];
    const base=prefix(project);
    const found=[];
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith(base)) continue;
      let row;
      try { row=JSON.parse(localStorage.getItem(key)); } catch { continue; }
      if (row?.projectId===project.id && (!row.classification || row.accountId===getCurrentWorkAccount().id) && (!row.autoDaily || window.projectFlowDemo.roleFor(project)!=='employee' || row.accountId===getCurrentWorkAccount().id) && OFFICE_CHANNELS[row.provider] && canReadChannelSample(row.kind,project)) found.push(row);
    }
    const demo=[window.projectOrganizationDemo,window.projectTeamDailyDemo].find(item=>item?.project.id===project?.id);
    if(project.id===demo?.project.id){
      for(const row of demo.office){
        if(!localStorage.getItem(base+row.ref)&&canReadChannelSample(row.kind,project))found.push(structuredClone(row));
      }
    }
    return found.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  }

  function dailyProjects() {
    return WORK_HUB_PROJECTS.filter(project => canCurrentAccountAccessProject(project)
      && window.projectFlowDemo.roleFor(project) === 'employee');
  }

  function classifyDaily(content, projects, tasks) {
    return content.split(/[\n；;。]+/u).map(line => line.trim()).filter(Boolean).map(text => {
      const namedProjects = projects.filter(project => text.includes(project.name));
      const explicitTitle=text.match(/^(.+?)[：:]\s*(已完成|阻塞|预计延期)/)?.[1]?.trim();
      const matchingTasks = tasks.filter(task => projects.some(project => project.id === task.projectId)
        && task.title && (explicitTitle?explicitTitle===task.title:text.includes(task.title))
        && (!namedProjects.length || namedProjects.some(project => project.id === task.projectId)));
      const projectIds = new Set([...namedProjects.map(project => project.id), ...matchingTasks.map(task => task.projectId)]);
      if (projectIds.size !== 1) return {text, projectId:'', taskId:''};
      return {text, projectId:[...projectIds][0], taskId:matchingTasks.length === 1 ? matchingTasks[0].id : ''};
    });
  }

  function dailyTasks(projects){
    return [...window.projectProgressDemo.dailyTaskCatalog(projects),...WORK_HUB_TASKS.filter(canCurrentAccountSeeWorkItem)];
  }

  function syncDaily(project, record) {
    const projects = dailyProjects();
    const items = classifyDaily(record.text, projects, dailyTasks(projects));
    localStorage.setItem(prefix(project)+record.ref, JSON.stringify({...record, classification:items}));
    publishDaily(record, items);
    return '已同步日报 · '+items.filter(item=>item.projectId).length+' 条已归类 · '+items.filter(item=>!item.taskId).length+' 条待确认';
  }

  function publishDaily(record, items) {
    for (const project of dailyProjects()) {
      const parts = items.filter(item => item.projectId === project.id);
      const key = prefix(project)+record.ref+'-summary';
      if (parts.length) {
        const summary = {...record, projectId:project.id, sourceRef:record.ref, ref:record.ref+'-summary',
          title:'员工日报归集', text:parts.map(part => part.text).join('；'), items:parts, autoDaily:true, status:'已自动归集'};
        localStorage.setItem(key, JSON.stringify(summary));
      } else if (localStorage.getItem(key)) {
        delete localStorage[key];
      }
    }
  }

  function dailyRows(project) {
    if (!canCurrentAccountAccessProject(project)) return {raw:[], summaries:[]};
    const role = window.projectFlowDemo.roleFor(project);
    if (!['employee','supervisor','department','executive'].includes(role)) return {raw:[], summaries:[]};
    const account = getCurrentWorkAccount();
    const raw = [], summaries = [];
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith(prefix(project))) continue;
      let row;
      try { row=JSON.parse(localStorage.getItem(key)); } catch { continue; }
      if (row?.autoDaily && (role !== 'employee' || row.accountId === account.id)) summaries.push(row);
      if (role === 'employee' && row?.accountId === account.id && row.classification) raw.push(row);
    }
    return {raw, summaries};
  }

  function dailySummary(project) {
    const {raw,summaries}=dailyRows(project);
    if (!raw.length && !summaries.length) return '';
    const totals = new Map();
    for (const row of summaries) totals.set(row.date, (totals.get(row.date)||0)+1);
    return `<section class="pr-workspace"><h3>日报自动汇总</h3>
      ${[...totals].map(([date,count])=>`<p class="mini">${safeText(date)} · ${count} 份日报</p>`).join('')}
      ${summaries.map(row=>`<article class="pr-note"><p>${safeText(row.text)}</p><small>${safeText(row.date)} · 原单 ${safeText(row.sourceRef)}</small></article>`).join('')}
      ${raw.map(row=>row.classification.map((item,index)=>(item.taskId||item.confirmed)?'':`<div class="pr-note"><b>待确认归属</b><p>${safeText(item.text)}</p><button class="btn sm" data-act="oa-classify" data-project-id="${safeText(project.id)}" data-ref="${safeText(row.ref)}" data-index="${index}">确认项目及任务</button></div>`).join('')).join('')}
    </section>`;
  }

  function confirmDaily(project, ref, index) {
    const projects = dailyProjects();
    if (!project || !projects.includes(project)) return;
    const key = prefix(project)+ref;
    const row = JSON.parse(localStorage.getItem(key)||'null');
    if (row?.accountId !== getCurrentWorkAccount().id || !row.classification?.[index]) return;
    modal('确认日报条目归属', `<p>${safeText(row.classification[index].text)}</p>
      <label for="oaDailyProject">项目</label><select id="oaDailyProject" class="inp">${projects.map(p=>`<option value="${safeText(p.id)}" ${p.id===row.classification[index].projectId?'selected':''}>${safeText(p.name)}</option>`).join('')}</select>
      <label for="oaDailyTask">任务</label><select id="oaDailyTask" class="inp"></select>`, '保存归属', () => {
      const current=JSON.parse(localStorage.getItem(key)||'null');
      if (current?.accountId!==getCurrentWorkAccount().id || !current.classification?.[index]) return closeModal();
      const projectId=$('#oaDailyProject').value, taskId=$('#oaDailyTask').value;
      if (!dailyProjects().some(p=>p.id===projectId)) return;
      if (taskId && !dailyTasks(dailyProjects()).some(task=>task.id===taskId && task.projectId===projectId)) return;
      current.classification[index]={...current.classification[index],projectId,taskId,confirmed:true};
      localStorage.setItem(key,JSON.stringify(current));
      publishDaily(current,current.classification);
      closeModal();refresh();toast('已更新日报归属','ok');
    }, true);
    const renderTasks=()=>{
      const projectId=$('#oaDailyProject').value;
      $('#oaDailyTask').innerHTML='<option value="">只归入项目</option>'+dailyTasks(projects).filter(task=>task.projectId===projectId).map(task=>`<option value="${safeText(task.id)}">${safeText(task.title)}</option>`).join('');
    };
    $('#oaDailyProject').addEventListener('change',renderTasks);
    renderTasks();
  }

  function typeName(provider,kind) {
    return OFFICE_CHANNELS[provider].types[OFFICE_SAMPLES[kind].index];
  }
  function launchers(project,provider=null,stageIndex) {
    const pairs=provider ? Object.keys(names).filter(k=>canReadChannelSample(k,project) && (k!=='daily'||(project.stageOwners?window.projectProgressDemo.channelStage(project):window.projectFlowDemo.roleFor(project)==='employee'))).map(k=>[provider,k])
      : Object.keys(OFFICE_CHANNELS).map(p=>[p,'daily']);
    return pairs.map(([p,k])=>`<button type="button" class="btn" data-act="oa-native" data-provider="${p}" data-kind="${k}" data-project-id="${safeText(project.id)}" ${stageIndex===undefined?'':'data-stage-index="'+stageIndex+'"'}>${provider?typeName(p,k):OFFICE_CHANNELS[p].name+' · '+typeName(p,k)}</button>`).join('');
  }

  function resolveStageSource(source){
    const account=getCurrentWorkAccount();
    if(source.accountId!==account.id)return null;
    const candidates=WORK_HUB_PROJECTS.filter(project=>project.stageOwners&&project.name===source.projectName&&canCurrentAccountAccessProject(project));
    if(candidates.length!==1)return null;
    const project=candidates[0];
    const index=window.projectProgressDemo.stageNames.indexOf(source.stageName);
    const stage=window.projectProgressDemo.channelStage(project,index);
    return stage?{project,index}:null;
  }

  function open(provider,kind,project,previous=null,stageIndex) {
    if (!Object.hasOwn(OFFICE_CHANNELS,provider) || !Object.hasOwn(names,kind) || !canReadChannelSample(kind,project)) return;
    const account=getCurrentWorkAccount();
    if(previous&&(previous.accountId!==account.id||previous.state!=='rejected'||records(project).some(row=>row.supersedes===previous.ref)))return;
    const stage=kind==='daily'&&project.stageOwners?window.projectProgressDemo.channelStage(project,stageIndex):null;
    if(kind==='daily' && (project.stageOwners?!stage:window.projectFlowDemo.roleFor(project)!=='employee'))return;
    const form=typeName(provider,kind);
    const number=({wecom:'QW',feishu:'FS',dingtalk:'DD'})[provider]+'-'+crypto.randomUUID().slice(0,8).toUpperCase();
    const sample=channelSamples(project)[kind];
    const sourceStatus=kind==='approval'? `<div class="field"><label for="oaApprovalType">审批类型</label><select class="inp" id="oaApprovalType">${Object.entries({payment:'打款',invoice:'开票',quote:'商务报价',other:'其他'}).map(([type,label])=>`<option value="${type}" ${previous?.approvalType===type?'selected':''}>${label}</option>`).join('')}</select></div>
      <div id="oaQuoteFields" hidden><div class="field"><label for="oaQuoteScope">批准的报价范围</label><input class="inp" id="oaQuoteScope" value="${safeText(previous?.quote?.scope||'')}"></div><div class="field"><label for="oaQuoteItems">分项及金额（每行 名称,金额）</label><textarea class="inp" id="oaQuoteItems">${safeText(previous?.quote?.items||'')}</textarea></div><div class="split"><div class="field"><label for="oaQuoteCurrency">币种</label><select class="inp" id="oaQuoteCurrency"><option>CNY</option><option ${previous?.quote?.currency==='USD'?'selected':''}>USD</option></select></div><div class="field"><label for="oaQuoteExpiry">有效期至</label><input class="inp" type="date" id="oaQuoteExpiry" value="${safeText(previous?.quote?.expiry||'')}"></div></div></div>`:'';

    const text=stage?'':kind==='daily'?sample.text:kind==='approval'?'为完成本期复核，申请借调测试人员半天。':'本次会议对齐了本期交付范围，测试负责人将在下次评审前提交验证结果。';
    const body=`<p class="mini">原平台流程演示 · ${safeText(project.name)} · ${safeText(number)}</p>
      <div class="field"><label for="oaNativeTitle">主题</label><input class="inp" id="oaNativeTitle" maxlength="120" value="${safeText(previous?.title||(stage?stage.stage+'进展':kind==='meeting'?'项目进展沟通会':sample.title))}"></div>
      <div class="field"><label for="oaNativeText">${kind==='daily'?'工作进展':kind==='approval'?'申请事项':'会议结论'}</label><textarea class="inp" id="oaNativeText" rows="4" maxlength="6000">${safeText(previous?.text||text)}</textarea></div>
      ${stage?`<details class="oa-history"><summary>模拟原单归集字段</summary><div class="split">
      <div class="field"><label for="oaSourceProject">原单项目名称</label><input class="inp" id="oaSourceProject" value="${safeText(project.name)}"></div>
      <div class="field"><label for="oaSourceStage">原单阶段</label><input class="inp" id="oaSourceStage" value="${safeText(stage.stage)}"></div></div></details><div class="field"><label for="oaStagePercent">阶段进度（%）</label><input class="inp" id="oaStagePercent" type="number" min="0" max="100" value="${stage.percent}"></div>${stage.requiredEvidence?`<div class="field"><label for="oaStageCompletionRef">${safeText(stage.requiredEvidence)}（确认完成时提供）</label><input class="inp" id="oaStageCompletionRef" maxlength="240"></div>`:''}${stage.missingStages.length?`<p class="mini">完成前需等待 ${safeText(stage.missingStages.join('、'))}。可以先汇报准备进度。</p>`:''}`:''}${sourceStatus}${kind==='approval'?`<div class="field"><label for="oaProjectImpact">受影响的项目节点（可选）</label><input class="inp" id="oaProjectImpact" value="${safeText(previous?.projectImpact||'')}"></div>`:''}${previous?`<p class="mini">补正原单 ${safeText(previous.ref)} · ${safeText(previous.rejectionReason||'')}</p>`:''}<p class="mini">${stage?'提交后，项目自动同步此阶段进度。进度达到 100% 时，系统按本阶段条件判断是否完成。':kind==='daily'?'可以填写多个项目的工作事项。每条另起一行，写上项目或任务名称。系统自动归类，归属不清的条目待确认。':kind==='approval'?'项目跟随原平台的审批状态更新。':'发布后归入项目动态并保留纪要原文。'}</p>`;
    modal(`${OFFICE_CHANNELS[provider].name} · ${form}`,body,kind==='meeting'?'在原流程发布':'在原流程提交',()=>{
      if (getCurrentWorkAccount().id!==account.id || !canReadChannelSample(kind,project)) return closeModal();
      const title=document.getElementById('oaNativeTitle').value.trim();
      const content=document.getElementById('oaNativeText').value.trim();
      if (!title || !content) return toast('请填写主题和正文','warn');
      const percent=stage?$('#oaStagePercent').valueAsNumber:null;
      if(stage&&(!Number.isInteger(percent)||percent<0||percent>100))return toast('请填写 0–100 的整数进度','warn');
      if(stage&&!window.projectProgressDemo.channelStage(project,stage.index))return toast('阶段已变化，请重新打开日报','warn');
      if(previous&&records(project).some(row=>row.supersedes===previous.ref))return toast('该审批已重新提交','warn');
      const at=new Date().toISOString();
      const approvalType=kind==='approval'?document.getElementById('oaApprovalType').value:'';
      const quote=approvalType==='quote'?{scope:$('#oaQuoteScope').value.trim(),items:$('#oaQuoteItems').value.trim(),
        currency:$('#oaQuoteCurrency').value,expiry:$('#oaQuoteExpiry').value}:null;
      if(quote&&(!quote.scope||!window.projectMaterialsDemo.parseItems(quote.items)||!window.projectMaterialsDemo.dayValid(quote.expiry)))
        return toast('请核对报价范围、分项金额和有效期','warn');
      const state=kind==='approval'?'pending':'submitted';
      const channelAccountId=organizationDirectory(account.tenantId).find(member=>member.id===account.id)?.mappings[provider];
      const source=stage?{projectName:$('#oaSourceProject').value.trim(),stageName:$('#oaSourceStage').value.trim(),accountId:account.id}:null;
      const matched=source?resolveStageSource(source):null;
      if(stage&&!matched)return toast('归属待确认：请核对原单项目、阶段和提交人。项目进度未更新。','warn');
      const target=matched?.project||project;
      const record={...(stage?{stageIndex:matched.index,source,percent,completionRef:$('#oaStageCompletionRef')?.value.trim()||''}:{}),native:true,projectId:target.id,provider,channelAccountId,providers:[provider],kind,ref:number,title,text:content,state,approvalType,quote,
        status:kind==='approval'?approvalStates[state]:kind==='meeting'?'已发布':'已提交',tone:state==='pending'?'warn':'brd',
        form,supersedes:previous?.ref||'',projectImpact:document.getElementById('oaProjectImpact')?.value.trim()||'',author:account.name,accountId:account.id,createdAt:at,updatedAt:at,date:new Date().toLocaleDateString('zh-CN'),verified:false};
      const key=prefix(target)+number;
      const existing=localStorage.getItem(key);
      if (!existing) localStorage.setItem(key,JSON.stringify(record));
      const saved=existing?JSON.parse(existing):record;
      let message='已同步到项目和企业大脑';
      if(stage){
        const result=window.projectProgressDemo.receiveStageReport(target,saved);
        if(!result)return toast('日报未能匹配当前阶段','warn');
        message=result.completed?'日报已同步，阶段已完成':result.pending?.length?'进度已更新，待确认：'+result.pending.join('、'):'日报已同步，项目进度已更新';
      }else if (kind==='daily') message=syncDaily(project,saved);
      closeModal();refresh();toast(message,'ok');
    },true);
    if(kind==='approval'){
      const type=$('#oaApprovalType');
      const update=()=>{$('#oaQuoteFields').hidden=type.value!=='quote';};
      if(previous)type.disabled=true;
      type.addEventListener('change',update);update();
    }
  }

  function refresh() {
    renderChannelWorkspace();
    if (workHubState.selectedProjectId) renderWorkProjectDetail();
    if (document.querySelector('.page[data-p="home"].show')) renderWorkTaskCenter();
  }
  function corrections(project){
    const rows=records(project);
    return rows.filter(row=>row.kind==='approval'&&row.state==='rejected'&&!rows.some(next=>next.supersedes===row.ref));
  }
  function correctionTasks(){
    const account=getCurrentWorkAccount();
    return WORK_HUB_PROJECTS.flatMap(project=>corrections(project).filter(row=>row.accountId===account.id).map(row=>({
      id:'office-correction-'+row.ref,officeCorrection:row.ref,projectId:project.id,ownerAccountId:account.id,status:'pending',title:'补正审批：'+row.title
    })));
  }
  function reopen(project,ref){
    const row=corrections(project).find(item=>item.ref===ref&&item.accountId===getCurrentWorkAccount().id);
    if(row)open(row.provider,'approval',project,row);
  }
  function show(project,row) {
    if (!canReadChannelSample(row.kind,project)) return;
    const account=getCurrentWorkAccount();
    const mayVerify=()=>canCurrentAccountAccessProject(project)&&(window.projectFlowDemo.roleFor(project)==='supervisor'||canManageProjectLifecycle(project));
    const meetingStatus=row.kind==='meeting'?'<p class="mini">'+(row.verified?'已核验，可作为复测依据':'待核验，暂不可作为复测依据')+'</p>':'';
    const verification=row.kind==='meeting'&&!row.verified&&mayVerify()?'<button type="button" class="btn pri" id="oaVerifyMeeting">核验并允许引用</button>':'';
    const quoteDetails=row.quote?`<section><h4>商务报价范围</h4><p>${safeText(row.quote.scope)}</p>
      <pre>${safeText(row.quote.items)}</pre><p class="mini">${safeText(row.quote.currency)} · 有效至 ${safeText(row.quote.expiry)}</p></section>`:'';
    const canDecide=row.kind==='approval'&&['pending','approved'].includes(row.state)&&currentWorkDataScope()==='all';
    const decision=canDecide?`<details class="oa-history"><summary>演示原平台审批</summary><div class="field"><label for="oaNativeDecision">处理结果</label><select class="inp" id="oaNativeDecision">${row.state==="approved"?'<option value="withdrawn">撤回批复</option>':'<option value="approved">通过</option><option value="rejected">驳回</option>'}</select></div><div class="field"><label for="oaRejectionReason">驳回或撤回原因</label><textarea class="inp" id="oaRejectionReason" rows="2"></textarea></div><button type="button" class="btn" id="oaSaveDecision">在原平台确认结果</button></details>`:'';
    modal(OFFICE_CHANNELS[row.provider].name+' · '+row.form,`<p class="mini">原平台记录 · ${safeText(project.name)} · ${safeText(row.sourceRef||row.ref)}</p><div class="head"><h3>${safeText(row.title)}</h3><span class="bdg mut">${safeText(row.status)}</span></div><p class="mini">${safeText(row.author||'')} · ${safeText(row.date)}</p><blockquote class="oa-quote">${safeText(row.text)}</blockquote>${quoteDetails}${row.supersedes?`<p class="mini">补正自 ${safeText(row.supersedes)}</p>`:''}${row.rejectionReason?`<p>处理原因 · ${safeText(row.rejectionReason)}</p>`:''}${corrections(project).some(item=>item.ref===row.ref)&&row.accountId===getCurrentWorkAccount().id?`<button class="btn sm" data-act="oa-correction" data-project-id="${safeText(project.id)}" data-ref="${safeText(row.ref)}">补正并重提</button>`:''}${decision}${meetingStatus}${verification}`,'关闭' ,closeModal,true);
    if(verification)document.getElementById('oaVerifyMeeting').onclick=()=>{
      if(getCurrentWorkAccount().id!==account.id||!mayVerify())return closeModal();
      const current=records(project).find(item=>item.ref===row.ref&&item.kind==='meeting'&&item.provider===row.provider);
      if(!current||current.verified)return closeModal();
      localStorage.setItem(prefix(project)+row.ref,JSON.stringify({...current,verified:true,verifiedBy:account.id,verifiedAt:new Date().toISOString()}));
      closeModal();refresh();toast('纪要已核验，可用于复测签认','ok');
    };
    if (canDecide) document.getElementById('oaSaveDecision').onclick=()=>{
      if (getCurrentWorkAccount().id!==account.id||currentWorkDataScope()!=='all'||!canReadChannelSample('approval',project)) return closeModal();
      const key=prefix(project)+row.ref;
      const current=JSON.parse(localStorage.getItem(key)||'null');
      if (current?.state===row.state) {
        const state=document.getElementById('oaNativeDecision').value;
        if (!(row.state==='pending'?['approved','rejected']:['withdrawn']).includes(state)) return;
        const rejectionReason=state!=='approved'?document.getElementById('oaRejectionReason').value.trim():'';
        if(state!=='approved'&&!rejectionReason)return toast('请填写驳回或撤回原因','warn');
        localStorage.setItem(key,JSON.stringify({...current,state,rejectionReason,decidedBy:account.id,status:approvalStates[state],tone:'brd',updatedAt:new Date().toISOString()}));
      }
      closeModal();refresh();toast('原流程审批结果已同步','ok');
    };
  }
  window.officeWorkflowDemo={records,launchers,open,show,corrections,correctionTasks,reopen,dailyRows,dailySummary,confirmDaily,classifyDaily};
})();
