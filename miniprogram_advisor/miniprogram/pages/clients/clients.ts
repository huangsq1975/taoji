const API_BASE = 'http://localhost:3000/api/v1'
const app = getApp<IAppOption>()

interface ApiCustomer {
  id: number
  name: string
  status?: string
  docCompleteness?: number
  contactName?: string
  financingNeed?: string
  advisorName?: string
}

type FilterKey = 'all' | 'review' | 'gap' | 'bank'

Page({
  data: {
    customers: [] as ApiCustomer[],
    activeFilter: 'all' as FilterKey,
    filters: [
      { key: 'all', label: '全部' },
      { key: 'review', label: '待复核' },
      { key: 'gap', label: '资料缺口' },
      { key: 'bank', label: '银行对接' },
    ],
  },

  onLoad() {
    if (app.globalData.loginDone) {
      this.loadCustomers()
    } else {
      app.loginReadyCallback = () => {
        this.loadCustomers()
      }
    }
  },

  onShow() {
    if (app.globalData.loginDone) {
      this.loadCustomers()
    }
  },

  loadCustomers() {
    const token = wx.getStorageSync('token') as string
    wx.request({
      url: `${API_BASE}/customers?pageSize=100`,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as { data?: { items?: ApiCustomer[] } }
        this.setData({ customers: payload.data?.items || [] })
      },
      fail: () => {
        wx.showToast({ title: '加载客户列表失败', icon: 'none' })
      },
    })
  },

  onFilterTap(e: WechatMiniprogram.TouchEvent) {
    this.setData({ activeFilter: e.currentTarget.dataset['key'] as FilterKey })
  },

  filteredList(): ApiCustomer[] {
    const f = this.data.activeFilter
    const all = this.data.customers
    if (f === 'review') return all.filter(c => c.status === '顾问复核')
    if (f === 'gap') return all.filter(c => (c.docCompleteness ?? 100) < 80)
    if (f === 'bank') return all.filter(c => c.status === '银行对接')
    return all
  },

  onClientTap(e: WechatMiniprogram.TouchEvent) {
    const id = Number(e.currentTarget.dataset['id'])
    wx.navigateTo({ url: '/pages/client-detail/client-detail?id=' + id })
  },

  onBankTap(e: WechatMiniprogram.TouchEvent) {
    const id = Number(e.currentTarget.dataset['id'])
    wx.navigateTo({ url: '/pages/bank/bank?customerId=' + id })
  },

  onDeleteTap(e: WechatMiniprogram.TouchEvent) {
    const id = Number(e.currentTarget.dataset['id'])
    const name = e.currentTarget.dataset['name'] as string
    wx.showModal({
      title: '确认删除',
      content: `确定删除客户「${name}」吗？此操作不可恢复。`,
      confirmText: '删除',
      confirmColor: '#ef4444',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            customers: this.data.customers.filter(c => c.id !== id),
          })
        }
      },
    })
  },
})
