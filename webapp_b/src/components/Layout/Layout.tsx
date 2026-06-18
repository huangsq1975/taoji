import { useState, useCallback } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import AiAssistant from '../AiAssistant/AiAssistant'
import { getAuth, clearAuth, roleLabel } from '../../utils/auth'
import './Layout.css'

const navSections = [
  {
    label: '工作台',
    items: [{ to: '/dashboard', label: '工作台', icon: '⬡' }],
  },
  {
    label: '客户管理',
    items: [{ to: '/customers', label: '客户列表', icon: '👥' }],
  },
  {
    label: '资料作业中心',
    items: [
      { to: '/reports', label: '报告作业台', icon: '📋' },
      { to: '/parsing', label: 'AI资料识别', icon: '🔍' },
      { to: '/banks', label: '银行资料管理', icon: '🏦' },
    ],
  },
  {
    label: '管理后台',
    items: [
      { to: '/settings/templates', label: '平台配置', icon: '⚙️' },
      { to: '/settings/membership', label: '会员与套餐', icon: '💎' },
      { to: '/settings/usage', label: '调用记录', icon: '📊' },
      { to: '/settings/accounts', label: '机构账号', icon: '👤' },
      { to: '/settings/api', label: 'API配置', icon: '🔌' },
    ],
  },
]

const breadcrumbMap: Record<string, string[]> = {
  '/dashboard': ['工作台'],
  '/customers': ['客户管理', '客户列表'],
  '/reports': ['资料作业中心', '报告作业台'],
  '/parsing': ['资料作业中心', 'AI资料识别'],
  '/banks': ['资料作业中心', '银行资料管理'],
  '/settings/templates': ['管理后台', '平台配置'],
  '/settings/membership': ['管理后台', '会员与套餐'],
  '/settings/usage': ['管理后台', '调用记录'],
  '/settings/accounts': ['管理后台', '机构账号'],
  '/settings/api': ['管理后台', 'API配置'],
}

function getBreadcrumb(pathname: string): string[] {
  if (breadcrumbMap[pathname]) return breadcrumbMap[pathname]
  if (pathname.startsWith('/customers/')) return ['客户管理', '客户列表', '客户详情']
  if (pathname.startsWith('/reports/')) return ['资料作业中心', '报告作业台', '作业详情']
  if (pathname.startsWith('/banks/')) return ['资料作业中心', '银行资料管理', '银行详情']
  return ['工作台']
}

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const crumbs = getBreadcrumb(location.pathname)
  const [aiOpen, setAiOpen] = useState(false)
  const handlePanelChange = useCallback((open: boolean) => setAiOpen(open), [])

  const user = getAuth()
  const userName = user?.name ?? '未知用户'
  const userAvatar = userName.slice(-1)
  const userRoleLabel = user ? roleLabel(user.role) : ''
  const institutionName = user?.institutionName ?? ''

  function handleLogout() {
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">韬</div>
          <div className="sidebar-logo-text">
            <div className="sidebar-logo-main">韬纪元AI</div>
            <div className="sidebar-logo-sub">报告工作台</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navSections.map((section) => (
            <div key={section.label} className="nav-section">
              <div className="nav-section-label">{section.label}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    'nav-item' + (isActive ? ' nav-item-active' : '')
                  }
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{userAvatar}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{userName}</div>
              <div className="sidebar-user-role">{institutionName} · {userRoleLabel}</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>注销</button>
        </div>
      </aside>

      <div className={`main-wrapper${aiOpen ? ' main-wrapper-shifted' : ''}`}>
        <header className="topbar">
          <div className="breadcrumb">
            {crumbs.map((crumb, i) => (
              <span key={crumb} className="breadcrumb-item">
                {i > 0 && <span className="breadcrumb-sep">›</span>}
                <span className={i === crumbs.length - 1 ? 'breadcrumb-current' : 'breadcrumb-link'}>
                  {crumb}
                </span>
              </span>
            ))}
          </div>
          <div className="topbar-right">
            <div className="topbar-badge">
              <span className="topbar-badge-dot" />
              <span>3 待处理</span>
            </div>
            <div className="topbar-user">
              <div className="topbar-avatar">{userAvatar}</div>
              <span>{userName}</span>
            </div>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>

      <AiAssistant onPanelChange={handlePanelChange} />
    </div>
  )
}
