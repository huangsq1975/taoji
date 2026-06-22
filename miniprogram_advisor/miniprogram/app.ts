const API_BASE = 'http://localhost:3000/api/v1'

App<IAppOption>({
  globalData: {
    advisorInfo: {
      name: '张顾问',
      role: '高级助贷顾问',
      institutionName: '韬纪元AI合作顾问团队',
    },
    token: undefined,
    loginDone: false,
  },
  loginReadyCallback: null,
  onLaunch() {
    const cached = wx.getStorageSync('token') as string
    if (cached) {
      this.globalData.token = cached
      this.globalData.loginDone = true
      if (this.loginReadyCallback) {
        this.loginReadyCallback()
        this.loginReadyCallback = null
      }
      return
    }
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
            const data = payload.data
            if (data && data.token) {
              wx.setStorageSync('token', data.token)
              this.globalData.token = data.token
              this.globalData.advisorInfo = {
                name: data.name || (this.globalData.advisorInfo ? this.globalData.advisorInfo.name : ''),
                role: data.role || (this.globalData.advisorInfo ? this.globalData.advisorInfo.role : '顾问'),
                institutionName: data.institutionName || (this.globalData.advisorInfo ? this.globalData.advisorInfo.institutionName : ''),
              }
            }
            this.globalData.loginDone = true
            if (this.loginReadyCallback) {
              this.loginReadyCallback()
              this.loginReadyCallback = null
            }
          },
          fail: () => {
            this.globalData.loginDone = true
            if (this.loginReadyCallback) {
              this.loginReadyCallback()
              this.loginReadyCallback = null
            }
          },
        })
      },
    })
  },
})
