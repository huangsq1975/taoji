import { mockUser } from '../../utils/mock'

Page({
  data: {
    user: mockUser,
  },

  onAdvisorTap() {
    wx.navigateTo({ url: '/pages/advisor/advisor' })
  },

  onAuthTap() {
    wx.navigateTo({ url: '/pages/auth/auth' })
  },

  onHistoryTap() {
    wx.navigateTo({ url: '/pages/history/history' })
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '已退出登录', icon: 'success' })
        }
      },
    })
  },
})
