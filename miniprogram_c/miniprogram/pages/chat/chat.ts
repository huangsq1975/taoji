import { quickPills, getAiReply, ChatMessage } from '../../utils/mock'
import { API_BASE } from '../../utils/config'

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

interface AdvisorItem {
  id: number
  name: string
  role: string
  institutionName?: string
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
    docTypeSheetVisible: false,
    docTypes: DOC_TYPES,
    pendingFilePath: '',
    pendingFileName: '',
    uploading: false,
    advisorSheetVisible: false,
    advisorList: [] as AdvisorItem[],
    advisorPickerRange: [] as string[],
    selectedAdvisorIdx: -1,
    scrollToId: '',
    statusBarHeight: 0,
    userName: '您',
    sessionId: null as number | null,
  },

  onLoad(options: Record<string, string>) {
    wx.getSystemInfo({
      success: (res) => {
        this.setData({ statusBarHeight: res.statusBarHeight })
      },
    })
    const user = app.globalData.userInfo
    if (user) {
      this.setData({ userName: user.name })
    }

    const sessionIdStr = options['sessionId']
    if (sessionIdStr) {
      this.setData({ sessionId: parseInt(sessionIdStr, 10) })
    }

    if (app.globalData.loginDone) {
      this.onLoginReady()
    } else {
      app.loginReadyCallback = () => this.onLoginReady()
    }
  },

  onLoginReady() {
    if (this.data.sessionId) {
      this.loadSession(this.data.sessionId)
    } else {
      this.checkAndShowAdvisorSheet()
    }
  },

  loadSession(sessionId: number) {
    const token = app.globalData.token
    if (!token) return
    wx.request({
      url: `${API_BASE}/c/chat/sessions/${sessionId}/messages`,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as {
          data?: Array<{ id: number; role: string; content: string; created_at: string }>
        }
        const msgs: ChatMessage[] = (payload.data ?? []).map(m => ({
          id: String(m.id),
          role: (m.role === 'user' ? 'user' : 'ai') as 'user' | 'ai',
          content: m.content,
          time: (m.created_at ?? '').replace('T', ' ').slice(11, 16),
        }))
        const last = msgs[msgs.length - 1]
        this.setData({ messages: msgs, scrollToId: last?.id ?? '' })
      },
      fail: () => {
        wx.showToast({ title: '加载对话失败', icon: 'none' })
      },
    })
  },

  checkAndShowAdvisorSheet() {
    if (!app.globalData.needsAdvisorSelection) return
    wx.request({
      url: `${API_BASE}/c/advisors`,
      method: 'GET',
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as { data?: AdvisorItem[]; statusCode?: number }
        if (payload.statusCode && payload.statusCode !== 200) {
          wx.showToast({ title: '获取顾问列表失败', icon: 'none' })
          return
        }
        const list = payload.data || []
        const range = list.map((a) =>
          a.institutionName ? `${a.name}（${a.institutionName}）` : a.name,
        )
        this.setData({
          advisorList: list,
          advisorPickerRange: range,
          selectedAdvisorIdx: -1,
          advisorSheetVisible: true,
        })
      },
      fail: () => {
        wx.showToast({ title: '获取顾问列表失败', icon: 'none' })
      },
    })
  },

  onAdvisorPickerChange(e: WechatMiniprogram.PickerChange) {
    const idx = Number(e.detail.value)
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

    const token = app.globalData.token
    if (token) {
      wx.request({
        url: `${API_BASE}/c/chat/send`,
        method: 'POST',
        header: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: {
          content: userText,
          sessionId: this.data.sessionId ?? undefined,
          customerId: app.globalData.customerId ?? undefined,
          source: 'c_end',
        },
        success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
          const payload = res.data as { data?: { sessionId?: number; content?: string } }
          const d = payload.data
          const reply = d?.content ?? '收到，顾问将尽快处理。'
          const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
          if (d?.sessionId && !this.data.sessionId) {
            this.setData({ sessionId: d.sessionId })
          }
          const msgs = this.data.messages.map(m =>
            m.id === thinkingId ? { ...m, content: reply, time } : m
          )
          this.setData({ messages: msgs, scrollToId: thinkingId })
        },
        fail: () => {
          // Fall back to local mock
          const reply = getAiReply(userText)
          const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
          const msgs = this.data.messages.map(m =>
            m.id === thinkingId ? { ...m, content: reply, time } : m
          )
          this.setData({ messages: msgs, scrollToId: thinkingId })
        },
      })
    } else {
      // No token — local mock
      setTimeout(() => {
        const reply = getAiReply(userText)
        const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        const msgs = this.data.messages.map(m =>
          m.id === thinkingId ? { ...m, content: reply, time } : m
        )
        this.setData({ messages: msgs, scrollToId: thinkingId })
      }, 600)
    }
  },

  // ─── Upload flow ────────────────────────────────────────────────────────────

  onDocTypeSheetClose() {
    this.setData({ docTypeSheetVisible: false, pendingFilePath: '', pendingFileName: '' })
  },

  onDocTypeSelect(e: WechatMiniprogram.TouchEvent) {
    const docType = e.currentTarget.dataset['value'] as string
    const docLabel = e.currentTarget.dataset['label'] as string
    const filePath = this.data.pendingFilePath
    const fileName = this.data.pendingFileName

    this.setData({ docTypeSheetVisible: false, uploading: true })
    this.addMessage('user', `[上传中] ${docLabel} · ${fileName}`)

    const token = wx.getStorageSync('token') as string
    wx.uploadFile({
      url: `${API_BASE}/c/documents/upload`,
      filePath,
      name: 'file',
      formData: { docType },
      header: { Authorization: `Bearer ${token}` },
      success: (res: WechatMiniprogram.UploadFileSuccessCallbackResult) => {
        this.setData({ uploading: false, pendingFilePath: '', pendingFileName: '' })
        let parsed: { statusCode?: number } = {}
        try {
          parsed = JSON.parse(res.data) as { statusCode?: number }
        } catch {
          // ignore parse error, check http status only
        }
        if (res.statusCode === 200 && parsed.statusCode === 200) {
          const id = genId()
          const reply: ChatMessage = {
            id,
            role: 'ai',
            content: `${docLabel}已上传成功，AI 正在解析，结果将同步给您的顾问。`,
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

  onNewChat() {
    this.setData({ messages: [], sidebarVisible: false, sessionId: null })
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

    const showDocTypeSheet = (filePath: string, fileName: string) => {
      this.setData({ pendingFilePath: filePath, pendingFileName: fileName, docTypeSheetVisible: true })
    }

    if (type === 'camera') {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['camera'],
        success: (res: WechatMiniprogram.ChooseMediaSuccessCallbackResult) => {
          const f = res.tempFiles[0]
          showDocTypeSheet(f.tempFilePath, `拍照_${Date.now()}.jpg`)
        },
        fail: () => { /* user cancelled */ },
      })
    } else if (type === 'local') {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album'],
        success: (res: WechatMiniprogram.ChooseMediaSuccessCallbackResult) => {
          const f = res.tempFiles[0]
          showDocTypeSheet(f.tempFilePath, `图片_${Date.now()}.jpg`)
        },
        fail: () => { /* user cancelled */ },
      })
    } else if (type === 'wechat') {
      wx.chooseMessageFile({
        count: 1,
        type: 'file',
        success: (res: WechatMiniprogram.ChooseMessageFileSuccessCallbackResult) => {
          const f = res.tempFiles[0]
          showDocTypeSheet(f.path, f.name)
        },
        fail: () => { /* user cancelled */ },
      })
    }
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
