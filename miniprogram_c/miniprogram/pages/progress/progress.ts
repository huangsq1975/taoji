import { API_BASE } from '../../utils/config'

// Customer status → ordered pipeline stages
// DB enum: COLLECTING | REVIEWING | REPORTING | SUBMITTED | DONE | PAUSED
const STAGE_ORDER = ['COLLECTING', 'REVIEWING', 'REPORTING', 'SUBMITTED', 'DONE']

const STAGE_LABELS: Record<string, string> = {
  COLLECTING: '资料收集',
  REVIEWING: 'AI资料分析',
  REPORTING: '银行材料整理',
  SUBMITTED: '提交银行',
  DONE: '办理完成',
  PAUSED: '暂停',
}

const STATUS_DESC: Record<string, { current: string; blocker: string; next: string }> = {
  COLLECTING: {
    current: '资料收集中',
    blocker: '请上传相关资料以推进流程',
    next: '完成资料上传后顾问进行AI分析',
  },
  REVIEWING: {
    current: 'AI资料分析中',
    blocker: 'AI正在识别和分析您上传的资料',
    next: 'AI分析完成后进入银行材料整理阶段',
  },
  REPORTING: {
    current: '银行材料整理中',
    blocker: '顾问正在整理银行材料包',
    next: '材料整理完成后将提交至银行',
  },
  SUBMITTED: {
    current: '已提交银行',
    blocker: '等待银行审核结果',
    next: '银行审核完成后顾问将同步结果',
  },
  DONE: {
    current: '办理完成',
    blocker: '',
    next: '如有疑问请联系您的顾问',
  },
  PAUSED: {
    current: '当前流程已暂停',
    blocker: '请联系顾问了解暂停原因',
    next: '顾问将协助您恢复办理流程',
  },
}

const DOC_TYPE_LABELS: Record<string, string> = {
  BUSINESS_LICENSE: '营业执照',
  BANK_STATEMENT: '银行流水',
  CREDIT_REPORT: '征信报告',
  TAX_INVOICE: '税务发票',
  PROPERTY_CERT: '房产证',
  ID_CARD: '身份证',
  FINANCIAL_STATEMENT: '财务报表',
  OTHER: '其他材料',
}

const AI_STATUS_LABELS: Record<string, string> = {
  PENDING: '待分析',
  PROCESSING: '分析中',
  DONE: '已解析',
  FAILED: '解析失败',
}

interface TimelineStep {
  label: string
  status: 'done' | 'current' | 'pending'
  time: string
}

interface UploadedDoc {
  docType: string
  docTypeLabel: string
  fileName: string
  aiParseStatus: string
  aiParseStatusLabel: string
  createdAt: string
}

interface FollowUp {
  advisorName: string
  content: string
  createdAt: string
}

const app = getApp<IAppOption>()

Page({
  data: {
    loading: true,
    currentStage: '',
    blocker: '',
    nextStep: '',
    steps: [] as TimelineStep[],
    uploadedDocs: [] as UploadedDoc[],
    latestFollowUp: null as FollowUp | null,
    advisorName: '',
  },

  onLoad() {
    if (app.globalData.loginDone) {
      this.loadProgress()
    } else {
      app.loginReadyCallback = () => this.loadProgress()
    }
  },

  onShow() {
    if (app.globalData.loginDone) {
      this.loadProgress()
    }
  },

  loadProgress() {
    const token = app.globalData.token
    wx.request({
      url: `${API_BASE}/c/progress`,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as {
          data?: {
            status?: string
            advisorName?: string
            documents?: Array<{
              doc_type: string
              file_name: string
              ai_parse_status: string
              created_at: string
            }>
            followUps?: Array<{
              advisor_name: string
              content: string
              created_at: string
            }>
          }
        }
        const d = payload.data
        if (!d) return
        this.renderProgress(d)
      },
      fail: () => {
        this.setData({ loading: false })
        wx.showToast({ title: '加载失败，请重试', icon: 'none' })
      },
    })
  },

  renderProgress(d: {
    status?: string
    advisorName?: string
    documents?: Array<{ doc_type: string; file_name: string; ai_parse_status: string; created_at: string }>
    followUps?: Array<{ advisor_name: string; content: string; created_at: string }>
  }) {
    const status = d.status ?? 'COLLECTING'
    const desc = STATUS_DESC[status] ?? STATUS_DESC['COLLECTING']
    const stageIdx = STAGE_ORDER.indexOf(status)

    // Build timeline steps
    const steps: TimelineStep[] = STAGE_ORDER.map((s, i) => {
      let stepStatus: 'done' | 'current' | 'pending'
      if (status === 'DONE') {
        stepStatus = 'done'
      } else if (i < stageIdx) {
        stepStatus = 'done'
      } else if (i === stageIdx) {
        stepStatus = 'current'
      } else {
        stepStatus = 'pending'
      }
      return { label: STAGE_LABELS[s], status: stepStatus, time: '' }
    })

    // Uploaded docs
    const uploadedDocs: UploadedDoc[] = (d.documents ?? []).map(doc => ({
      docType: doc.doc_type,
      docTypeLabel: DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type,
      fileName: doc.file_name,
      aiParseStatus: doc.ai_parse_status,
      aiParseStatusLabel: AI_STATUS_LABELS[doc.ai_parse_status] ?? doc.ai_parse_status,
      createdAt: (doc.created_at ?? '').replace('T', ' ').slice(0, 16),
    }))

    // Latest advisor message
    const firstFollowUp = (d.followUps ?? [])[0]
    const latestFollowUp: FollowUp | null = firstFollowUp
      ? {
          advisorName: firstFollowUp.advisor_name ?? '顾问',
          content: firstFollowUp.content,
          createdAt: (firstFollowUp.created_at ?? '').replace('T', ' ').slice(0, 16),
        }
      : null

    this.setData({
      loading: false,
      currentStage: desc.current,
      blocker: desc.blocker,
      nextStep: desc.next,
      steps,
      uploadedDocs,
      latestFollowUp,
      advisorName: d.advisorName ?? '',
    })
  },

  onUploadTap() {
    wx.navigateTo({ url: '/pages/chat/chat' })
  },
})
