import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getCustomer, ApiCustomer, sendAdvisorChat } from '../../utils/api'
import './AiAssistant.css'

type AgentType = 'talk' | 'write' | 'fill'

interface Msg {
  role: 'ai' | 'user'
  text: string
  loading?: boolean
}

const AGENT_META: Record<AgentType, { label: string; icon: string; placeholder: string; quick: string[] }> = {
  talk: {
    label: '推荐话术',
    icon: '💬',
    placeholder: '例如：帮我写一段催客户补流水的话术',
    quick: ['写催补流水话术', '写银行沟通话术', '写下户准备说明', '客户问利率怎么回', '推荐匹配银行产品', '异议处理话术'],
  },
  write: {
    label: '写作助手',
    icon: '✍️',
    placeholder: '例如：帮我写一封催件通知',
    quick: ['写补件通知邮件', '写银行提交说明', '写客户跟进记录', '生成客户360画像摘要', '写风险说明备注', '写顾问工作汇报'],
  },
  fill: {
    label: '一键填表',
    icon: '📝',
    placeholder: '例如：把月营业收入改成95万',
    quick: ['修改月营业收入', '更新征信查询次数', '重写资金用途说明', '按最新流水重新计算', '核对企业成立年限', '确认抵押物评估值'],
  },
}

const WELCOME: Record<AgentType, (ctx: CustomerCtx | null) => string> = {
  talk: (ctx) => {
    const cname = ctx?.name ?? '当前客户'
    const bank = ctx?.bank ? `，目标银行：${ctx.bank}` : ''
    const block = ctx?.block ? `，卡点：${ctx.block}` : ''
    return `我可以帮你生成各种沟通话术：\n• 银行客户经理沟通话术\n• 催客户补件话术\n• 下户前准备说明\n• 客户异议应对话术\n\n当前客户：**${cname}**${bank}${block}`
  },
  write: (ctx) => {
    const cname = ctx?.name ?? '当前客户'
    return `我是你的写作助手，可以帮你起草各类文字材料：\n• 催件通知 / 补件说明\n• 银行提交信函\n• 客户跟进记录\n• 风险备注说明\n\n当前客户：**${cname}**`
  },
  fill: (ctx) => {
    const cname = ctx?.name ?? '当前客户'
    const bank = ctx?.bank ? ` ${ctx.bank}` : ''
    return `我可以帮你修改 AI 已填写的银行制式表格字段。\n\n你可以直接告诉我要改什么，比如：\n• "把月营业收入改成95万"\n• "征信查询次数写错了，应该是3次"\n• "用途说明改成采购原材料"\n\n当前客户：**${cname}**${bank}，修改后我会标注数据来源变更，等你确认。`
  },
}

// Local mock fallback when API is unavailable
function localMockReply(agent: AgentType, msg: string, ctx: CustomerCtx | null): string {
  const cname = ctx?.name ?? '该客户'
  const bank = ctx?.bank ?? '目标银行'
  const complete = ctx?.complete ?? '--'

  if (agent === 'talk') {
    if (msg.includes('催') || msg.includes('补') || msg.includes('流水'))
      return `以下是催补流水话术（已适配 ${cname}）：\n\n"您好，关于贵司融资申请，目前还需要补充近6个月的经营流水明细。\n\n建议优先提供银行盖章版或电子流水导出件，格式为PDF或Excel。如果部分月份有缺口，请一并说明原因。\n\n资料补齐后我会尽快整理好银行材料包。请问您这边方便这两天提供吗？"\n\n需要调整语气或补充其他要求吗？`
    if (msg.includes('银行') || msg.includes('沟通'))
      return `以下是与 ${bank} 沟通的话术要点：\n\n• 强调客户经营稳定性（成立年限、行业地位）\n• 资料完整度已达 ${complete}%，主要材料齐全\n• 如有卡点，提前说明整改方案\n\n需要我生成完整版话术吗？`
    if (msg.includes('推荐') || msg.includes('匹配'))
      return `根据 ${cname} 的资料情况（完整度 ${complete}%），推荐以下银行产品：\n\n**1. ${bank}（当前目标）**\n资料匹配度较高，建议优先推进\n\n**2. 微众银行 · 微业流水贷**\n门槛相对较低，适合作为备选\n\n以上为参考推荐，最终以银行审核为准。`
    return `已为 ${cname} 生成话术建议。请告诉我具体场景（催件、银行沟通、下户、异议处理），我生成针对性话术。`
  }
  if (agent === 'write') {
    if (msg.includes('补件') || msg.includes('催件') || msg.includes('通知'))
      return `**补件通知（${cname}）**\n\n${cname}您好：\n\n您的融资申请目前还需要补充以下材料，请尽快提供：\n• 近6个月银行流水明细\n• 最新一期财务报表\n\n请于3个工作日内提供，以免影响申请进度。如有疑问请随时联系顾问。`
    if (msg.includes('银行') || msg.includes('提交'))
      return `**银行提交说明（${cname}）**\n\n贵行好：\n\n现随附 ${cname} 的融资申请材料一套，请予以受理。\n\n本次申请资料完整度 ${complete}%，主要材料已齐全。如需补充任何材料，请告知。\n\n谢谢！`
    if (msg.includes('摘要') || msg.includes('画像'))
      return `**${cname} 客户画像摘要**\n\n融资需求：${ctx?.loanPurpose ?? '经营周转'}\n资料完整度：${complete}%\n目标银行：${bank}\n\n**风险关注点：**\n• 请顾问人工核实征信情况\n• 确认流水连续性\n\n（AI 生成，仅供参考，最终以顾问核实为准）`
    return `已根据 ${cname} 的情况准备写作素材。请告诉我具体要写什么（通知、说明、摘要等），我帮你起草。`
  }
  if (agent === 'fill') {
    if (msg.includes('月营业收入') || msg.includes('收入'))
      return `已修改：\n\n**制式表格 - 月营业收入**\n• 原值：118万（来源：近12个月流水均值）\n• 新值：95万（来源：近3个月流水均值）\n• 数据来源变更：从"近12个月均值"改为"近3个月均值"\n\n⚠️ 提醒：修改后与年纳税额比值调整，请核实合理性。\n\n确认修改吗？`
    if (msg.includes('征信') || msg.includes('查询次数'))
      return `已修改：\n\n**制式表格 - 近半年征信查询次数**\n• 原值：4次（来源：征信报告AI识别）\n• 新值：3次（来源：顾问人工核对）\n• 数据来源变更：从"AI识别"改为"顾问核对"\n\n确认修改吗？`
    if (msg.includes('用途') || msg.includes('资金'))
      return `已修改：\n\n**制式表格 - 资金用途说明**\n• 原值：经营周转（来源：AI根据客户需求生成）\n• 新值：采购原材料（来源：顾问修改）\n• 建议同步更新用途合同，确保内容一致\n\n确认修改吗？`
    if (msg.includes('重新计算') || msg.includes('最新流水'))
      return `已根据最新上传的流水重新计算：\n\n**变更字段汇总（3项）：**\n• 月均进账：118万 → 105万\n• 月均支出：89万 → 82万\n• 净流入：29万 → 23万\n\n数据来源统一更新为"最新流水重新计算"。\n\n⚠️ 提醒：净流入下降可能影响还款能力评估，请顾问关注。\n\n确认更新这3项吗？`
    return `请告诉我要修改哪个字段及修改值，例如：\n• "把月营业收入改成95万"\n• "征信查询次数改为3次"\n• "用途说明改成采购原材料"`
  }
  return '请告诉我你的具体需求。'
}

interface CustomerCtx {
  id: number
  name: string
  complete: number
  bank: string
  block: string
  loanPurpose: string | null
}

function renderText(text: string) {
  return text.split('\n').map((line, i, arr) => {
    const parts = line.split(/\*\*(.*?)\*\*/g)
    return (
      <span key={i}>
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
        )}
        {i < arr.length - 1 && <br />}
      </span>
    )
  })
}

interface AiAssistantProps {
  onPanelChange?: (open: boolean) => void
}

export default function AiAssistant({ onPanelChange }: AiAssistantProps) {
  const [open, setOpen] = useState(false)
  const [agent, setAgent] = useState<AgentType>('talk')
  const [messages, setMessages] = useState<Record<AgentType, Msg[]>>({ talk: [], write: [], fill: [] })
  const [sessions, setSessions] = useState<Record<AgentType, number | undefined>>({ talk: undefined, write: undefined, fill: undefined })
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [customer, setCustomer] = useState<CustomerCtx | null>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  // Extract customer ID from URL
  useEffect(() => {
    const match = location.pathname.match(/^\/customers\/(\d+)/)
    const reportMatch = location.pathname.match(/^\/reports\/(\d+)/)
    const customerId = match ? parseInt(match[1]) : null
    const reportId = reportMatch ? parseInt(reportMatch[1]) : null

    if (customerId) {
      getCustomer(customerId)
        .then((c: ApiCustomer) => {
          setCustomer({
            id: c.id,
            name: c.name,
            complete: c.docCompleteness,
            bank: '',
            block: c.riskNotes ?? '',
            loanPurpose: c.loanPurpose,
          })
        })
        .catch(() => setCustomer(null))
    } else if (reportId) {
      // On report detail page — we can't easily get customerId without fetching the task
      // Leave customer as null; user can still chat without context
      setCustomer(null)
    } else {
      setCustomer(null)
    }
    // Reset sessions when navigating to a different page
    setSessions({ talk: undefined, write: undefined, fill: undefined })
    setMessages({ talk: [], write: [], fill: [] })
  }, [location.pathname])

  useEffect(() => {
    onPanelChange?.(open)
  }, [open, onPanelChange])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, agent])

  function toggle() {
    setOpen(o => !o)
  }

  function switchAgent(a: AgentType) {
    setAgent(a)
  }

  async function send(text: string) {
    const msg = text.trim()
    if (!msg || sending) return
    setInput('')
    setSending(true)

    const userMsg: Msg = { role: 'user', text: msg }
    const loadingMsg: Msg = { role: 'ai', text: '正在思考...', loading: true }

    setMessages(prev => ({
      ...prev,
      [agent]: [...prev[agent], userMsg, loadingMsg],
    }))

    try {
      const resp = await sendAdvisorChat({
        content: msg,
        sessionId: sessions[agent],
        customerId: customer?.id,
        source: 'advisor_pc',
      })

      // Save session ID for this agent
      if (resp.sessionId && !sessions[agent]) {
        setSessions(prev => ({ ...prev, [agent]: resp.sessionId }))
      }

      const aiReply: Msg = { role: 'ai', text: resp.content }
      setMessages(prev => ({
        ...prev,
        [agent]: prev[agent].slice(0, -1).concat(aiReply),
      }))
    } catch {
      // Fallback to local mock
      const fallback = localMockReply(agent, msg, customer)
      const aiReply: Msg = { role: 'ai', text: fallback }
      setMessages(prev => ({
        ...prev,
        [agent]: prev[agent].slice(0, -1).concat(aiReply),
      }))
    } finally {
      setSending(false)
    }
  }

  const meta = AGENT_META[agent]
  const msgs = messages[agent]

  return (
    <>
      <button className="ai-float-btn" onClick={toggle} aria-label="AI助手">
        <span className="ai-float-badge">AI</span>
        AI 助手
      </button>

      <div className={`ai-panel ${open ? 'ai-panel-open' : ''}`}>
        <div className="ai-panel-header">
          <div className="ai-panel-tabs">
            {(['talk', 'write', 'fill'] as AgentType[]).map(a => (
              <button
                key={a}
                className={`ai-tab-btn ${agent === a ? 'ai-tab-active' : ''}`}
                onClick={() => switchAgent(a)}
              >
                {AGENT_META[a].icon} {AGENT_META[a].label}
              </button>
            ))}
          </div>
          <button className="ai-panel-close" onClick={toggle}>✕</button>
        </div>

        <div className="ai-panel-context">
          {customer ? (
            <>
              当前客户：<strong>{customer.name}</strong> · 资料完整度 {customer.complete}%
              {customer.block && <> · <span className="ai-ctx-block">{customer.block}</span></>}
            </>
          ) : (
            <span className="ai-ctx-none">当前页面无关联客户 · 可直接提问</span>
          )}
        </div>

        <div className="ai-panel-chat" ref={chatRef}>
          {msgs.length === 0 ? (
            <div className="ai-chat-welcome">
              <div className="ai-welcome-icon">{meta.icon}</div>
              <div className="ai-welcome-label">{meta.icon} {meta.label}</div>
              <div className="ai-chat-bubble ai-bubble-ai">
                {renderText(WELCOME[agent](customer))}
              </div>
            </div>
          ) : (
            msgs.map((m, i) => (
              <div key={i} className={`ai-chat-bubble ${m.role === 'ai' ? 'ai-bubble-ai' : 'ai-bubble-user'} ${m.loading ? 'ai-bubble-loading' : ''}`}>
                <div className="ai-bubble-author">{m.role === 'ai' ? `${meta.icon} ${meta.label}` : '顾问'}</div>
                {m.loading ? (
                  <span className="ai-loading-dots"><span /><span /><span /></span>
                ) : (
                  renderText(m.text)
                )}
              </div>
            ))
          )}
        </div>

        <div className="ai-panel-quick">
          {meta.quick.map(q => (
            <button key={q} className="ai-quick-btn" disabled={sending} onClick={() => send(q)}>{q}</button>
          ))}
        </div>

        <div className="ai-panel-input">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
            placeholder={meta.placeholder}
            disabled={sending}
          />
          <button onClick={() => send(input)} disabled={sending || !input.trim()}>
            {sending ? '...' : '发送'}
          </button>
        </div>
      </div>
    </>
  )
}
