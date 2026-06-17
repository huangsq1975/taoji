import { mockAuthItems, AuthItem } from '../../utils/mock'

Page({
  data: {
    authItems: mockAuthItems as AuthItem[],
  },

  onRevokeAuth(e: WechatMiniprogram.TouchEvent) {
    const name = e.currentTarget.dataset['name'] as string
    wx.showModal({
      title: '撤销授权',
      content: `确定要撤销"${name}"吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '已撤销授权', icon: 'success' })
        }
      },
    })
  },

  onApplyAuth(e: WechatMiniprogram.TouchEvent) {
    const name = e.currentTarget.dataset['name'] as string
    wx.showToast({ title: `已发起${name}申请`, icon: 'success' })
  },

  onUploadAuth() {
    wx.showToast({ title: '请上传授权文件', icon: 'none' })
  },
})
