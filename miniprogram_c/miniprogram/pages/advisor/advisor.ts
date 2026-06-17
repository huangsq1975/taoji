Page({
  data: {
    advisor: {
      name: '张顾问',
      role: '韬纪元AI · 高级助贷顾问',
      stats: '服务客户 86 位 · 好评率 98%',
      phone: '13800138000',
      message: '陈总，当前资料已进入银行材料整理阶段。现在主要缺征信授权书和近6个月经营流水，补齐后我会继续复核材料包，并同步下一步处理结果。',
    },
  },

  onPhoneCall() {
    const phone = this.data.advisor.phone
    wx.makePhoneCall({
      phoneNumber: phone,
      fail: () => {
        wx.showToast({ title: '拨号失败', icon: 'error' })
      },
    })
  },

  onWechatTap() {
    wx.showToast({ title: '已模拟打开微信聊天', icon: 'none' })
  },
})
