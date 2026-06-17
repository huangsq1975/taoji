export interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  time: string
}

export interface ProgressStep {
  label: string
  status: 'done' | 'current' | 'pending'
  time: string
  desc: string
}

export interface PendingDoc {
  name: string
  desc: string
  status: 'missing' | 'recorded'
}

export interface AuthItem {
  name: string
  desc: string
  status: 'authorized' | 'pending' | 'not_applied'
  statusLabel: string
  target: string
  time: string
}

export interface NotifyItem {
  id: string
  title: string
  body: string
  time: string
  dotColor: 'blue' | 'green' | 'orange'
  read: boolean
}

export interface HistoryItem {
  id: string
  title: string
  preview: string
  time: string
}

export const mockUser = {
  name: '陈总',
  phone: '136****8891',
  isLoggedIn: true,
  storage: '已用 128M / 500M',
  advisor: '张顾问',
  currentStage: '银行材料整理中，2项待补',
  latestProgress: '征信授权文件待补充',
}

export const quickPills: string[] = [
  '帮我分析企业流水',
  '查企业征信',
  '评估我的信用资质',
  '推荐适合的融资方案',
  '查看资料提交进度',
]

export const mockProgressSteps: ProgressStep[] = [
  { label: '资料收集', status: 'done', time: '2026-06-08 已完成', desc: '' },
  { label: 'AI资料分析', status: 'done', time: '2026-06-09 已完成', desc: '' },
  { label: '银行材料整理', status: 'current', time: '进行中', desc: '顾问正在整理材料包' },
  { label: '顾问复核', status: 'pending', time: '待开始', desc: '' },
  { label: '提交银行', status: 'pending', time: '待开始', desc: '' },
]

export const mockPendingDocs: PendingDoc[] = [
  { name: '上传征信授权书', desc: '需签字件或清晰照片', status: 'missing' },
  { name: '补充近6个月经营流水', desc: '优先提供电子流水明细或盖章版', status: 'missing' },
  { name: '确认资金用途说明', desc: '门店扩张用途已记录，待顾问复核', status: 'recorded' },
]

export const mockAuthItems: AuthItem[] = [
  {
    name: '企业资料授权',
    desc: '营业执照、经营流水、企业基础信息',
    status: 'authorized',
    statusLabel: '已授权',
    target: '张顾问（韬纪元AI合作顾问）',
    time: '2026-06-11 15:40',
  },
  {
    name: '征信查询授权',
    desc: '企业征信报告、法人个人征信查询',
    status: 'pending',
    statusLabel: '待补充',
    target: '需上传签字授权书',
    time: '',
  },
  {
    name: '税务数据授权',
    desc: '电子税务局数据接入、开票明细',
    status: 'not_applied',
    statusLabel: '未申请',
    target: '如需AI分析税票数据需单独授权',
    time: '',
  },
  {
    name: '数据使用协议',
    desc: '个人及企业信息用于融资资料整理',
    status: 'authorized',
    statusLabel: '已同意',
    target: '韬纪元AI平台',
    time: '2026-06-08 10:23',
  },
]

export const mockNotifications: NotifyItem[] = [
  {
    id: 'n1',
    title: '您的企业流水已通过AI初步分析',
    body: '系统已自动提取月均收入、进账趋势等字段，顾问将进一步复核。',
    time: '2小时前',
    dotColor: 'blue',
    read: false,
  },
  {
    id: 'n2',
    title: '顾问张顾问已查看您的资料',
    body: '您提交的营业执照和经营信息已被顾问确认，下一步将整理银行材料。',
    time: '昨天 16:20',
    dotColor: 'green',
    read: false,
  },
  {
    id: 'n3',
    title: '请补充征信授权文件',
    body: '银行材料整理需要征信授权书签字件，请尽快上传。',
    time: '昨天 10:05',
    dotColor: 'orange',
    read: true,
  },
  {
    id: 'n4',
    title: '融资方向参考已生成',
    body: '根据您提供的经营数据，AI已生成可尝试的融资方向参考，请查看。',
    time: '2天前',
    dotColor: 'blue',
    read: true,
  },
  {
    id: 'n5',
    title: '资料收集阶段已完成',
    body: '您的基础资料已收集完毕，进入AI分析和银行材料整理阶段。',
    time: '2026-06-09',
    dotColor: 'green',
    read: true,
  },
]

export const mockHistory: HistoryItem[] = [
  {
    id: 'h1',
    title: '企业流水分析',
    preview: 'AI已完成近6个月流水趋势分析，并提示顾问复核异常大额进账。',
    time: '2026-06-11 14:32',
  },
  {
    id: 'h2',
    title: '融资方向咨询',
    preview: '根据经营数据建议先从流水贷和税票贷方向准备资料。',
    time: '2026-06-10 09:15',
  },
  {
    id: 'h3',
    title: '资料提交进度查询',
    preview: '当前资料收集阶段已完成，进入AI资料分析与银行材料整理阶段。',
    time: '2026-06-08 16:48',
  },
]

export function getAiReply(text: string): string {
  if (text.includes('流水')) {
    return '请上传近6-12个月企业经营流水，我会帮您分析进账稳定性、月均收入趋势和异常交易，并整理报告所需字段。\n\n点击输入框旁的 ⊕ 按钮上传文件，支持从手机本地或微信聊天记录中选取。'
  }
  if (text.includes('征信') || text.includes('信用查询')) {
    return '企业征信查询需要以下准备：\n\n【查询所需材料】\n• 企业征信授权书（需法人签字+公章）\n• 营业执照复印件\n• 法人身份证复印件\n\n【注意事项】\n• 征信查询会留下查询记录，建议不要频繁查询\n• 授权书需按银行制式模板填写，顾问会提供模板\n• 查询结果将同步给您的专属顾问用于材料整理\n\n请先上传企业征信授权书，或联系您的顾问获取授权模板。'
  }
  if (text.includes('信用') || text.includes('资质')) {
    return '请补充企业/法人征信授权或征信报告截图，我会提取查询次数、逾期摘要、负债压力等关键指标，并提示顾问复核。'
  }
  if (text.includes('融资') || text.includes('产品') || text.includes('推荐') || text.includes('方案')) {
    return '我会根据您提供的经营数据，给出可尝试的融资方向参考（如流水贷、税票贷、抵押经营贷等），不限定具体银行产品，最终由顾问结合真实资料复核。\n\n请先告诉我：企业经营多久了？需要多少资金？用途是什么？'
  }
  if (text.includes('进度')) {
    return '当前资料会同步给您的专属顾问，顾问确认后进入AI识别、报告草稿和银行材料整理流程。\n\n可在底部菜单进入「进度」查看详细进度。'
  }
  if (text.includes('财报') || text.includes('财务')) {
    return '请上传财务报表或收入成本数据，我会整理经营趋势、收入结构、利润变动和银行报告所需摘要。'
  }
  return '我已记录您的需求。请补充更多信息（企业情况、资金需求、已有资料等），我会围绕资料分析、融资方向和报告材料继续帮您梳理。'
}
