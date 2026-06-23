import { API_BASE } from '../../utils/config'

interface SessionItem {
  id: number
  title: string
  preview: string
  time: string
}

const app = getApp<IAppOption>()

Page({
  data: {
    historyList: [] as SessionItem[],
    loading: true,
    empty: false,
  },

  onLoad() {
    if (app.globalData.loginDone) {
      this.loadSessions()
    } else {
      app.loginReadyCallback = () => this.loadSessions()
    }
  },

  onShow() {
    if (app.globalData.loginDone) {
      this.loadSessions()
    }
  },

  loadSessions() {
    const token = app.globalData.token
    if (!token) {
      this.setData({ loading: false, empty: true })
      return
    }
    wx.request({
      url: `${API_BASE}/c/chat/sessions`,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as { data?: SessionItem[] }
        const list = payload.data ?? []
        this.setData({ historyList: list, loading: false, empty: list.length === 0 })
      },
      fail: () => {
        this.setData({ loading: false, empty: true })
        wx.showToast({ title: '加载失败，请重试', icon: 'none' })
      },
    })
  },

  onItemTap(e: WechatMiniprogram.TouchEvent) {
    const sessionId = e.currentTarget.dataset['id'] as number
    wx.navigateTo({ url: `/pages/chat/chat?sessionId=${sessionId}` })
  },
})
