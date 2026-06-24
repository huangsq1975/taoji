const API_BASE = 'http://localhost:3000/api/v1'
const app = getApp<IAppOption>()

interface ApiCustomer {
  id: number
  name: string
  status: string
  docCompleteness: number
}

interface ApiMembership {
  planName: string
  reportQuota: number
  reportUsed: number
  packageQuota: number
  packageUsed: number
}

interface ApiReportTask {
  id: number
  customer_name: string
  product_name: string
  bank_short_name: string
  status: string
  updated_at: string
}

interface DashboardStats {
  docGapCount: number
  taskTotal: number
  aiPending: number
  reportQuota: number
  reportUsed: number
  recentTasks: ApiReportTask[]
}

const ROLE_LABELS: Record<string, string> = {
  advisor: '助贷顾问',
  supervisor: '主管',
  admin: '管理员',
}

const TASK_STATUS_LABELS: Record<string, string> = {
  pending: '等待填表',
  ai_filling: 'AI填表中',
  ai_done: '填表完成',
  reviewing: '复核中',
  review_done: '复核完成',
  exporting: '导出中',
  exported: '已导出',
  submitted: '已提交',
}

function formatTime(isoStr: string): string {
  return isoStr.replace('T', ' ').slice(5, 16)
}

interface ActivityItem {
  id: number
  title: string
  body: string
  statusLabel: string
  statusClass: string
  time: string
}

function taskToActivity(t: ApiReportTask): ActivityItem {
  const statusLabel = TASK_STATUS_LABELS[t.status] ?? t.status
  const statusClass = t.status === 'submitted' || t.status === 'exported'
    ? 'status-done'
    : t.status === 'reviewing' || t.status === 'review_done'
      ? 'status-review'
      : 'status-active'
  return {
    id: t.id,
    title: `${t.customer_name} · ${t.bank_short_name}`,
    body: t.product_name,
    statusLabel,
    statusClass,
    time: formatTime(t.updated_at),
  }
}

Page({
  data: {
    advisor: { name: '', roleLabel: '', institution: '' },
    // Clients
    totalClients: 0,
    pendingClients: 0,
    reviewClients: 0,
    // Quota
    planName: '',
    quotaRemainingLabel: '-',
    quotaFill: 0,
    quotaExport: 0,
    // Activity
    recentActivity: [] as ActivityItem[],
    loadingActivity: true,
  },

  onLoad() {
    const info = app.globalData.advisorInfo
    if (info) {
      this.setData({
        advisor: {
          name: info.name,
          roleLabel: ROLE_LABELS[info.role] ?? info.role,
          institution: info.institutionName,
        },
      })
    }
    this.loadClients()
    this.loadMembership()
    this.loadDashboard()
  },

  loadClients() {
    const token = app.globalData.token ?? (wx.getStorageSync('token') as string)
    wx.request({
      url: `${API_BASE}/customers?pageSize=100`,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as { data?: { items?: ApiCustomer[]; total?: number } }
        const items = payload.data?.items ?? []
        const total = payload.data?.total ?? items.length
        const pending = items.filter(c => (c.docCompleteness ?? 0) < 80).length
        const reviewing = items.filter(c => c.status === 'REVIEWING' || c.status === 'REPORTING').length
        this.setData({ totalClients: total, pendingClients: pending, reviewClients: reviewing })
      },
    })
  },

  loadMembership() {
    const token = app.globalData.token ?? (wx.getStorageSync('token') as string)
    wx.request({
      url: `${API_BASE}/settings/membership`,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as { data?: ApiMembership }
        const m = payload.data
        if (!m) return
        const remaining = m.reportQuota === -1
          ? '不限'
          : String(m.reportQuota - m.reportUsed)
        this.setData({
          planName: m.planName,
          quotaRemainingLabel: remaining,
          quotaFill: m.reportUsed,
          quotaExport: m.packageUsed,
        })
      },
    })
  },

  loadDashboard() {
    const token = app.globalData.token ?? (wx.getStorageSync('token') as string)
    wx.request({
      url: `${API_BASE}/dashboard/stats`,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as { data?: DashboardStats }
        const stats = payload.data
        const activity = (stats?.recentTasks ?? []).slice(0, 5).map(taskToActivity)
        this.setData({ recentActivity: activity, loadingActivity: false })
      },
      fail: () => {
        this.setData({ loadingActivity: false })
      },
    })
  },

  onClientsTap() {
    wx.navigateTo({ url: '/pages/clients/clients' })
  },
})
