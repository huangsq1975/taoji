import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { listBanks, listBankProducts, createBank, ApiBank, ApiProduct } from '../../utils/api'
import './BankCenter.css'

function Spinner() {
  return <div className="spinner-wrap"><div className="spinner" /></div>
}

// ─── 新增银行弹窗 ──────────────────────────────────────────────────────────────

interface AddBankModalProps {
  onClose: () => void
  onCreated: (bank: ApiBank) => void
}

function AddBankModal({ onClose, onCreated }: AddBankModalProps) {
  const [name, setName] = useState('')
  const [shortName, setShortName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function handleSubmit() {
    if (!name.trim() || !shortName.trim()) { setErr('银行名称和简称为必填项'); return }
    setLoading(true)
    setErr('')
    try {
      const bank = await createBank({
        name: name.trim(),
        shortName: shortName.trim(),
        contactPerson: contactPerson || undefined,
        contactPhone: contactPhone || undefined,
        notes: notes || undefined,
      })
      onCreated(bank)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : '创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">新增银行</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">银行全称<span className="required">*</span></label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="如：中国工商银行股份有限公司" />
            </div>
            <div className="form-field">
              <label className="form-label">银行简称<span className="required">*</span></label>
              <input className="form-input" value={shortName} onChange={e => setShortName(e.target.value)} placeholder="如：工商银行" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">对接联系人</label>
              <input className="form-input" value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="银行客户经理姓名" />
            </div>
            <div className="form-field">
              <label className="form-label">联系电话</label>
              <input className="form-input" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="手机或座机" />
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">备注</label>
            <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="合作特点、注意事项等..." rows={2} />
          </div>
          {err && <div className="form-error">{err}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !name.trim() || !shortName.trim()}>
            {loading ? '创建中...' : '创建银行'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── 主页面 ────────────────────────────────────────────────────────────────────

export default function BankCenter() {
  const navigate = useNavigate()
  const [banks, setBanks] = useState<ApiBank[]>([])
  const [allProducts, setAllProducts] = useState<ApiProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setErr('')
    try {
      const [bankList, productList] = await Promise.all([listBanks(), listBankProducts()])
      setBanks(bankList)
      setAllProducts(productList)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const productsByBank: Record<number, ApiProduct[]> = {}
  for (const p of allProducts) {
    if (!productsByBank[p.bankId]) productsByBank[p.bankId] = []
    productsByBank[p.bankId].push(p)
  }

  const filtered = search
    ? banks.filter(b => b.name.includes(search) || (b.shortName ?? '').includes(search))
    : banks

  const metrics = [
    { label: '已配置银行', value: banks.length, color: '#2563eb', bg: '#eff6ff' },
    { label: '已配置产品', value: allProducts.length, color: '#16a34a', bg: '#f0fdf4' },
    { label: '待更新银行', value: banks.filter(b => !allProducts.some(p => p.bankId === b.id)).length, color: '#d97706', bg: '#fffbeb' },
  ]

  function handleCreated(bank: ApiBank) {
    setShowAdd(false)
    navigate(`/banks/${bank.id}`)
  }

  return (
    <div className="bank-center">
      <div className="page-header">
        <h1 className="page-title">银行资料管理</h1>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ 新增银行</button>
      </div>

      <div className="metrics-row">
        {metrics.map((m) => (
          <div key={m.label} className="metric-mini-card" style={{ borderLeft: `4px solid ${m.color}`, background: m.bg }}>
            <div className="metric-mini-value" style={{ color: m.color }}>{m.value}</div>
            <div className="metric-mini-label">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="card toolbar">
        <input
          className="search-input"
          placeholder="搜索银行名称..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="toolbar-spacer" />
        <span className="record-count">共 {filtered.length} 家银行</span>
      </div>

      <div className="card table-card">
        {loading ? <Spinner /> : err ? (
          <div className="error-box" style={{ margin: 16 }}>
            ⚠ {err}
            <button className="btn btn-outline" style={{ marginLeft: 12 }} onClick={load}>重试</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>银行名称</th>
                <th>金融产品</th>
                <th>产品数</th>
                <th>联系人</th>
                <th>联系电话</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((bank) => {
                const prods = productsByBank[bank.id] || []
                return (
                  <tr
                    key={bank.id}
                    className="table-row-hover"
                    onClick={() => navigate(`/banks/${bank.id}`)}
                  >
                    <td>
                      <div className="bank-name-cell">
                        <div className="bank-avatar">{bank.name.slice(0, 2)}</div>
                        <div>
                          <div className="cell-main">{bank.name}</div>
                          {bank.shortName && <div className="cell-sub">{bank.shortName}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="product-tags">
                        {prods.length === 0
                          ? <span className="cell-sub">暂未配置产品</span>
                          : prods.map(p => <span key={p.id} className="product-chip">{p.name}</span>)
                        }
                      </div>
                    </td>
                    <td><span className="count-badge">{prods.length} 个</span></td>
                    <td className="cell-sub">{bank.contactPerson ?? '—'}</td>
                    <td className="cell-sub">{bank.contactPhone ?? '—'}</td>
                    <td>
                      <button
                        className="btn-sm btn-manage"
                        onClick={e => { e.stopPropagation(); navigate(`/banks/${bank.id}`) }}
                      >
                        进入配置
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {!loading && !err && filtered.length === 0 && (
          <div className="empty-state">
            {search ? '未找到匹配银行' : '暂未配置银行，点击右上角"新增银行"开始'}
          </div>
        )}
      </div>

      {showAdd && <AddBankModal onClose={() => setShowAdd(false)} onCreated={handleCreated} />}
    </div>
  )
}
