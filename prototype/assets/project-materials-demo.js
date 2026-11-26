/* Local stage-material workflow demo; it does not connect to OA or production services. */
(function (root) {
  const esc = value => (root.safeText ? root.safeText(value) : String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
  const seed = (project) => ({kind:'customer',scopeText:project?.id && project.id!=='proj-growth'?'项目现状访谈、诊断报告与改进建议':'增长策略梳理、会员体系方案、数据看板原型；不含接口开发与运营代投',scopeConfirmed:false,proposal:false,outlineApproved:false,outline:[],quote:null,quoteHistory:[],scripts:{customer:'',internal:''},scriptHistory:[],versions:[],currentDeck:null,revision:0,skipQuote:false});
  const stateFor = ctx => {
    const key=`project-materials-demo:${ctx?.scopeKey||ctx?.project?.id||ctx?.project?.name||'default'}`;
    let s=seed(ctx.project);
    try {s=Object.assign(s,JSON.parse(localStorage.getItem(key)||'{}'));}catch(_){}
    if(s.quote && typeof ctx.quoteApprovals==='function'){
      const match=ctx.quoteApprovals().find(row=>row.ref===s.quote.approval&&row.state==='approved'&&row.updatedAt===s.quote.approvalVersion);
      if(!match)s.quote={...s.quote,status:'inactive'};
    }
    return {key,s};
  };
  const save=(key,s)=>{try{localStorage.setItem(key,JSON.stringify(s));}catch(_){}};
  const projectName=ctx=>ctx?.project?.name||ctx?.project?.title||'极光科技增长项目';
  const active=s=>s.quote?.status==='approved'&&s.kind!=='internal'&&s.scopeConfirmed&&s.quote.expiry>=new Date().toISOString().slice(0,10);
  const privileged=ctx=>ctx?.canLead===true&&ctx?.role!=='employee';
  const dayValid=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;const d=new Date(`${value}T00:00:00Z`);return !Number.isNaN(d.valueOf())&&d.toISOString().slice(0,10)===value&&value>=new Date().toISOString().slice(0,10);};
  function parseItems(value) {
    const items = [];
    let total = 0;
    for (const line of String(value || '').trim().split(/\n+/)) {
      const parts = line.trim().match(/^(.+?)[,，]\s*(\d+)(?:\.(\d{1,2}))?$/);
      if (!parts || !parts[1].trim()) return null;
      const cents = Number(parts[2]) * 100 + Number((parts[3] || '').padEnd(2,'0'));
      total += cents;
      if (cents <= 0 || !Number.isSafeInteger(total)) return null;
      items.push({name:parts[1].trim(),cents});
    }
    return items;
  }
  const scopeParts=value=>String(value||'').split(/[、，,；;。\n]+/).map(part=>part.trim()).filter(Boolean);
  const scopeContains=(candidate,confirmed)=>{
    const parts=scopeParts(candidate);
    const allowed=new Set(scopeParts(confirmed).filter(part=>!/(?:不含|不包括|不在|排除|另议)/.test(part)));
    return parts.length>0&&parts.every(part=>allowed.has(part));
  };
  const hasMoney=value=>/(?:CNY|USD|人民币|[¥￥])\s*[0-9][0-9,.]*/i.test(String(value||''));
  const outlineFor=s=>s.kind==='internal'?['迭代目标与版本范围','当前基线与成果记录','剩余工作与责任分工','测试、灰度与回滚方案','上线门槛及验收指标','上线后观察计划']:['项目目标与当前基线','待核验问题与业务影响','目标用户与使用场景','方案设计与交付边界','实施里程碑及双方责任','验收指标、依赖与风险'];
  const talkTrack=s=>s.kind==='internal'?`本期交付范围为 ${s.scopeText}。当前节点：方案确认后进入实现、联调和回归；上线需满足回归通过及灰度责任人确认。待决事项：请确认灰度对象和回滚负责人。实际发布记录到达前，状态保持待上线。`:`您好，我们已确认本项目范围：${s.scopeText}。建议先对齐目标指标与验收方式，再按里程碑启动。${active(s)?`有效报价批复总额为 ${s.quote.currency} ${(s.quote.totalCents/100).toFixed(2)}，期限至 ${s.quote.expiry}，范围：${s.quote.quoteScope}。`:'当前没有可对客引用的有效报价金额；报价需以独立商务批复为准。'}`;
  const buildDeck=(ctx,s)=>{
    const name=projectName(ctx), scope=s.scopeText;
    const evidence=ctx.evidence?.()||[];
    const progress=evidence.length ? (ctx.observe?.()||'')+'（'+evidence.map(e=>e.ref).filter(Boolean).join('、')+'）' : '尚无已归集的工作记录，请在迭代评审前补充。';
    const customer=[
      {title:'项目目标与当前基线',body:`项目：${name}\n确认范围：${scope}\n目标：与客户确认交付物的使用场景及验收方式。\n衡量方式：由双方在启动会确认目标指标、基线及验收口径。`},
      {title:'待核验问题与业务影响',body:'待客户确认：目标人群与转化路径、会员权益分层、经营数据来源和复盘周期。\n评估方式：结合客户提供的样本与现行指标，核实哪些问题影响投放、触达和复购。\n待确认：数据口径、样本可用性和优先业务场景。'},
      {title:'目标用户与使用场景',body:'候选用户分层（待客户确认）：新客、活跃会员、待唤醒会员。\n候选场景：新客转化、会员激活、复购提升、经营复盘。\n设计原则：先围绕已确认业务场景，避免把未验证假设写成客户事实。'},
      {title:'方案设计与交付边界',body:`本期约定：${scope}。\n新增需求：记录对费用和排期的影响，经双方确认后生效。\n依赖：客户提供经确认的产品、用户和经营数据；第三方费用另行确认。`},
      {title:'实施里程碑与责任',body:'M1 需求与基线确认：双方确认目标和数据口径。\nM2 方案评审：提交范围内的方案初稿，由双方负责人确认。\nM3 交付评审：业务代表逐项检查样件或交付成果。\nM4 验收交接：按双方签认的验收清单完成交付。'},
      {title:'验收指标、依赖与风险',body:'验收：双方逐项核对交付清单、待处理问题及签认记录。\n依赖：数据样本、业务决策人和评审时间按计划提供。\n风险：数据缺失将影响指标可用性；范围新增须评估周期和报价后另行确认。'}
    ];
    const internal=[
      {title:'迭代目标与版本范围',body:`版本：${name} 本期迭代。\n目标：形成可复核的迭代成果并完成发布准备。\n本期边界：${scope}。`},
      {title:'当前基线与成果记录',body:`项目动态：${progress}\n成果：由负责人从任务记录中确认已完成项并补充证据链接。\n差异：尚未记录或未验收的工作不计为已完成。`},
      {title:'剩余工作与责任分工',body:'产品：冻结验收口径并确认灰度对象。\n研发：完成剩余开发、联调和回滚开关。\n测试：覆盖主流程、权限和异常路径，留存回归结果。'},
      {title:'测试、灰度与回滚方案',body:'进入灰度门槛：回归通过、阻断缺陷清零、值班和回滚责任人就位。\n灰度观察：核对核心流程、错误率和反馈。\n异常处理：停止扩量、回滚版本、登记原因和复盘责任人。'},
      {title:'上线门槛及验收指标',body:'发布前：测试负责人提交回归记录，产品负责人签认范围。\n发布后：以实际发布记录和监测结果更新项目状态。\n验收：发布清单、回归证据和遗留问题责任人可追溯。'},
      {title:'上线后观察计划',body:'发布后按约定窗口观察核心路径和告警。\n出现异常时先止损并更新风险状态。\n当前仍是计划材料；没有发布证据前不得标记为已上线。'}
    ];
    return s.outline.map((title,i)=>({title,body:(s.kind==='internal'?internal:customer)[i]?.body||`项目：${name}\n确认范围：${scope}\n本页：${title}\n需由项目负责人结合有效项目记录补充具体执行人、日期和验收依据。`}));
  };
  const button=(action,label,disabled=false,primary=false)=>
    `<button type="button" class="btn sm${primary?' pri':''}" data-act="${action}"${disabled?' disabled':''}>${label}</button>`;
  function render(ctx) {
    const {s}=stateFor(ctx), lead=privileged(ctx), internal=s.kind==='internal', validQuote=active(s);
    const phase=!s.scopeConfirmed?'确认项目范围':!s.outlineApproved?'审阅提案大纲':internal?'审阅上线材料':validQuote?'审阅交付物':'归集商务报价批复';
    const next=!s.scopeConfirmed?'确认本期要交付什么，系统将据此起草大纲和沟通话术。':!s.outlineApproved?'逐页核对大纲。确认后将生成可编辑的提案。':internal?'核对迭代进展、上线条件和待协调事项。':validQuote?'下载提案与报价单，或查看对应的客户沟通话术。':'归集独立的商务批复，用其中的分项、总额和有效期生成正式报价单。';
    const primary=!s.scopeConfirmed?button('mat-edit-scope','确认范围',!lead,true):!s.outlineApproved?button('mat-edit-outline','审阅并确认大纲',!lead,true):!internal&&!validQuote?button('mat-quote-approve','归集商务批复',!lead,true):'';
    return `<div class="project-materials-demo">
      <section class="project-panel material-task-setup"><header class="mat-heading"><div><small>生成与审核</small><h3>${esc(phase)}</h3></div>
      <label>项目类型 <select class="inp" data-act="mat-kind" ${lead?'':'disabled'}><option value="customer" ${internal?'':'selected'}>客户交付</option><option value="internal" ${internal?'selected':''}>内部迭代</option></select></label></header>
      <p>${esc(next)}</p><div class="mat-scope"><b>${s.scopeConfirmed?'已确认范围':'待确认范围'}</b><span>${esc(s.scopeText)}</span></div>
      <div class="mat-actions">${primary}${lead&&!validQuote&&s.quoteHistory.length?button('mat-quote-history','报价历史与原文'):''}${s.scopeConfirmed&&lead?button('mat-edit-scope','修改范围'):''}</div></section>
      </div>`;
  }
  function deliverables(ctx) {
    const {s}=stateFor(ctx), lead=privileged(ctx);
    const rows=[];
    if(s.scopeConfirmed) rows.push({stage:'项目启动',key:'scope',name:'交付范围',status:'已确认',version:'当前确认版',source:'项目范围确认',detail:s.scopeText});
    if(s.proposal) rows.push({stage:'售前',key:'proposal',name:'提案大纲',status:s.outlineApproved?'已确认':'待确认',version:s.outlineApproved?'当前确认版':'当前草稿',source:'项目范围',detail:s.outline.join('；'),action:button('mat-edit-outline','审阅大纲',!lead)});
    if(s.currentDeck?.length) rows.push({stage:s.kind==='internal'?'测试与上线准备':'售前',key:'deck',name:s.kind==='internal'?'内部汇报 PPT':'客户提案 PPT',status:'待审阅',version:s.versions.at(-1)?.label||'当前草稿',source:'已确认大纲',action:button('mat-preview-deck','预览 / 编辑')+button('mat-download-deck','下载 PPTX')+(lead&&s.versions.length?button('mat-deck-history','版本记录'):'')});
    if(active(s)) rows.push({stage:'售前',key:'quote',name:'正式报价单',status:'可用',version:'v'+s.quote.version,source:'商务批复 '+s.quote.approval,
      action:lead?button('mat-preview-quote','预览报价单')+button('mat-download-quote','下载报价单')+button('mat-quote-revoke','撤回批复')+(s.quoteHistory.length?button('mat-quote-history','报价历史与原文'):''):''});
    if(s.scopeConfirmed) rows.push({stage:s.kind==='internal'?'上线':'售前',key:'script',name:s.kind==='internal'?'上线协调话术':'客户沟通话术',status:'待确认',version:'当前草稿',source:'项目范围与已归集批复',action:button('mat-edit-talk','查看 / 编辑')+button('mat-copy-script','复制')});
    return rows;
  }
  const readSlides=(host)=>[...host.querySelectorAll('[data-slide-title]')].map((el,i)=>({title:el.value.trim(),body:host.querySelector(`[data-slide-body="${i}"]`)?.value.trim()||''}));
  const quoteMarkup=(ctx,q)=>`<article style="padding:28px;color:#17212b;background:white"><header style="display:flex;justify-content:space-between"><div><h1>正式报价单</h1><div>${esc(projectName(ctx))}</div></div><strong>${esc(q.currency)}</strong></header><hr style="margin:18px 0"><p>报价范围：${esc(q.quoteScope)}</p><p>有效期：${esc(q.expiry)}</p><table style="width:100%;margin:18px 0;border-collapse:collapse"><thead><tr><th style="text-align:left">服务项目</th><th style="text-align:right">金额（${esc(q.currency)}）</th></tr></thead><tbody>${q.items.map(x=>`<tr><td>${esc(x.name)}</td><td style="text-align:right">${(x.cents/100).toFixed(2)}</td></tr>`).join('')}</tbody><tfoot><tr><th style="text-align:left">合计</th><th style="text-align:right">${(q.totalCents/100).toFixed(2)}</th></tr></tfoot></table><p>批复编号：${esc(q.approval)}</p><p>审批原文：${esc(q.approvalText)}</p></article>`;
  const modal=(title,body,ok,fn)=>root.modal?.(title,body,ok,fn,true);
  const act=(action,el,ctx)=>{
    if(!action?.startsWith('mat-'))return false;
    const {key,s}=stateFor(ctx),host=el?.closest('.project-materials-demo'),lead=privileged(ctx),refresh=()=>{save(key,s);ctx?.refresh?.();};
    if(action==='mat-switch-kind')return false; // The host page routes select changes through change().
    if(action==='mat-edit-scope'){
      if(!lead){ctx?.observe?.('项目范围由负责人确认');return true;}
      modal('确认项目范围',`<div class="field"><label>范围与交付边界</label><textarea class="inp" id="matScopeText" rows="5" style="width:100%">${esc(s.scopeText)}</textarea></div><div class="mini">保存后自动形成阶段大纲和沟通话术；已有报价、话术和PPT将留档并按新范围失效。</div>`,'保存并确认范围',()=>{const value=document.querySelector('#matScopeText')?.value.trim();if(!value){root.toast?.('范围不能为空','warn');return;}if(s.scopeConfirmed&&value!==s.scopeText){invalidateForScope(s);s.scopeApprovalFloor=new Date().toISOString();}s.scopeText=value;s.scopeConfirmed=true;if(!s.proposal){s.outline=outlineFor(s);s.proposal=true;s.outlineApproved=false;s.revision++;}setTalk(s,s.kind==='internal'?'internal':'customer',talkTrack(s));refresh();root.closeModal?.();});return true;
    }
    if(action==='mat-edit-outline'){
      if(!lead){ctx?.observe?.('大纲需要负责人审阅和确认');return true;}
      const text=(s.outline.length?s.outline:outlineFor(s)).join('\n');modal('审阅提案大纲',`<div class="field"><label>每行一页标题</label><textarea class="inp" id="matOutlineEdit" rows="7" style="width:100%">${esc(text)}</textarea></div><div class="mini">确认后自动生成逐页完整内容和预览。范围：${esc(s.scopeText)}</div>`,'确认并生成 PPT',()=>{const rows=(document.querySelector('#matOutlineEdit')?.value||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);if(rows.length<2){root.toast?.('至少保留两页大纲','warn');return;}s.outline=rows;s.outlineApproved=true;s.currentDeck=buildDeck(ctx,s);s.revision++;s.versions.push({label:`${s.kind==='internal'?'内部汇报':'提案'} v${s.revision}`,note:'按已确认范围自动生成',deck:s.currentDeck,time:new Date().toISOString()});setTalk(s,s.kind==='internal'?'internal':'customer',talkTrack(s));refresh();root.closeModal?.();});return true;
    }
    if(action==='mat-preview-deck'||action==='mat-save-deck'||action==='mat-download-deck'){
      const slides=s.currentDeck;if(!slides?.length)return true;
      if(action==='mat-preview-deck'){const body=slides.map((p,i)=>`<div class="field"><label>第 ${i+1} 页标题</label><input class="inp" data-slide-title="${i}" value="${esc(p.title)}"><label>内容</label><textarea class="inp" data-slide-body="${i}" rows="7">${esc(p.body)}</textarea></div>`).join('');modal('PPT 预览与编辑',`<div data-mat-slide-editor>${body}</div>`,'保存人工修改',()=>{const next=readSlides(document.querySelector('[data-mat-slide-editor]'));if(next.some(p=>!p.title||!p.body)){root.toast?.('每页标题和内容都需要填写','warn');return;}if(JSON.stringify(next)!==JSON.stringify(s.currentDeck)){s.currentDeck=next;s.revision++;s.versions.push({label:`人工修订 v${s.revision}`,note:'已保存完整编辑快照',deck:next,time:new Date().toISOString()});refresh();}root.closeModal?.();});return true;}
      if(action==='mat-save-deck'){const next=readSlides(host);if(JSON.stringify(next)!==JSON.stringify(s.currentDeck)){s.currentDeck=next;s.revision++;s.versions.push({label:`人工修订 v${s.revision}`,note:'已保存完整编辑快照',deck:next,time:new Date().toISOString()});refresh();}return true;}
      if(typeof ctx?.downloadDeck==='function')ctx.downloadDeck(`${projectName(ctx)}${s.kind==='internal'?'内部迭代汇报':'客户提案'}`,slides.map(({title,body})=>({title,body})));return true;
    }
    if(action==='mat-deck-history'){if(!privileged(ctx))return true;const body=s.versions.map(v=>`<section class="card pad" style="margin:8px 0"><b>${esc(v.label)} · ${esc(v.time)}</b><div>${esc(v.note)}</div>${(v.deck||[]).map((p,i)=>`<details><summary>第 ${i+1} 页：${esc(p.title)}</summary><pre style="white-space:pre-wrap">${esc(p.body)}</pre></details>`).join('')}</section>`).join('')||'暂无版本';modal('PPT 历史版本全文',body,'关闭',()=>root.closeModal?.());return true;}
    if(action==='mat-quote-approve'){
      if(!s.scopeConfirmed||s.kind==='internal'||!privileged(ctx)){ctx?.observe?.('已确认范围的客户项目可由负责人归集商务批复');return true;}
      const approved=(ctx.quoteApprovals?.()||[]).filter(row=>row.state==='approved'&&row.quote&&dayValid(row.quote.expiry)&&(!s.scopeApprovalFloor||row.updatedAt>s.scopeApprovalFloor));
      if(!approved.length){ctx.observe?.('请先在协作渠道提交商务报价审批，并由有权审批者通过。');return true;}
      const options=approved.map(row=>`<option value="${esc(row.ref)}">${esc(row.title)} · ${esc(row.ref)} · 有效至 ${esc(row.quote.expiry)}</option>`).join('');
      modal('引用已通过的商务报价批复',`<label class="field">报价审批 <select class="inp" id="matApproval">${options}</select></label><p class="mini">报价金额、范围和有效期以原流程批复为准。</p>`,'生成正式报价单',()=>{
        const ref=document.querySelector('#matApproval')?.value;
        const row=ctx.quoteApprovals?.().find(item=>item.ref===ref&&item.state==='approved'&&(!s.scopeApprovalFloor||item.updatedAt>s.scopeApprovalFloor));
        const quote=row?.quote,items=quote&&parseItems(quote.items);
        if(!items||!dayValid(quote.expiry)||!['CNY','USD'].includes(quote.currency)||!scopeContains(quote.scope,s.scopeText))
          return root.toast?.('批复已失效或超出当前项目范围，请重新核对','warn');
        if(s.quote?.approval===ref&&s.quote.approvalVersion===row.updatedAt&&active(s)){
          root.closeModal?.();return root.toast?.('该批复已生成报价','ok');
        }
        const version=Math.max(0,...s.quoteHistory.map(item=>Number(item.version)||0),Number(s.quote?.version)||0)+1;
        archiveQuote(s,'被新批复替代');
        s.quote={currency:quote.currency,expiry:quote.expiry,items,totalCents:items.reduce((sum,item)=>sum+item.cents,0),quoteScope:quote.scope,
          approval:row.ref,approvalText:row.text,approvalVersion:row.updatedAt,scopeSnapshot:s.scopeText,status:'approved',version};
        setTalk(s,'customer',talkTrack(s));root.closeModal?.();refresh();
      });return true;
    }
    if(action==='mat-preview-quote'||action==='mat-download-quote'){
      if(!active(s)||!privileged(ctx)){ctx?.observe?.('报价单当前不可供此角色查看或导出');return true;}const markup=quoteMarkup(ctx,s.quote);
      if(action==='mat-preview-quote'){modal('正式报价单预览',markup,'关闭',()=>root.closeModal?.());return true;}
      const blob=new Blob([`<!doctype html><meta charset="utf-8"><title>${esc(projectName(ctx))}报价单</title><style>body{font:15px Arial,sans-serif;max-width:900px;margin:36px auto;color:#17212b}td,th{border-bottom:1px solid #ccd3da;padding:10px} @media print{button{display:none}}</style>${markup}`],{type:'text/html;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${projectName(ctx).replace(/[\\/:*?"<>|]/g,'_')}-正式报价单.html`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return true;
    }
    if(action==='mat-quote-revoke'){if(!privileged(ctx)){ctx?.observe?.('报价撤回需授权角色处理');return true;}archiveQuote(s,'来源审批撤回');s.scripts.customer=talkTrack(s);refresh();return true;}
    if(action==='mat-quote-history'){if(!privileged(ctx))return true;const body=s.quoteHistory.map((q,i)=>`<section class="card pad" style="margin:8px 0"><b>${esc(q.label||`历史 ${i+1}`)} · ${esc(q.status||'')}</b><div>${esc(q.currency||'')} ${(Number(q.totalCents||0)/100).toFixed(2)} · ${esc(q.expiry||'')}</div><div>范围：${esc(q.quoteScope||'')}</div><div>批复：${esc(q.approval||'')}</div><div>原文：${esc(q.approvalText||'')}</div><div>历史话术：${esc(q.scriptSnapshot||'')}</div></section>`).join('')||'暂无历史';modal('报价历史与原文',body,'关闭',()=>root.closeModal?.());return true;}
    if(action==='mat-edit-talk'){
      const employee=ctx?.role==='employee',slot=s.kind==='internal'?'internal':employee?'customerEmployee':'customer',initial=(slot==='customer'&&!active(s)&&hasMoney(s.scripts[slot])?'':s.scripts[slot])||((slot==='customerEmployee')?safeTalkForEmployee(s):talkTrack(s)),disabledCopy=slot==='customer'&&!active(s),history=s.scriptHistory.filter(item=>item.slot===slot).map((item,i)=>`<details><summary>历史话术版本 ${i+1} · ${esc(item.time)}</summary><div>修改前：${esc(item.before)}</div><div>修改后：${esc(item.after)}</div></details>`).join('');modal(slot==='internal'?'内部汇报话术':'客户沟通话术',`<div class="field"><label>话术</label><textarea class="inp" id="matTalkEdit" rows="7" style="width:100%">${esc(initial)}</textarea></div>${disabledCopy?'<div class="mini">当前报价无效；话术中的旧报价内容不得复制或对客使用。</div>':''}${history?`<div style="margin-top:12px"><b>话术版本对比</b>${history}</div>`:''}`,'保存话术',()=>{const value=document.querySelector('#matTalkEdit')?.value.trim();if(!value){root.toast?.('话术不能为空','warn');return;}if(slot!=='internal'&&!active(s)&&hasMoney(value)){root.toast?.('报价批复失效时，客户话术不能包含金额','warn');return;}if(s.scripts[slot]&&s.scripts[slot]!==value)s.scriptHistory.push({slot,before:s.scripts[slot],after:value,time:new Date().toISOString()});s.scripts[slot]=value;refresh();root.closeModal?.();});return true;
    }
    if(action==='mat-copy-script'){const slot=s.kind==='internal'?'internal':ctx?.role==='employee'?'customerEmployee':'customer',text=s.scripts[slot]||(slot==='customerEmployee'?safeTalkForEmployee(s):talkTrack(s));if(slot!=='internal'&&!active(s)&&hasMoney(text)){ctx?.observe?.('报价失效话术含金额，已阻止复制');return true;}navigator.clipboard?.writeText(text).then(()=>root.toast?.('话术已复制','ok')).catch(()=>root.toast?.('请手动选择话术复制','warn'));return true;}
    return false;
  };
  const change=(action,el,ctx)=>{if(action!=='mat-kind')return false;const {key,s}=stateFor(ctx);if(!privileged(ctx)){ctx?.observe?.('项目路径切换需授权角色');return true;}if(el.value===s.kind)return true;if(s.currentDeck?.length)s.versions.push({label:`项目路径切换归档 v${s.revision}`,note:'保留切换前的完整PPT快照',deck:s.currentDeck,time:new Date().toISOString()});if(s.kind==='customer'&&s.quote)archiveQuote(s,'切换到内部项目后停用');s.kind=el.value;s.scopeText=s.kind==='internal'?'本期版本评审、主流程迭代与灰度发布准备':seed(ctx.project).scopeText;s.proposal=false;s.outlineApproved=false;s.outline=[];s.currentDeck=null;s.skipQuote=s.kind==='internal';s.scopeConfirmed=false;s.scripts[s.kind==='internal'?'internal':'customer']='';save(key,s);ctx?.refresh?.();return true;};
  function archiveQuote(s,reason){if(s.quote){s.quoteHistory.push({...s.quote,status:reason,label:`报价历史 v${s.quote.version}`,scriptSnapshot:s.scripts.customer||talkTrack(s)});s.quote=null;}}
  function safeTalkForEmployee(s){return talkTrack({...s,quote:null});}
  function setTalk(s,slot,value){if(s.scripts[slot]&&s.scripts[slot]!==value)s.scriptHistory.push({slot,before:s.scripts[slot],after:value,time:new Date().toISOString()});s.scripts[slot]=value;}
  function invalidateForScope(s){archiveQuote(s,'项目范围变更后停用');s.scriptHistory.push({slot:'customer',before:s.scripts.customer||talkTrack(s),after:'已因范围变更停用',time:new Date().toISOString()});s.scripts.customer='';if(s.currentDeck?.length)s.versions.push({label:`范围变更归档 v${s.revision}`,note:'保留旧范围PPT全文快照',deck:s.currentDeck,time:new Date().toISOString()});s.currentDeck=null;s.proposal=false;s.outlineApproved=false;s.outline=[];}
  const brainEntries=ctx=>{const {s}=stateFor(ctx),entries=[],maySee=privileged(ctx);const add=(id,title,summary,kind,ref)=>entries.push({id,title,summary,kind,ref});if(s.scopeConfirmed)add('materials-scope',`${projectName(ctx)} · 已确认范围`,s.scopeText,'project-material',projectName(ctx));if(s.proposal&&!s.outlineApproved)add('materials-outline-status',`${projectName(ctx)} · 大纲待确认`,'自动形成的大纲是待审阅草稿，不作为已确认事实。','workflow-status',projectName(ctx));if(s.outlineApproved)add('materials-outline',`${projectName(ctx)} · 已确认大纲`,s.outline.join('；'),'approved-material',projectName(ctx));if(active(s))add('materials-quote',`${projectName(ctx)} · 有效报价批复`,maySee?`${s.quote.currency} ${(s.quote.totalCents/100).toFixed(2)}；有效期至 ${s.quote.expiry}；范围：${s.quote.quoteScope}；分项：${s.quote.items.map(x=>`${x.name} ${(x.cents/100).toFixed(2)}`).join('；')}；批复：${s.quote.approval}。`:'有效商务报价批复已归集；金额和分项受角色权限限制。','approval',s.quote.approval);if(s.quoteHistory.some(q=>['来源审批撤回','项目范围变更后停用','切换到内部项目后停用'].includes(q.status)))add('materials-quote-status',`${projectName(ctx)} · 旧报价停用`,'来源审批撤回或范围变化，历史报价不可继续对客使用。','approval-status',projectName(ctx));if(s.currentDeck?.length)add('materials-deck',`${projectName(ctx)} · PPT 草稿`,`${s.currentDeck.length} 页可编辑物料，尚需审阅后使用。`,'draft-material',projectName(ctx));return entries;};
  root.projectMaterialsDemo={parseItems,dayValid,render,act,change,brainEntries,deliverables};
})(window);
