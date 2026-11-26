/* Local-only, role-stepped project reporting demo. No source text is copied to storage. */
(function (root) {
  'use strict';

  const ROLE = { employee: '员工', supervisor: '直属主管', department: '部门负责人', executive: '分管领导' };
  const STORAGE_PREFIX = 'aiHuokeProjectReportsDemo.v1.';
  const esc = value => (typeof root.safeText === 'function' ? root.safeText(String(value ?? '')) : String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
  const today = () => new Date().toISOString().slice(0, 10);
  const id = () => 'rpt-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  const roleRank = { employee: 0, supervisor: 1, department: 2, executive: 3 };
  const stageRank = { employee_draft: 0, employee_submitted: 1, supervisor_submitted: 2, department_submitted: 3, returned_employee: 4, returned_supervisor: 5, returned_department: 6, approved: 7, executing: 8, retest_pending: 9, verified: 10 };

  function read(ctx) {
    const key = STORAGE_PREFIX + String(ctx.scopeKey || 'local-demo');
    try {
      const raw = root.localStorage?.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.periods)) return parsed;
      }
    } catch (_) { /* Storage may be unavailable in a restricted preview. */ }
    const demo = [root.projectOrganizationDemo, root.projectTeamDailyDemo].find(item => item && item.project.id === ctx.project?.id);
    if (demo) return structuredClone(demo.reports);
    return { version: 1, scopeKey: String(ctx.scopeKey || 'local-demo'), periods: [{ id: id(), label: '本期汇报 · ' + today(), createdAt: new Date().toISOString(), status: 'employee_draft', submissions: [], decisions: [], execution: null, verification: null, carryForward: null }] };
  }
  function write(ctx, state) {
    try { root.localStorage?.setItem(STORAGE_PREFIX + String(ctx.scopeKey || 'local-demo'), JSON.stringify(state)); } catch (_) { /* Keep the current page usable if storage is disabled. */ }
  }
  function active(state) { return state.periods[state.periods.length - 1]; }
  function evidence(ctx) {
    try {
      const result = typeof ctx.evidence === 'function' ? ctx.evidence() : [];
      return Array.isArray(result) ? result : (Array.isArray(result?.items) ? result.items : []);
    } catch (_) { return []; }
  }
  function sourceKey(item, provider) { return [provider || item.provider || (item.providers || [])[0] || 'source', item.kind || item.type || 'record', item.ref || item.id || ''].join(':'); }
  function safeSources(ctx, kinds) {
    const items = evidence(ctx).filter(item => (!kinds || kinds.includes(item.kind || item.type)) && !(item.kind==='meeting' && item.verified===false));
    return items.map(item => ({
      key: sourceKey(item), title: String(item.title || item.name || item.label || item.kind || '已归集记录'),
      kind: String(item.kind || item.type || 'record'), providers: Array.isArray(item.providers) ? item.providers.slice() : [item.provider].filter(Boolean),
      date: String(item.date || item.timestamp || ''), ref: String(item.ref || item.id || '')
    }));
  }
  function activeSubmit(p, role) {
    const latest = [...(p.submissions || [])].reverse().find(row => row.role === role);
    return latest || null;
  }
  function canReadSubmission(row, ctx, role) {
    if(role==='employee'&&row.accountId&&row.accountId!==ctx.accountId)return false;
    return roleRank[row.role]===roleRank[role] || roleRank[row.role]===roleRank[role]-1;
  }
  function nextOwner(p) {
    return ({ employee_draft: '员工', employee_submitted: '直属主管', supervisor_submitted: '部门负责人', department_submitted: '分管领导', returned_employee: '员工', returned_supervisor: '直属主管', returned_department: '部门负责人', approved: '员工执行', executing: '员工执行', retest_pending: '主管复测', verified: '下一期责任人' })[p.status] || '待分配';
  }
  function statusText(status) {
    return ({ employee_draft: '员工填报中', employee_submitted: '待直属主管处理', supervisor_submitted: '待部门负责人处理', department_submitted: '待分管领导决策', returned_employee: '退回员工补充', returned_supervisor: '退回主管补充', returned_department: '退回部门补充', approved: '已批准 · 待执行', executing: '执行中', retest_pending: '待主管独立复测', verified: '复测通过 · 本期完成' })[status] || '进行中';
  }
  function when(text) { return text ? `<span class="pr-meta">${esc(text)}</span>` : ''; }
  function button(label, action, cls = '') { return `<button type="button" class="btn ${cls}" data-act="${action}">${esc(label)}</button>`; }
  function sourceCard(src, ctx) {
    const providers = src.providers.length ? src.providers : [''];
    const canOpen = src.kind !== 'daily' || ['employee', 'supervisor'].includes(ctx.role);
    const kindLabel = ({ daily: '日报', meeting: '会议记录', approval: '审批记录' })[src.kind] || '工作记录';
    return `<div class="pr-source"><div><b>${esc(src.title)}</b><small>${kindLabel} ${src.date ? '· ' + esc(src.date) : ''} ${src.ref ? '· ' + esc(src.ref) : ''}</small></div>${canOpen ? providers.map(provider => `<button type="button" class="btn sm gho" data-act="flow-report-source" data-provider="${esc(provider)}" data-kind="${esc(src.kind)}" data-ref="${esc(src.ref)}">查看来源</button>`).join('') : '<small>来源已引用</small>'}</div>`;
  }
  function renderHistory(state, ctx, role) {
    return state.periods.slice(0, -1).reverse().map(p => {
      const visibleRows = (p.submissions || []).filter(row => canReadSubmission(row,ctx,role));
      const refs = [...new Map(visibleRows.flatMap(row => row.sources || []).map(src => [src.key, src])).values()];
      const submissions = visibleRows.map(row => `<article class="pr-submission"><b>${esc(ROLE[row.role] || '员工')} · ${esc(row.version || 'v1')}</b><p>${esc(row.headline || '')}</p>${row.action ? `<p><b>已采取动作：</b>${esc(row.action)}</p>` : ''}${row.judgement ? `<p><b>本级判断：</b>${esc(row.judgement)}</p>` : ''}${row.suggestion ? `<p><b>建议：</b>${esc(row.suggestion)}</p>` : ''}${row.next ? `<p><b>下一步：</b>${esc(row.next)}</p>` : ''}<small>${esc(row.at || '')}</small></article>`).join('');
      const decision = role === 'executive' && p.decision ? `<div class="pr-note"><b>领导决定：${esc(p.decision.outcome)}</b><p>${esc(p.decision.note || '')}</p>${p.decision.instruction ? `<p>执行指令：${esc(p.decision.instruction)}</p>` : ''}</div>` : p.decision?.instruction ? `<div class="pr-note"><b>执行指令</b><p>${esc(p.decision.instruction)}</p></div>` : '';
      const execution = role !== 'employee' && p.execution ? `<div class="pr-note"><b>执行回执</b><p>${esc(p.execution.text)}</p></div>` : '';
      const verification = role !== 'employee' && p.verification ? `<div class="pr-note"><b>主管复测与验收</b><p>${esc(p.verification.text)}</p><small>${esc(p.verification.source?.title || '已归集会议记录')} · ${esc(p.verification.at || '')}</small></div>` : '';
      return `<details open class="pr-history"><summary><b>${esc(p.label)}</b><span class="bdg ${p.status === 'verified' ? 'ok' : 'mut'}">${esc(statusText(p.status))}</span></summary><div class="pr-history-body"><p class="pr-meta">截止与版本快照：${esc(p.snapshotAt || p.createdAt || '')}</p>${submissions || '<p>本期无可见员工提交。</p>'}${decision}${execution}${verification}${role !== 'employee' && p.carryForward ? `<div class="pr-note"><b>上期决议复查</b><p>${esc(role === 'executive' ? p.carryForward.decision || '' : p.carryForward.instruction || '上期事项待复查')}</p><p>${esc(p.carryForward.result || '待本期更新执行情况')}</p></div>` : ''}<div class="pr-source-list">${refs.map(src => sourceCard(src, ctx)).join('') || '<small>本期未关联来源</small>'}</div></div></details>`;
    }).join('') || '<p class="pr-empty">完成本期后，这里会保留历史快照。</p>';
  }

  const reportStyles=`<style>
      .pr-hero{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:13px 18px;border:1px solid var(--line);border-left:4px solid var(--brand);border-radius:10px;background:var(--surface);margin-bottom:14px}.pr-hero>div{display:flex;align-items:center;gap:14px}.pr-owner{font-size:var(--ui-meta-size);color:var(--muted)}.pr-grid{display:grid;grid-template-columns:minmax(0,1fr) 270px;gap:16px;align-items:start}.pr-main,.pr-side{display:grid;gap:14px}.pr-workspace{background:var(--surface,#fff);border:1px solid var(--line,#e2e8e8);border-radius:13px;padding:19px}.pr-section-title{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px}.pr-section-title h3,.pr-workspace h3{margin:4px 0 0;font-size:var(--ui-section-size)}.pr-muted,.pr-empty{color:#74848a;font-size:var(--ui-meta-size);line-height:1.65}.pr-submission{border:1px solid #e7ecec;border-radius:10px;padding:14px;margin-top:10px}.pr-submission header{display:flex;justify-content:space-between;align-items:center}.pr-submission>p{line-height:1.65}.pr-submission footer,.pr-meta{display:block;font-size:var(--ui-meta-size);color:#87969a;margin-top:9px}.pr-note,.pr-carry{padding:12px 14px;background:#f4f7f6;border-radius:8px;margin:10px 0}.pr-note p,.pr-carry p{margin:5px 0;line-height:1.65}.pr-source-list{display:grid;gap:7px}.pr-source{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:9px 10px;border:1px solid #e7ecec;border-radius:8px}.pr-source small{display:block;color:#859397;font-size:var(--ui-meta-size);margin-top:4px}.pr-field{display:grid;gap:6px;margin:12px 0}.pr-field>span{font-weight:600;font-size:var(--ui-meta-size)}.pr-checks{display:grid;gap:7px;margin:10px 0}.pr-checks label{display:flex;align-items:center;gap:9px;padding:10px;border:1px solid #e5ebeb;border-radius:8px;cursor:pointer}.pr-checks label span{display:grid;gap:3px}.pr-checks small{font-size:var(--ui-meta-size);color:#829195}.pr-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px}.pr-actions .btn,.pr-workspace>.btn{margin-top:12px}.pr-empty-block{padding:14px;background:#f6f8f8;border-radius:9px}.pr-empty-block p{color:#74848a;line-height:1.6}.pr-local-badge{padding:14px;border-radius:10px;background:#edf5f2;color:#45645c;font-size:var(--ui-meta-size)}.pr-local-badge p{line-height:1.6;margin-bottom:0}.pr-steps{padding:0;list-style:none;display:grid;gap:13px;margin:16px 0}.pr-steps li{display:flex;align-items:center;gap:9px;color:#829195;font-size:var(--ui-body-size)}.pr-steps i{width:9px;height:9px;border:2px solid #cad5d5;border-radius:50%}.pr-steps li.done{color:#28644f;font-weight:600}.pr-steps li.done i{background:#3a9270;border-color:#3a9270}.pr-divider{border-top:1px solid #e7ecec;margin:14px 0}.pr-history{border-top:1px solid #e7ecec;padding:12px 0}.pr-history summary{cursor:pointer;display:flex;justify-content:space-between;gap:10px;align-items:center}.pr-history-body{padding-top:10px}.pr-carry{border:1px solid #d8e6df;background:#f1f7f3;margin-bottom:14px}.pr-decision{border:1px solid #e8e0c7;background:#fffdf6;border-radius:13px;padding:18px}.pr-decision h3{margin:4px 0}.pr-decision .pr-section-title{margin-bottom:7px}.pr-decision .pr-note{background:#f7f1dc}@media(max-width:850px){.pr-grid{grid-template-columns:1fr}.pr-side{grid-template-columns:repeat(auto-fit,minmax(190px,1fr))}.pr-hero{display:grid}.pr-hero-meta{justify-items:start}}
    </style>`;
  function feedbackRecipients(ctx) {
    return ['department','supervisor','employee'].filter(role=>ctx.project?.reportRecipients?.[role]);
  }
  function visibleFeedback(period,ctx,role) {
    return (period.feedback||[]).filter(row=>role==='executive'||(row.recipient===role&&row.recipientAccountId===ctx.accountId));
  }
  function renderFeedback(period,ctx,role,compose=false) {
    const feedback=visibleFeedback(period,ctx,role);
    const readableSources=new Map(safeSources(ctx,['approval']).map(source=>[source.key,source]));
    const canWrite=compose&&role==='executive'&&feedbackRecipients(ctx).length>0;
    if(!canWrite&&!feedback.length)return '';
    return `<section class="project-panel pr-feedback"><div class="pr-section-title"><h3>项目跟进反馈</h3>${canWrite?button('写反馈','flow-report-feedback','pri'):''}</div>
      ${feedback.slice().reverse().map(row=>`<article class="pr-submission"><p>${esc(row.note)}</p><footer>发给${esc(ROLE[row.recipient])} · ${esc(new Date(row.at).toLocaleString('zh-CN'))}</footer>${readableSources.has(row.source?.key)?sourceCard(readableSources.get(row.source.key),ctx):''}</article>`).join('')||'<p class="mini">暂无反馈。可写明需要核对或补充的事项。</p>'}</section>`;
  }
  function openFeedback(ctx) {
    const recipients=feedbackRecipients(ctx);
    if(ctx.role!=='executive'||!recipients.length||typeof root.modal!=='function')return;
    const sources=safeSources(ctx,['approval']);
    root.modal('写项目反馈',`<div class="field"><label for="prFeedbackRecipient">接收角色</label><select class="inp" id="prFeedbackRecipient">${recipients.map(role=>`<option value="${role}">${ROLE[role]}</option>`).join('')}</select></div>
      <div class="field"><label for="prFeedbackSource">关联审批（可选）</label><select class="inp" id="prFeedbackSource"><option value="">无关联审批</option>${sources.map((source,index)=>`<option value="${index}">${esc(source.title)} · ${esc(source.ref)}</option>`).join('')}</select></div>
      <div class="field"><label for="prFeedbackNote">反馈内容 *</label><textarea class="inp" id="prFeedbackNote" rows="4" placeholder="例如：请补充验收单并核对付款金额"></textarea></div>`,
    '保存并回传',()=>{
      const note=(root.document?.querySelector('#prFeedbackNote')?.value||'').trim();
      const recipient=root.document?.querySelector('#prFeedbackRecipient')?.value;
      if(!note||!recipients.includes(recipient))return notice('请选择接收角色并填写反馈。','warn');
      const selected=root.document?.querySelector('#prFeedbackSource')?.value;
      const source=selected?sources[Number(selected)]:null;
      const state=read(ctx),period=active(state);
      (period.feedback ||= []).push({id:id(),note,recipient,recipientAccountId:ctx.project.reportRecipients[recipient],source,at:new Date().toISOString()});
      write(ctx,state);root.closeModal?.();rerender(ctx);notice('项目反馈已保存','ok');
    },true);
  }
  function render(ctx = {}, section = 'reports') {
    const state = read(ctx), p = active(state), role = ROLE[ctx.role] ? ctx.role : 'employee';
    const latestAll = [...(p.submissions || [])].reverse();
    const latest = latestAll.filter(row => canReadSubmission(row,ctx,role));
    const reports = latest.map(row => `<article class="pr-submission"><header><b>${esc(ROLE[row.role] || row.role)}提交${row.originLabel ? ' · '+esc(row.originLabel) : ''}</b><span class="bdg brd">${esc(row.version || 'v1')}</span></header><p>${esc(row.headline || '')}</p>${row.judgement ? `<div class="pr-note"><b>${row.role === 'employee' ? '员工说明' : '本级判断'}</b><p>${esc(row.judgement)}</p></div>` : ''}${row.action ? `<div class="pr-note"><b>已采取的动作</b><p>${esc(row.action)}</p></div>` : ''}${row.suggestion ? `<div class="pr-note"><b>建议 / 待决策</b><p>${esc(row.suggestion)}</p></div>` : ''}${row.next ? `<p class="pr-meta">下一步：${esc(row.next)}</p>` : ''}<div class="pr-source-list">${(row.sources || []).map(src => sourceCard(src, ctx)).join('')}</div><footer>${esc(ROLE[row.role] || row.role)} · ${esc(row.at || '')}</footer></article>`).join('');
    if (section==='closed-reports') {
      const previous=state.periods.length-1;
      return reportStyles+(root.officeWorkflowDemo?.dailySummary?.(ctx.project)||'')
        +(reports?`<section class="pr-workspace pr-timeline"><h3>已提交汇报</h3>${reports}</section>`:'')
        +(previous>0?`<details open class="pr-workspace"><summary>往期汇报 · ${previous} 期</summary>${renderHistory(state,ctx)}</details>`:'');
    }
    const employeeCount = new Set(latest.filter(row => row.role === 'employee' && row.accountId).map(row => row.accountId)).size;
    const submissionCount = role === 'supervisor' && employeeCount > 0 ? employeeCount + ' 名员工 · ' + latest.length + ' 次提交' : latest.length + ' 次提交';
    const executiveOnly = role === 'executive' && (p.status==='department_submitted'||p.decision) ?  `<section class="pr-decision" aria-label="领导决策"><div class="pr-section-title"><div><h3>领导决策</h3></div><span class="bdg warn">仅当前领导身份可见</span></div>${p.status==='department_submitted'?`<p>${esc(activeSubmit(p,'department')?.suggestion || '部门已提交，待你决策。')}</p>`:p.decision ? `<div class="pr-note"><b>${esc(p.decision.outcome)}</b><p>${esc(p.decision.note)}</p><small>${esc(p.decision.at || '')}</small></div>` : ''}${p.status === 'department_submitted' ? `<div class="pr-actions">${button('批准并安排执行', 'flow-report-approve', 'pri')}${button('调整后批准', 'flow-report-adjust')}${button('退回部门补充', 'flow-report-return-department')}</div>` : ''}</section>` : '';

    const operatingBrief = role==='executive' && p.decision && p.decision.outcome!=='退回补充'
      ? `<section class="pr-workspace"><h3>经营会简报</h3><p>收件角色：经营会</p>${p.operatingBrief ? `<span class="bdg ok">已提交快照 · ${esc(p.operatingBrief.at)}</span><p>${esc(p.operatingBrief.summary)}</p>` : button('提交经营会简报', 'flow-report-submit-ops-brief', 'pri')}</section>` : '';

    let workspace = '';
    if (role === 'employee') {
      const sourceRows = safeSources(ctx, ['daily']);
      const pref = (evidence(ctx).find(item => (item.kind || item.type) === 'daily')?.text || '');
      const canEdit = ['employee_draft', 'returned_employee'].includes(p.status);
      const canExecute = ['approved', 'executing'].includes(p.status);
      workspace = canEdit ? `<section class="pr-workspace"><div class="pr-section-title"><div><h3>${p.status === 'returned_employee' ? '补充后重新提交' : '本期工作与求助'}</h3></div><span class="bdg mut">优先引用已归集日报</span></div>${p.status === 'returned_employee' && p.employeeInstruction ? `<div class="pr-note"><b>待执行指令</b><p>${esc(p.employeeInstruction)}</p></div>` : ''}${sourceRows.length ? `<p class="pr-muted">选择日报作为依据，已自动预填本期进展，可继续编辑。</p><div class="pr-checks">${sourceRows.map((src, i) => `<label><input type="checkbox" data-report-source="${esc(src.key)}" ${i === 0 ? 'checked' : ''}><span><b>${esc(src.title)}</b><small>${esc(src.date)} ${esc(src.ref)}</small></span></label>`).join('')}</div>` : `<div class="pr-empty-block"><b>还没有可关联的日报</b><p>可先去协作渠道归集日报，也可以在下方自行填报。</p><div class="pr-actions">${button('去协作渠道', 'flow-report-channels')}${button('刷新已归集记录', 'flow-report-refresh')}</div></div>`}<label class="pr-field"><span>本期完成 / 进展 *</span><textarea class="inp" data-report-field="headline" rows="3" placeholder="写清承诺、实际完成和当前偏差">${esc(p.employeeDraft?.headline || pref)}</textarea></label><label class="pr-field"><span>阻塞、风险或需要的协助</span><textarea class="inp" data-report-field="judgement" rows="2" placeholder="说明影响、已尝试的处理及需要谁协助">${esc(p.employeeDraft?.judgement || '')}</textarea></label><label class="pr-field"><span>下一步与预计时间</span><input class="inp" data-report-field="next" value="${esc(p.employeeDraft?.next || '')}" placeholder="负责人 · 事项 · 截止时间"></label>${canEdit ? button(p.status === 'returned_employee' ? '重新提交给直属主管' : '提交给直属主管', 'flow-report-submit-employee', 'pri') : ''}</section>` : canExecute ? `<section class="pr-workspace"><div class="pr-section-title"><div><h3>执行领导决定</h3></div><span class="bdg warn">等待实际执行</span></div><div class="pr-note"><b>执行指令</b><p>${esc(p.decision?.instruction || '')}</p>${p.decision?.dueDate?`<p class="mini">截止 ${esc(p.decision.dueDate)}</p>`:''}${p.decision?.target?`<button class="btn sm gho" data-act="open-project-detail-tab" data-tab="${esc(p.decision.target.tab)}">查看${esc(p.decision.target.label)}</button>`:''}</div><label class="pr-field"><span>执行结果 *</span><textarea class="inp" data-report-field="execution" rows="3" placeholder="记录已完成动作、时间和仍有影响"></textarea></label>${button('提交执行结果，交主管复测', 'flow-report-execute', 'pri')}</section>` : role === 'employee' ? `<section class="pr-workspace"><div class="pr-section-title"><div><h3>等待后续处理</h3></div><span class="bdg brd">${esc(statusText(p.status))}</span></div><p class="pr-muted">当前责任人：${esc(nextOwner(p))}。领导审批细节仅在分管领导身份下显示。</p></section>` : '';

    }
    if (role === 'employee' && ['employee_draft','returned_employee','employee_submitted'].includes(p.status)) {
      const direct = `<section class="pr-workspace"><div class="pr-section-title"><h3>从现有流程提交日报</h3><span class="bdg mut">渠道演示</span></div><p class="pr-muted">沿用团队的日报或日志表单。提交一次，系统按事项拆分归类，项目汇总自动更新。</p><div class="pr-actions">${root.officeWorkflowDemo.launchers(ctx.project)}</div></section>`;
      workspace = direct + (p.status==='employee_submitted' ? workspace : `<details open class="pr-workspace"><summary>手工补报</summary>${workspace}</details>`);
    }
    if (role === 'supervisor') {
      const canReview = ['employee_submitted', 'returned_supervisor'].includes(p.status);
      const canRetest = p.status === 'retest_pending';
      const meetings = safeSources(ctx, ['meeting']);
      workspace = canReview ? `<section class="pr-workspace"><div class="pr-section-title"><div><h3>${p.status === 'returned_supervisor' ? '补充主管判断' : '主管判断与协调'}</h3></div><span class="bdg warn">本级补判断后再上报</span></div><label class="pr-field"><span>本级已采取的协调动作 *</span><textarea class="inp" data-report-field="action" rows="2" placeholder="可组内消化的资源协调、责任人和答复时间"></textarea></label><label class="pr-field"><span>团队判断 / 仍需部门协调 *</span><textarea class="inp" data-report-field="judgement" rows="2" placeholder="区分已确认事实与主管判断"></textarea></label><label class="pr-field"><span>上报建议与下一步 *</span><textarea class="inp" data-report-field="suggestion" rows="2" placeholder="需要部门负责人决定什么，建议何时答复"></textarea></label><label class="pr-field"><span>下一责任人 / 截止时间</span><input class="inp" data-report-field="next" placeholder="责任人 · 事项 · 截止时间"></label>${button('提交给部门负责人', 'flow-report-submit-supervisor', 'pri')}</section>` : canRetest ? `<section class="pr-workspace"><div class="pr-section-title"><div><h3>主管独立复测签认</h3></div><span class="bdg warn">必须引用已归集会议记录</span></div>${meetings.length ? `<div class="pr-checks">${meetings.map((src, i) => `<label><input type="radio" name="pr-meeting-source" data-report-meeting="${esc(src.key)}" ${i === 0 ? 'checked' : ''}><span><b>${esc(src.title)}</b><small>${esc(src.date)} ${esc(src.ref)}</small></span></label>`).join('')}</div><label class="pr-field"><span>独立复测结论 *</span><textarea class="inp" data-report-field="verification" rows="3" placeholder="填写复测范围、实际结果、是否解除风险；只记录你核实过的结果"></textarea></label>${button('签认复测结果', 'flow-report-verify', 'pri')}` : `<div class="pr-empty-block"><b>尚无可用复测会议记录</b><p>请先在协作渠道打开复测纪要原文并核验，再回来签认。</p>${button('去协作渠道', 'flow-report-channels')}</div>`}</section>` : `<section class="pr-workspace"><div class="pr-section-title"><div><h3>主管待办</h3></div><span class="bdg brd">${esc(statusText(p.status))}</span></div><p class="pr-muted">当前责任人：${esc(nextOwner(p))}。复测必须使用与执行人不同的主管身份，并引用已归集会议记录。</p></section>`;
    }

    if (role === 'department') {
      const canSubmit = ['supervisor_submitted', 'returned_department'].includes(p.status);
      workspace = canSubmit ? `<section class="pr-workspace"><div class="pr-section-title"><div><h3>部门负责人汇总</h3></div><span class="bdg warn">汇总下级事实，也补充本级动作</span></div><label class="pr-field"><span>部门已采取的动作 *</span><textarea class="inp" data-report-field="action" rows="2" placeholder="部门内资源调配、优先级安排或已关闭事项"></textarea></label><label class="pr-field"><span>部门判断 *</span><textarea class="inp" data-report-field="judgement" rows="2" placeholder="目标与实际差距、跨项目风险及影响"></textarea></label><label class="pr-field"><span>建议分管领导决策 *</span><textarea class="inp" data-report-field="suggestion" rows="2" placeholder="可选方案、推荐方案、业务代价和最迟决策时间"></textarea></label><label class="pr-field"><span>下一责任人 / 复查时间</span><input class="inp" data-report-field="next" placeholder="责任人 · 事项 · 截止时间"></label>${button('提交给分管领导', 'flow-report-submit-department', 'pri')}</section>` : `<section class="pr-workspace"><div class="pr-section-title"><div><h3>部门汇报待办</h3></div><span class="bdg brd">${esc(statusText(p.status))}</span></div><p class="pr-muted">当前责任人：${esc(nextOwner(p))}。</p></section>`;
    }

    if (role === 'department' && p.status === 'returned_department' && p.returnFeedback) workspace = workspace.replace('<label class="pr-field">', `<div class="pr-note"><b>分管领导退回意见</b><p>${esc(p.returnFeedback)}</p></div><label class="pr-field">`);
    const executionView = role !== 'employee' && p.execution ? `<section class="pr-workspace"><div class="pr-section-title"><div><h3>执行回执</h3></div><span class="bdg ${p.verification ? 'ok' : 'warn'}">${p.verification ? '已复测' : '待复测'}</span></div><p>${esc(p.execution.text)}</p><small class="pr-meta">员工执行 · ${esc(p.execution.at || '')}</small>${p.verification ? `<div class="pr-note"><b>主管独立复测</b><p>${esc(p.verification.text)}</p><small>${esc(p.verification.at || '')} · 来源：${esc(p.verification.source?.title || '已归集会议记录')}</small></div>` : ''}</section>` : '';
    if (section==='decisions') {
      const lastDepartment=activeSubmit(p,'department');
      const request=role==='executive' && lastDepartment ? `<section class="project-panel"><h3>部门上报建议</h3>${[['建议与待决策',p.status==='department_submitted'?'':lastDepartment.suggestion],['部门判断',lastDepartment.judgement],['已采取的动作',lastDepartment.action],['下一步',lastDepartment.next]].filter(([,text])=>text).map(([label,text])=>`<div class="pr-note"><b>${label}</b><p>${esc(text)}</p></div>`).join('')}<div class="pr-source-list">${(lastDepartment.sources||[]).map(source=>sourceCard(source,ctx)).join('')}</div></section>` : '';
      const visibleDecision=p.decision?.instruction || (role==='department' && p.status==='returned_department' && p.returnFeedback);
      const response=visibleDecision?`<p>${esc(visibleDecision)}</p>`:'<p class="mini">当前没有已回传给你的决策。</p>';
      return reportStyles+(role==='executive'?executiveOnly:`<section class="project-panel"><h3>项目决策</h3>${response}</section>`)+request+executionView+renderFeedback(p,ctx,role,true);
    }
    const automaticSummary=root.officeWorkflowDemo?.dailySummary?.(ctx.project)||'';
    if(automaticSummary&&p.status==='employee_draft'&&!latest.length){
      const channelForm=role==='employee'?'<section class="pr-workspace"><h3>从现有流程提交日报</h3><div class="pr-actions">'+root.officeWorkflowDemo.launchers(ctx.project)+'</div></section>':'';
      return reportStyles+automaticSummary+channelForm+renderFeedback(p,ctx,role);
    }
    const awaitingFirstSubmission=p.status==='employee_draft'&&!latestAll.length;
    const canNewPeriod = role !== 'employee' && p.status === 'verified';
    const carry = p.carryForward ? `<div class="pr-carry"><b>${esc(role === 'executive' ? p.carryForward.decision || '上期决议' : '上期决议执行')}</b><p>${esc(role === 'executive' ? p.carryForward.result || '尚待本期更新执行结果' : p.carryForward.instruction || '请按本期任务说明更新执行情况。')}</p>${role !== 'employee' && p.carryForward.source ? sourceCard(p.carryForward.source, ctx) : ''}</div>` : '';
    return reportStyles+`<section class="pr-hero"><b>${esc(p.label)}</b><div><span class="bdg ${p.status === 'verified' ? 'ok' : 'warn'}">${awaitingFirstSubmission?'尚无提交':esc(statusText(p.status))}</span>${awaitingFirstSubmission?'':`<span class="pr-owner">下一责任人：${esc(nextOwner(p))}</span>`}</div></section>${carry}<div class="pr-grid"><div class="pr-main">${root.officeWorkflowDemo?.dailySummary?.(ctx.project)||''}${renderFeedback(p,ctx,role)}${workspace}${operatingBrief}${role==='executive'?`<button class="btn" data-act="pf-tab" data-tab="decisions">查看审批与决策</button>`:''}<section class="pr-workspace pr-timeline"><div class="pr-section-title"><div><h3>本期事实与逐级判断</h3></div><span class="bdg mut">${submissionCount}</span></div>${reports || '<div class="pr-empty-block"><b>本期尚无提交</b><p>员工在协作平台提交日报后，这里将显示原文和提交记录。</p></div>'}</section>${executionView}<details open class="pr-workspace"><summary>往期汇报 · ${Math.max(0, state.periods.length - 1)} 期</summary>${renderHistory(state, ctx)}</details></div><aside class="pr-side"><section class="pr-workspace"><h3>本期节点</h3><ol class="pr-steps">${['员工提交','主管协调','部门建议','领导决策','员工执行','主管复测'].map((label, index) => `<li class="${stageRank[p.status] >= [1,2,3,7,8,10][index] ? 'done' : ''}"><i></i><span>${label}</span></li>`).join('')}</ol><div class="pr-divider"></div><b>引用来源</b><p class="pr-muted">${[...new Map(latest.flatMap(row => row.sources || []).map(src => [src.key, src])).values()].length} 条已引用来源</p></section>${canNewPeriod ? `<section class="pr-workspace"><h3>本期已验收</h3><p class="pr-muted">下一期将带入本期决议和复测结果。</p>${button('创建下一期汇报','flow-report-next-period','pri')}</section>` : ''}</aside></div>`;
  }

  function value(ctx, name) {
    const node = root.document?.querySelector(`[data-report-field="${name}"]`);
    return String(node?.value || '').trim();
  }
  function selectedSource(ctx, kinds) {
    const checked = [...(root.document?.querySelectorAll('[data-report-source]:checked') || [])].map(n => n.dataset.reportSource);
    return safeSources(ctx, kinds).filter(src => checked.includes(src.key));
  }
  function notice(message, tone) { if (typeof root.toast === 'function') root.toast(message, tone || 'ok'); }
  function rerender(ctx) { if (typeof ctx.refresh === 'function') ctx.refresh(); }
  function submit(ctx, role, stage, required) {
    const state = read(ctx), p = active(state), roleNow = ctx.role;
    const allowed = { employee: ['employee_draft', 'returned_employee'], supervisor: ['employee_submitted', 'returned_supervisor'], department: ['supervisor_submitted', 'returned_department'] };
    if (roleNow !== role || !allowed[role]?.includes(p.status)) return notice('当前汇报阶段或演示身份已变化，请刷新后继续。', 'warn');
    const nextRole={employee:'supervisor',supervisor:'department',department:'executive'}[role];
    if(ctx.project.reportRecipients&&!ctx.project.reportRecipients[nextRole])return notice('请先在项目成员中指定'+ROLE[nextRole]+'。','warn');
    const fieldNames = role === 'employee' ? ['headline', 'judgement', 'next'] : ['action', 'judgement', 'suggestion', 'next'];
    const fields = Object.fromEntries(fieldNames.map(name => [name, value(ctx, name)]));
    const missing = required.filter(name => !fields[name]);
    if (missing.length) return notice('请补齐本级必填判断后再提交。', 'warn');
    const sources = role === 'employee' ? selectedSource(ctx, ['daily']) : [];
    if (role === 'employee' && !sources.length && !fields.headline) return notice('请关联一条日报，或填写本期工作进展。', 'warn');
    const version = 'v' + ((p.submissions || []).filter(row => row.role === role).length + 1);
    const row = { id: id(), role, accountId:ctx.accountId, version, at: new Date().toISOString(), sources, ...fields };
    p.participantSnapshot ||= {...ctx.project.reportRecipients};
    p.submissions = p.submissions || []; p.submissions.push(row); p.lastActor = ROLE[role]; p.snapshotAt = new Date().toISOString();
    if (role === 'employee') { p.employeeDraft = null; p.status = 'employee_submitted'; }
    if (role === 'supervisor') p.status = 'supervisor_submitted';
    if (role === 'department') p.status = 'department_submitted';
    p.headline = p.submissions[0]?.headline || p.headline || '';
    write(ctx, state); rerender(ctx); notice('已提交至' + nextOwner(p), 'ok');
  }
  function receiveDaily(ctx,record) {
    if (ctx?.role!=='employee' || record.kind!=='daily' || record.projectId!==ctx.project.id) return '未匹配到当前项目';
    const state=read(ctx), period=active(state);
    const source=safeSources(ctx,['daily']).find(s=>s.ref===record.ref && s.providers.includes(record.provider));
    if (!source) return '未找到已同步的原平台记录';
    const duplicate=state.periods.some(p=>(p.submissions||[]).some(row=>row.sources?.some(s=>s.key===source.key)));
    if (duplicate || state.archivedDailySources?.includes(source.key)) return '该日报已同步';
    if (period.status==='verified') {
      state.archivedDailySources=[...(state.archivedDailySources||[]),source.key];
      write(ctx,state);
      return '日报已归入项目动态，本期汇报已归档';
    }
    const forwards=['employee_draft','returned_employee','employee_submitted'].includes(period.status);
    const version='v'+(period.submissions.filter(row=>row.role==='employee').length+1);
    period.participantSnapshot ||= {...ctx.project.reportRecipients};
    period.submissions.push({id:id(),role:'employee',accountId:ctx.accountId,version,at:record.createdAt,headline:record.text,
      sources:[source],originLabel:[record.author,OFFICE_CHANNELS[record.provider].name,record.form].filter(Boolean).join(' · ')});
    if (forwards) {period.status='employee_submitted';period.lastActor=ROLE.employee;period.employeeDraft=null;}
    period.snapshotAt=new Date().toISOString();
    write(ctx,state);
    return forwards?(ctx.project.reportRecipients?.supervisor?'日报已同步，待直属主管处理':'日报已同步，请先指定直属主管'):'日报已补入本期，已提交的上级意见保留';
  }
  function openDecision(ctx, outcome) {
    const state = read(ctx), p = active(state);
    if (ctx.role !== 'executive' || p.status !== 'department_submitted') return notice('当前没有可处理的领导决策。', 'warn');
    const nextRole=outcome==='returned'?'department':'employee';
    if(ctx.project.reportRecipients&&!ctx.project.reportRecipients[nextRole])return notice('请先在项目成员中指定'+ROLE[nextRole]+'。','warn');
    const title = outcome === 'returned' ? '退回部门补充' : outcome === 'adjusted' ? '调整并批准' : '批准本期建议';
    const project=ctx.project;
    const current=root.projectProgressDemo?.summary(project);
    const targets=[
      ...(current?.step?[{key:'stage:'+current.index,label:'阶段排期 · '+current.stage,tab:'schedule'}]:[]),
      ...(project?.milestones||[]).map((item,index)=>({key:'milestone:'+index,label:'里程碑 · '+item.name,tab:'work-items'})),
      {key:'scope',label:'交付范围',tab:'stage'}
    ];
    const executionFields=`<label class="pr-field"><span>关联项目内容</span><select class="inp" id="prDecisionTarget"><option value="">仅记录执行指令</option>${targets.map(item=>`<option value="${esc(item.key)}">${esc(item.label)}</option>`).join('')}</select></label><label class="pr-field"><span>执行截止日期</span><input class="inp" type="date" id="prDecisionDue"></label>`;
    const html = outcome === 'returned' ? `<label class="pr-field"><span>退回部门的补充意见 *</span><textarea class="inp" id="prDecisionNote" rows="4" placeholder="明确缺少的信息、需要修正的判断和返回时限"></textarea></label><p class="pr-muted">此意见会提供给部门负责人，不会作为员工审批内容展示。</p>` : `<label class="pr-field"><span>员工执行指令 *</span><textarea class="inp" id="prDecisionInstruction" rows="3" placeholder="责任人、具体动作与最迟完成时间"></textarea></label><label class="pr-field"><span>领导内部判断（仅领导可见）</span><textarea class="inp" id="prDecisionNote" rows="3" placeholder="记录取舍依据、业务影响或内部审批理由"></textarea></label>${executionFields}<p class="pr-muted">批准结果回传到原事项，内部判断不会展示给员工。</p>`;
    if (typeof root.modal !== 'function') return notice('当前原型未提供决策弹窗。', 'warn');
    root.modal(title, html, outcome === 'returned' ? '退回补充' : '保存决定', () => {
      const note = String(root.document?.querySelector('#prDecisionNote')?.value || '').trim();
      const instruction = String(root.document?.querySelector('#prDecisionInstruction')?.value || '').trim();
      if (outcome === 'returned' && !note) return notice('请写清退回部门的补充意见。', 'warn');
      if (outcome !== 'returned' && !instruction) return notice('请填写员工可执行的具体指令。', 'warn');
      p.decision = { id:id(), outcome: outcome === 'adjusted' ? '调整后批准' : outcome === 'returned' ? '退回补充' : '批准', note, instruction, at: new Date().toISOString(), actor: 'executive' };
      if(outcome!=='returned'){
        p.decision.target=targets.find(item=>item.key===root.document?.querySelector('#prDecisionTarget')?.value)||null;
        p.decision.dueDate=root.document?.querySelector('#prDecisionDue')?.value||'';
      }
      if (outcome === 'returned') p.returnFeedback = note;
      else p.employeeInstruction = instruction;
      p.lastActor = ROLE.executive; p.snapshotAt = new Date().toISOString();
      p.status = outcome === 'returned' ? 'returned_department' : 'approved';
      if (outcome !== 'returned') p.decisions.push({ ...p.decision });
      write(ctx, state); root.closeModal?.(); rerender(ctx); notice(outcome === 'returned' ? '已退回部门负责人补充' : '决定已保存，等待员工执行', 'ok');
    }, true);
  }
  function act(action, el, ctx = {}) {
    if (!String(action || '').startsWith('flow-report-')) return false;
    const state = read(ctx), p = active(state), role = ctx.role;
    switch (action) {
      case 'flow-report-submit-employee': return submit(ctx, 'employee', p.status, ['headline']);
      case 'flow-report-submit-supervisor': return submit(ctx, 'supervisor', p.status, ['action', 'judgement', 'suggestion']);
      case 'flow-report-submit-department': return submit(ctx, 'department', p.status, ['action', 'judgement', 'suggestion']);
      case 'flow-report-feedback': return openFeedback(ctx);
      case 'flow-report-approve': return openDecision(ctx, 'approved');
      case 'flow-report-adjust': return openDecision(ctx, 'adjusted');
      case 'flow-report-return-department': return openDecision(ctx, 'returned');
      case 'flow-report-submit-ops-brief': {
        if (role !== 'executive' || !p.decision || p.decision.outcome === '退回补充') return notice('分管领导形成决定后才可提交经营会简报。', 'warn');
        if (p.operatingBrief) return notice('本期经营会简报快照已提交，不能重复提交。', 'warn');
        const facts = (p.submissions || []).map(row => row.headline).filter(Boolean);
        const impacts = (p.submissions || []).map(row => row.judgement || row.suggestion).filter(Boolean);
        p.operatingBrief = { id: id(), recipient: '经营会', at: new Date().toISOString(), summary: `成果：${facts.join('；') || '待补'}；影响：${impacts.join('；') || '待补'}；决议执行：${p.execution?.text || p.decision.instruction || '待执行'}；下一动作：${(p.submissions || []).at(-1)?.next || nextOwner(p)}` };
        p.snapshotAt = new Date().toISOString(); write(ctx, state); rerender(ctx); notice('已向经营会提交简报快照', 'ok'); return true;
      }
      case 'flow-report-source': {
        if (typeof ctx.openSource === 'function') ctx.openSource(el?.dataset?.provider || '', el?.dataset?.kind || '', el?.dataset?.ref || '');
        else notice('来源已保留定位信息；当前页面未提供打开来源入口。', 'warn');
        return true;
      }
      case 'flow-report-refresh': rerender(ctx); notice('已刷新已归集来源', 'ok'); return true;
      case 'flow-report-channels': if (typeof ctx.gotoChannels === 'function') ctx.gotoChannels(); else notice('当前页面未提供协作渠道入口。', 'warn'); return true;
      case 'flow-report-execute': {
        if (role !== 'employee' || !['approved', 'executing'].includes(p.status)) return notice('当前阶段不可执行。', 'warn');
        const text = value(ctx, 'execution'); if (!text) return notice('请填写实际执行结果。', 'warn');
        if (p.execution) return notice('本期执行结果已提交，不能重复提交。', 'warn');
        p.execution = { text, at: new Date().toISOString(), actor: 'employee' }; p.status = 'retest_pending'; p.lastActor = ROLE.employee; p.snapshotAt = new Date().toISOString(); write(ctx, state); rerender(ctx); notice('执行结果已提交，等待主管独立复测', 'ok'); return true;
      }
      case 'flow-report-verify': {
        if (role !== 'supervisor' || p.status !== 'retest_pending' || p.verification) return notice('当前阶段不可复测，或复测已签认。', 'warn');
        const text = value(ctx, 'verification'), key = root.document?.querySelector('[data-report-meeting]:checked')?.dataset.reportMeeting;
        const source = safeSources(ctx, ['meeting']).find(src => src.key === key);
        if (!text || !source) return notice('请关联一条已归集会议记录 并填写独立复测结论。', 'warn');
        p.verification = { text, source, at: new Date().toISOString(), actor: 'supervisor' }; p.status = 'verified'; p.lastActor = ROLE.supervisor; p.snapshotAt = new Date().toISOString(); write(ctx, state); rerender(ctx); notice('主管已签认独立复测，本期完成', 'ok'); return true;
      }
      case 'flow-report-next-period': {
        if (!['supervisor', 'department', 'executive'].includes(role) || p.status !== 'verified') return notice('本期完成主管复测后，方可创建下一期。', 'warn');
        if (state.periods.some(period => period !== p && period.status !== 'verified')) return notice('已有未完成汇报期，请先完成后再新建。', 'warn');
        const decision = p.decision ? `${p.decision.outcome}：${p.decision.note || ''}` : '本期未形成领导决议';
        state.periods.push({ id: id(), label: '下一期汇报 · ' + today(), createdAt: new Date().toISOString(), status: 'employee_draft', submissions: [], decisions: [], execution: null, verification: null, carryForward: { decision, instruction: p.decision?.instruction || '按上期事项继续复查并回报执行结果', result: p.verification?.text || p.execution?.text || '待本期更新执行情况', source: p.verification?.source || null }, previousPeriodId: p.id });
        write(ctx, state); rerender(ctx); notice('已创建下一期；往期提交与复测快照保留。', 'ok'); return true;
      }
      default: return false;
    }
  }

  function brainEntries(ctx = {}) {
    const state = read(ctx), role = ROLE[ctx.role] ? ctx.role : 'employee';
    const visibleRank = { employee: 0, supervisor: 1, department: 2, executive: 3 }[role];
    const entries = [];
    const readableSourceKeys=new Set(safeSources(ctx,['approval']).map(source=>source.key));
    state.periods.forEach(period => {
      visibleFeedback(period,ctx,role).forEach(row=>entries.push({id:row.id,title:`${period.label} · 项目跟进反馈`,summary:row.note,kind:'report_feedback',ref:readableSourceKeys.has(row.source?.key)?row.source.ref:row.id}));
      (period.submissions || []).forEach(row => {
        if (!canReadSubmission(row,ctx,role)) return;
        const refs = (row.sources || []).map(src => src.ref || src.key).filter(Boolean).join('、');
        const summary = role === 'employee' ? row.headline : [row.headline, row.judgement, row.action, row.suggestion].filter(Boolean).join('；');
        entries.push({ id: row.id, title: `${period.label} · ${ROLE[row.role] || '提交'}`, summary, kind: 'report_submission', ref: refs || row.id });
      });
      if (period.decision && role === 'executive') entries.push({ id: `decision-${period.id}`, title: `${period.label} · 领导决策`, summary: [period.decision.outcome, period.decision.note, period.decision.instruction].filter(Boolean).join('；'), kind: 'report_decision', ref: period.id });
      if (period.operatingBrief && role === 'executive') entries.push({ id: period.operatingBrief.id, title: `${period.label} · 经营会简报`, summary: period.operatingBrief.summary, kind: 'operating_brief', ref: period.id });
      if (period.execution && visibleRank >= 0) entries.push({ id: `execution-${period.id}`, title: `${period.label} · 执行回执`, summary: period.execution.text, kind: 'report_execution', ref: period.id });
      if (period.verification && visibleRank >= 1) entries.push({ id: `verification-${period.id}`, title: `${period.label} · 主管复测`, summary: period.verification.text, kind: 'report_verification', ref: period.verification.source?.ref || period.verification.source?.key || period.id });
      if (period.status === 'verified' && visibleRank >= 1) entries.push({ id: `acceptance-${period.id}`, title: `${period.label} · 复测验收`, summary: '主管独立复测已签认，本期汇报完成。', kind: 'report_acceptance', ref: period.verification?.source?.ref || period.id });
    });
    return entries;
  }

  function overview(ctx) {
    if(!ctx)return '';
    const period=active(read(ctx));
    const latest=[...period.submissions].reverse().find(row=>canReadSubmission(row,ctx,ctx.role));
    if(!latest && !period.employeeInstruction)return '';
    const pending=pendingTask(ctx,period);
    const target=pending?.reportRoute||'reports';
    return `<section class="project-panel"><div class="head"><h3>本期汇报进展</h3><span class="bdg brd">${esc(statusText(period.status))}</span></div>
      ${latest?`<p><b>${esc(ROLE[latest.role])}</b> · ${esc(latest.judgement||latest.headline)}</p>`:''}
      ${period.employeeInstruction?`<p>执行要求 · ${esc(period.employeeInstruction)}</p>`:''}
      <div class="head"><span class="mini">下一责任人 · ${esc(nextOwner(period))}</span><button class="btn sm" data-act="pf-tab" data-tab="${target}">${esc(pending?.title||'查看汇报')}</button></div></section>`;
  }
  function pendingTask(ctx,period=active(read(ctx))) {
    const next={
      returned_employee:['employee','补充员工汇报','reports'],
      returned_supervisor:['supervisor','补充主管判断','reports'],
      executing:['employee','更新决策执行结果','reports'],
      employee_submitted:['supervisor','审阅员工汇报','reports'],
      supervisor_submitted:['department','汇总部门意见','reports'],
      returned_department:['department','补充退回的部门汇报','reports'],
      department_submitted:['executive','处理项目决策','decisions'],
      approved:['employee','执行项目决策','reports'],
      retest_pending:['supervisor','签认项目复测结果','reports']
    }[period.status];
    if(!next||next[0]!==ctx.role)return null;
    const executing=['approved','executing'].includes(period.status);
    const dueAt=executing?(period.decision?.dueDate||''):'';
    return {title:next[1],reportRoute:next[2],dueAt,scheduledDate:dueAt,
      decisionId:executing?period.decision?.id||period.id:'',decisionTarget:executing?period.decision?.target:null};
  }
  function hasActiveSubmissions(scopeKey){const p=active(read({scopeKey}));return p.status!=='verified'&&Boolean(p.submissions?.length);}
  root.projectReportsDemo = { hasActiveSubmissions,render, act, brainEntries, receiveDaily, pendingTask, overview };
})(window);
