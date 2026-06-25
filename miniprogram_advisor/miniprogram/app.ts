const API_BASE = 'http://localhost:3000/api/v1'

const ADVISOR_ROLES = ['advisor', 'supervisor', 'admin']

App<IAppOption>({
  globalData: {
    advisorInfo: undefined,
    token: undefined,
    loginDone: false,
    needsLogin: false,
  },
  loginReadyCallback: null,

  onLaunch() {
    const fireReady = () => {
      if (this.loginReadyCallback) {
        this.loginReadyCallback()
        this.loginReadyCallback = null
      }
    }

    // Fast path: valid token already cached
    const cached = wx.getStorageSync('token') as string
    if (cached) {
      this.globalData.token = cached
      const info = wx.getStorageSync('advisorInfo') as typeof this.globalData.advisorInfo
      if (info) this.globalData.advisorInfo = info
      this.globalData.loginDone = true
      fireReady()
      return
    }

    // No token: try automatic login via WeChat openId binding
    wx.login({
      success: (res) => {
        wx.request({
          url: `${API_BASE}/auth/wx-login`,
          method: 'POST',
          data: { code: res.code },
          success: (wxRes: WechatMiniprogram.RequestSuccessCallbackResult) => {
            const payload = wxRes.data as {
              data?: { token?: string; name?: string; role?: string; institutionName?: string }
            }
            const d = payload.data
            if (d?.token && ADVISOR_ROLES.includes(d.role ?? '')) {
              wx.setStorageSync('token', d.token)
              this.globalData.token = d.token
              this.globalData.advisorInfo = {
                name: d.name ?? '',
                role: d.role ?? '',
                institutionName: d.institutionName ?? '',
              }
              wx.setStorageSync('advisorInfo', this.globalData.advisorInfo)
            } else {
              // No binding found, or bound to a customer role — must login with phone + password
              this.globalData.needsLogin = true
            }
            this.globalData.loginDone = true
            fireReady()
          },
          fail: () => {
            this.globalData.needsLogin = true
            this.globalData.loginDone = true
            fireReady()
          },
        })
      },
      fail: () => {
        this.globalData.needsLogin = true
        this.globalData.loginDone = true
        fireReady()
      },
    })
  },
})
