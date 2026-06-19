import { Navigate } from 'react-router-dom'
import { canAccessAdminPanel } from '../utils/auth'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  if (!canAccessAdminPanel()) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}
