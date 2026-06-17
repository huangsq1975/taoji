import { mockCustomers, mockNotifications, NotifyItem } from '../../utils/mock'

const app = getApp<IAppOption>()

Page({
  data: {
    advisor: { name: '张顾问', role: '高级助贷顾问', institution: '韬纪元AI合作顾问团队', status: '在线' },
    totalClients: mockCustomers.length,
    pendingClients: mockCustomers.filter(c => c.complete < 80).length,
    reviewClients: mockCustomers.filter(c => c.stage === '顾问复核').length,
    notifications: mockNotifications as NotifyItem[],
    quotaRemaining: 286,
    quotaFill: 12,
    quotaExport: 18,
  },

  onLoad() {
    const info = app.globalData.advisorInfo
    if (info) {
      this.setData({ advisor: { name: info.name, role: info.role, institution: info.institutionName, status: '在线' } })
    }
  },

  onClientsTap() {
    wx.navigateTo({ url: '/pages/clients/clients' })
  },
})
