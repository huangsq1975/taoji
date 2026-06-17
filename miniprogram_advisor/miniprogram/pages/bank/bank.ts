import { mockCustomers, mockBanks, mockProducts, mockMaterialGroups, UPLOADED_DOCS, MISSING_DOCS, Customer, Bank, Product, MaterialGroup } from '../../utils/mock'

type BankTab = 'requirements' | 'match' | 'ai'

Page({
  data: {
    customers: mockCustomers as Customer[],
    banks: mockBanks as Bank[],
    selectedCustomerId: 'c1',
    selectedBankId: 'b1',
    activeTab: 'requirements' as BankTab,
    tabs: [
      { key: 'requirements', label: '材料要求' },
      { key: 'match', label: '资料匹配' },
      { key: 'ai', label: 'AI修改' },
    ],
    aiInput: '',
    aiMessages: [{ role: 'ai', text: '告诉我材料说明哪里不对，我会生成修改建议，等待顾问复核。' }] as Array<{role: string; text: string}>,
  },

  onLoad(options: Record<string, string>) {
    if (options['customerId']) {
      this.setData({ selectedCustomerId: options['customerId'] })
    }
    // Auto-select bank based on customer
    const c = this.selectedCustomer()
    if (c) {
      this.setData({ selectedBankId: c.bankId })
    }
  },

  selectedCustomer(): Customer | undefined {
    return this.data.customers.find(c => c.id === this.data.selectedCustomerId)
  },

  selectedBank(): Bank | undefined {
    return this.data.banks.find(b => b.id === this.data.selectedBankId)
  },

  selectedProduct(): Product | undefined {
    return mockProducts.find(p => p.bankId === this.data.selectedBankId)
  },

  materialGroups(): MaterialGroup[] {
    const p = this.selectedProduct()
    if (!p) return []
    return mockMaterialGroups[p.id] || []
  },

  onCustomerChange(e: WechatMiniprogram.PickerChange) {
    const idx = parseInt(e.detail.value as string)
    const c = this.data.customers[idx]
    if (c) this.setData({ selectedCustomerId: c.id, selectedBankId: c.bankId })
  },

  onBankChange(e: WechatMiniprogram.PickerChange) {
    const idx = parseInt(e.detail.value as string)
    const b = this.data.banks[idx]
    if (b) this.setData({ selectedBankId: b.id })
  },

  onTabTap(e: WechatMiniprogram.TouchEvent) {
    this.setData({ activeTab: e.currentTarget.dataset['key'] as BankTab })
  },

  onAiInputChange(e: WechatMiniprogram.Input) {
    this.setData({ aiInput: e.detail.value })
  },

  onAiSend() {
    const text = this.data.aiInput.trim()
    if (!text) return
    const msgs = [...this.data.aiMessages, { role: 'user', text }, { role: 'ai', text: '已根据顾问要求修改材料说明：' + text + '。修改内容已进入材料包草稿，待顾问复核。' }]
    this.setData({ aiMessages: msgs, aiInput: '' })
    wx.showToast({ title: '已模拟更新材料包草稿', icon: 'none' })
  },
})

// Suppress unused import warnings
const _unused = { UPLOADED_DOCS, MISSING_DOCS, mockMaterialGroups }
void _unused
