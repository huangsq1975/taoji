import { useNavigate } from 'react-router-dom'
import { mockBanks } from '../../utils/mock'
import './BankCenter.css'

export default function BankCenter() {
  const navigate = useNavigate()

  const metrics = [
    { label: '已配置银行', value: 3, color: '#2563eb', bg: '#eff6ff' },
    { label: '已配置产品', value: 5, color: '#16a34a', bg: '#f0fdf4' },
    { label: '待更新表格', value: 0, color: '#64748b', bg: '#f8fafc' },
  ]

  return (
    <div className="bank-center">
      <div className="page-header">
        <h1 className="page-title">银行资料管理</h1>
        <div className="header-actions">
          <button className="btn btn-outline">导入模板</button>
          <button className="btn btn-primary">+ 新增银行</button>
        </div>
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
        <input className="search-input" placeholder="搜索银行名称..." />
        <select className="filter-select">
          <option>全部状态</option>
          <option>已启用</option>
          <option>待配置</option>
        </select>
        <div className="toolbar-spacer" />
        <span className="record-count">共 {mockBanks.length} 家银行</span>
      </div>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>银行名称</th>
              <th>金融产品</th>
              <th>资料项</th>
              <th>制式表格</th>
              <th>最近更新</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {mockBanks.map((bank) => (
              <tr
                key={bank.id}
                className="table-row-hover"
                onClick={() => navigate(`/banks/${bank.id}`)}
              >
                <td>
                  <div className="bank-name-cell">
                    <div className="bank-avatar">
                      {bank.name.slice(0, 2)}
                    </div>
                    <div>
                      <div className="cell-main">{bank.name}</div>
                      <div className="cell-sub">{bank.products.length} 个产品</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="product-tags">
                    {bank.products.map((p) => (
                      <span key={p.id} className="product-chip">{p.name}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <span className="count-badge">
                    {bank.products.reduce((sum, p) => sum + p.materials.length, 0)} 项
                  </span>
                </td>
                <td>
                  <span className="count-badge">{bank.templates} 份</span>
                </td>
                <td className="cell-sub">{bank.updated}</td>
                <td>
                  <span className="badge badge-active">已启用</span>
                </td>
                <td>
                  <button
                    className="btn-sm btn-manage"
                    onClick={(e) => { e.stopPropagation(); navigate(`/banks/${bank.id}`) }}
                  >
                    进入资料管理
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
