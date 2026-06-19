import { useState, FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { loginApi } from '../../utils/api'
import { saveAuth } from '../../utils/auth'
import './Login.css'

const DEMO_PHONE = '13800000000'
const DEMO_PASSWORD = '123456'

// Mock fallback for when backend is not running
async function mockLogin(phone: string, password: string) {
  await new Promise(r => setTimeout(r, 600))
  if (phone === DEMO_PHONE && password === DEMO_PASSWORD) {
    return {
      token: 'mock-jwt-token',
      userId: 1,
      name: '系统管理员',
      role: 'ADMIN',
      phone,
      institutionId: 1,
      institutionName: '韬纪元演示机构',
    }
  }
  throw new Error('账号或密码错误')
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [phoneErr, setPhoneErr] = useState('')
  const [passwordErr, setPasswordErr] = useState('')
  const [globalErr, setGlobalErr] = useState('')
  const [loading, setLoading] = useState(false)

  function validate(): boolean {
    let ok = true
    setPhoneErr('')
    setPasswordErr('')
    setGlobalErr('')
    if (!phone.trim()) {
      setPhoneErr('请输入手机号')
      ok = false
    } else if (!/^1\d{10}$/.test(phone.trim())) {
      setPhoneErr('请输入正确的手机号格式')
      ok = false
    }
    if (!password) {
      setPasswordErr('请输入密码')
      ok = false
    }
    return ok
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      let data
      try {
        // Try real backend first
        data = await loginApi(phone.trim(), password)
      } catch (apiErr) {
        // Fallback to mock if backend unreachable (fetch failed entirely)
        if (apiErr instanceof TypeError && apiErr.message.includes('fetch')) {
          data = await mockLogin(phone.trim(), password)
        } else {
          throw apiErr
        }
      }

      saveAuth({
        token: data.token,
        userId: data.userId,
        name: data.name,
        role: data.role,
        phone: data.phone,
        institutionId: data.institutionId,
        institutionName: data.institutionName,
      })
      navigate(from, { replace: true })
    } catch (err) {
      setGlobalErr(err instanceof Error ? err.message : '登录失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Left brand panel */}
      <div className="login-brand">
        <div className="login-brand-top">
          <div className="login-brand-logo">
            <div className="login-brand-icon">韬</div>
            <div>
              <div className="login-brand-name">韬纪元AI</div>
              <div className="login-brand-sub">助贷报告生产平台</div>
            </div>
          </div>

          <div className="login-brand-headline">
            AI驱动的<br />
            <em>智能助贷</em>工作台
          </div>
          <div className="login-brand-desc">
            资料识别 · 360客户画像 · AI自动填表<br />
            一键导出材料包，提升贷款顾问作业效率
          </div>
        </div>

        <div className="login-brand-features">
          <div className="login-feature-item">
            <div className="login-feature-icon">🔍</div>
            <div className="login-feature-text">AI资料识别，自动提取关键字段</div>
          </div>
          <div className="login-feature-item">
            <div className="login-feature-icon">📋</div>
            <div className="login-feature-text">银行制式表格智能填写与复核</div>
          </div>
          <div className="login-feature-item">
            <div className="login-feature-icon">📦</div>
            <div className="login-feature-text">一键打包材料，ZIP导出提交</div>
          </div>
        </div>

        <div className="login-brand-bottom">
          © 2026 韬纪元AI · AI输出仅供参考，须顾问复核后提交
        </div>
      </div>

      {/* Right form panel */}
      <div className="login-form-panel">
        <div className="login-form-box">
          <div className="login-form-title">欢迎回来</div>
          <div className="login-form-subtitle">登录您的韬纪元AI账号以继续</div>

          {globalErr && (
            <div className="login-global-error">{globalErr}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="login-field">
              <label htmlFor="phone">手机号</label>
              <input
                id="phone"
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className={phoneErr ? 'error' : ''}
                autoComplete="username"
                maxLength={11}
              />
              {phoneErr && <div className="login-error">{phoneErr}</div>}
            </div>

            <div className="login-field">
              <label htmlFor="password">密码</label>
              <input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={passwordErr ? 'error' : ''}
                autoComplete="current-password"
              />
              {passwordErr && <div className="login-error">{passwordErr}</div>}
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? '登录中…' : '登 录'}
            </button>
          </form>

          <div className="login-footer">
            AI生成结果仅供参考，最终以顾问审核为准
          </div>
        </div>
      </div>
    </div>
  )
}
