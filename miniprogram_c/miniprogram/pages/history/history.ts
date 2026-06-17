import { mockHistory, HistoryItem } from '../../utils/mock'

Page({
  data: {
    historyList: mockHistory as HistoryItem[],
  },

  onItemTap(e: WechatMiniprogram.TouchEvent) {
    const title = e.currentTarget.dataset['title'] as string
    wx.showToast({ title: `加载：${title}`, icon: 'none' })
  },
})
