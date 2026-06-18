import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getBank,
  listBankProducts,
  createProduct,
  getProductMaterials,
  createMaterialItem,
  deleteMaterialItem,
  getProductFieldMappings,
  createFieldMapping,
  deleteFieldMapping,
  getProductTemplates,
  createTemplate,
  deleteTemplate,
  ApiBank,
  ApiProduct,
  ApiMaterialItem,
  ApiFieldMapping,
  ApiTemplate,
} from '../../utils/api'
import './BankDetail.css'

const CONFIG_TABS = ['资料配置', '字段口径', '制式表格', '要求对比']

const MATERIAL_CATEGORIES = [
  { key: 'entity',        label: '基础主体资料' },
  { key: 'credit_auth',   label: '征信授权资料' },
  { key: 'finance',       label: '经营财务资料' },
  { key: 'purpose_credit', label: '用途与增信资料' },
  { key: 'bank_form',     label: '银行制式表格' },
  { key: 'other',         label: '其他材料' },
]

const PRODUCT_TYPES = ['信用贷', '抵押贷', '抵押+信用', '供应链贷', '票据贴现', '其他']

function Spinner() {
  return <div className="spinner-wrap"><div className="spinner" /></div>
}

// ─── 新增产品弹窗 ──────────────────────────────────────────────────────────────

interface AddProductModalProps {
  bankId: string
  onClose: () => void
  onCreated: (product: ApiProduct) => void
}

function AddProductModal({ bankId, onClose, onCreated }: AddProductModalProps) {
  const [name, setName] = useState('')
  const [productType, setProductType] = useState('')
  const [loanAmount, setLoanAmount] = useState('')
  const [loanTerm, setLoanTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function handleSubmit() {
    if (!name.trim()) { setErr('产品名称为必填项'); return }
    setLoading(true)
    setErr('')
    try {
      const product = await createProduct(bankId, {
        name: name.trim(),
        productType: productType || undefined,
        loanAmount: loanAmount || undefined,
        loanTerm: loanTerm || undefined,
      })
      onCreated(product)
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
          <span className="modal-title">新增金融产品</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-field">
            <label className="form-label">产品名称<span className="required">*</span></label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="如：科创贷、经营快贷" />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">产品类型</label>
              <select className="form-select" value={productType} onChange={e => setProductType(e.target.value)}>
                <option value="">请选择</option>
                {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">最高额度</label>
              <input className="form-input" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} placeholder="如：500万以内" />
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">贷款期限</label>
            <input className="form-input" value={loanTerm} onChange={e => setLoanTerm(e.target.value)} placeholder="如：1-3年" />
          </div>
          {err && <div className="form-error">{err}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !name.trim()}>
            {loading ? '创建中...' : '创建产品'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── 新增材料弹窗 ──────────────────────────────────────────────────────────────

interface AddMaterialModalProps {
  productId: number
  onClose: () => void
  onCreated: (item: ApiMaterialItem) => void
}

function AddMaterialModal({ productId, onClose, onCreated }: AddMaterialModalProps) {
  const [name, setName] = useState('')
  const [required, setRequired] = useState(true)
  const [source, setSource] = useState('')
  const [format, setFormat] = useState('')
  const [note, setNote] = useState('')
  const [category, setCategory] = useState('entity')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function handleSubmit() {
    if (!name.trim() || !source.trim() || !format.trim()) { setErr('名称、来源渠道、格式要求为必填项'); return }
    setLoading(true)
    setErr('')
    try {
      const item = await createMaterialItem(productId, {
        name: name.trim(),
        required,
        source: source.trim(),
        format: format.trim(),
        note: note || undefined,
        category,
      })
      onCreated(item)
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
          <span className="modal-title">新增材料项</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-field" style={{ flex: 2 }}>
              <label className="form-label">材料名称<span className="required">*</span></label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="如：近12个月对公流水" />
            </div>
            <div className="form-field">
              <label className="form-label">是否必须</label>
              <div className="toggle-row">
                <label className="toggle-label">
                  <input type="checkbox" checked={required} onChange={e => setRequired(e.target.checked)} />
                  <span className="toggle-text">{required ? '必须' : '选填'}</span>
                </label>
              </div>
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">材料分类</label>
            <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
              {MATERIAL_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">来源渠道<span className="required">*</span></label>
              <input className="form-input" value={source} onChange={e => setSource(e.target.value)} placeholder="如：客户上传、电子税务局" />
            </div>
            <div className="form-field">
              <label className="form-label">格式要求<span className="required">*</span></label>
              <input className="form-input" value={format} onChange={e => setFormat(e.target.value)} placeholder="如：PDF/图片" />
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">注意事项</label>
            <input className="form-input" value={note} onChange={e => setNote(e.target.value)} placeholder="特殊要求说明..." />
          </div>
          {err && <div className="form-error">{err}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? '添加中...' : '添加材料'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── 新增字段口径弹窗 ──────────────────────────────────────────────────────────

interface AddMappingModalProps {
  productId: number
  onClose: () => void
  onCreated: (mapping: ApiFieldMapping) => void
}

function AddMappingModal({ productId, onClose, onCreated }: AddMappingModalProps) {
  const [sysField, setSysField] = useState('')
  const [bankField, setBankField] = useState('')
  const [source, setSource] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function handleSubmit() {
    if (!sysField.trim() || !bankField.trim() || !source.trim()) { setErr('系统字段、银行口径、数据来源为必填项'); return }
    setLoading(true)
    setErr('')
    try {
      const mapping = await createFieldMapping(productId, {
        sysField: sysField.trim(),
        bankField: bankField.trim(),
        source: source.trim(),
        note: note || undefined,
      })
      onCreated(mapping)
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
          <span className="modal-title">新增字段口径</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">系统字段名<span className="required">*</span></label>
              <input className="form-input" value={sysField} onChange={e => setSysField(e.target.value)} placeholder="如：注册资本（万元）" />
            </div>
            <div className="form-field">
              <label className="form-label">银行要求口径<span className="required">*</span></label>
              <input className="form-input" value={bankField} onChange={e => setBankField(e.target.value)} placeholder="如：注册资本（元）" />
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">数据来源<span className="required">*</span></label>
            <input className="form-input" value={source} onChange={e => setSource(e.target.value)} placeholder="如：营业执照、银行流水" />
          </div>
          <div className="form-field">
            <label className="form-label">注意事项</label>
            <input className="form-input" value={note} onChange={e => setNote(e.target.value)} placeholder="如：单位需换算为元" />
          </div>
          {err && <div className="form-error">{err}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? '添加中...' : '添加口径'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── 新增制式表格弹窗 ──────────────────────────────────────────────────────────

interface AddTemplateModalProps {
  productId: number
  onClose: () => void
  onCreated: (tmpl: ApiTemplate) => void
}

function AddTemplateModal({ productId, onClose, onCreated }: AddTemplateModalProps) {
  const [name, setName] = useState('')
  const [keyFields, setKeyFields] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function handleSubmit() {
    if (!name.trim() || !keyFields.trim()) { setErr('表格名称和核心字段为必填项'); return }
    setLoading(true)
    setErr('')
    try {
      const tmpl = await createTemplate(productId, {
        name: name.trim(),
        keyFields: keyFields.trim(),
        note: note || undefined,
      })
      onCreated(tmpl)
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
          <span className="modal-title">新增制式表格</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-field">
            <label className="form-label">表格名称<span className="required">*</span></label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="如：基本信息申请表" />
          </div>
          <div className="form-field">
            <label className="form-label">核心字段<span className="required">*</span></label>
            <input className="form-input" value={keyFields} onChange={e => setKeyFields(e.target.value)} placeholder="如：企业名称、法人、注册资本" />
          </div>
          <div className="form-field">
            <label className="form-label">填写说明</label>
            <textarea className="form-textarea" value={note} onChange={e => setNote(e.target.value)} placeholder="填写注意事项..." rows={2} />
          </div>
          {err && <div className="form-error">{err}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? '添加中...' : '添加表格'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── 主页面 ────────────────────────────────────────────────────────────────────

export default function BankDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [bank, setBank] = useState<ApiBank | null>(null)
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const [activeProduct, setActiveProduct] = useState(0)
  const [activeConfigTab, setActiveConfigTab] = useState(0)

  const [materials, setMaterials] = useState<ApiMaterialItem[]>([])
  const [fieldMappings, setFieldMappings] = useState<ApiFieldMapping[]>([])
  const [templates, setTemplates] = useState<ApiTemplate[]>([])
  const [productDataLoading, setProductDataLoading] = useState(false)

  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showAddMaterial, setShowAddMaterial] = useState(false)
  const [showAddMapping, setShowAddMapping] = useState(false)
  const [showAddTemplate, setShowAddTemplate] = useState(false)

  const loadBank = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setErr('')
    try {
      const [bankData, productList] = await Promise.all([
        getBank(id),
        listBankProducts(Number(id)),
      ])
      setBank(bankData)
      setProducts(productList)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadBank() }, [loadBank])

  const loadProductData = useCallback(async (productId: number) => {
    setProductDataLoading(true)
    try {
      const [mats, maps, tmpls] = await Promise.all([
        getProductMaterials(productId),
        getProductFieldMappings(productId),
        getProductTemplates(productId),
      ])
      setMaterials(mats)
      setFieldMappings(maps)
      setTemplates(tmpls)
    } catch {
      setMaterials([])
      setFieldMappings([])
      setTemplates([])
    } finally {
      setProductDataLoading(false)
    }
  }, [])

  useEffect(() => {
    if (products[activeProduct]) {
      loadProductData(products[activeProduct].id)
    }
  }, [products, activeProduct, loadProductData])

  async function handleDeleteMaterial(item: ApiMaterialItem) {
    if (!confirm(`确认删除材料项「${item.name}」？`)) return
    try {
      await deleteMaterialItem(item.id)
      setMaterials(prev => prev.filter(m => m.id !== item.id))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '删除失败')
    }
  }

  async function handleDeleteMapping(mapping: ApiFieldMapping) {
    if (!confirm(`确认删除字段口径「${mapping.sysField}」？`)) return
    try {
      await deleteFieldMapping(mapping.id)
      setFieldMappings(prev => prev.filter(m => m.id !== mapping.id))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '删除失败')
    }
  }

  async function handleDeleteTemplate(tmpl: ApiTemplate) {
    if (!confirm(`确认删除表格「${tmpl.name}」？`)) return
    try {
      await deleteTemplate(tmpl.id)
      setTemplates(prev => prev.filter(t => t.id !== tmpl.id))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '删除失败')
    }
  }

  function handleProductCreated(product: ApiProduct) {
    setProducts(prev => [...prev, product])
    setActiveProduct(products.length)
    setShowAddProduct(false)
  }

  if (loading) return <div className="bank-detail"><Spinner /></div>
  if (err || !bank) return (
    <div className="bank-detail">
      <button className="back-btn" onClick={() => navigate('/banks')}>← 返回银行列表</button>
      <div className="error-box" style={{ marginTop: 16 }}>⚠ {err || '银行不存在'}</div>
      <button className="btn btn-outline" onClick={loadBank} style={{ marginTop: 12 }}>重试</button>
    </div>
  )

  const product = products[activeProduct]

  // Group materials by category
  const materialsByCategory: Record<string, ApiMaterialItem[]> = {}
  for (const m of materials) {
    const key = m.category || 'other'
    if (!materialsByCategory[key]) materialsByCategory[key] = []
    materialsByCategory[key].push(m)
  }

  return (
    <div className="bank-detail">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/banks')}>← 返回银行列表</button>
        <div className="bank-title-row">
          <h1 className="bank-title">
            <span className="bank-avatar-lg">{bank.name.slice(0, 2)}</span>
            {bank.name} · 资料配置中心
          </h1>
          {bank.contactPerson && (
            <div className="bank-contact">
              联系人：{bank.contactPerson}
              {bank.contactPhone && <span> · {bank.contactPhone}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Product tabs */}
      <div className="product-tabs">
        <span className="product-tabs-label">金融产品：</span>
        {products.map((p, i) => (
          <button
            key={p.id}
            className={`product-tab ${activeProduct === i ? 'product-tab-active' : ''}`}
            onClick={() => setActiveProduct(i)}
          >
            {p.name}
          </button>
        ))}
        <button className="product-tab-add" onClick={() => setShowAddProduct(true)}>+ 新增产品</button>
      </div>

      {products.length === 0 ? (
        <div className="card empty-state" style={{ marginBottom: 20 }}>
          尚未配置金融产品，请点击"新增产品"添加
        </div>
      ) : product ? (
        <>
          {/* Product summary */}
          <div className="card product-summary">
            <div className="product-info-grid">
              <div className="product-info-item">
                <div className="product-info-label">产品类型</div>
                <div className="product-info-value">{product.productType || '—'}</div>
              </div>
              <div className="product-info-item">
                <div className="product-info-label">最高额度</div>
                <div className="product-info-value">{product.loanAmount || '—'}</div>
              </div>
              <div className="product-info-item">
                <div className="product-info-label">贷款期限</div>
                <div className="product-info-value">{product.loanTerm || '—'}</div>
              </div>
              <div className="product-info-item">
                <div className="product-info-label">资料项数</div>
                <div className="product-info-value">{materials.length} 项</div>
              </div>
              <div className="product-info-item">
                <div className="product-info-label">字段口径</div>
                <div className="product-info-value">{fieldMappings.length} 条</div>
              </div>
              <div className="product-info-item">
                <div className="product-info-label">配置状态</div>
                <div className="product-info-value">
                  <span className={`badge ${materials.length > 0 ? 'badge-active' : 'badge-pending'}`}>
                    {materials.length > 0 ? '已配置' : '待配置'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Config sub-tabs */}
          <div className="config-tabs">
            {CONFIG_TABS.map((tab, i) => (
              <button
                key={tab}
                className={`tab-btn ${activeConfigTab === i ? 'tab-btn-active' : ''}`}
                onClick={() => setActiveConfigTab(i)}
              >
                {tab}
              </button>
            ))}
          </div>

          {productDataLoading ? <Spinner /> : (
            <>
              {/* Tab 0: 资料配置 */}
              {activeConfigTab === 0 && (
                <div className="config-content">
                  <div className="tab-actions">
                    <button className="btn btn-primary btn-sm-action" onClick={() => setShowAddMaterial(true)}>
                      + 新增材料项
                    </button>
                  </div>
                  {MATERIAL_CATEGORIES.filter(cat => materialsByCategory[cat.key]?.length > 0).map(cat => (
                    <div key={cat.key} className="material-group">
                      <h3 className="material-group-title">{cat.label}</h3>
                      <div className="card table-card">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>材料名称</th>
                              <th>是否必须</th>
                              <th>来源渠道</th>
                              <th>格式要求</th>
                              <th>注意事项</th>
                              <th>操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {materialsByCategory[cat.key].map(m => (
                              <tr key={m.id}>
                                <td className="cell-main">{m.name}</td>
                                <td>
                                  <span className={`badge ${m.required ? 'badge-required' : 'badge-optional'}`}>
                                    {m.required ? '必须' : '选填'}
                                  </span>
                                </td>
                                <td>{m.source}</td>
                                <td><span className="format-tag">{m.format}</span></td>
                                <td className="cell-note">{m.note || '—'}</td>
                                <td>
                                  <button className="btn-sm btn-delete" onClick={() => handleDeleteMaterial(m)}>删除</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                  {materials.length === 0 && (
                    <div className="card empty-state">暂无材料配置，点击"新增材料项"开始添加</div>
                  )}
                  {materials.length > 0 && Object.keys(materialsByCategory).length === 0 && (
                    <div className="card empty-state">暂无材料配置</div>
                  )}
                </div>
              )}

              {/* Tab 1: 字段口径 */}
              {activeConfigTab === 1 && (
                <div className="config-content">
                  <div className="tab-actions">
                    <button className="btn btn-primary btn-sm-action" onClick={() => setShowAddMapping(true)}>
                      + 新增字段口径
                    </button>
                  </div>
                  <div className="card table-card">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>系统字段</th>
                          <th>银行要求口径</th>
                          <th>数据来源</th>
                          <th>注意事项</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fieldMappings.map(f => (
                          <tr key={f.id}>
                            <td className="cell-main">{f.sysField}</td>
                            <td>{f.bankField}</td>
                            <td className="cell-sub">{f.source}</td>
                            <td className="cell-note">{f.note || '—'}</td>
                            <td>
                              <button className="btn-sm btn-delete" onClick={() => handleDeleteMapping(f)}>删除</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {fieldMappings.length === 0 && (
                      <div className="empty-state">暂无字段口径配置</div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: 制式表格 */}
              {activeConfigTab === 2 && (
                <div className="config-content">
                  <div className="tab-actions">
                    <button className="btn btn-primary btn-sm-action" onClick={() => setShowAddTemplate(true)}>
                      + 新增表格
                    </button>
                  </div>
                  <div className="card table-card">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>表格名称</th>
                          <th>核心字段</th>
                          <th>填写说明</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {templates.map(t => (
                          <tr key={t.id}>
                            <td>
                              <div className="cell-main">📋 {t.name}</div>
                              <div className="cell-sub">{bank.name} · {product.name}</div>
                            </td>
                            <td className="cell-note">{t.keyFields}</td>
                            <td className="cell-sub">{t.note || '—'}</td>
                            <td>
                              <div className="action-btns">
                                {t.fileUrl && (
                                  <a href={t.fileUrl} target="_blank" rel="noreferrer" className="btn-sm btn-preview">
                                    下载模板
                                  </a>
                                )}
                                <button className="btn-sm btn-delete" onClick={() => handleDeleteTemplate(t)}>删除</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {templates.length === 0 && (
                      <div className="empty-state">暂无制式表格配置</div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: 要求对比 */}
              {activeConfigTab === 3 && (
                <div className="config-content">
                  {products.length < 2 ? (
                    <div className="card empty-state">
                      当前银行仅配置了一个产品，多产品时可在此进行横向对比
                    </div>
                  ) : (
                    <>
                      <div className="comparison-hint">以下为 {bank.name} 各金融产品材料要求横向对比</div>
                      <ComparisonTab products={products} bank={bank} />
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </>
      ) : null}

      {showAddProduct && id && (
        <AddProductModal bankId={id} onClose={() => setShowAddProduct(false)} onCreated={handleProductCreated} />
      )}
      {showAddMaterial && product && (
        <AddMaterialModal
          productId={product.id}
          onClose={() => setShowAddMaterial(false)}
          onCreated={item => { setMaterials(prev => [...prev, item]); setShowAddMaterial(false) }}
        />
      )}
      {showAddMapping && product && (
        <AddMappingModal
          productId={product.id}
          onClose={() => setShowAddMapping(false)}
          onCreated={mapping => { setFieldMappings(prev => [...prev, mapping]); setShowAddMapping(false) }}
        />
      )}
      {showAddTemplate && product && (
        <AddTemplateModal
          productId={product.id}
          onClose={() => setShowAddTemplate(false)}
          onCreated={tmpl => { setTemplates(prev => [...prev, tmpl]); setShowAddTemplate(false) }}
        />
      )}
    </div>
  )
}

// ─── 产品对比子组件 ────────────────────────────────────────────────────────────

function ComparisonTab({ products, bank }: { products: ApiProduct[]; bank: ApiBank }) {
  const [allMaterials, setAllMaterials] = useState<Record<number, ApiMaterialItem[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all(products.map(p => getProductMaterials(p.id).then(mats => ({ id: p.id, mats }))))
      .then(results => {
        const m: Record<number, ApiMaterialItem[]> = {}
        for (const r of results) m[r.id] = r.mats
        setAllMaterials(m)
      })
      .catch(() => setAllMaterials({}))
      .finally(() => setLoading(false))
  }, [products])

  if (loading) return <Spinner />

  // Collect all unique material names across products
  const allNames = Array.from(new Set(
    Object.values(allMaterials).flatMap(mats => mats.map(m => m.name))
  ))

  if (allNames.length === 0) {
    return <div className="card empty-state">各产品暂无材料配置，无法对比</div>
  }

  return (
    <div className="card table-card">
      <table className="data-table comparison-table">
        <thead>
          <tr>
            <th>材料 / 产品</th>
            {products.map(p => (
              <th key={p.id}>{p.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allNames.map(name => (
            <tr key={name}>
              <td className="cell-main compare-item">{name}</td>
              {products.map(p => {
                const item = (allMaterials[p.id] ?? []).find(m => m.name === name)
                if (!item) return <td key={p.id} className="cell-sub">—</td>
                return (
                  <td key={p.id}>
                    <span className={`badge ${item.required ? 'badge-required' : 'badge-optional'}`}>
                      {item.required ? '必须' : '选填'}
                    </span>
                    {item.note && <div className="cell-note" style={{ marginTop: 4 }}>{item.note}</div>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
        <caption className="comparison-caption">{bank.name} · 各产品材料要求横向对比</caption>
      </table>
    </div>
  )
}
