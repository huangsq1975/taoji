import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { mockBanks } from '../../utils/mock'
import './BankDetail.css'

const CONFIG_TABS = ['资料配置', '字段口径', '制式表格', '要求对比']

const fieldMappings = [
  { sysField: '企业全称', bankField: '企业名称（全称）', source: '营业执照', note: '与营业执照一致，不可简写' },
  { sysField: '法人代表', bankField: '法定代表人姓名', source: '身份证/营业执照', note: '需与身份证姓名完全一致' },
  { sysField: '注册资本（万元）', bankField: '注册资本（元）', source: '营业执照', note: '单位需换算为元' },
  { sysField: '月均流水（万元）', bankField: '近12个月平均月流水', source: '银行流水', note: '按实际月均计算，四舍五入' },
  { sysField: '经营年限（年）', bankField: '经营年限', source: '营业执照成立日期', note: '精确到年，不足1年按1年计' },
  { sysField: '纳税总额（万元）', bankField: '近两年纳税合计（万元）', source: '完税证明', note: '含所有税种总额' },
]

const templates = [
  { name: '基本信息申请表', keyFields: '企业名称、法人、注册资本、经营范围', note: '所有必填字段均需签字盖章' },
  { name: '个人征信授权书', keyFields: '法人姓名、身份证号、授权范围、有效期', note: '需法人签字+身份证复印件附件' },
  { name: '贷款用途声明', keyFields: '用途类型、金额、还款来源', note: '需与银行提交的申请材料一致' },
]

const comparisonData = [
  { item: '营业执照要求', pufa: '有效期内', cmc: '有效期内，近6个月无变更', icbc: '有效期内' },
  { item: '流水期限', pufa: '近12个月对公', cmc: '近24个月对公', icbc: '近12个月（工行账户优先）' },
  { item: '流水月均下限', pufa: '20万元', cmc: '50万元', icbc: '无明确要求' },
  { item: '财务报表要求', pufa: '无需', cmc: '无需', icbc: '近2年，需盖章' },
  { item: '最高可贷金额', pufa: '500万', cmc: '1000万', icbc: '300万' },
]

export default function BankDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeProduct, setActiveProduct] = useState(0)
  const [activeConfigTab, setActiveConfigTab] = useState(0)

  const bank = mockBanks.find((b) => b.id === id) || mockBanks[0]
  const product = bank.products[activeProduct]

  const materialGroups = [
    {
      title: '主体资质材料',
      items: product.materials.filter((m) =>
        m.name.includes('营业执照') || m.name.includes('身份证') || m.name.includes('章程')
      ),
    },
    {
      title: '财务流水材料',
      items: product.materials.filter((m) => m.name.includes('流水') || m.name.includes('财务')),
    },
    {
      title: '税务材料',
      items: product.materials.filter((m) => m.name.includes('纳税') || m.name.includes('税')),
    },
    {
      title: '资质加分材料',
      items: product.materials.filter((m) =>
        m.name.includes('证书') || m.name.includes('房产') || !m.required
      ),
    },
  ].filter((g) => g.items.length > 0)

  return (
    <div className="bank-detail">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/banks')}>← 返回银行列表</button>
        <h1 className="bank-title">
          <span className="bank-avatar-lg">{bank.name.slice(0, 2)}</span>
          {bank.name} · 资料配置中心
        </h1>
      </div>

      {/* Product tabs */}
      <div className="product-tabs">
        <span className="product-tabs-label">金融产品：</span>
        {bank.products.map((p, i) => (
          <button
            key={p.id}
            className={`product-tab ${activeProduct === i ? 'product-tab-active' : ''}`}
            onClick={() => setActiveProduct(i)}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Product summary card */}
      <div className="card product-summary">
        <div className="product-info-grid">
          <div className="product-info-item">
            <div className="product-info-label">产品类型</div>
            <div className="product-info-value">{product.type}</div>
          </div>
          <div className="product-info-item">
            <div className="product-info-label">最高额度</div>
            <div className="product-info-value">{product.amount}</div>
          </div>
          <div className="product-info-item">
            <div className="product-info-label">贷款期限</div>
            <div className="product-info-value">{product.term}</div>
          </div>
          <div className="product-info-item">
            <div className="product-info-label">资料项数</div>
            <div className="product-info-value">{product.materials.length} 项</div>
          </div>
          <div className="product-info-item">
            <div className="product-info-label">最近更新</div>
            <div className="product-info-value">{bank.updated}</div>
          </div>
          <div className="product-info-item">
            <div className="product-info-label">配置状态</div>
            <div className="product-info-value"><span className="badge badge-active">已配置</span></div>
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

      {/* 资料配置 */}
      {activeConfigTab === 0 && (
        <div className="config-content">
          {materialGroups.map((group) => (
            <div key={group.title} className="material-group">
              <h3 className="material-group-title">{group.title}</h3>
              <div className="card table-card">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>材料名称</th>
                      <th>是否必须</th>
                      <th>来源渠道</th>
                      <th>格式要求</th>
                      <th>注意事项</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((m) => (
                      <tr key={m.name}>
                        <td className="cell-main">{m.name}</td>
                        <td>
                          <span className={`badge ${m.required ? 'badge-required' : 'badge-optional'}`}>
                            {m.required ? '必须' : '选填'}
                          </span>
                        </td>
                        <td>{m.source}</td>
                        <td><span className="format-tag">{m.format}</span></td>
                        <td className="cell-note">{m.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 字段口径 */}
      {activeConfigTab === 1 && (
        <div className="config-content">
          <div className="card table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>系统字段</th>
                  <th>银行要求口径</th>
                  <th>数据来源</th>
                  <th>注意事项</th>
                </tr>
              </thead>
              <tbody>
                {fieldMappings.map((f) => (
                  <tr key={f.sysField}>
                    <td className="cell-main">{f.sysField}</td>
                    <td>{f.bankField}</td>
                    <td className="cell-sub">{f.source}</td>
                    <td className="cell-note">{f.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 制式表格 */}
      {activeConfigTab === 2 && (
        <div className="config-content">
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
                {templates.map((t) => (
                  <tr key={t.name}>
                    <td>
                      <div className="cell-main">📋 {t.name}</div>
                      <div className="cell-sub">{bank.name} · {product.name}</div>
                    </td>
                    <td className="cell-note">{t.keyFields}</td>
                    <td className="cell-sub">{t.note}</td>
                    <td>
                      <button className="btn-sm btn-preview">预览AI填写</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 要求对比 */}
      {activeConfigTab === 3 && (
        <div className="config-content">
          <div className="comparison-hint">以下为所有已配置银行的核心材料要求横向对比</div>
          <div className="card table-card">
            <table className="data-table comparison-table">
              <thead>
                <tr>
                  <th>对比项目</th>
                  <th className={bank.id === 'b001' ? 'col-active' : ''}>浦发银行</th>
                  <th className={bank.id === 'b002' ? 'col-active' : ''}>招商银行</th>
                  <th className={bank.id === 'b003' ? 'col-active' : ''}>工商银行</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row) => (
                  <tr key={row.item}>
                    <td className="cell-main compare-item">{row.item}</td>
                    <td className={bank.id === 'b001' ? 'col-active-cell' : ''}>{row.pufa}</td>
                    <td className={bank.id === 'b002' ? 'col-active-cell' : ''}>{row.cmc}</td>
                    <td className={bank.id === 'b003' ? 'col-active-cell' : ''}>{row.icbc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
