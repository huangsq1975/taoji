import { Navigate, useLocation } from 'react-router-dom'
import { isLoggedIn } from '../utils/auth'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  if (!isLoggedIn()) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}
