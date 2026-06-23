import { API_BASE } from '../../utils/config'

interface NotifyItem {
  id: number
  title: string
  body: string
  time: string
  dotColor: 'blue' | 'green' | 'orange'
  read: boolean
}

const app = getApp<IAppOption>()

Page({
  data: {
    notifications: [] as NotifyItem[],
    loading: true,
    empty: false,
  },

  onLoad() {
    if (app.globalData.loginDone) {
      this.loadNotifications()
    } else {
      app.loginReadyCallback = () => this.loadNotifications()
    }
  },

  onShow() {
    if (app.globalData.loginDone) {
      this.loadNotifications()
    }
  },

  loadNotifications() {
    const token = app.globalData.token
    if (!token) {
      this.setData({ loading: false, empty: true })
      return
    }
    wx.request({
      url: `${API_BASE}/c/notifications`,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as { data?: NotifyItem[] }
        const list = payload.data ?? []
        this.setData({ notifications: list, loading: false, empty: list.length === 0 })
      },
      fail: () => {
        this.setData({ loading: false, empty: true })
        wx.showToast({ title: '加载失败，请重试', icon: 'none' })
      },
    })
  },

  onMarkRead(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset['id'] as number
    const token = app.globalData.token
    if (!token) return

    // Optimistic update
    const notifications = this.data.notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    )
    this.setData({ notifications })

    wx.request({
      url: `${API_BASE}/c/notifications/${id}/read`,
      method: 'PUT',
      header: { Authorization: `Bearer ${token}` },
    })
  },
})
