export interface Customer {
  id: string
  name: string
  industry: string
  years: number
  owner: string
  phone: string
  stage: '资料收集' | '顾问复核' | '银行对接' | '下户'
  amount: string
  complete: number
  risk: '低' | '中' | '高'
  block: string
  next: string
  advisor: string
  last: string
  bank: string
  product: string
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  qual: string[]
  profileScore: number
}

export interface Bank {
  id: string
  name: string
  products: Product[]
  templates: number
  updated: string
}

export interface Product {
  id: string
  bankId: string
  bankName: string
  name: string
  type: string
  amount: string
  term: string
  materials: MaterialItem[]
}

export interface MaterialItem {
  name: string
  required: boolean
  source: string
  format: string
  note: string
}

export interface FillTask {
  id: string
  customerId: string
  customerName: string
  industry: string
  complete: number
  bankName: string
  product: string
  filledFields: number
  totalFields: number
  status: '待AI填写' | '待处理' | '可导出' | '已导出'
  reviewer: string
  time: string
}

export interface ParseFile {
  id: string
  filename: string
  uploader: string
  customer: string
  aiType: string
  confidence: number
  status: '已确认' | '待确认' | '识别失败'
  time: string
}

export interface OrgAccount {
  id: string
  name: string
  role: '顾问' | '主管' | '运营管理员'
  scope: '仅本人客户' | '本团队客户' | '全部客户'
  status: '启用' | '停用'
  last: string
  perms: string[]
}

export interface UsageLog {
  id: string
  time: string
  type: '报告生成' | '材料整理' | 'API调用'
  target: string
  user: string
  cost: number
  status: '待处理' | '已导出' | '调用成功'
}

export interface Notification {
  id: string
  level: 'info' | 'warn' | 'error'
  message: string
  time: string
}
