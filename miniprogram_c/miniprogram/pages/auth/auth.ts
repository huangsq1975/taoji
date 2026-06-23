import { API_BASE } from '../../utils/config'

interface AuthItem {
  authType: string
  name: string
  desc: string
  status: 'authorized' | 'pending' | 'not_applied'
  statusLabel: string
  target: string
  time: string
}

const app = getApp<IAppOption>()

Page({
  data: {
    authItems: [] as AuthItem[],
    loading: true,
  },

  onLoad() {
    if (app.globalData.loginDone) {
      this.loadAuthorizations()
    } else {
      app.loginReadyCallback = () => this.loadAuthorizations()
    }
  },

  onShow() {
    if (app.globalData.loginDone) {
      this.loadAuthorizations()
    }
  },

  loadAuthorizations() {
    const token = app.globalData.token
    if (!token) {
      this.setData({ loading: false })
      return
    }
    wx.request({
      url: `${API_BASE}/c/authorizations`,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as { data?: AuthItem[] }
        this.setData({ authItems: payload.data ?? [], loading: false })
      },
      fail: () => {
        this.setData({ loading: false })
        wx.showToast({ title: '加载失败，请重试', icon: 'none' })
      },
    })
  },

  onRevokeAuth(e: WechatMiniprogram.TouchEvent) {
    const authType = e.currentTarget.dataset['authType'] as string
    const name = e.currentTarget.dataset['name'] as string
    wx.showModal({
      title: '撤销授权',
      content: `确定要撤销"${name}"吗？`,
      success: (res) => {
        if (!res.confirm) return
        const token = app.globalData.token
        if (!token) return
        wx.request({
          url: `${API_BASE}/c/authorizations/${authType}/revoke`,
          method: 'POST',
          header: { Authorization: `Bearer ${token}` },
          success: () => {
            wx.showToast({ title: '已撤销授权', icon: 'success' })
            this.loadAuthorizations()
          },
          fail: () => {
            wx.showToast({ title: '撤销失败，请重试', icon: 'none' })
          },
        })
      },
    })
  },

  onApplyAuth(e: WechatMiniprogram.TouchEvent) {
    const authType = e.currentTarget.dataset['authType'] as string
    const name = e.currentTarget.dataset['name'] as string
    wx.showModal({
      title: '发起授权',
      content: `确认发起"${name}"申请？`,
      success: (res) => {
        if (!res.confirm) return
        const token = app.globalData.token
        if (!token) return
        wx.request({
          url: `${API_BASE}/c/authorizations/${authType}/apply`,
          method: 'POST',
          header: { Authorization: `Bearer ${token}` },
          success: () => {
            wx.showToast({ title: '授权申请已提交', icon: 'success' })
            this.loadAuthorizations()
          },
          fail: () => {
            wx.showToast({ title: '申请失败，请重试', icon: 'none' })
          },
        })
      },
    })
  },

  onUploadAuth(e: WechatMiniprogram.TouchEvent) {
    const authType = e.currentTarget.dataset['authType'] as string
    const token = app.globalData.token
    if (!token) return

    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res: WechatMiniprogram.ChooseMessageFileSuccessCallbackResult) => {
        const f = res.tempFiles[0]
        wx.showLoading({ title: '上传中…', mask: true })
        wx.uploadFile({
          url: `${API_BASE}/c/authorizations/${authType}/upload`,
          filePath: f.path,
          name: 'file',
          header: { Authorization: `Bearer ${token}` },
          success: (uploadRes: WechatMiniprogram.UploadFileSuccessCallbackResult) => {
            wx.hideLoading()
            let parsed: { statusCode?: number } = {}
            try { parsed = JSON.parse(uploadRes.data) as { statusCode?: number } } catch { /* ignore */ }
            if (uploadRes.statusCode === 200 && parsed.statusCode === 200) {
              wx.showToast({ title: '上传成功', icon: 'success' })
              this.loadAuthorizations()
            } else {
              wx.showToast({ title: '上传失败，请重试', icon: 'none' })
            }
          },
          fail: () => {
            wx.hideLoading()
            wx.showToast({ title: '上传失败，请检查网络', icon: 'none' })
          },
        })
      },
      fail: () => { /* user cancelled */ },
    })
  },
})
