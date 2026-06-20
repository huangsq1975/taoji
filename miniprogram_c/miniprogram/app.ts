// Backend base URL — update this to your production domain
const API_BASE = 'http://localhost:3000/api/v1'

App<IAppOption>({
  globalData: {
    userInfo: {
      name: '微信用户',
      phone: '',
      isLoggedIn: false,
    },
    customerId: null as number | null,
    advisorId: null as number | null,
    token: null as string | null,
    needsAdvisorSelection: false,
  },
  loginReadyCallback: null as (() => void) | null,
  onLaunch(options: WechatMiniprogram.App.LaunchShowOption) {
    // Extract advisorId from QR code scene param (format: "a={advisorId}")
    let advisorId: number | null = null
    const sceneRaw = options.query && (options.query as Record<string, string>).scene
    if (sceneRaw) {
      const sceneStr = decodeURIComponent(sceneRaw)
      const match = sceneStr.match(/a=(\d+)/)
      if (match) {
        advisorId = parseInt(match[1], 10)
        this.globalData.advisorId = advisorId
      }
    }
    wx.login({
      success: res => {
        const body: Record<string, unknown> = { code: res.code }
        if (advisorId !== null) body.advisorId = advisorId

        wx.request({
          url: `${API_BASE}/auth/wx-login`,
          method: 'POST',
          data: body,
          success: (loginRes: WechatMiniprogram.RequestSuccessCallbackResult) => {
            const payload = loginRes.data as {
              data?: { token?: string; userId?: number; name?: string; advisorId?: number }
            }
            const data = payload.data
            if (data && data.token) {
              wx.setStorageSync('token', data.token)
              this.globalData.token = data.token
              this.globalData.customerId = data.userId != null ? data.userId : null
              this.globalData.advisorId = data.advisorId != null ? data.advisorId : advisorId
              this.globalData.userInfo.name = data.name || '微信用户'
              this.globalData.userInfo.isLoggedIn = true
              this.globalData.needsAdvisorSelection = this.globalData.advisorId === null
            }
            if (this.loginReadyCallback) {
              this.loginReadyCallback()
              this.loginReadyCallback = null
            }
          },
          fail: (err) => {
            console.error('wx-login request failed:', err)
          },
        })
      },
    })
  },
})
