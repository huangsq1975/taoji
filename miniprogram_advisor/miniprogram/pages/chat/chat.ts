import { quickPills, getAdvisorAiReply, ChatMessage } from '../../utils/mock'

const API_BASE = 'http://localhost:3000/api/v1'
const app = getApp<IAppOption>()

interface ApiCustomer {
  id: number
  name: string
  status?: string
  docCompleteness?: number
  contactName?: string
  financingNeed?: string
}

interface DocTypeOption {
  label: string
  value: string
  icon: string
}

const DOC_TYPES: DocTypeOption[] = [
  { label: '营业执照', value: 'BUSINESS_LICENSE', icon: '🏢' },
  { label: '银行流水', value: 'BANK_STATEMENT', icon: '🏦' },
  { label: '征信报告', value: 'CREDIT_REPORT', icon: '📊' },
  { label: '税务发票', value: 'TAX_INVOICE', icon: '🧾' },
  { label: '房产证', value: 'PROPERTY_CERT', icon: '🏠' },
  { label: '身份证', value: 'ID_CARD', icon: '💳' },
  { label: '财务报表', value: 'FINANCIAL_STATEMENT', icon: '📈' },
  { label: '其他', value: 'OTHER', icon: '📎' },
]

let msgIdCounter = 0
function genId(): string {
  msgIdCounter += 1
  return 'msg_' + msgIdCounter
}

Page({
  data: {
    messages: [] as ChatMessage[],
    quickPills,
    inputValue: '',
    sidebarVisible: false,
    // Upload flow
    uploadSheetVisible: false,
    uploadCustomerPickerVisible: false,
    uploadCustomers: [] as ApiCustomer[],
    uploadTargetCustomer: null as ApiCustomer | null,
    docTypeSheetVisible: false,
    docTypes: DOC_TYPES,
    pendingFilePath: '',
    pendingFileName: '',
    uploading: false,
    // Context bar (AI chat customer, uses simple display from selected customer)
    selectedCustomer: null as ApiCustomer | null,
    customerPickerVisible: false,
    searchKeyword: '',
    scrollToId: '',
    statusBarHeight: 0,
    advisorName: '张顾问',
  },

  onLoad() {
    wx.getSystemInfo({
      success: (res) => {
        this.setData({ statusBarHeight: res.statusBarHeight })
      },
    })
    const info = app.globalData.advisorInfo
    if (info) {
      this.setData({ advisorName: info.name })
    }
    if (app.globalData.loginDone) {
      this.loadUploadCustomers()
    } else {
      app.loginReadyCallback = () => {
        this.loadUploadCustomers()
      }
    }
  },

  loadUploadCustomers() {
    const token = wx.getStorageSync('token') as string
    wx.request({
      url: `${API_BASE}/customers?pageSize=100`,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as { data?: { items?: ApiCustomer[] } }
        const customers = payload.data?.items || []
        this.setData({ uploadCustomers: customers })
      },
      fail: () => { /* silent — upload will still show customer picker */ },
    })
  },

  onInputChange(e: WechatMiniprogram.Input) {
    this.setData({ inputValue: e.detail.value })
  },

  onSendTap() {
    const text = this.data.inputValue.trim()
    if (!text) return
    this.setData({ inputValue: '' })
    this.addMessage('user', text)
    this.replyAI(text)
  },

  onPillTap(e: WechatMiniprogram.TouchEvent) {
    const text = e.currentTarget.dataset['text'] as string
    this.addMessage('user', text)
    this.replyAI(text)
  },

  addMessage(role: 'user' | 'ai', content: string) {
    const id = genId()
    const msg: ChatMessage = {
      id,
      role,
      content,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    }
    this.setData({ messages: [...this.data.messages, msg], scrollToId: id })
  },

  replyAI(userText: string) {
    const thinkingId = genId()
    const thinking: ChatMessage = { id: thinkingId, role: 'ai', content: '正在分析...', time: '' }
    this.setData({ messages: [...this.data.messages, thinking] })
    setTimeout(() => {
      const customerName = this.data.selectedCustomer ? this.data.selectedCustomer.name : ''
      const reply = getAdvisorAiReply(userText, customerName)
      const msgs = this.data.messages.map(m =>
        m.id === thinkingId
          ? { ...m, content: reply, time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }
          : m
      )
      this.setData({ messages: msgs, scrollToId: thinkingId })
    }, 600)
  },

  onNewChat() {
    this.setData({ messages: [], sidebarVisible: false })
  },

  onMenuTap() {
    this.setData({ sidebarVisible: !this.data.sidebarVisible })
  },

  onSidebarMaskTap() {
    this.setData({ sidebarVisible: false })
  },

  // ─── Upload flow ─────────────────────────────────────────────────────────────

  onUploadTap() {
    this.setData({ sidebarVisible: false })
    if (!this.data.uploadTargetCustomer) {
      this.setData({ uploadCustomerPickerVisible: true })
    } else {
      this.setData({ uploadSheetVisible: true })
    }
  },

  onUploadCustomerPickerClose() {
    this.setData({ uploadCustomerPickerVisible: false })
  },

  onSelectUploadCustomer(e: WechatMiniprogram.TouchEvent) {
    const id = Number(e.currentTarget.dataset['id'])
    const customer = this.data.uploadCustomers.find(c => c.id === id) || null
    this.setData({ uploadTargetCustomer: customer, uploadCustomerPickerVisible: false, uploadSheetVisible: true })
  },

  onUploadSheetClose() {
    this.setData({ uploadSheetVisible: false })
  },

  onUploadChoose(e: WechatMiniprogram.TouchEvent) {
    const type = e.currentTarget.dataset['type'] as string
    this.setData({ uploadSheetVisible: false })

    const showDocTypeSheet = (filePath: string, fileName: string) => {
      this.setData({ pendingFilePath: filePath, pendingFileName: fileName, docTypeSheetVisible: true })
    }

    if (type === 'camera') {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['camera'],
        success: (res: WechatMiniprogram.ChooseMediaSuccessCallbackResult) => {
          showDocTypeSheet(res.tempFiles[0].tempFilePath, `拍照_${Date.now()}.jpg`)
        },
        fail: () => { /* user cancelled */ },
      })
    } else if (type === 'local') {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album'],
        success: (res: WechatMiniprogram.ChooseMediaSuccessCallbackResult) => {
          showDocTypeSheet(res.tempFiles[0].tempFilePath, `图片_${Date.now()}.jpg`)
        },
        fail: () => { /* user cancelled */ },
      })
    } else if (type === 'wechat') {
      wx.chooseMessageFile({
        count: 1,
        type: 'file',
        success: (res: WechatMiniprogram.ChooseMessageFileSuccessCallbackResult) => {
          showDocTypeSheet(res.tempFiles[0].path, res.tempFiles[0].name)
        },
        fail: () => { /* user cancelled */ },
      })
    }
  },

  onDocTypeSheetClose() {
    this.setData({ docTypeSheetVisible: false, pendingFilePath: '', pendingFileName: '' })
  },

  onDocTypeSelect(e: WechatMiniprogram.TouchEvent) {
    const docType = e.currentTarget.dataset['value'] as string
    const docLabel = e.currentTarget.dataset['label'] as string
    const customer = this.data.uploadTargetCustomer

    if (!customer) {
      wx.showToast({ title: '请先选择客户', icon: 'none' })
      return
    }

    this.setData({ docTypeSheetVisible: false, uploading: true })
    this.addMessage('user', `[上传中] ${docLabel} · ${this.data.pendingFileName}（${customer.name}）`)

    const token = wx.getStorageSync('token') as string
    wx.uploadFile({
      url: `${API_BASE}/documents/upload`,
      filePath: this.data.pendingFilePath,
      name: 'file',
      formData: { docType, customerId: String(customer.id) },
      header: { Authorization: `Bearer ${token}` },
      success: (res: WechatMiniprogram.UploadFileSuccessCallbackResult) => {
        this.setData({ uploading: false, pendingFilePath: '', pendingFileName: '' })
        let parsed: { statusCode?: number } = {}
        try {
          parsed = JSON.parse(res.data) as { statusCode?: number }
        } catch {
          // ignore parse error
        }
        if (res.statusCode === 200 && parsed.statusCode === 200) {
          const id = genId()
          const reply: ChatMessage = {
            id,
            role: 'ai',
            content: `已为「${customer.name}」上传 ${docLabel}，AI正在解析，完成后可在客户详情页查看。`,
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          }
          this.setData({ messages: [...this.data.messages, reply], scrollToId: id })
        } else {
          wx.showToast({ title: '上传失败，请重试', icon: 'none' })
        }
      },
      fail: () => {
        this.setData({ uploading: false, pendingFilePath: '', pendingFileName: '' })
        wx.showToast({ title: '上传失败，请检查网络', icon: 'none' })
      },
    })
  },

  // ─── Navigation ──────────────────────────────────────────────────────────────

  onClientsTap() {
    this.setData({ sidebarVisible: false })
    wx.navigateTo({ url: '/pages/clients/clients' })
  },

  onBankTap() {
    this.setData({ sidebarVisible: false })
    const c = this.data.selectedCustomer
    const url = c ? '/pages/bank/bank?customerId=' + c.id : '/pages/bank/bank'
    wx.navigateTo({ url })
  },

  onHistoryTap() {
    this.setData({ sidebarVisible: false })
    wx.navigateTo({ url: '/pages/history/history' })
  },

  onMineTap() {
    this.setData({ sidebarVisible: false })
    wx.navigateTo({ url: '/pages/mine/mine' })
  },

  // ─── Context bar (AI customer) ────────────────────────────────────────────────

  onContextBarTap() {
    this.setData({ customerPickerVisible: true, sidebarVisible: false })
  },

  onCustomerPickerClose() {
    this.setData({ customerPickerVisible: false, searchKeyword: '' })
  },

  onSearchInput(e: WechatMiniprogram.Input) {
    this.setData({ searchKeyword: e.detail.value })
  },

  onSelectCustomer(e: WechatMiniprogram.TouchEvent) {
    const id = Number(e.currentTarget.dataset['id'])
    const c = this.data.uploadCustomers.find(x => x.id === id) || null
    if (!c) return
    this.setData({ selectedCustomer: c, customerPickerVisible: false, searchKeyword: '' })
    this.addMessage('ai', '已切换到 ' + c.name + '，后续AI作业会基于该客户资料。')
  },

})
