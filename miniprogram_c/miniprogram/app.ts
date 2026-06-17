App<IAppOption>({
  globalData: {
    userInfo: {
      name: '陈总',
      phone: '136****8891',
      isLoggedIn: true,
    },
  },
  onLaunch() {
    wx.login({
      success: res => {
        // TODO: send res.code to backend for openId/sessionKey/unionId
        console.log(res.code)
      },
    })
  },
})
