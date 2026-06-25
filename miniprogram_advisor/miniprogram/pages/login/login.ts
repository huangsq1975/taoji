const API_BASE = 'http://localhost:3000/api/v1'
const app = getApp<IAppOption>()

Page({
  data: {
    phone: '',
    password: '',
    loading: false,
    errMsg: '',
  },

  onPhoneInput(e: WechatMiniprogram.Input) {
    this.setData({ phone: e.detail.value })
  },

  onPasswordInput(e: WechatMiniprogram.Input) {
    this.setData({ password: e.detail.value })
  },

  onLoginTap() {
    const { phone, password } = this.data
    if (!phone.trim() || !password) {
      this.setData({ errMsg: '请输入手机号和密码' })
      return
    }
    this.setData({ loading: true, errMsg: '' })

    wx.request({
      url: `${API_BASE}/auth/login`,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { phone: phone.trim(), password },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as {
          data?: { token?: string; name?: string; role?: string; institutionName?: string }
          message?: string
        }
        const d = payload.data
        if (res.statusCode !== 200 || !d?.token) {
          this.setData({ loading: false, errMsg: payload.message ?? '手机号或密码错误' })
          return
        }

        // Store token and advisor info
        wx.setStorageSync('token', d.token)
        app.globalData.token = d.token
        app.globalData.needsLogin = false
        const info = {
          name: d.name ?? '',
          role: d.role ?? '',
          institutionName: d.institutionName ?? '',
        }
        wx.setStorageSync('advisorInfo', info)
        app.globalData.advisorInfo = info

        // Bind WeChat openId in background — fire and forget
        wx.login({
          success: (wxRes) => {
            wx.request({
              url: `${API_BASE}/auth/wx-bind`,
              method: 'POST',
              header: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${d.token}`,
              },
              data: { code: wxRes.code },
              fail: () => { /* silent — binding will work next login attempt */ },
            })
          },
        })

        this.setData({ loading: false })
        wx.redirectTo({ url: '/pages/chat/chat' })
      },
      fail: () => {
        this.setData({ loading: false, errMsg: '网络异常，请重试' })
      },
    })
  },
})
