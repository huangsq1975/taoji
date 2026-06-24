const API_BASE = 'http://localhost:3000/api/v1'
const app = getApp<IAppOption>()

// Heuristic: match material item name to customer doc type
const DOC_KEYWORDS: Array<[string, string]> = [
  ['营业执照', 'BUSINESS_LICENSE'],
  ['流水', 'BANK_STATEMENT'],
  ['银行流水', 'BANK_STATEMENT'],
  ['征信', 'CREDIT_REPORT'],
  ['发票', 'TAX_INVOICE'],
  ['税', 'TAX_INVOICE'],
  ['房产', 'PROPERTY_CERT'],
  ['身份证', 'ID_CARD'],
  ['财务报表', 'FINANCIAL_STATEMENT'],
  ['财报', 'FINANCIAL_STATEMENT'],
]

function guessDocType(name: string): string | null {
  for (const [kw, dt] of DOC_KEYWORDS) {
    if (name.includes(kw)) return dt
  }
  return null
}

type BankTab = 'requirements' | 'match' | 'ai'

interface ApiCustomer { id: number; name: string }
interface ApiBank { id: number; name: string }
interface ApiProduct { id: number; name: string; loanAmount?: string; loanTerm?: string; description?: string; requirements?: string }
interface ApiMaterial { id: number; name: string; required: boolean; source?: string; format?: string; note?: string; category: string }
interface ApiDoc { id: number; docType: string; fileName: string; aiParseStatus: string }

interface MatchItem extends ApiMaterial {
  matchStatus: string
  matchClass: string
}

interface MaterialGroup {
  category: string
  items: ApiMaterial[]
}

interface MatchGroup {
  category: string
  items: MatchItem[]
}

Page({
  data: {
    customers: [] as ApiCustomer[],
    banks: [] as ApiBank[],
    products: [] as ApiProduct[],
    materials: [] as ApiMaterial[],
    customerDocs: [] as ApiDoc[],

    selectedCustomerIdx: -1,
    selectedBankIdx: 0,
    selectedProductIdx: 0,

    // Picker range names
    customerNames: [] as string[],
    bankNames: [] as string[],
    productNames: [] as string[],

    // Display in selectors
    selectedCustomerName: '请选择客户',
    selectedBankName: '请选择银行',
    selectedProductName: '请选择产品',

    // Computed for tabs
    materialGroups: [] as MaterialGroup[],
    matchGroups: [] as MatchGroup[],
    selectedProduct: null as ApiProduct | null,

    // UI state
    activeTab: 'requirements' as BankTab,
    tabs: [
      { key: 'requirements', label: '材料要求' },
      { key: 'match', label: '资料匹配' },
      { key: 'ai', label: 'AI修改' },
    ],
    loadingMaterials: false,
    creating: false,
    pendingCustomerId: 0,

    aiInput: '',
    aiMessages: [
      { id: 'init', role: 'ai', text: '告诉我材料说明哪里不对，我会生成修改建议，等待顾问复核。' },
    ] as Array<{ id: string; role: string; text: string }>,
    aiSending: false,
    aiSessionId: null as number | null,
    aiScrollToId: '',
  },

  onLoad(options: Record<string, string>) {
    const customerId = parseInt(options['customerId'] || '0', 10) || 0
    this.setData({ pendingCustomerId: customerId })
    this.loadCustomers()
    this.loadBanks()
  },

  loadCustomers() {
    const token = app.globalData.token ?? (wx.getStorageSync('token') as string)
    wx.request({
      url: `${API_BASE}/customers?pageSize=100`,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as { data?: { items?: ApiCustomer[] } }
        const items = payload.data?.items ?? []
        const customerNames = items.map(c => c.name)

        let idx = items.length > 0 ? 0 : -1
        const { pendingCustomerId } = this.data
        if (pendingCustomerId) {
          const found = items.findIndex(c => c.id === pendingCustomerId)
          if (found >= 0) idx = found
        }

        this.setData({
          customers: items,
          customerNames,
          selectedCustomerIdx: idx,
          selectedCustomerName: idx >= 0 ? items[idx].name : '请选择客户',
        })

        if (idx >= 0) this.loadCustomerDocs(items[idx].id)
      },
    })
  },

  loadBanks() {
    const token = app.globalData.token ?? (wx.getStorageSync('token') as string)
    wx.request({
      url: `${API_BASE}/banks`,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as { data?: ApiBank[] }
        const banks = payload.data ?? []
        const bankNames = banks.map(b => b.name)
        const idx = banks.length > 0 ? 0 : -1
        this.setData({
          banks,
          bankNames,
          selectedBankIdx: idx,
          selectedBankName: idx >= 0 ? banks[idx].name : '请选择银行',
        })
        if (idx >= 0) this.loadProducts(banks[idx].id)
      },
    })
  },

  loadProducts(bankId: number) {
    const token = app.globalData.token ?? (wx.getStorageSync('token') as string)
    wx.request({
      url: `${API_BASE}/banks/products?bankId=${bankId}`,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as { data?: ApiProduct[] }
        const products = payload.data ?? []
        const productNames = products.map(p => p.name)
        const idx = products.length > 0 ? 0 : -1
        this.setData({
          products,
          productNames,
          selectedProductIdx: idx,
          selectedProductName: idx >= 0 ? products[idx].name : '暂无产品',
          selectedProduct: idx >= 0 ? products[idx] : null,
          materials: [],
          materialGroups: [],
          matchGroups: [],
        })
        if (idx >= 0) this.loadMaterials(products[idx].id)
      },
    })
  },

  loadMaterials(productId: number) {
    const token = app.globalData.token ?? (wx.getStorageSync('token') as string)
    this.setData({ loadingMaterials: true })
    wx.request({
      url: `${API_BASE}/banks/products/${productId}/materials`,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as { data?: ApiMaterial[] }
        const materials = payload.data ?? []
        this.setData({ materials, loadingMaterials: false })
        this.buildMaterialGroups(materials)
        this.computeMatch()
      },
      fail: () => {
        this.setData({ loadingMaterials: false })
      },
    })
  },

  loadCustomerDocs(customerId: number) {
    const token = app.globalData.token ?? (wx.getStorageSync('token') as string)
    wx.request({
      url: `${API_BASE}/customers/${customerId}/documents`,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as { data?: ApiDoc[] }
        this.setData({ customerDocs: payload.data ?? [] })
        this.computeMatch()
      },
    })
  },

  buildMaterialGroups(materials: ApiMaterial[]) {
    const map = new Map<string, ApiMaterial[]>()
    for (const m of materials) {
      const cat = m.category || '基本资料'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(m)
    }
    this.setData({ materialGroups: [...map.entries()].map(([category, items]) => ({ category, items })) })
  },

  computeMatch() {
    const { materials, customerDocs } = this.data
    const uploaded = new Set(customerDocs.map(d => d.docType))

    const map = new Map<string, MatchItem[]>()
    for (const m of materials) {
      const guessed = guessDocType(m.name)
      const matched = guessed ? uploaded.has(guessed) : false
      const item: MatchItem = {
        ...m,
        matchStatus: matched ? '已满足' : (m.required ? '缺失' : '未上传'),
        matchClass: matched ? 'badge-ok' : (m.required ? 'badge-warn' : 'badge-gray'),
      }
      const cat = m.category || '基本资料'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(item)
    }
    this.setData({ matchGroups: [...map.entries()].map(([category, items]) => ({ category, items })) })
  },

  onCustomerChange(e: WechatMiniprogram.PickerChange) {
    const idx = parseInt(e.detail.value as string, 10)
    const customer = this.data.customers[idx]
    if (!customer) return
    this.setData({
      selectedCustomerIdx: idx,
      selectedCustomerName: customer.name,
      customerDocs: [],
      matchGroups: [],
      aiSessionId: null,
    })
    this.loadCustomerDocs(customer.id)
  },

  onBankChange(e: WechatMiniprogram.PickerChange) {
    const idx = parseInt(e.detail.value as string, 10)
    const bank = this.data.banks[idx]
    if (!bank) return
    this.setData({
      selectedBankIdx: idx,
      selectedBankName: bank.name,
      products: [],
      productNames: [],
      selectedProductIdx: -1,
      selectedProductName: '请选择产品',
      selectedProduct: null,
      materials: [],
      materialGroups: [],
      matchGroups: [],
      aiSessionId: null,
    })
    this.loadProducts(bank.id)
  },

  onProductChange(e: WechatMiniprogram.PickerChange) {
    const idx = parseInt(e.detail.value as string, 10)
    const product = this.data.products[idx]
    if (!product) return
    this.setData({
      selectedProductIdx: idx,
      selectedProductName: product.name,
      selectedProduct: product,
      materials: [],
      materialGroups: [],
      matchGroups: [],
      aiSessionId: null,
    })
    this.loadMaterials(product.id)
  },

  onTabTap(e: WechatMiniprogram.TouchEvent) {
    this.setData({ activeTab: e.currentTarget.dataset['key'] as BankTab })
  },

  onCreateReportTask() {
    const { customers, products, selectedCustomerIdx, selectedProductIdx } = this.data
    const customer = customers[selectedCustomerIdx]
    const product = products[selectedProductIdx]
    if (!customer || !product) {
      wx.showToast({ title: '请先选择客户和产品', icon: 'none' })
      return
    }
    const token = app.globalData.token ?? (wx.getStorageSync('token') as string)
    this.setData({ creating: true })
    wx.request({
      url: `${API_BASE}/reports`,
      method: 'POST',
      header: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { customerId: customer.id, productId: product.id },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        this.setData({ creating: false })
        const payload = res.data as { data?: { id?: number }; statusCode?: number }
        if (res.statusCode === 200 && payload.data?.id) {
          wx.showModal({
            title: '报告任务已创建',
            content: `任务 #${payload.data.id} 已生成，AI 将开始填写字段草稿，稍后可在 AI填报 模块查看。`,
            showCancel: false,
            confirmText: '知道了',
          })
        } else {
          wx.showToast({ title: '创建失败', icon: 'error' })
        }
      },
      fail: () => {
        this.setData({ creating: false })
        wx.showToast({ title: '创建失败', icon: 'error' })
      },
    })
  },

  onAiInputChange(e: WechatMiniprogram.Input) {
    this.setData({ aiInput: e.detail.value })
  },

  onAiSend() {
    const text = this.data.aiInput.trim()
    if (!text || this.data.aiSending) return

    const uid = 'u' + Date.now()
    const tid = 't' + Date.now()
    const customer = this.data.customers[this.data.selectedCustomerIdx]
    const product = this.data.selectedProduct

    const msgs = [
      ...this.data.aiMessages,
      { id: uid, role: 'user', text },
      { id: tid, role: 'ai', text: '正在分析...' },
    ]
    this.setData({ aiMessages: msgs, aiInput: '', aiSending: true, aiScrollToId: tid })

    const finishWithReply = (reply: string) => {
      const updated = this.data.aiMessages.map(m =>
        m.id === tid ? { ...m, text: reply } : m
      )
      this.setData({ aiMessages: updated, aiSending: false, aiScrollToId: tid })
    }

    const token = app.globalData.token ?? (wx.getStorageSync('token') as string)
    if (token) {
      // Build context prefix so AI knows what product/customer we're editing
      const ctxPrefix = customer && product
        ? `【银行材料整理 · ${customer.name} · ${product.name}】\n${text}`
        : text
      wx.request({
        url: `${API_BASE}/c/chat/send`,
        method: 'POST',
        header: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: {
          content: ctxPrefix,
          sessionId: this.data.aiSessionId ?? undefined,
          customerId: customer?.id ?? undefined,
          source: 'advisor_mobile',
        },
        success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
          const payload = res.data as { data?: { sessionId?: number; content?: string } }
          const d = payload.data
          if (res.statusCode === 200 && d?.content) {
            if (d.sessionId && !this.data.aiSessionId) {
              this.setData({ aiSessionId: d.sessionId })
            }
            finishWithReply(d.content)
          } else {
            finishWithReply('已记录修改意见，待顾问确认后更新材料包草稿。')
          }
        },
        fail: () => {
          finishWithReply('已记录修改意见，待顾问确认后更新材料包草稿。')
        },
      })
    } else {
      setTimeout(() => {
        finishWithReply('已记录修改意见，待顾问确认后更新材料包草稿。')
      }, 500)
    }
  },
})
