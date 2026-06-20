import { mockCustomers, Customer } from '../../utils/mock'

type FilterKey = 'all' | 'review' | 'gap' | 'bank'

Page({
  data: {
    customers: mockCustomers as Customer[],
    activeFilter: 'all' as FilterKey,
    filters: [
      { key: 'all', label: '全部' },
      { key: 'review', label: '待复核' },
      { key: 'gap', label: '资料缺口' },
      { key: 'bank', label: '银行对接' },
    ],
  },

  onFilterTap(e: WechatMiniprogram.TouchEvent) {
    this.setData({ activeFilter: e.currentTarget.dataset['key'] as FilterKey })
  },

  onClientTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset['id'] as string
    wx.navigateTo({ url: '/pages/client-detail/client-detail?id=' + id })
  },

  filteredList(): Customer[] {
    const f = this.data.activeFilter
    if (f === 'review') return this.data.customers.filter(c => c.stage === '顾问复核')
    if (f === 'gap') return this.data.customers.filter(c => c.complete < 80)
    if (f === 'bank') return this.data.customers.filter(c => c.stage === '银行对接')
    return this.data.customers
  },

  onBankTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset['id'] as string
    wx.navigateTo({ url: '/pages/bank/bank?customerId=' + id })
  },

  onDeleteTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset['id'] as string
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
