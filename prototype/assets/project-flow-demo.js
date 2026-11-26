(() => {

  const tabs = {reports:'动态与汇报',stage:'阶段交付物',decisions:'审批与决策',archive:'企业大脑记录'};
  function roleFor(project) {
    const account=getCurrentWorkAccount();
    if (!canCurrentAccountAccessProject(project)) return null;
    if (project.reportRecipients) return project.reportRecipients[account.projectRole]===account.id ? account.projectRole : null;
    return project.ownerAccountId===account.id ? account.projectRole : null;
  }
  function view() {
    return {project:WORK_HUB_PROJECTS.find(project=>roleFor(project)),tab:'reports'};
  }
  function context(project = WORK_HUB_PROJECTS.find(p=>p.id===workHubState.selectedProjectId)) {
    const role=roleFor(project);
    if (!role) return null;
    const evidence = () => channelEvidence(project).filter(source=>role!=='employee'||source.kind!=='approval');
    return {project,role,accountId:getCurrentWorkAccount().id,canLead:['department','executive'].includes(role),scopeKey:`${project.tenantId}.${project.id}`,
      refresh: render, evidence, quoteApprovals:()=>window.officeWorkflowDemo.records(project).filter(row=>row.approvalType==='quote'), observe:(message)=>message ? toast(message,'warn') : channelObservation(evidence()),
      gotoChannels:()=>{selectedOfficeProjectId=project.id;go('kb');showKbTab('channels');},
      openSource:(provider,kind,ref)=>{
        if (evidence().some(e=>e.kind===kind && (!ref || e.ref===ref) && e.providers.includes(provider))) openChannelRecord(provider,kind,project,ref);
      }, downloadDeck};
  }
  function records(ctx) {
    const {state}=window.projectProgressDemo.summary(ctx.project);
    const stages=window.projectProgressDemo.stageMaterialRows(ctx.project,state).map(row=>({
      title:row.stage+' · '+row.name+' · '+row.version,
      summary:row.status+' · '+row.detail,ref:row.source,
      kind:row.status==='已确认'?'approved-material':'draft-material',tab:'stage'
    }));
    return [
      ...stages,
      ...window.officeWorkflowDemo.dailyRows(ctx.project).summaries.map(row=>({title:row.title,summary:row.text,ref:row.sourceRef,tab:'reports'})),
      ...(window.projectReportsDemo.brainEntries?.(ctx) || []).map(entry=>({...entry,tab:['report_decision','report_feedback'].includes(entry.kind)?'decisions':'reports'})),
      ...(window.projectMaterialsDemo.brainEntries?.(ctx) || []).map(entry=>({...entry,tab:'stage'}))
    ];
  }
  const entryKinds={
    report_feedback:'项目跟进反馈',report_submission:'汇报快照',report_decision:'领导决策',report_execution:'执行回执',report_verification:'复测签认',
    report_acceptance:'验收记录',operating_brief:'经营会简报','project-material':'范围与物料',
    'workflow-status':'流程状态','approved-material':'已确认物料','draft-material':'物料草稿',
    'approval-status':'商务批复状态',approval:'商务批复'
  };
  function archive(ctx) {
    const entries = records(ctx);
    const sources = ctx.evidence();
    return `<section class="project-brain-records" data-project-resource="archive" aria-labelledby="project-brain-heading"><h3 id="project-brain-heading">企业大脑记录</h3><section class="project-panel"><div class="head"><h4>流程记录</h4><span class="bdg mut">${entries.length} 条</span></div>${entries.length ? entries.map(entry=>`<div class="oa-item"><div><small>${safeText(entryKinds[entry.kind] || tabs[entry.tab])}${entry.ref && !entry.ref.startsWith('rpt-') ? ' · '+safeText(entry.ref) : ''}</small><b>${safeText(entry.title)}</b><p>${safeText(entry.summary || '')}</p></div><button class="btn sm" data-act="pf-tab" data-tab="${entry.tab}">查看${tabs[entry.tab]}</button></div>`).join('') : '<p class="oa-result">提交首份汇报或确认项目范围后，可在这里追溯记录与版本。</p>'}</section>
      ${sources.length ? renderChannelProjectUpdate(ctx.project,sources,ctx.canLead) : '<section class="project-panel"><h4>已归集的项目来源</h4><p class="oa-result">当前项目还没有已归集的渠道原文。</p></section>'}</section>`;
  }
  function render() {
    const project=WORK_HUB_PROJECTS.find(p=>p.id===workHubState.selectedProjectId);
    const ctx=context(project);
    if (!project) return;
    const tab=workHubState.activeProjectTab;
    document.querySelectorAll('[data-flow-slot]').forEach(slot=>{
      if (slot.dataset.flowSlot!==tab) {slot.replaceChildren();return;}
      if (tab==='stage') {slot.innerHTML=renderProjectDeliverables(project,ctx);return;}
      if (!ctx) {slot.innerHTML='<p class="mini">当前账号没有该项目的汇报与物料权限。</p>';return;}
      if (tab==='reports') slot.innerHTML=(window.projectProgressDemo.isDelivered(project)?window.projectReportsDemo.render(ctx,'closed-reports'):window.projectReportsDemo.overview(ctx)+window.projectReportsDemo.render(ctx))+archive(ctx);
      if (tab==='decisions') {
        if(!slot.hasAttribute('data-platform-approvals')){
          slot.innerHTML=window.projectReportsDemo.render(ctx,'decisions');
          return;
        }
        const sources=ctx.evidence().filter(e=>e.kind==='approval');
        const platform=ctx.canLead?`<section class="project-panel"><div class="head"><h3>协作平台审批</h3><button class="btn sm gho" data-act="open-kb-tab" data-kbtab="channels" data-project-id="${safeText(project.id)}">查看协作渠道</button></div>${sources.length?channelEvidenceList(sources):'<p class="mini">当前项目暂无已同步的审批单。</p>'}</section>`:'';
        slot.innerHTML=platform;
      }
    });
  }
  function open(projectId, tab='reports') {
    const dest=tab==='materials'?'stage':tab;
    const project=WORK_HUB_PROJECTS.find(item=>item.id===projectId);
    if(!roleFor(project)){toast('当前账号无权查看该项目汇报','warn');return;}
    openWorkProject(projectId,dest);
  }
  function tasks() {
    const account=getCurrentWorkAccount();
    return WORK_HUB_PROJECTS.filter(canCurrentAccountAccessProject).flatMap(project=>{
      const ctx=context(project), task=ctx && window.projectReportsDemo.pendingTask(ctx);
      return task?[{...task,id:'project-report-'+project.id,projectId:project.id,customerId:project.customerId,
        ownerAccountId:account.id,status:'pending'}]:[];
    });
  }
  function action(name,el) {
    if (name==='pf-open') { open(el.dataset.projectId,el.dataset.tab||'reports');return; }
    const ctx=context();
    if (!ctx) return;
    if (name==='pf-tab' && Object.hasOwn(tabs,el.dataset.tab)) {switchWorkProjectTab(el.dataset.tab);return;}
    if (name.startsWith('flow-')) window.projectReportsDemo.act(name,el,ctx);
    if (name.startsWith('mat-')) {
      if (el.tagName === 'SELECT') window.projectMaterialsDemo.change(name,el,ctx);
      else window.projectMaterialsDemo.act(name,el,ctx);
    }
  }
  function archiveLink(project,showEmpty=false) {
    const ctx=context(project);
    if (!ctx) return '';
    const entries=records(ctx);
    if (!entries.length&&!showEmpty) return '';
    return `<section class="card pad pf-brain-link"><div class="head"><div><h3>项目归档记录</h3><p class="mini">${safeText(project.name)} · ${entries.length} 条可见记录</p></div><button class="btn sm" data-act="pf-open" data-project-id="${safeText(project.id)}" data-tab="archive">查看归档</button></div></section>`;
  }
  document.addEventListener('change',event=>{
    const el=event.target;
    if (el.id==='oaProject' && WORK_HUB_PROJECTS.some(p=>p.id===el.value && canCurrentAccountAccessProject(p))){selectedOfficeProjectId=el.value;renderChannelWorkspace();}
    if (el.tagName==='SELECT' && el.dataset.act?.startsWith('mat-'))action(el.dataset.act,el);
  });
  window.addEventListener('storage',()=>{
    if(document.querySelector('#mask.show'))return;
    if(document.querySelector('.page[data-p="projects"].show') && workHubState.selectedProjectId)renderWorkProjectDetail();
    if(document.querySelector('.page[data-p="home"].show'))renderWorkTaskCenter();
  });
  let deckLibrary;
  function loadDeckLibrary() {
    if (!deckLibrary) deckLibrary = new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='assets/vendor/pptxgenjs-4.0.1.js';
      script.onload=()=>resolve(window.PptxGenJS);
      script.onerror=()=>{deckLibrary=null;script.remove();reject(new Error('演示文稿组件加载失败'));};
      document.head.appendChild(script);
    });
    return deckLibrary;
  }
  async function downloadDeck(title, slides) {
    if (!Array.isArray(slides)||!slides.length) return;
    try {
      const Pptx=await loadDeckLibrary();
      const deck=new Pptx();
      deck.layout='LAYOUT_WIDE';deck.title=title;deck.author='企业 AI 经营大脑';
      deck.lang='zh-CN';deck.theme={headFontFace:'Microsoft YaHei',bodyFontFace:'Microsoft YaHei',lang:'zh-CN'};
      slides.forEach((page,index)=>{
        const slide=deck.addSlide();
        const dark=index===0;
        const ink=dark?'F8FAFB':'173545';
        slide.background={color:dark?'193C4B':'F5F8F9'};
        const body=Array.isArray(page.body)?page.body.join('\n'):String(page.body??'');
        slide.addShape(deck.ShapeType.rect,{x:0.76,y:0.8,w:0.13,h:0.5,line:{transparency:100},fill:{color:'2A9B85'}});
        slide.addText(title,{x:1.06,y:0.79,w:10.6,h:0.48,fontSize:17,color:dark?'B8DCD5':'496B72',margin:0,fit:'shrink'});
        slide.addText(String(page.title||title),{x:0.78,y:1.73,w:11.75,h:1.13,fontSize:34,bold:true,color:ink,margin:0,fit:'shrink'});
        slide.addText(body,{x:0.82,y:3.13,w:11.65,h:3.18,fontSize:21,breakLine:false,valign:'top',paraSpaceAfter:10,color:ink,margin:0,fit:'shrink'});
        slide.addText(`${index+1} / ${slides.length}`,{x:11.42,y:6.85,w:1.1,h:0.32,align:'right',fontSize:11,color:dark?'A5C7C3':'5C7179',margin:0});
      });
      await deck.writeFile({fileName:String(title||'阶段汇报').replace(/[\\/:*?"<>|]/g,'_')+'.pptx'});
    } catch (error) {console.error('PPTX 导出失败',error);toast('PPTX 导出失败，请重新下载','warn');}
  }
  window.projectFlowDemo={render,open,action,archiveLink,context,roleFor,tasks,legacyView:view};
})();
