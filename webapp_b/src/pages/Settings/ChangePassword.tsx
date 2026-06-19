import { useState } from 'react'
import { changePasswordApi } from '../../utils/api'
import './Settings.css'

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit() {
    setErr('')
    if (!oldPassword.trim()) { setErr('请输入当前密码'); return }
    if (newPassword.length < 6) { setErr('新密码长度至少 6 位'); return }
    if (newPassword !== confirmPassword) { setErr('两次输入的新密码不一致'); return }
    setLoading(true)
    try {
      await changePasswordApi({ oldPassword, newPassword })
      setSuccess(true)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : '修改失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">修改密码</h1>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#166534', fontSize: 14 }}>
            密码修改成功，请在下次登录时使用新密码。
          </div>
        )}

        <div className="form-field" style={{ marginBottom: 16 }}>
          <label className="form-label">当前密码<span className="required">*</span></label>
          <input
            className="form-input"
            type="password"
            value={oldPassword}
            onChange={e => { setOldPassword(e.target.value); setSuccess(false); setErr('') }}
            placeholder="请输入当前密码"
            autoComplete="current-password"
          />
        </div>

        <div className="form-field" style={{ marginBottom: 16 }}>
          <label className="form-label">新密码<span className="required">*</span></label>
          <input
            className="form-input"
            type="password"
            value={newPassword}
            onChange={e => { setNewPassword(e.target.value); setSuccess(false); setErr('') }}
            placeholder="至少 6 位"
            autoComplete="new-password"
          />
        </div>

        <div className="form-field" style={{ marginBottom: 20 }}>
          <label className="form-label">确认新密码<span className="required">*</span></label>
          <input
            className="form-input"
            type="password"
            value={confirmPassword}
            onChange={e => { setConfirmPassword(e.target.value); setSuccess(false); setErr('') }}
            placeholder="再次输入新密码"
            autoComplete="new-password"
          />
        </div>

        {err && <div className="form-error" style={{ marginBottom: 16 }}>{err}</div>}

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading || !oldPassword || !newPassword || !confirmPassword}
        >
          {loading ? '提交中...' : '确认修改'}
        </button>
      </div>
    </div>
  )
}
