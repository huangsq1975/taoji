import { API_BASE } from '../../utils/config'

interface DocumentItem {
  id: number
  docType: string
  fileName: string
  fileSize: number | null
  aiParseStatus: string
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

const app = getApp<IAppOption>()

Page({
  data: {
    name: '',
    phone: '',
    advisorName: '',
    personalDocSummary: '暂无资料',
    businessDocSummary: '暂无资料',
    docCount: 0,
    loading: true,
  },

  onLoad() {
    if (app.globalData.loginDone) {
      this.loadProfile()
    } else {
      app.loginReadyCallback = () => this.loadProfile()
    }
  },

  onShow() {
    if (app.globalData.loginDone) {
      this.loadProfile()
    }
  },

  loadProfile() {
    const { userInfo, advisorId, token } = app.globalData
    this.setData({
      name: userInfo.name || '微信用户',
      phone: userInfo.phone || '',
    })
    this.loadDocuments(token)
    if (advisorId) {
      this.loadAdvisorName(advisorId)
    }
  },

  loadDocuments(token: string | null) {
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

  loadAdvisorName(advisorId: number) {
    wx.request({
      url: `${API_BASE}/c/advisors`,
      method: 'GET',
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as { data?: Array<{ id: number; name: string }> }
        const advisors = payload.data ?? []
        const found = advisors.find(a => a.id === advisorId)
        if (found) {
          this.setData({ advisorName: found.name })
        }
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
