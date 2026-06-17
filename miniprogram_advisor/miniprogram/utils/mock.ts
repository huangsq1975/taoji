export interface Customer {
  id: string
  name: string
  owner: string
  advisor: string
  industry: string
  years: string
  edu: string
  staff: string
  stage: string
  complete: number
  revenue: string
  tax: string
  office: string
  phone: string
  bankId: string
  productId: string
  risk: string
  block: string
  next: string
  qual: string[]
  credit: string
}

export interface Bank {
  id: string
  name: string
}

export interface Product {
  id: string
  bankId: string
  name: string
  type: string
  amount: string
  rate: string
  term: string
  access: string
}

export interface MaterialGroup {
  label: string
  items: MaterialItem[]
}

export interface MaterialItem {
  name: string
  required: string
  source: string
  desc: string
  note: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  time: string
}

export interface HistoryItem {
  id: string
  title: string
  preview: string
  time: string
}

export interface NotifyItem {
  id: string
  title: string
  body: string
  time: string
  dotColor: 'blue' | 'green' | 'orange'
}

export const mockCustomers: Customer[] = [
  {
    id: 'c1',
    name: '东莞某智能设备有限公司',
    owner: '黄先生',
    advisor: '陈顾问',
    industry: '智能设备制造',
    years: '6年',
    edu: '本科',
    staff: '68人',
    stage: '顾问复核',
    complete: 86,
    revenue: '近12个月收入约6200万',
    tax: '纳税等级A，近12个月纳税约96万',
    office: '东莞松山湖自有厂房约1800㎡',
    phone: '138****2639',
    bankId: 'b1',
    productId: 'p1',
    risk: '低',
    block: 'AI填表完成，4项待顾问确认',
    next: '逐字段复核AI填写结果，确认科技资质和月营业收入口径',
    qual: ['国高', '专精特新', '科小'],
    credit: '企业征信无重大不良，近半年查询4次',
  },
  {
    id: 'c2',
    name: '深圳某餐饮管理有限公司',
    owner: '陈总',
    advisor: '张顾问',
    industry: '餐饮连锁',
    years: '4年',
    edu: '大专',
    staff: '32人',
    stage: '资料收集',
    complete: 58,
    revenue: '近12个月流水约980万',
    tax: '小规模转一般纳税人，税务记录连续但金额偏低',
    office: '深圳南山租赁门店3家',
    phone: '136****8891',
    bankId: 'b3',
    productId: 'p3',
    risk: '中',
    block: '缺近6个月经营流水',
    next: '生成补件清单发给客户',
    qual: ['普通经营户'],
    credit: '法人征信有2次短期逾期，已结清',
  },
  {
    id: 'c3',
    name: '广州某供应链服务有限公司',
    owner: '李总',
    advisor: '李顾问',
    industry: '供应链服务',
    years: '5年',
    edu: '本科',
    staff: '41人',
    stage: '银行对接',
    complete: 92,
    revenue: '近12个月收入约4380万',
    tax: '纳税等级B，开票连续',
    office: '广州天河写字楼租赁办公',
    phone: '139****5220',
    bankId: 'b2',
    productId: 'p2',
    risk: '低',
    block: '等待银行客户经理反馈',
    next: '记录银行沟通结果和下户安排',
    qual: ['科小'],
    credit: '企业征信正常，无当前逾期',
  },
  {
    id: 'c4',
    name: '佛山某五金制造厂',
    owner: '王总',
    advisor: '周顾问',
    industry: '五金制造',
    years: '8年',
    edu: '高中',
    staff: '56人',
    stage: '下户',
    complete: 74,
    revenue: '近12个月收入约3100万',
    tax: '纳税等级B，近12个月纳税约58万',
    office: '佛山顺德生产场地约2600㎡',
    phone: '137****1098',
    bankId: 'b4',
    productId: 'p4',
    risk: '中',
    block: '需确认经营场地接待人',
    next: '预约银行下户时间',
    qual: ['专精特新'],
    credit: '企业征信正常，法人负债偏高',
  },
]

export const mockBanks: Bank[] = [
  { id: 'b1', name: '建设银行' },
  { id: 'b2', name: '广发银行' },
  { id: 'b3', name: '微众银行' },
  { id: 'b4', name: '平安银行' },
]

export const mockProducts: Product[] = [
  { id: 'p1', bankId: 'b1', name: '建行善科贷', type: '科创贷', amount: '50-1000万', rate: '3.05%-4.20%', term: '12-36个月', access: '高新/专精特新，经营满2年，纳税和流水稳定' },
  { id: 'p1b', bankId: 'b1', name: '建行云税贷', type: '税贷', amount: '30-300万', rate: '3.20%-4.80%', term: '6-24个月', access: '纳税连续，近12个月开票稳定，征信无重大异常' },
  { id: 'p1c', bankId: 'b1', name: '建行经营快贷', type: '信用经营贷', amount: '20-500万', rate: '3.60%-5.60%', term: '6-36个月', access: '经营流水稳定，成立满2年，经营场地可核验' },
  { id: 'p2', bankId: 'b2', name: '企业税票贷', type: '税贷', amount: '30-500万', rate: '3.30%-5.20%', term: '6-24个月', access: '成立满2年，近12个月开票连续，纳税等级B以上' },
  { id: 'p3', bankId: 'b3', name: '微业流水贷', type: '流水贷', amount: '10-200万', rate: '4.80%-8.50%', term: '6-18个月', access: '经营流水连续12个月，收款账户稳定' },
  { id: 'p4', bankId: 'b4', name: '房抵经营贷', type: '抵押贷', amount: '100-1500万', rate: '3.20%-5.10%', term: '12-60个月', access: '抵押物权属清晰，资金用途为经营周转' },
]

export const mockMaterialGroups: Record<string, MaterialGroup[]> = {
  p1: [
    {
      label: '基础主体资料',
      items: [
        { name: '营业执照', required: '必填', source: '客户上传/C端', desc: '彩色扫描件，名称与工商报告一致', note: '核对统一社会信用代码和经营范围' },
        { name: '法人/实控人信息', required: '必填', source: '顾问录入', desc: '身份证明、联系方式、持股或控制关系', note: '确认实控人与签署人一致' },
      ],
    },
    {
      label: '征信授权资料',
      items: [
        { name: '企业征信授权', required: '必填', source: '银行制式授权', desc: '签字盖章版，日期按银行口径填写', note: '授权主体需与申请企业一致' },
        { name: '法人征信授权', required: '必填', source: '银行制式授权', desc: '法人签字，身份证正反面清晰', note: '关注查询次数和当前逾期' },
      ],
    },
    {
      label: '经营财务资料',
      items: [
        { name: '近12个月流水', required: '必填', source: '客户上传/顾问上传', desc: '银行流水或电子流水明细', note: '剔除内部转账和临时过桥款' },
        { name: '纳税记录', required: '必填', source: '税务截图/授权导出', desc: '近12个月纳税记录连续', note: '关注所属期是否断档' },
        { name: '科技资质证明', required: '必填', source: '客户上传', desc: '国高/科小/专精特新证书或公示截图', note: '核对有效期和企业名称' },
      ],
    },
    {
      label: '银行制式表格',
      items: [
        { name: '善科贷企业信息采集表', required: '必填', source: '银行制式表格', desc: '按产品字段填写，不确定项标记待复核', note: '由顾问复核后提交' },
      ],
    },
  ],
  p2: [
    {
      label: '基础主体资料',
      items: [
        { name: '营业执照', required: '必填', source: '客户上传', desc: '彩色扫描件', note: '主体与开票数据一致' },
        { name: '法人/实控人信息', required: '必填', source: '顾问录入', desc: '身份证明和联系方式', note: '确认签字人' },
      ],
    },
    {
      label: '经营财务资料',
      items: [
        { name: '开票数据', required: '必填', source: '税控导出/系统识别', desc: '近12个月连续开票', note: '关注作废和冲红' },
        { name: '对公流水', required: '必填', source: '客户上传', desc: '近12个月对公流水', note: '与开票客户匹配' },
      ],
    },
    {
      label: '银行制式表格',
      items: [
        { name: '税票贷信息表', required: '必填', source: '银行制式表格', desc: '开票、纳税、对公流水字段一致', note: '顾问复核后提交' },
      ],
    },
  ],
  p3: [
    {
      label: '基础主体资料',
      items: [
        { name: '营业执照', required: '必填', source: '客户上传', desc: '清晰扫描件', note: '经营主体需真实存续' },
        { name: '经营场地材料', required: '必填', source: '客户上传', desc: '门店照片或租赁合同', note: '确认经营连续性' },
      ],
    },
    {
      label: '经营财务资料',
      items: [
        { name: '收款流水', required: '必填', source: '客户上传', desc: '近12个月收款流水', note: '重点识别经营收款' },
        { name: '经营照片', required: '必填', source: '客户上传', desc: '门头、收银、库存或设备照片', note: '照片需清晰' },
      ],
    },
    {
      label: '银行制式表格',
      items: [
        { name: '商户流水核验表', required: '必填', source: '银行制式表格', desc: '流水账户、月均收款、经营场景', note: '顾问核对后提交' },
      ],
    },
  ],
  p4: [
    {
      label: '基础主体资料',
      items: [
        { name: '营业执照', required: '必填', source: '客户上传', desc: '清晰扫描件', note: '借款主体需与经营主体一致' },
        { name: '法人/实控人信息', required: '必填', source: '顾问录入', desc: '身份、联系方式、共有人信息', note: '确认签署主体' },
      ],
    },
    {
      label: '用途与增信资料',
      items: [
        { name: '房产材料', required: '必填', source: '客户上传', desc: '产权证、不动产查询、评估资料', note: '核验查封、抵押和共有人' },
        { name: '用途合同', required: '必填', source: '客户上传', desc: '采购、装修或经营合同', note: '用途需明确' },
      ],
    },
    {
      label: '银行制式表格',
      items: [
        { name: '房抵经营贷申请表', required: '必填', source: '银行制式表格', desc: '抵押物、用途、经营收入字段需复核', note: '顾问确认后提交' },
      ],
    },
  ],
}

export const MISSING_DOCS: Record<string, string[]> = {
  c1: ['银行材料补充表', '企业征信授权原件复核'],
  c2: ['近6个月经营流水', '资金用途说明', '法人征信授权'],
  c3: ['等待银行客户经理回复'],
  c4: ['经营场地接待人确认', '设备清单', '产权材料'],
}

export const UPLOADED_DOCS: Record<string, string[]> = {
  c1: ['营业执照', '法人身份证', '企业基础信息', '经营场地照片', '企业征信摘要', '近12个月流水', '开票/纳税记录', '用途合同', '资质证明'],
  c2: ['营业执照', '法人身份证', '企业基础信息', '经营场地照片'],
  c3: ['营业执照', '法人身份证', '企业基础信息', '经营场地照片', '企业征信摘要', '近12个月流水', '开票/纳税记录', '对公流水', '用途合同'],
  c4: ['营业执照', '法人身份证', '企业基础信息', '经营场地照片', '企业征信摘要', '近12个月流水'],
}

export const mockHistory: HistoryItem[] = [
  { id: 'h1', title: '东莞某智能设备 · 银行材料整理', preview: '已按建设银行善科贷要求整理材料匹配报告，4项待顾问确认。', time: '2026-06-14 16:20' },
  { id: 'h2', title: '深圳某餐饮管理 · 资料缺口识别', preview: 'AI识别出近6个月经营流水缺失，建议优先补充流水和用途说明。', time: '2026-06-13 11:05' },
  { id: 'h3', title: '佛山某五金制造 · 沟通话术', preview: '已生成催收资料话术和银行沟通话术，顾问复核后可直接使用。', time: '2026-06-12 09:30' },
]

export const mockNotifications: NotifyItem[] = [
  { id: 'n1', title: '东莞某智能设备 · AI填表完成', body: '善科贷制式表格18/22字段已填写，4项待您确认。', time: '1小时前', dotColor: 'blue' },
  { id: 'n2', title: '深圳某餐饮管理 · 客户补充了流水', body: '客户通过微信上传了近6个月经营流水，请查看并确认。', time: '今天 10:30', dotColor: 'green' },
  { id: 'n3', title: '佛山某五金制造 · 现场核验提醒', body: '明天14:00需到现场核验，请确认接待人和材料准备。', time: '昨天 16:45', dotColor: 'orange' },
]

export const quickPills: string[] = [
  '查看今日待办',
  '整理银行材料包',
  '识别客户资料缺口',
  '优化银行沟通话术',
]

export function getAdvisorAiReply(text: string, customerName: string): string {
  if (text.includes('待办') || text.includes('今日')) {
    return '今日待办：\n\n1. 东莞某智能设备 — AI填表完成，4项待顾问确认（科技资质、月营业收入口径）\n2. 深圳某餐饮管理 — 资料缺口影响银行材料准备，建议先确认客户流水\n3. 佛山某五金制造 — 现场核验接待人待确认，设备清单和产权材料缺失\n\n可进入客户列表查看详情。'
  }
  if (text.includes('银行材料') || text.includes('材料包')) {
    if (customerName) {
      return customerName + ' 的银行材料建议：\n\n进入「银行材料整理」可查看目标银行的资料匹配结果，选择客户和银行后可触发AI填表。'
    }
    return '请先在上方选择客户，我再按该客户资料整理银行材料建议。'
  }
  if (text.includes('资料缺口') || text.includes('识别')) {
    if (customerName) {
      return customerName + ' 的资料缺口分析将在识别完成后显示。可进入客户详情查看已上传资料和缺口列表。'
    }
    return '请先在上方选择客户，我再为该客户识别资料缺口。'
  }
  if (text.includes('话术') || text.includes('沟通')) {
    return '针对当前场景的沟通建议：\n\n【催收资料话术】\n"X总您好，您的材料已进入银行资料整理阶段。目前还缺少近6个月经营流水和资金用途说明，这两项会影响材料包完整度。您方便今天内拍照或从微信发给我吗？"\n\n【银行沟通话术】\n"X经理您好，关于XX公司的材料包，基础资料已完成归类，还有1项征信授权在跟进中，预计明天补齐后提交完整材料包。"'
  }
  if (text.includes('复核') || text.includes('填表')) {
    return '当前待复核项：\n\n1. 东莞某智能设备 · 建行善科贷 — AI填写18/22字段，4项需要顾问确认\n2. 佛山某五金制造 · 平安房抵贷 — AI填写完成，2项异常标记\n\n进入「银行材料整理」可以逐字段复核。'
  }
  return '已收到。请补充更多信息（客户名称、银行产品、具体资料问题等），我会给出针对性的作业建议。\n\n也可以从左侧菜单快速进入客户列表或银行材料整理。'
}
