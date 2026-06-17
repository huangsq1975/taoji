import { mockNotifications, NotifyItem } from '../../utils/mock'

Page({
  data: {
    notifications: mockNotifications as NotifyItem[],
  },

  onMarkRead(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset['id'] as string
    const notifications = this.data.notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    )
    this.setData({ notifications })
  },
})
