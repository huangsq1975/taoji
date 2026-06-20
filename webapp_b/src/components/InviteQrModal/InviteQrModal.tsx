import { useState, useEffect, useCallback } from 'react'
import { getAdvisorInviteQrcode } from '../../utils/api'
import './InviteQrModal.css'

interface Props {
  onClose: () => void
}

export default function InviteQrModal({ onClose }: Props) {
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const revokeRef = { url: '' }

  const load = useCallback(async () => {
    setLoading(true)
    setErr('')
    try {
      const url = await getAdvisorInviteQrcode()
      revokeRef.url = url
      setQrUrl(url)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : '获取二维码失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    return () => {
      if (revokeRef.url) URL.revokeObjectURL(revokeRef.url)
    }
  }, [load])

  return (
    <div className="qr-overlay" onClick={onClose}>
      <div className="qr-modal" onClick={e => e.stopPropagation()}>
        <div className="qr-modal-header">
          <h2 className="qr-modal-title">邀请客户扫码</h2>
          <button className="qr-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="qr-modal-body">
          {loading ? (
            <div className="qr-spinner-wrap"><div className="qr-spinner" /></div>
          ) : err ? (
            <div className="qr-error">
              <div className="qr-error-msg">{err}</div>
              <button className="btn-link" onClick={load}>重试</button>
            </div>
          ) : (
            <img className="qr-image" src={qrUrl!} alt="邀请二维码" />
          )}
        </div>

        <div className="qr-modal-tip">
          客户用微信扫描上方二维码，即可自动进入小程序并绑定到您名下
        </div>
      </div>
    </div>
  )
}
