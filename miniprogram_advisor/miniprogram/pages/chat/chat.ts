import { quickPills, getAdvisorAiReply, ChatMessage, mockCustomers, Customer } from '../../utils/mock'

const app = getApp<IAppOption>()

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
    uploadSheetVisible: false,
    scrollToId: '',
    statusBarHeight: 0,
    advisorName: '张顾问',
    selectedCustomer: null as Customer | null,
    customers: mockCustomers,
    customerPickerVisible: false,
    searchKeyword: '',
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

  onUploadTap() {
    this.setData({ uploadSheetVisible: true, sidebarVisible: false })
  },

  onUploadSheetClose() {
    this.setData({ uploadSheetVisible: false })
  },

  onUploadChoose(e: WechatMiniprogram.TouchEvent) {
    const type = e.currentTarget.dataset['type'] as string
    this.setData({ uploadSheetVisible: false })
    const labels: Record<string, string> = { camera: '拍摄现场资料', local: '手机本地文件', wechat: '从微信聊天记录中选择' }
    const label = labels[type] !== undefined ? labels[type] : type
    this.addMessage('user', '[' + label + '] 文件已选择')
    this.replyAI('upload')
  },

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

  onContextBarTap() {
    this.setData({ customerPickerVisible: true, sidebarVisible: false })
  },

  onCustomerPickerClose() {
    this.setData({ customerPickerVisible: false, searchKeyword: '' })
  },

  onSearchInput(e: WechatMiniprogram.Input) {
    this.setData({ searchKeyword: e.detail.value })
  },

  filteredCustomers(): Customer[] {
    const kw = this.data.searchKeyword.trim().toLowerCase()
    if (!kw) return this.data.customers
    return this.data.customers.filter(c =>
      c.name.includes(kw) || c.owner.includes(kw) || c.industry.includes(kw)
    )
  },

  get displayCustomers(): Customer[] {
    return this.filteredCustomers()
  },

  onSelectCustomer(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset['id'] as string
    const c = this.data.customers.find(x => x.id === id)
    if (!c) return
    this.setData({ selectedCustomer: c, customerPickerVisible: false, searchKeyword: '' })
    this.addMessage('ai', '已切换到 ' + c.name + '，后续AI作业会基于该客户资料。')
  },
})
