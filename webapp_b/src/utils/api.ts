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
