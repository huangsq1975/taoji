export interface AuthUser {
  userId: number
  name: string
  role: string
  phone: string
  institutionId: number
  institutionName: string
  token: string
}

const KEY = 'taoji_auth'

export function saveAuth(user: AuthUser) {
  localStorage.setItem(KEY, JSON.stringify(user))
}

export function getAuth(): AuthUser | null {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function clearAuth() {
  localStorage.removeItem(KEY)
}

export function isLoggedIn(): boolean {
  return getAuth() !== null
}

export function getToken(): string | null {
  return getAuth()?.token ?? null
}

export function roleLabel(role: string): string {
  const map: Record<string, string> = {
    ADMIN: '管理员',
    SUPERVISOR: '主管',
    ADVISOR: '顾问',
  }
  return map[role] ?? role
}

/** 主管、管理员可访问管理后台；顾问不可 */
export function canAccessAdminPanel(): boolean {
  const role = getAuth()?.role
  return role === 'ADMIN' || role === 'SUPERVISOR'
}
