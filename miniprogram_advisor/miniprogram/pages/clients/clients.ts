const API_BASE = 'http://localhost:3000/api/v1'
const app = getApp<IAppOption>()

interface ApiCustomer {
  id: number
  name: string
  status?: string
  statusLabel?: string
  statusClass?: string
  docCompleteness?: number
  contactName?: string
  contactPhone?: string
  financingNeed?: string
  advisorName?: string
}

type FilterKey = 'all' | 'review' | 'gap' | 'bank'

const STATUS_LABELS: Record<string, string> = {
  COLLECTING: '资料收集',
  REVIEWING: 'AI分析中',
  REPORTING: '材料整理',
  SUBMITTED: '已提交',
  DONE: '已完成',
  PAUSED: '已暂停',
}

const STATUS_CLASSES: Record<string, string> = {
  COLLECTING: 'badge-blue',
  REVIEWING: 'badge-purple',
  REPORTING: 'badge-orange',
  SUBMITTED: 'badge-green',
  DONE: 'badge-green',
  PAUSED: 'badge-gray',
}

Page({
  data: {
    customers: [] as ApiCustomer[],
    filteredCustomers: [] as ApiCustomer[],
    activeFilter: 'all' as FilterKey,
    searchKeyword: '',
    loading: false,
    filters: [
      { key: 'all', label: '全部' },
      { key: 'review', label: '待复核' },
      { key: 'gap', label: '资料缺口' },
      { key: 'bank', label: '银行对接' },
    ],
    createSheetVisible: false,
    newName: '',
    newContactName: '',
    newContactPhone: '',
    newFinancingNeed: '',
    creating: false,
  },

  onLoad() {
    if (app.globalData.loginDone) {
      this.loadCustomers()
    } else {
      app.loginReadyCallback = () => this.loadCustomers()
    }
  },

  onShow() {
    if (app.globalData.loginDone) {
      this.loadCustomers()
    }
  },

  loadCustomers() {
    const token = app.globalData.token ?? wx.getStorageSync('token') as string
    this.setData({ loading: true })
    wx.request({
      url: `${API_BASE}/customers?pageSize=100`,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as { data?: { items?: ApiCustomer[] } }
        const items = payload.data?.items ?? []
        this.setData({ customers: items, loading: false })
        this.applyFilter()
      },
      fail: () => {
        this.setData({ loading: false })
        wx.showToast({ title: '加载客户列表失败', icon: 'none' })
      },
    })
  },

  applyFilter() {
    const { customers, activeFilter, searchKeyword } = this.data
    const kw = searchKeyword.trim().toLowerCase()

    let list = kw
      ? customers.filter(c =>
          c.name.toLowerCase().includes(kw) ||
          (c.contactName ?? '').toLowerCase().includes(kw) ||
          (c.contactPhone ?? '').includes(kw),
        )
      : customers

    if (activeFilter === 'review') {
      list = list.filter(c => c.status === 'REVIEWING')
    } else if (activeFilter === 'gap') {
      list = list.filter(c => (c.docCompleteness ?? 100) < 80)
    } else if (activeFilter === 'bank') {
      list = list.filter(c => c.status === 'REPORTING' || c.status === 'SUBMITTED')
    }

    const enriched = list.map(c => ({
      ...c,
      statusLabel: STATUS_LABELS[c.status ?? ''] ?? c.status ?? '未知',
      statusClass: STATUS_CLASSES[c.status ?? ''] ?? 'badge-gray',
    }))

    this.setData({ filteredCustomers: enriched })
  },

  onFilterTap(e: WechatMiniprogram.TouchEvent) {
    this.setData({ activeFilter: e.currentTarget.dataset['key'] as FilterKey })
    this.applyFilter()
  },

  onSearchInput(e: WechatMiniprogram.Input) {
    this.setData({ searchKeyword: e.detail.value })
    this.applyFilter()
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
        if (!res.confirm) return
        const token = app.globalData.token ?? wx.getStorageSync('token') as string
        wx.request({
          url: `${API_BASE}/customers/${id}`,
          method: 'DELETE',
          header: { Authorization: `Bearer ${token}` },
          success: () => {
            const updated = this.data.customers.filter(c => c.id !== id)
            this.setData({ customers: updated })
            this.applyFilter()
            wx.showToast({ title: '已删除', icon: 'success' })
          },
          fail: () => {
            wx.showToast({ title: '删除失败', icon: 'error' })
          },
        })
      },
    })
  },

  onCreateTap() {
    this.setData({
      createSheetVisible: true,
      newName: '',
      newContactName: '',
      newContactPhone: '',
      newFinancingNeed: '',
    })
  },

  onCreateSheetClose() {
    this.setData({ createSheetVisible: false })
  },

  onNewNameInput(e: WechatMiniprogram.Input) {
    this.setData({ newName: e.detail.value })
  },

  onNewContactNameInput(e: WechatMiniprogram.Input) {
    this.setData({ newContactName: e.detail.value })
  },

  onNewContactPhoneInput(e: WechatMiniprogram.Input) {
    this.setData({ newContactPhone: e.detail.value })
  },

  onNewFinancingNeedInput(e: WechatMiniprogram.Input) {
    this.setData({ newFinancingNeed: e.detail.value })
  },

  onCreateSubmit() {
    const { newName, newContactName, newContactPhone, newFinancingNeed } = this.data
    if (!newName.trim()) {
      wx.showToast({ title: '请填写企业名称', icon: 'none' })
      return
    }
    const token = app.globalData.token ?? wx.getStorageSync('token') as string
    this.setData({ creating: true })
    wx.request({
      url: `${API_BASE}/customers`,
      method: 'POST',
      header: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        name: newName.trim(),
        contactName: newContactName.trim() || undefined,
        contactPhone: newContactPhone.trim() || undefined,
        financingNeed: newFinancingNeed.trim() || undefined,
      },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as { data?: ApiCustomer }
        const created = payload.data
        if (created) {
          const updated = [created, ...this.data.customers]
          this.setData({ customers: updated, createSheetVisible: false, creating: false })
          this.applyFilter()
          wx.showToast({ title: '创建成功', icon: 'success' })
        } else {
          this.setData({ creating: false })
          wx.showToast({ title: '创建失败', icon: 'error' })
        }
      },
      fail: () => {
        this.setData({ creating: false })
        wx.showToast({ title: '创建失败', icon: 'error' })
      },
    })
  },
})
