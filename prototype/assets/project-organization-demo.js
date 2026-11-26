// Snapshot exported from the simulated report and verification walkthrough.
window.projectOrganizationDemo = {
  "reports": {
    "version": 1,
    "scopeKey": "tenant-weiran.proj-organization-report-demo",
    "periods": [
      {
        "id": "rpt-mwvjo42g-3ix7y",
        "label": "接口联调协调与复测 · 模拟验收记录",
        "createdAt": "2026-11-25T03:08:54.040Z",
        "status": "verified",
        "submissions": [
          {
            "id": "rpt-mwvjo42g-kjy0k",
            "role": "employee",
            "accountId": "acct-employee-lin",
            "version": "v1",
            "at": "2026-11-25T03:08:54.038Z",
            "headline": "当前测试环境等待确认 0",
            "sources": [
              {
                "key": "wecom:daily:QW-C3BB5018",
                "title": "验收日报 0",
                "kind": "daily",
                "providers": [
                  "wecom"
                ],
                "date": "2026/11/25",
                "ref": "QW-C3BB5018"
              }
            ],
            "originLabel": "林晓 · 企业微信 · 工作汇报"
          },
          {
            "id": "rpt-mwvjo4kj-5r9hs",
            "role": "employee",
            "accountId": "acct-employee-lin",
            "version": "v2",
            "at": "2026-11-25T03:08:54.690Z",
            "headline": "当前测试环境等待确认 1",
            "sources": [
              {
                "key": "feishu:daily:FS-8A12A2E0",
                "title": "验收日报 1",
                "kind": "daily",
                "providers": [
                  "feishu"
                ],
                "date": "2026/11/25",
                "ref": "FS-8A12A2E0"
              }
            ],
            "originLabel": "林晓 · 飞书 · 日报表格"
          },
          {
            "id": "rpt-mwvjo530-pvma5",
            "role": "employee",
            "accountId": "acct-employee-lin",
            "version": "v3",
            "at": "2026-11-25T03:08:55.356Z",
            "headline": "当前测试环境等待确认 2",
            "sources": [
              {
                "key": "dingtalk:daily:DD-8E891BC7",
                "title": "验收日报 2",
                "kind": "daily",
                "providers": [
                  "dingtalk"
                ],
                "date": "2026/11/25",
                "ref": "DD-8E891BC7"
              }
            ],
            "originLabel": "林晓 · 钉钉 · 工作日志"
          },
          {
            "id": "rpt-mwvjo88e-77jjn",
            "role": "supervisor",
            "accountId": "acct-supervisor",
            "version": "v1",
            "at": "2026-11-25T03:08:59.438Z",
            "sources": [],
            "action": "核对回归排期",
            "judgement": "接口环境需确认",
            "suggestion": "调整测试顺序",
            "next": ""
          },
          {
            "id": "rpt-mwvjo8ww-fasi3",
            "role": "department",
            "accountId": "acct-department",
            "version": "v1",
            "at": "2026-11-25T03:09:00.320Z",
            "sources": [],
            "action": "核对回归排期",
            "judgement": "接口环境需确认",
            "suggestion": "调整测试顺序",
            "next": ""
          },
          {
            "id": "rpt-mwvjoczo-vqlgd",
            "role": "department",
            "accountId": "acct-department",
            "version": "v2",
            "at": "2026-11-25T03:09:05.604Z",
            "sources": [],
            "action": "核对回归排期",
            "judgement": "接口环境需确认",
            "suggestion": "调整测试顺序",
            "next": ""
          }
        ],
        "decisions": [
          {
            "id": "rpt-mwvjodvo-stctw",
            "outcome": "调整后批准",
            "note": "仅领导判断验收文本",
            "instruction": "登记联调回归结果",
            "at": "2026-11-25T03:09:06.756Z",
            "actor": "executive",
            "target": {
              "key": "stage:2",
              "label": "阶段排期 · 项目启动",
              "tab": "schedule"
            },
            "dueDate": "2026-11-25"
          }
        ],
        "execution": {
          "text": "已登记回归结果",
          "at": "2026-11-25T03:09:11.554Z",
          "actor": "employee"
        },
        "verification": {
          "text": "复测通过",
          "source": {
            "key": "dingtalk:meeting:DD-416A1F93",
            "title": "复测验收纪要",
            "kind": "meeting",
            "providers": [
              "dingtalk"
            ],
            "date": "2026/11/25",
            "ref": "DD-416A1F93"
          },
          "at": "2026-11-25T03:09:19.421Z",
          "actor": "supervisor"
        },
        "carryForward": null,
        "lastActor": "直属主管",
        "employeeDraft": null,
        "snapshotAt": "2026-11-25T03:09:23.321Z",
        "headline": "当前测试环境等待确认 0",
        "decision": {
          "id": "rpt-mwvjodvo-stctw",
          "outcome": "调整后批准",
          "note": "仅领导判断验收文本",
          "instruction": "登记联调回归结果",
          "at": "2026-11-25T03:09:06.756Z",
          "actor": "executive",
          "target": {
            "key": "stage:2",
            "label": "阶段排期 · 项目启动",
            "tab": "schedule"
          },
          "dueDate": "2026-11-25"
        },
        "returnFeedback": "请补充受影响的联调范围",
        "employeeInstruction": "登记联调回归结果",
        "operatingBrief": {
          "id": "rpt-mwvjoqnt-bzm97",
          "recipient": "经营会",
          "at": "2026-11-25T03:09:23.321Z",
          "summary": "成果：当前测试环境等待确认 0；当前测试环境等待确认 1；当前测试环境等待确认 2；影响：接口环境需确认；接口环境需确认；接口环境需确认；决议执行：已登记回归结果；下一动作：下一期责任人"
        },
        "participantSnapshot": {
          "employee": "acct-employee-lin",
          "supervisor": "acct-supervisor",
          "department": "acct-department",
          "executive": "acct-boss"
        }
      }
    ]
  },
  "office": [
    {
      "native": true,
      "projectId": "proj-organization-report-demo",
      "provider": "dingtalk",
      "providers": [
        "dingtalk"
      ],
      "kind": "meeting",
      "ref": "DD-416A1F93",
      "title": "复测验收纪要",
      "text": "接口回归复测结果已核对",
      "state": "submitted",
      "approvalType": "",
      "quote": null,
      "status": "已发布",
      "tone": "brd",
      "form": "会议纪要",
      "supersedes": "",
      "projectImpact": "",
      "author": "陈宁",
      "accountId": "acct-supervisor",
      "createdAt": "2026-11-25T03:09:16.239Z",
      "updatedAt": "2026-11-25T03:09:16.239Z",
      "date": "2026/11/25",
      "verified": true,
      "verifiedBy": "acct-supervisor",
      "verifiedAt": "2026-11-25T03:09:18.641Z",
      "channelAccountId": "dingtalk:demo:supervisor"
    },
    {
      "native": true,
      "projectId": "proj-organization-report-demo",
      "provider": "feishu",
      "providers": [
        "feishu"
      ],
      "kind": "daily",
      "ref": "FS-8A12A2E0",
      "title": "验收日报 1",
      "text": "当前测试环境等待确认 1",
      "state": "submitted",
      "approvalType": "",
      "quote": null,
      "status": "已提交",
      "tone": "brd",
      "form": "日报表格",
      "supersedes": "",
      "projectImpact": "",
      "author": "林晓",
      "accountId": "acct-employee-lin",
      "createdAt": "2026-11-25T03:08:54.690Z",
      "updatedAt": "2026-11-25T03:08:54.690Z",
      "date": "2026/11/25",
      "verified": false,
      "channelAccountId": "feishu:demo:employee-lin"
    },
    {
      "native": true,
      "projectId": "proj-organization-report-demo",
      "provider": "dingtalk",
      "providers": [
        "dingtalk"
      ],
      "kind": "daily",
      "ref": "DD-8E891BC7",
      "title": "验收日报 2",
      "text": "当前测试环境等待确认 2",
      "state": "submitted",
      "approvalType": "",
      "quote": null,
      "status": "已提交",
      "tone": "brd",
      "form": "工作日志",
      "supersedes": "",
      "projectImpact": "",
      "author": "林晓",
      "accountId": "acct-employee-lin",
      "createdAt": "2026-11-25T03:08:55.356Z",
      "updatedAt": "2026-11-25T03:08:55.356Z",
      "date": "2026/11/25",
      "verified": false,
      "channelAccountId": "dingtalk:demo:employee-lin"
    },
    {
      "native": true,
      "projectId": "proj-organization-report-demo",
      "provider": "wecom",
      "providers": [
        "wecom"
      ],
      "kind": "daily",
      "ref": "QW-C3BB5018",
      "title": "验收日报 0",
      "text": "当前测试环境等待确认 0",
      "state": "submitted",
      "approvalType": "",
      "quote": null,
      "status": "已提交",
      "tone": "brd",
      "form": "工作汇报",
      "supersedes": "",
      "projectImpact": "",
      "author": "林晓",
      "accountId": "acct-employee-lin",
      "createdAt": "2026-11-25T03:08:54.038Z",
      "updatedAt": "2026-11-25T03:08:54.038Z",
      "date": "2026/11/25",
      "verified": false,
      "channelAccountId": "wecom:demo:employee-lin"
    }
  ],
  "project": {
    "id": "proj-organization-report-demo",
    "tenantId": "tenant-weiran",
    "name": "跨渠道汇报闭环演练（模拟）",
    "customerId": "cust-aurora",
    "status": "执行中",
    "lifecycleStage": "执行中",
    "health": "正常",
    "goal": "演练协作渠道日报归集、逐级判断、决策执行和主管复测。",
    "scope": "接口联调范围、回归排期与资源协调。",
    "outcomes": "跨渠道日报和复测纪要、逐级汇报、领导决定、执行和复测记录。",
    "successCriteria": "主管使用本次核验的纪要签认执行结果，形成可追溯的本期记录。",
    "createdByAccountId": "acct-boss",
    "ownerAccountId": "acct-boss",
    "memberIds": [
      "acct-employee-lin",
      "acct-supervisor",
      "acct-department",
      "acct-boss"
    ],
    "reportRecipients": {
      "employee": "acct-employee-lin",
      "supervisor": "acct-supervisor",
      "department": "acct-department",
      "executive": "acct-boss"
    },
    "reportOrganizationSource": "wecom",
    "commercialDocuments": [],
    "items": [],
    "milestones": [],
    "acceptances": [],
    "createdAt": "2026-11-25T03:08:54.040Z",
    "scenario": "跨渠道汇报验收案例"
  }
};

/* A separate scenario keeps the signed-off walkthrough available. */
{
  const projectId = 'proj-team-daily-demo';
  const accountIds = ['acct-employee-lin', 'acct-employee-zhou'];
  const sampleRows = [
    { accountId: accountIds[0], author: '林晓', provider: 'wecom', service: '企业微信', form: '工作汇报', ref: 'QW-TEAM-01', title: '方案交接日报', text: '已整理客户确认的方案大纲和交付范围，下一步请产品确认需求边界。', createdAt: '2026-11-25T01:30:00Z' },
    { accountId: accountIds[1], author: '周宁', provider: 'feishu', service: '飞书', form: '日报表格', ref: 'FS-TEAM-01', title: '产品需求日报', text: '已拆分需求并标出验收标准。客户还未提供接口文档，请主管协调补齐；收到后再与开发确认排期。', createdAt: '2026-11-25T02:15:00Z' }
  ];
  const project = {
    ...structuredClone(window.projectOrganizationDemo.project),
    id: projectId,
    name: '多员工日报汇总演练（模拟）',
    goal: '让主管确认方案交接、需求边界和开发排期前的阻塞。',
    scope: '方案交接、产品需求、接口资料协调。',
    outcomes: '交付范围、验收标准和接口资料补齐记录。',
    successCriteria: '确认需求边界，补齐接口资料后再确认开发排期。',
    scenario: '员工日报归集、主管汇总、部门上报与领导决策',
    memberIds: [...window.projectOrganizationDemo.project.memberIds, accountIds[1]]
  };
  const office = sampleRows.map(row => ({
    ...row, native: true, projectId, providers: [row.provider], kind: 'daily',
    state: 'submitted', status: '已提交', tone: 'brd', date: '2026/11/25', updatedAt: row.createdAt
  }));
  const submissions = office.map(row => ({
    id: row.ref, role: 'employee', accountId: row.accountId, version: 'v1', at: row.createdAt,
    headline: row.text, originLabel: [row.author, row.service, row.form].join(' · '),
    sources: [{ key: [row.provider, row.kind, row.ref].join(':'), title: row.title, kind: row.kind,
      providers: row.providers, date: row.date, ref: row.ref }]
  }));
  window.projectTeamDailyDemo = {
    project, office,
    reports: {
      version: 1,
      scopeKey: 'tenant-weiran.' + projectId,
      periods: [{
        id: 'team-daily-period', label: '方案交接与需求确认 · 模拟日报',
        createdAt: office[0].createdAt, status: 'department_submitted', submissions,
        participantSnapshot: { ...project.reportRecipients },
        decisions: [], execution: null, verification: null, carryForward: null
      }]
    }
  };

  const period = window.projectTeamDailyDemo.reports.periods[0];
  period.submissions.push(
    { id: 'team-daily-supervisor', role: 'supervisor', accountId: 'acct-supervisor', version: 'v1',
      at: '2026-11-25T03:00:00Z', headline: '两名员工已完成方案交接和需求拆分，接口文档尚未收到。',
      judgement: '可先评审不依赖接口的需求；联调排期需等文档齐备。', sources: submissions.flatMap(row => row.sources) },
    { id: 'team-daily-department', role: 'department', accountId: 'acct-department', version: 'v1',
      originLabel: '汇总两名员工的日报', at: '2026-11-25T03:30:00Z',
      headline: '方案交接与产品需求拆分已完成。客户接口文档待补，影响开发联调排期。',
      judgement: '接口依赖尚未核实，暂无法确认联调日期。',
      suggestion: '请确认是否先评审无需接口的需求，并由项目负责人协调客户补齐接口文档。',
      next: '收到文档后，由产品和开发共同确认联调排期。', sources: submissions.flatMap(row => row.sources) }
  );

  const phases = [
    ['方案与报价确认', '2026-11-02', '2026-11-04', 'acct-employee-lin', '客户确认范围并收到报价'],
    ['合同签署', '2026-11-05', '2026-11-09', 'acct-boss', '双方签署合同与验收条款'],
    ['交付与项目分工确认', '2026-11-10', '2026-11-11', 'acct-supervisor', '内部确认交付负责人和分工'],
    ['产品方案评审', '2026-11-12', '2026-11-24', 'acct-employee-lin', '确认需求边界和验收标准'],
    ['开发完成并提测', '2026-11-25', '2026-12-04', 'acct-supervisor', '功能实现并完成接口联调'],
    ['测试通过及上线评审', '2026-12-07', '2026-12-10', 'acct-supervisor', '回归通过，确认上线与回退方案'],
    ['生产发布与运行验证', '2026-12-11', '2026-12-14', 'acct-department', '生产发布并验证关键功能'],
    ['客户验收和交付移交', '2026-12-15', '2026-12-18', 'acct-boss', '客户签认并移交资料及支持责任']
  ];
  const progress = { steps: structuredClone(window.projectAcceptanceDemo.progress.steps), history: [], stageMaterials: {} };
  progress.steps.forEach((step, index) => {
    const [, start, plan, owner, criteria] = phases[index];
    const done = index < 4;
    const blocked = index === 4;
    Object.assign(step, {
      owner, start, plan, baseline: { start, plan },
      status: done ? 'done' : blocked ? 'blocked' : 'waiting',
      completed: done ? plan : '', evidence: done ? criteria + ' · 模拟记录 DEMO-' + (index + 1) : '',
      reason: blocked ? '客户接口文档待补，联调排期需重新确认。' : '', forecast: blocked ? '2026-12-08' : ''
    });
    step.tasks.forEach((task, taskIndex) => {
      const requiresInterface = blocked && taskIndex === step.tasks.length - 1;
      Object.assign(task, { owner, start, plan, completed: done ? plan : '', forecast: requiresInterface ? step.forecast : '',
        status: done ? 'done' : requiresInterface ? 'blocked' : blocked ? 'active' : 'waiting',
        impact: requiresInterface ? step.reason : '' });
    });
  });
  const completedMaterials = [
    ['AURORA-PRESALE-01', { 'presale-summary': '客户确认看板与接口联调范围。', deck: '提案摘要：增长看板、联调范围、交付安排与书面验收。', quote: '报价确认记录：覆盖看板、接口联调和培训，计价明细以签署合同为准。', script: '沟通口径：客户补齐接口说明后，双方共同确认联调窗口。' }],
    ['DEMO-AURORA-20261109', { 'contract-check': '双方已签署合同，确认范围与书面验收条件。' }],
    ['AURORA-KICKOFF-01', { 'kickoff-plan': '启动会确认交付负责人、产品评审安排和验收责任。' }],
    ['AURORA-DESIGN-01', { design: '产品评审通过：看板范围与验收标准已确认，联调依赖客户接口文档。' }]
  ];
  completedMaterials.forEach(([ref, items], index) => {
    const [, , date, , label] = phases[index];
    progress.steps[index].evidence = label + ' · ' + ref;
    progress.stageMaterials[index] = {
      evidence: progress.steps[index].evidence, ref,
      items: Object.fromEntries(Object.entries(items).map(([key, text]) => [key, { text, approved: true, version: 1 }]))
    };
    progress.history.push({ at: date, actor: ['林晓', '蔚然', '陈宁', '林晓'][index], note: progress.steps[index].evidence });
  });
  progress.contractHandoff = { signedContract: 'DEMO-AURORA-20261109', scope: project.scope,
    acceptance: '书面确认上线验证记录、交付清单和支持责任', confirmedBy: 'acct-boss' };

  Object.assign(project, {
    name: '极光科技 · 八阶段项目全流程演练（模拟）',
    goal: '完成客户方案交接、产品实现、上线与书面验收。',
    scope: '包含客户增长看板、接口联调和交付培训；投放代运营另议。',
    startDate: phases[0][1], targetDate: phases[7][2], health: '有风险',
    successCriteria: progress.contractHandoff.acceptance,
    milestones: phases.map(([name, , dueDate, ownerAccountId, completionCriteria], index) => ({
      name, dueDate, ownerAccountId, completionCriteria, status: index < 4 ? '已完成' : '待完成',
      evidence: progress.steps[index].evidence
    })),
    items: [{ id: 'demo-interface-risk', type: 'risk', title: '客户接口文档待补', ownerAccountId: 'acct-supervisor',
      status: 'open', impact: '开发可并行推进；接口联调预计延后三个工作日，后续测试与上线待复核。' }],
    acceptances: [
      { title: '增长看板及上线验证记录', required: true, status: '待验收' },
      { title: '接口联调与回归测试报告', required: true, status: '待验收' },
      { title: '项目移交清单与培训记录', required: true, status: '待验收' }
    ]
  });
  progress.contractHandoff.scope = project.scope;
  const submittedAt = '2026-11-09T01:30:00Z';
  office.push({
    native: true, projectId, provider: 'wecom', providers: ['wecom'], kind: 'approval',
    ref: 'QW-AURORA-CONTRACT-01', title: '合同签署审批（模拟）',
    text: '已核对增长看板、接口联调、培训和书面验收范围，同意签署演示合同 DEMO-AURORA-20261109。',
    state: 'approved', status: '已通过', tone: 'ok', form: '审批',
    author: '蔚然', accountId: 'acct-boss', date: '2026/11/09', createdAt: submittedAt, updatedAt: submittedAt
  });
  window.projectTeamDailyDemo.progress = progress;
  window.projectTeamDailyDemo.materials = [
    ['售前方案与报价确认记录', 'AURORA-PRESALE-01', '2026-11-04'],
    ['签署合同与验收条款', 'DEMO-AURORA-20261109', '2026-11-09'],
    ['启动会纪要与分工清单', 'AURORA-KICKOFF-01', '2026-11-11'],
    ['需求说明与产品评审记录', 'AURORA-DESIGN-01', '2026-11-24']
  ].map(([title, sourceId, updatedAt]) => ({
    id: projectId + '-' + sourceId, tenantId: project.tenantId, projectId, sourceType: 'document',
    sourceId, title: title + '（模拟）', updatedAt, status: 'ready', visibility: 'project',
    ownerAccountId: 'acct-boss', selectedMemberIds: []
  }));

}
