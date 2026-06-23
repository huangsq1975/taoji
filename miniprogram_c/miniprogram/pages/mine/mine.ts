import { API_BASE } from '../../utils/config'

interface DocumentItem {
  id: number
  docType: string
  fileName: string
  fileSize: number | null
  aiParseStatus: string
}

interface ProfileData {
  customerId: number
  name: string
  status: string
  statusLabel: string
  advisorId: number | null
  advisorName: string | null
  advisorPhone: string | null
  financingNeed: string | null
  loanAmount: number | null
  docCompleteness: number
  advisorLatestMessage: string | null
}

const DOC_TYPE_LABELS: Record<string, string> = {
  ID_CARD: '身份证',
  CREDIT_REPORT: '征信报告',
  BUSINESS_LICENSE: '营业执照',
  BANK_STATEMENT: '银行流水',
  TAX_INVOICE: '税务发票',
  PROPERTY_CERT: '房产证',
  FINANCIAL_STATEMENT: '财务报表',
  OTHER: '其他材料',
}

const PERSONAL_DOC_TYPES = new Set(['ID_CARD', 'CREDIT_REPORT'])

function formatAmount(amount: number | null): string {
  if (!amount || amount === 0) return ''
  if (amount >= 10000) {
    const wan = amount / 10000
    return wan % 1 === 0 ? `${wan}万元` : `${wan.toFixed(1)}万元`
  }
  return `${Math.round(amount)}元`
}

const app = getApp<IAppOption>()

Page({
  data: {
    name: '',
    statusLabel: '',
    advisorName: '',
    financingNeed: '',
    loanAmountLabel: '',
    docCompleteness: 0,
    personalDocSummary: '暂无资料',
    businessDocSummary: '暂无资料',
    docCount: 0,
    loading: true,
  },

  onLoad() {
    if (app.globalData.loginDone) {
      this.loadAll()
    } else {
      app.loginReadyCallback = () => this.loadAll()
    }
  },

  onShow() {
    if (app.globalData.loginDone) {
      this.loadAll()
    }
  },

  loadAll() {
    const token = app.globalData.token
    if (!token) {
      this.setData({ loading: false })
      return
    }
    this.loadProfile(token)
    this.loadDocuments(token)
  },

  loadProfile(token: string) {
    wx.request({
      url: `${API_BASE}/c/profile`,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as { data?: ProfileData }
        const d = payload.data
        if (!d) return
        this.setData({
          name: d.name || app.globalData.userInfo.name || '微信用户',
          statusLabel: d.statusLabel || '',
          advisorName: d.advisorName || '',
          financingNeed: d.financingNeed || '',
          loanAmountLabel: formatAmount(d.loanAmount),
          docCompleteness: d.docCompleteness || 0,
        })
      },
      fail: () => {
        // Fall back to globalData name
        this.setData({ name: app.globalData.userInfo.name || '微信用户' })
      },
    })
  },

  loadDocuments(token: string) {
    wx.request({
      url: `${API_BASE}/c/documents`,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as { data?: DocumentItem[] }
        const docs = payload.data ?? []
        const personalTypes = [
          ...new Set(
            docs
              .filter(d => PERSONAL_DOC_TYPES.has(d.docType))
              .map(d => DOC_TYPE_LABELS[d.docType] ?? d.docType),
          ),
        ]
        const businessTypes = [
          ...new Set(
            docs
              .filter(d => !PERSONAL_DOC_TYPES.has(d.docType))
              .map(d => DOC_TYPE_LABELS[d.docType] ?? d.docType),
          ),
        ]
        this.setData({
          personalDocSummary: personalTypes.length > 0 ? personalTypes.join('、') : '暂无资料',
          businessDocSummary: businessTypes.length > 0 ? businessTypes.join('、') : '暂无资料',
          docCount: docs.length,
          loading: false,
        })
      },
      fail: () => {
        this.setData({ loading: false })
      },
    })
  },

  onAdvisorTap() {
    wx.navigateTo({ url: '/pages/advisor/advisor' })
  },

  onAuthTap() {
    wx.navigateTo({ url: '/pages/auth/auth' })
  },

  onHistoryTap() {
    wx.navigateTo({ url: '/pages/history/history' })
  },

  onProgressTap() {
    wx.redirectTo({ url: '/pages/progress/progress' })
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('token')
          app.globalData.token = null
          app.globalData.userInfo = { name: '微信用户', phone: '', isLoggedIn: false }
          app.globalData.customerId = null
          app.globalData.advisorId = null
          app.globalData.loginDone = false
          app.globalData.needsAdvisorSelection = false
          wx.reLaunch({ url: '/pages/index/index' })
        }
      },
    })
  },
})
