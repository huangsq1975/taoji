import { mockProgressSteps, mockPendingDocs, ProgressStep, PendingDoc } from '../../utils/mock'

Page({
  data: {
    currentStage: '银行材料整理中',
    blocker: '征信授权文件待补充、银行材料包待顾问复核',
    nextStep: '补充授权文件后，由顾问复核材料包',
    steps: mockProgressSteps as ProgressStep[],
    pendingDocs: mockPendingDocs as PendingDoc[],
    advisorMessage: '陈总，当前主要卡在征信授权文件和近6个月经营流水。您先补齐这两项，我这边会继续复核银行材料包，并把下一步处理结果同步到进度里。',
    uploadSheetVisible: false,
  },

  onUploadTap() {
    this.setData({ uploadSheetVisible: true })
  },

  onUploadSheetClose() {
    this.setData({ uploadSheetVisible: false })
  },

  onUploadChoose(e: WechatMiniprogram.TouchEvent) {
    const type = e.currentTarget.dataset['type'] as string
    this.setData({ uploadSheetVisible: false })
    wx.showToast({ title: `已选择${type === 'camera' ? '拍照' : type === 'local' ? '本地文件' : '微信文件'}`, icon: 'success' })
  },
})
