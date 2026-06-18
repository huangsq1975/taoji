import { getToken, clearAuth } from './auth'

const BASE = '/api/v1'

interface ApiResult<T = unknown> {
  statusCode: number
  message: string
  data: T
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    clearAuth()
    window.location.href = '/login'
    throw new Error('未授权，请重新登录')
  }

  const json: ApiResult<T> = await res.json()

  if (!res.ok) {
    throw new Error(json.message || `请求失败 (${res.status})`)
  }

  return json.data
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}

// Auth
export interface LoginResponse {
  token: string
  userId: number
  name: string
  role: string
  phone: string
  institutionId: number
  institutionName: string
}

export function loginApi(phone: string, password: string) {
  return api.post<LoginResponse>('/auth/login', { phone, password })
}

// Pagination
export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Customers
export interface ApiCustomer {
  id: number
  institutionId: number
  advisorId: number | null
  advisorName: string | null
  name: string
  contactName: string | null
  contactPhone: string | null
  financingNeed: string | null
  loanPurpose: string | null
  loanAmount: number | null
  status: 'COLLECTING' | 'REVIEWING' | 'REPORTING' | 'SUBMITTED' | 'DONE' | 'PAUSED'
  docCompleteness: number
  aiSummary: string | null
  riskNotes: string | null
  createdAt: string
  updatedAt: string
  labels: string[]
}

export interface CreateCustomerRequest {
  name: string
  contactName?: string
  contactPhone?: string
  financingNeed?: string
  loanAmount?: number
  loanPurpose?: string
  advisorId?: number
}

export function listCustomers(params: {
  keyword?: string
  status?: string
  page?: number
  pageSize?: number
}) {
  const qs = new URLSearchParams()
  if (params.keyword) qs.set('keyword', params.keyword)
  if (params.status) qs.set('status', params.status)
  if (params.page) qs.set('page', String(params.page))
  if (params.pageSize) qs.set('pageSize', String(params.pageSize))
  const q = qs.toString()
  return api.get<PaginatedResult<ApiCustomer>>(`/customers${q ? '?' + q : ''}`)
}

export function createCustomer(body: CreateCustomerRequest) {
  return api.post<ApiCustomer>('/customers', body)
}

export function getCustomer(id: number | string) {
  return api.get<ApiCustomer>(`/customers/${id}`)
}

export function updateCustomer(id: number | string, body: Partial<CreateCustomerRequest> & { status?: string; aiSummary?: string; riskNotes?: string; labels?: string[] }) {
  return api.put<ApiCustomer>(`/customers/${id}`, body)
}

// Customer overview counts
export interface CustomerOverview {
  customer: ApiCustomer
  docCount: number
  followUpCount: number
  authSignedCount: number
  reportCount: number
}

export function getCustomerOverview(id: number | string) {
  return api.get<CustomerOverview>(`/customers/${id}/overview`)
}

// Documents
export interface ApiDocument {
  id: number
  customerId: number
  customerName?: string
  uploaderId: number | null
  uploaderType: string
  uploaderName?: string | null
  docType: string
  aiDocType?: string | null
  confidence?: number | null
  fileName: string
  fileUrl: string
  fileSize: number | null
  mimeType: string | null
  aiParseStatus: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED'
  aiParsedAt: string | null
  createdAt: string
}

export function listDocuments(customerId: number | string) {
  return api.get<ApiDocument[]>(`/customers/${customerId}/documents`)
}

export function listAllDocuments(params: {
  aiParseStatus?: string
  customerId?: number
  page?: number
  pageSize?: number
}) {
  const qs = new URLSearchParams()
  if (params.aiParseStatus) qs.set('aiParseStatus', params.aiParseStatus)
  if (params.customerId) qs.set('customerId', String(params.customerId))
  if (params.page) qs.set('page', String(params.page))
  if (params.pageSize) qs.set('pageSize', String(params.pageSize))
  const q = qs.toString()
  return api.get<PaginatedResult<ApiDocument>>(`/documents${q ? '?' + q : ''}`)
}

export function confirmDocument(id: number, docType?: string) {
  return api.post<ApiDocument>(`/documents/${id}/confirm`, { docType })
}

export function retryParseDocument(id: number) {
  return api.post<ApiDocument>(`/documents/${id}/retry`, {})
}

export function deleteDocument(id: number) {
  return api.delete<void>(`/documents/${id}`)
}

export function uploadDocument(customerId: number, docType: string, file: File) {
  const token = getToken()
  const form = new FormData()
  form.append('customerId', String(customerId))
  form.append('docType', docType)
  form.append('file', file)
  return fetch('/api/v1/documents/upload', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  }).then(async r => {
    const json = await r.json()
    if (!r.ok) throw new Error(json.message || '上传失败')
    return json.data as ApiDocument
  })
}

// Follow-ups
export interface ApiFollowUp {
  id: number
  type: string
  content: string
  createdAt: string
  advisorName: string | null
}

export function listFollowUps(customerId: number | string) {
  return api.get<ApiFollowUp[]>(`/customers/${customerId}/follow-ups`)
}

export function addFollowUp(customerId: number | string, body: { type: string; content: string }) {
  return api.post<ApiFollowUp>(`/customers/${customerId}/follow-ups`, body)
}

// Report tasks (snake_case - jOOQ fetchMaps returns DB column names)
export interface ApiReportTask {
  id: number
  institution_id: number
  customer_id: number
  customer_name: string
  advisor_id: number | null
  advisor_name: string | null
  product_id: number
  product_name: string
  bank_short_name: string
  status: string
  issue_count: number
  export_url: string | null
  created_at: string
  updated_at: string
}

export interface ApiFieldDraft {
  id: number
  task_id: number
  field_key: string
  field_label: string
  ai_value: string | null
  final_value: string | null
  source_hint: string | null
  ai_status: 'ok' | 'issue' | 'missing' | 'needs_review'
  ai_note: string | null
  review_status: 'pending' | 'approved' | 'corrected' | 'rejected'
  reviewed_by: number | null
  reviewed_at: string | null
}

export interface ReviewFieldBody {
  fieldId: number
  reviewStatus: 'approved' | 'corrected' | 'rejected'
  finalValue?: string
  reviewNote?: string
}

export function listReportTasks(params: { customerId?: number; status?: string; page?: number; pageSize?: number }) {
  const qs = new URLSearchParams()
  if (params.customerId) qs.set('customerId', String(params.customerId))
  if (params.status) qs.set('status', params.status)
  if (params.page) qs.set('page', String(params.page))
  if (params.pageSize) qs.set('pageSize', String(params.pageSize))
  const q = qs.toString()
  return api.get<PaginatedResult<ApiReportTask>>(`/reports${q ? '?' + q : ''}`)
}

export function getReportTask(id: number | string) {
  return api.get<ApiReportTask>(`/reports/${id}`)
}

export function getReportFields(id: number | string) {
  return api.get<ApiFieldDraft[]>(`/reports/${id}/fields`)
}

export function reviewField(id: number | string, body: ReviewFieldBody) {
  return api.post<ApiFieldDraft>(`/reports/${id}/review`, body)
}

export function exportReport(id: number | string) {
  return api.post<ApiReportTask>(`/reports/${id}/export`, {})
}

export function createReportTask(body: { customerId: number; productId: number }) {
  return api.post<ApiReportTask>('/reports', body)
}

// Banks
export interface ApiBank {
  id: number
  name: string
  shortName: string
  sortOrder: number
}

export interface ApiProduct {
  id: number
  bankId: number
  bankName: string
  name: string
  productType: string
}

export function listBanks() {
  return api.get<ApiBank[]>('/banks')
}

export function listBankProducts(bankId?: number) {
  const qs = bankId ? `?bankId=${bankId}` : ''
  return api.get<ApiProduct[]>(`/banks/products${qs}`)
}
