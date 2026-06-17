App<IAppOption>({
  globalData: {
    advisorInfo: {
      name: '张顾问',
      role: '高级助贷顾问',
      institutionName: '韬纪元AI合作顾问团队',
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
