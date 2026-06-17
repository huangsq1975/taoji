import { mockCustomers, Customer, MISSING_DOCS, UPLOADED_DOCS } from '../../utils/mock'

Page({
  data: {
    customer: null as Customer | null,
    uploadedDocs: [] as string[],
    missingDocs: [] as string[],
  },

  onLoad(options: Record<string, string>) {
    const id = options['id']
    const c = mockCustomers.find(x => x.id === id) || mockCustomers[0]
    this.setData({
      customer: c,
      uploadedDocs: UPLOADED_DOCS[c.id] || [],
      missingDocs: MISSING_DOCS[c.id] || [],
    })
  },

  onBankTap() {
    const c = this.data.customer
    if (!c) return
    wx.navigateTo({ url: '/pages/bank/bank?customerId=' + c.id })
  },

  onRemindTap() {
    wx.showToast({ title: '已模拟发送资料缺口提醒', icon: 'success' })
  },
})
