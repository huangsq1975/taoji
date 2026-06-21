import { quickPills, getAiReply, ChatMessage } from '../../utils/mock'

const API_BASE = 'http://localhost:3000/api/v1'

interface AdvisorItem {
  id: number
  name: string
  role: string
}

const app = getApp<IAppOption>()

let msgIdCounter = 0
function genId(): string {
  msgIdCounter += 1
  return `msg_${msgIdCounter}`
}

Page({
  data: {
    messages: [] as ChatMessage[],
    quickPills,
    inputValue: '',
    sidebarVisible: false,
    uploadSheetVisible: false,
    advisorSheetVisible: false,
    advisorList: [] as AdvisorItem[],
    selectedAdvisorIdx: -1,
    scrollToId: '',
    statusBarHeight: 0,
    userName: '您',
  },

  onLoad() {
    wx.getSystemInfo({
      success: (res) => {
        this.setData({ statusBarHeight: res.statusBarHeight })
      },
    })
    const user = app.globalData.userInfo
    if (user) {
      this.setData({ userName: user.name })
    }
    // If login already completed, check immediately; otherwise register callback
    if (app.globalData.loginDone) {
      this.checkAndShowAdvisorSheet()
    } else {
      app.loginReadyCallback = () => {
        this.checkAndShowAdvisorSheet()
      }
    }
  },

  checkAndShowAdvisorSheet() {
    if (!app.globalData.needsAdvisorSelection) return
    wx.request({
      url: `${API_BASE}/c/advisors`,
      method: 'GET',
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as { data?: AdvisorItem[] }
        const list = payload.data || []
        this.setData({ advisorList: list, advisorSheetVisible: true })
      },
      fail: () => {
        wx.showToast({ title: '获取顾问列表失败', icon: 'none' })
      },
    })
  },

  onAdvisorItemTap(e: WechatMiniprogram.TouchEvent) {
    const idx = e.currentTarget.dataset['idx'] as number
    this.setData({ selectedAdvisorIdx: idx })
  },

  onAdvisorConfirm() {
    const idx = this.data.selectedAdvisorIdx
    if (idx < 0) {
      wx.showToast({ title: '请先选择顾问', icon: 'none' })
      return
    }
    const advisor = this.data.advisorList[idx]
    wx.showLoading({ title: '绑定中...' })
    // Obtain a fresh wx code (the original one was consumed at app launch)
    wx.login({
      success: (wxRes) => {
        wx.request({
          url: `${API_BASE}/auth/wx-login`,
          method: 'POST',
          data: { code: wxRes.code, advisorId: advisor.id },
          success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
            wx.hideLoading()
            const payload = res.data as {
              data?: { token?: string; userId?: number; name?: string; advisorId?: number }
            }
            const data = payload.data
            if (data && data.token) {
              wx.setStorageSync('token', data.token)
              app.globalData.token = data.token
              app.globalData.customerId = data.userId != null ? data.userId : null
              app.globalData.advisorId = data.advisorId != null ? data.advisorId : advisor.id
              app.globalData.userInfo.name = data.name || '微信用户'
              app.globalData.userInfo.isLoggedIn = true
              app.globalData.needsAdvisorSelection = false
              this.setData({ advisorSheetVisible: false, userName: app.globalData.userInfo.name })
              wx.showToast({ title: '已绑定顾问', icon: 'success' })
            } else {
              wx.showToast({ title: '绑定失败，请重试', icon: 'none' })
            }
          },
          fail: () => {
            wx.hideLoading()
            wx.showToast({ title: '绑定失败，请重试', icon: 'none' })
          },
        })
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '微信授权失败，请重试', icon: 'none' })
      },
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
    const messages = [...this.data.messages, msg]
    this.setData({ messages, scrollToId: id })
  },

  replyAI(userText: string) {
    const thinkingId = genId()
    const thinking: ChatMessage = { id: thinkingId, role: 'ai', content: '正在分析...', time: '' }
    this.setData({ messages: [...this.data.messages, thinking] })
    setTimeout(() => {
      const reply = getAiReply(userText)
      const msgs = this.data.messages.map(m =>
        m.id === thinkingId ? { ...m, content: reply, time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) } : m
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
    const labels: Record<string, string> = {
      camera: '拍照上传',
      local: '手机本地文件',
      wechat: '从微信聊天记录中选择',
    }
    const names: Record<string, string> = {
      camera: '现场拍照_营业执照.jpg',
      local: '企业经营流水_2026.pdf',
      wechat: '微信收到_征信报告截图.png',
    }
    this.addMessage('user', `[${labels[type] !== undefined ? labels[type] : type}] ${names[type] !== undefined ? names[type] : '文件'}`)
    this.replyAI('upload')
  },

  onProgressTap() {
    this.setData({ sidebarVisible: false })
    wx.navigateTo({ url: '/pages/progress/progress' })
  },

  onAdvisorTap() {
    this.setData({ sidebarVisible: false })
    wx.navigateTo({ url: '/pages/advisor/advisor' })
  },

  onNotifyTap() {
    this.setData({ sidebarVisible: false })
    wx.redirectTo({ url: '/pages/notify/notify' })
  },

  onAuthTap() {
    this.setData({ sidebarVisible: false })
    wx.navigateTo({ url: '/pages/auth/auth' })
  },

  onHistoryTap() {
    this.setData({ sidebarVisible: false })
    wx.navigateTo({ url: '/pages/history/history' })
  },

  onMineTap() {
    this.setData({ sidebarVisible: false })
    wx.redirectTo({ url: '/pages/mine/mine' })
  },

  onCreditTap() {
    this.setData({ sidebarVisible: false })
    this.addMessage('user', '查企业征信')
    this.replyAI('查企业征信')
  },
})
