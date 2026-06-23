import { API_BASE } from '../../utils/config'

interface ProfileData {
  advisorName: string | null
  advisorPhone: string | null
  advisorLatestMessage: string | null
}

const app = getApp<IAppOption>()

Page({
  data: {
    loading: true,
    advisorName: '',
    advisorPhone: '',
    advisorMessage: '',
    hasAdvisor: false,
  },

  onLoad() {
    if (app.globalData.loginDone) {
      this.loadAdvisorInfo()
    } else {
      app.loginReadyCallback = () => this.loadAdvisorInfo()
    }
  },

  onShow() {
    if (app.globalData.loginDone) {
      this.loadAdvisorInfo()
    }
  },

  loadAdvisorInfo() {
    const token = app.globalData.token
    if (!token) {
      this.setData({ loading: false })
      return
    }
    wx.request({
      url: `${API_BASE}/c/profile`,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as { data?: ProfileData }
        const d = payload.data
        if (!d) {
          this.setData({ loading: false })
          return
        }
        const hasAdvisor = !!d.advisorName
        this.setData({
          loading: false,
          hasAdvisor,
          advisorName: d.advisorName || '暂未分配',
          advisorPhone: d.advisorPhone || '',
          advisorMessage: d.advisorLatestMessage || (hasAdvisor ? '您好！如有任何疑问，请随时与我联系。' : ''),
        })
      },
      fail: () => {
        this.setData({ loading: false })
        wx.showToast({ title: '加载失败，请重试', icon: 'none' })
      },
    })
  },

  onPhoneCall() {
    const phone = this.data.advisorPhone
    if (!phone) {
      wx.showToast({ title: '暂无顾问电话', icon: 'none' })
      return
    }
    wx.makePhoneCall({
      phoneNumber: phone,
      fail: () => {
        wx.showToast({ title: '拨号失败', icon: 'error' })
      },
    })
  },

  onWechatTap() {
    wx.showToast({ title: '请通过微信搜索顾问账号联系', icon: 'none' })
  },
})
