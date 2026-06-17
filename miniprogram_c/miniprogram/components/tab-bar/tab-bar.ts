type TabName = 'chat' | 'progress' | 'notify' | 'mine'

interface TabItem {
  name: TabName
  label: string
  icon: string
  path: string
}

Component({
  properties: {
    activeTab: {
      type: String,
      value: 'chat',
    },
  },
  data: {
    tabs: [
      { name: 'chat', label: 'AI对话', icon: '💬', path: '/pages/chat/chat' },
      { name: 'progress', label: '进度', icon: '📋', path: '/pages/progress/progress' },
      { name: 'notify', label: '通知', icon: '🔔', path: '/pages/notify/notify' },
      { name: 'mine', label: '我的', icon: '👤', path: '/pages/mine/mine' },
    ] as TabItem[],
  },
  methods: {
    onTabTap(e: WechatMiniprogram.TouchEvent) {
      const tab = e.currentTarget.dataset['tab'] as TabItem
      if (tab.name === this.properties.activeTab) return
      wx.redirectTo({ url: tab.path })
    },
  },
})
