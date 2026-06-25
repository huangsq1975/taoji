const app = getApp<IAppOption>()

Page({
  onLoad() {
    if (app.globalData.loginDone) {
      this.route()
    } else {
      app.loginReadyCallback = () => this.route()
    }
  },

  route() {
    if (app.globalData.needsLogin) {
      wx.redirectTo({ url: '/pages/login/login' })
    } else {
      wx.redirectTo({ url: '/pages/chat/chat' })
    }
  },
})
