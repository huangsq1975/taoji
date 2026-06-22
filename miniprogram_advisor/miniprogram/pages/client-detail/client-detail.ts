const API_BASE = 'http://localhost:3000/api/v1'

interface ApiCustomer {
  id: number
  name: string
  status?: string
  docCompleteness?: number
  contactName?: string
  contactPhone?: string
  financingNeed?: string
  loanAmount?: number
  aiSummary?: string
  riskNotes?: string
}

interface ApiDocument {
  id: number
  fileName: string
  docType: string
  aiParseStatus: string
  fileSize?: number
  createdAt?: string
}

interface DocTypeOption {
  label: string
  value: string
  icon: string
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

const DOC_TYPE_LABELS: Record<string, string> = {
  BUSINESS_LICENSE: '营业执照', BANK_STATEMENT: '银行流水', CREDIT_REPORT: '征信报告',
  TAX_INVOICE: '税务发票', PROPERTY_CERT: '房产证', ID_CARD: '身份证',
  FINANCIAL_STATEMENT: '财务报表', OTHER: '其他',
}

const PARSE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'AI识别中', PROCESSING: '解析中', DONE: '已完成', FAILED: '识别失败',
}

Page({
  data: {
    customerId: 0,
    customer: null as ApiCustomer | null,
    documents: [] as ApiDocument[],
    loadingDocs: false,
    uploadSheetVisible: false,
    docTypeSheetVisible: false,
    docTypes: DOC_TYPES,
    pendingFilePath: '',
    pendingFileName: '',
    uploading: false,
    docTypeLabels: DOC_TYPE_LABELS,
    parseStatusLabels: PARSE_STATUS_LABELS,
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
  },

  onShow() {
    const id = this.data.customerId
    if (id) this.loadDocuments(id)
  },

  loadCustomer(id: number) {
    const token = wx.getStorageSync('token') as string
    wx.request({
      url: `${API_BASE}/customers/${id}`,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        const payload = res.data as { data?: ApiCustomer }
        if (payload.data) {
          this.setData({ customer: payload.data })
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

  onBankTap() {
    const id = this.data.customerId
    if (id) wx.navigateTo({ url: '/pages/bank/bank?customerId=' + id })
  },

  onRemindTap() {
    wx.showToast({ title: '已发送资料缺口提醒', icon: 'success' })
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
})
