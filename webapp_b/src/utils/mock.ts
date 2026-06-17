import type { Customer, Bank, FillTask, ParseFile, OrgAccount, UsageLog } from '../types'

export const mockCustomers: Customer[] = [
  {
    id: 'c001', name: '苏州盛晨科技有限公司', industry: '科技制造', years: 8,
    owner: '陈建明', phone: '136****8891', stage: '银行对接', amount: '300万',
    complete: 82, risk: '低', block: '流水月均未达标，需补充12个月对公流水',
    next: '联系客户补充近12个月对公流水', advisor: '张顾问', last: '2小时前',
    bank: '浦发银行', product: '科创贷', priority: 'P0',
    qual: ['国高', '科小', '专精特新'], profileScore: 78
  },
  {
    id: 'c002', name: '南京鸿达贸易有限公司', industry: '批发零售', years: 5,
    owner: '王国华', phone: '139****2234', stage: '顾问复核', amount: '150万',
    complete: 65, risk: '中', block: '法人征信有查询次数偏多',
    next: '等待法人出具查询说明', advisor: '李顾问', last: '1天前',
    bank: '招商银行', product: '生意贷', priority: 'P1',
    qual: ['小微企业'], profileScore: 61
  },
  {
    id: 'c003', name: '杭州云帆网络科技有限公司', industry: '互联网', years: 3,
    owner: '刘晓峰', phone: '137****5567', stage: '资料收集', amount: '500万',
    complete: 45, risk: '中', block: '成立年限不足，缺纳税证明和财务报表',
    next: '收集近3年纳税记录', advisor: '张顾问', last: '3天前',
    bank: '浦发银行', product: '数字贷', priority: 'P1',
    qual: ['科小'], profileScore: 52
  },
  {
    id: 'c004', name: '无锡华荣建材有限公司', industry: '建筑材料', years: 12,
    owner: '赵强', phone: '135****9900', stage: '下户', amount: '800万',
    complete: 95, risk: '低', block: '无',
    next: '等待银行下户审核结果', advisor: '王顾问', last: '5小时前',
    bank: '工商银行', product: '经营快贷', priority: 'P0',
    qual: ['专精特新', '规上企业'], profileScore: 91
  },
]

export const mockBanks: Bank[] = [
  {
    id: 'b001', name: '浦发银行', templates: 8, updated: '2026-06-10',
    products: [
      {
        id: 'p001', bankId: 'b001', bankName: '浦发银行',
        name: '科创贷', type: '信用贷', amount: '500万以内', term: '1-3年',
        materials: [
          { name: '营业执照', required: true, source: '客户上传', format: 'PDF/图片', note: '需在有效期内' },
          { name: '法人身份证', required: true, source: '客户上传', format: 'PDF/图片', note: '正反两面' },
          { name: '近12个月对公流水', required: true, source: '客户上传', format: 'PDF', note: '月均不低于20万' },
          { name: '近2年纳税证明', required: true, source: '电子税务局', format: 'PDF', note: '完税证明或纳税申报表' },
          { name: '高新技术企业证书', required: false, source: '客户上传', format: 'PDF/图片', note: '有效期内，加分项' },
        ]
      },
      {
        id: 'p002', bankId: 'b001', bankName: '浦发银行',
        name: '数字贷', type: '信用贷', amount: '200万以内', term: '1年',
        materials: [
          { name: '营业执照', required: true, source: '客户上传', format: 'PDF/图片', note: '' },
          { name: '法人身份证', required: true, source: '客户上传', format: 'PDF/图片', note: '' },
          { name: '近6个月对公流水', required: true, source: '客户上传', format: 'PDF', note: '' },
        ]
      }
    ]
  },
  {
    id: 'b002', name: '招商银行', templates: 6, updated: '2026-06-05',
    products: [
      {
        id: 'p003', bankId: 'b002', bankName: '招商银行',
        name: '生意贷', type: '抵押+信用', amount: '1000万以内', term: '1-5年',
        materials: [
          { name: '营业执照', required: true, source: '客户上传', format: 'PDF/图片', note: '' },
          { name: '法人及配偶身份证', required: true, source: '客户上传', format: 'PDF/图片', note: '需配偶签字授权' },
          { name: '近24个月对公流水', required: true, source: '客户上传', format: 'PDF', note: '月均不低于50万' },
          { name: '房产证或抵押物证明', required: false, source: '客户上传', format: 'PDF/图片', note: '提供抵押物可提升额度' },
        ]
      }
    ]
  },
  {
    id: 'b003', name: '工商银行', templates: 10, updated: '2026-06-12',
    products: [
      {
        id: 'p004', bankId: 'b003', bankName: '工商银行',
        name: '经营快贷', type: '信用贷', amount: '300万以内', term: '1年',
        materials: [
          { name: '营业执照', required: true, source: '客户上传', format: 'PDF/图片', note: '' },
          { name: '法人身份证', required: true, source: '客户上传', format: 'PDF/图片', note: '' },
          { name: '近12个月银行流水', required: true, source: '客户上传', format: 'PDF', note: '工商银行账户优先' },
          { name: '近2年财务报表', required: true, source: '客户上传', format: 'PDF/Excel', note: '需会计师事务所盖章' },
        ]
      }
    ]
  },
]

export const mockFillTasks: FillTask[] = [
  { id: 't001', customerId: 'c001', customerName: '苏州盛晨科技有限公司', industry: '科技制造', complete: 82, bankName: '浦发银行', product: '科创贷', filledFields: 28, totalFields: 35, status: '待处理', reviewer: '张顾问', time: '2026-06-17 10:30' },
  { id: 't002', customerId: 'c004', customerName: '无锡华荣建材有限公司', industry: '建筑材料', complete: 95, bankName: '工商银行', product: '经营快贷', filledFields: 32, totalFields: 32, status: '可导出', reviewer: '王顾问', time: '2026-06-17 09:15' },
  { id: 't003', customerId: 'c002', customerName: '南京鸿达贸易有限公司', industry: '批发零售', complete: 65, bankName: '招商银行', product: '生意贷', filledFields: 0, totalFields: 28, status: '待AI填写', reviewer: '李顾问', time: '2026-06-17 14:00' },
  { id: 't004', customerId: 'c003', customerName: '杭州云帆网络科技有限公司', industry: '互联网', complete: 45, bankName: '浦发银行', product: '数字贷', filledFields: 10, totalFields: 22, status: '待AI填写', reviewer: '张顾问', time: '2026-06-16 16:20' },
]

export const mockParseFiles: ParseFile[] = [
  { id: 'f001', filename: '营业执照_苏州盛晨科技.pdf', uploader: '陈建明（客户）', customer: '苏州盛晨科技有限公司', aiType: '营业执照', confidence: 97, status: '已确认', time: '06-17 10:22' },
  { id: 'f002', filename: '法人身份证_正面.jpg', uploader: '陈建明（客户）', customer: '苏州盛晨科技有限公司', aiType: '身份证（正面）', confidence: 94, status: '已确认', time: '06-17 10:23' },
  { id: 'f003', filename: '流水明细_20260101-20260601.pdf', uploader: '王国华（客户）', customer: '南京鸿达贸易有限公司', aiType: '银行流水', confidence: 88, status: '待确认', time: '06-17 11:05' },
  { id: 'f004', filename: '扫描文件_001.jpg', uploader: '刘晓峰（客户）', customer: '杭州云帆网络科技有限公司', aiType: '未知', confidence: 23, status: '识别失败', time: '06-17 13:30' },
  { id: 'f005', filename: '纳税证明2025.pdf', uploader: '张顾问', customer: '苏州盛晨科技有限公司', aiType: '纳税证明', confidence: 91, status: '待确认', time: '06-17 14:10' },
]

export const mockAccounts: OrgAccount[] = [
  { id: 'a001', name: '张顾问', role: '主管', scope: '全部客户', status: '启用', last: '2小时前', perms: ['查看客户', '编辑跟进', 'AI资料解析', '生成补件清单', '维护银行材料要求', '复核材料包', '会员套餐管理', '账号启停', '权限配置'] },
  { id: 'a002', name: '李顾问', role: '顾问', scope: '仅本人客户', status: '启用', last: '1天前', perms: ['查看客户', '编辑跟进', 'AI资料解析', '生成补件清单'] },
  { id: 'a003', name: '王顾问', role: '顾问', scope: '本团队客户', status: '启用', last: '3小时前', perms: ['查看客户', '编辑跟进', 'AI资料解析', '生成补件清单', '复核材料包'] },
  { id: 'a004', name: '赵运营', role: '运营管理员', scope: '全部客户', status: '停用', last: '2周前', perms: ['查看客户', '会员套餐管理', '调用记录查看'] },
]

export const mockUsageLogs: UsageLog[] = [
  { id: 'u001', time: '06-17 10:35', type: '报告生成', target: '苏州盛晨科技·浦发科创贷', user: '张顾问', cost: 3, status: '待处理' },
  { id: 'u002', time: '06-17 09:20', type: '报告生成', target: '无锡华荣建材·工行经营快贷', user: '王顾问', cost: 3, status: '已导出' },
  { id: 'u003', time: '06-17 08:50', type: '材料整理', target: '南京鸿达贸易·招行生意贷', user: '李顾问', cost: 1, status: '已导出' },
  { id: 'u004', time: '06-16 16:30', type: 'API调用', target: 'POST /mock/forms/fill', user: 'API', cost: 4, status: '调用成功' },
  { id: 'u005', time: '06-16 15:10', type: '报告生成', target: '杭州云帆网络·浦发数字贷', user: '张顾问', cost: 2, status: '待处理' },
]
