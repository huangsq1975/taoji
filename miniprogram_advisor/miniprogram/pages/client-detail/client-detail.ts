const API_BASE = 'http://localhost:3000/api/v1'

interface ApiCustomer {
  id: number
  name: string
  status?: string
  docCompleteness?: number
  contactName?: string | null
  contactPhone?: string | null
  financingNeed?: string | null
  loanPurpose?: string | null
  loanAmount?: number | null
  aiSummary?: string | null
  riskNotes?: string | null
  advisorName?: string | null
  labels?: string[]
}

interface ApiDocument {
  id: number
  fileName: string
  docType: string
  aiParseStatus: string
  fileSize?: number
  createdAt?: string
}

interface ApiFollowUp {
  id: number
  type: string
  content: string
  createdAt: string
  advisorName: string | null
}

interface DocTypeOption {
  label: string
  value: string
  icon: string
}

interface FollowUpTypeOption {
  label: string
  value: string
}

const DOC_TYPES: DocTypeOption[] = [
  { label: '营业执照', value: 'BUSINESS_LICENSE', icon: '🏢' },
  { label: '银行流水', value: 'BANK_STATEMENT', icon: '🏦' },
  { label: '征信报告', value: 'CREDIT_REPORT', icon: '📊' },
  { label: '税务发票', value: 'TAX_INVOICE', icon: '🧾' },
  { label: '房产证', value: 'PROPERTY_CERT', icon: '🏠' },
  { label: '身份证', value: 'ID_CARD', icon: '💳' },
  { label: '财务报表', value: 'FINANCIAL_STATEMENT', icon: '📈' },
  { label: '其他', value: 'OTHER', icon: '📎' },
]

const FOLLOW_UP_TYPES: FollowUpTypeOption[] = [
  { label: '跟进备注', value: 'NOTE' },
  { label: '补件请求', value: 'SUPPLEMENT_REQUEST' },
  { label: '银行提交', value: 'BANK_SUBMIT' },
]

const DOC_TYPE_LABELS: Record<string, string> = {
  BUSINESS_LICENSE: '营业执照', BANK_STATEMENT: '银行流水', CREDIT_REPORT: '征信报告',
  TAX_INVOICE: '税务发票', PROPERTY_CERT: '房产证', ID_CARD: '身份证',
  FINANCIAL_STATEMENT: '财务报表', OTHER: '其他',
}

const PARSE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'AI识别中', PROCESSING: '解析中', DONE: '已完成', FAILED: '识别失败',
}

const STATUS_LABELS: Record<string, string> = {
  COLLECTING: '资料收集中',
  REVIEWING: '资料审核中',
  REPORTING: 'AI填表中',
  SUBMITTED: '已提交银行',
  DONE: '已完结',
  PAUSED: '已暂停',
}

const FOLLOW_UP_TYPE_LABELS: Record<string, string> = {
  NOTE: '跟进备注',
  SUPPLEMENT_REQUEST: '补件请求',
  BANK_SUBMIT: '银行提交',
  BANK_FEEDBACK: '银行反馈',
  SYSTEM: '系统通知',
}

function formatLoanAmount(amount: number | null | undefined): string {
  if (!amount) return ''
  if (amount >= 100000000) return (amount / 100000000).toFixed(1).replace('.0', '') + '亿元'
  if (amount >= 10000) return Math.round(amount / 10000) + '万元'
  return amount + '元'
}

function formatTime(isoStr: string): string {
  // "2026-06-23T10:30:00" → "06-23 10:30"
  return isoStr.replace('T', ' ').slice(5, 16)
}

Page({
  data: {
    customerId: 0,
    customer: null as ApiCustomer | null,
    statusLabel: '',
    loanAmountLabel: '',
    documents: [] as ApiDocument[],
    loadingDocs: false,
    followUps: [] as ApiFollowUp[],
    followUpTypeLabels: FOLLOW_UP_TYPE_LABELS,
    // Upload flow
    uploadSheetVisible: false,
    docTypeSheetVisible: false,
    docTypes: DOC_TYPES,
    pendingFilePath: '',
    pendingFileName: '',
    uploading: false,
    docTypeLabels: DOC_TYPE_LABELS,
    parseStatusLabels: PARSE_STATUS_LABELS,
    // Add follow-up
    addFollowUpVisible: false,
    followUpTypes: FOLLOW_UP_TYPES,
    selectedFollowUpTypeIdx: 0,
    followUpContent: '',
    submittingFollowUp: false,
  },

  onLoad(options: Record<string, string>) {
    const id = parseInt(options['id'] || '0', 10)
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      return
    }
    this.setData({ customerId: id })
    this.loadCustomer(id)
    this.loadDocuments(id)
    this.loadFollowUps(id)
  },

  onShow() {
    const id = this.data.customerId
    if (id) {
      this.loadDocuments(id)
      this.loadFollowUps(id)
    }
  },

  loadCustomer(id: number) {
    const token = wx.getStorageSync('token') as string
    wx.request({
      url: `${API_BASE}/customers/${id}`,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as { data?: ApiCustomer }
        const c = payload.data
        if (c) {
          this.setData({
            customer: c,
            statusLabel: STATUS_LABELS[c.status ?? ''] ?? c.status ?? '',
            loanAmountLabel: formatLoanAmount(c.loanAmount),
          })
        }
      },
      fail: () => {
        wx.showToast({ title: '加载客户信息失败', icon: 'none' })
      },
    })
  },

  loadDocuments(id: number) {
    this.setData({ loadingDocs: true })
    const token = wx.getStorageSync('token') as string
    wx.request({
      url: `${API_BASE}/customers/${id}/documents`,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as { data?: ApiDocument[] }
        this.setData({ documents: payload.data || [], loadingDocs: false })
      },
      fail: () => {
        this.setData({ loadingDocs: false })
      },
    })
  },

  loadFollowUps(id: number) {
    const token = wx.getStorageSync('token') as string
    wx.request({
      url: `${API_BASE}/customers/${id}/follow-ups`,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as { data?: ApiFollowUp[] }
        const followUps = (payload.data || []).map(f => ({
          ...f,
          createdAt: formatTime(f.createdAt),
        }))
        this.setData({ followUps })
      },
      fail: () => { /* silent */ },
    })
  },

  onBankTap() {
    const id = this.data.customerId
    if (id) wx.navigateTo({ url: '/pages/bank/bank?customerId=' + id })
  },

  onRemindTap() {
    const idx = FOLLOW_UP_TYPES.findIndex(t => t.value === 'SUPPLEMENT_REQUEST')
    this.setData({ addFollowUpVisible: true, selectedFollowUpTypeIdx: idx >= 0 ? idx : 0, followUpContent: '' })
  },

  // ─── Upload flow ─────────────────────────────────────────────────────────────

  onUploadTap() {
    this.setData({ uploadSheetVisible: true })
  },

  onUploadSheetClose() {
    this.setData({ uploadSheetVisible: false })
  },

  onUploadChoose(e: WechatMiniprogram.TouchEvent) {
    const type = e.currentTarget.dataset['type'] as string
    this.setData({ uploadSheetVisible: false })

    const showDocTypeSheet = (filePath: string, fileName: string) => {
      this.setData({ pendingFilePath: filePath, pendingFileName: fileName, docTypeSheetVisible: true })
    }

    if (type === 'camera') {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['camera'],
        success: (res: WechatMiniprogram.ChooseMediaSuccessCallbackResult) => {
          showDocTypeSheet(res.tempFiles[0].tempFilePath, `拍照_${Date.now()}.jpg`)
        },
        fail: () => { /* user cancelled */ },
      })
    } else if (type === 'local') {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album'],
        success: (res: WechatMiniprogram.ChooseMediaSuccessCallbackResult) => {
          showDocTypeSheet(res.tempFiles[0].tempFilePath, `图片_${Date.now()}.jpg`)
        },
        fail: () => { /* user cancelled */ },
      })
    } else if (type === 'wechat') {
      wx.chooseMessageFile({
        count: 1,
        type: 'file',
        success: (res: WechatMiniprogram.ChooseMessageFileSuccessCallbackResult) => {
          showDocTypeSheet(res.tempFiles[0].path, res.tempFiles[0].name)
        },
        fail: () => { /* user cancelled */ },
      })
    }
  },

  onDocTypeSheetClose() {
    this.setData({ docTypeSheetVisible: false, pendingFilePath: '', pendingFileName: '' })
  },

  onDocTypeSelect(e: WechatMiniprogram.TouchEvent) {
    const docType = e.currentTarget.dataset['value'] as string
    const docLabel = e.currentTarget.dataset['label'] as string
    const customerId = this.data.customerId

    this.setData({ docTypeSheetVisible: false, uploading: true })
    wx.showLoading({ title: '上传中...' })

    const token = wx.getStorageSync('token') as string
    wx.uploadFile({
      url: `${API_BASE}/documents/upload`,
      filePath: this.data.pendingFilePath,
      name: 'file',
      formData: { docType, customerId: String(customerId) },
      header: { Authorization: `Bearer ${token}` },
      success: (res: WechatMiniprogram.UploadFileSuccessCallbackResult) => {
        wx.hideLoading()
        this.setData({ uploading: false, pendingFilePath: '', pendingFileName: '' })
        let parsed: { statusCode?: number } = {}
        try {
          parsed = JSON.parse(res.data) as { statusCode?: number }
        } catch {
          // ignore parse error
        }
        if (res.statusCode === 200 && parsed.statusCode === 200) {
          wx.showToast({ title: `${docLabel}上传成功`, icon: 'success' })
          this.loadDocuments(customerId)
        } else {
          wx.showToast({ title: '上传失败，请重试', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        this.setData({ uploading: false, pendingFilePath: '', pendingFileName: '' })
        wx.showToast({ title: '上传失败，请检查网络', icon: 'none' })
      },
    })
  },

  // ─── Follow-up ────────────────────────────────────────────────────────────────

  onAddFollowUpTap() {
    this.setData({ addFollowUpVisible: true, selectedFollowUpTypeIdx: 0, followUpContent: '' })
  },

  onFollowUpClose() {
    this.setData({ addFollowUpVisible: false, followUpContent: '' })
  },

  onFollowUpTypeChange(e: WechatMiniprogram.PickerChange) {
    this.setData({ selectedFollowUpTypeIdx: Number(e.detail.value) })
  },

  onFollowUpContentInput(e: WechatMiniprogram.Input) {
    this.setData({ followUpContent: e.detail.value })
  },

  onSubmitFollowUp() {
    const content = this.data.followUpContent.trim()
    if (!content) {
      wx.showToast({ title: '请填写跟进内容', icon: 'none' })
      return
    }
    if (this.data.submittingFollowUp) return
    const type = this.data.followUpTypes[this.data.selectedFollowUpTypeIdx].value
    const token = wx.getStorageSync('token') as string
    this.setData({ submittingFollowUp: true })
    wx.showLoading({ title: '提交中...' })
    wx.request({
      url: `${API_BASE}/customers/${this.data.customerId}/follow-ups`,
      method: 'POST',
      header: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { type, content },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        wx.hideLoading()
        this.setData({ submittingFollowUp: false })
        const payload = res.data as { statusCode?: number }
        if (res.statusCode === 200 && payload.statusCode === 200) {
          wx.showToast({ title: '已添加', icon: 'success' })
          this.setData({ addFollowUpVisible: false, followUpContent: '', selectedFollowUpTypeIdx: 0 })
          this.loadFollowUps(this.data.customerId)
        } else {
          wx.showToast({ title: '提交失败，请重试', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        this.setData({ submittingFollowUp: false })
        wx.showToast({ title: '提交失败，请检查网络', icon: 'none' })
      },
    })
  },
})
