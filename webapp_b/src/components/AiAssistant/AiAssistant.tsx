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
    return `（以下为功能引导，发送消息后将连接后端大模型实时生成）\n\n我可以帮你生成各种沟通话术：\n• 银行客户经理沟通话术\n• 催客户补件话术\n• 下户前准备说明\n• 客户异议应对话术\n\n当前客户：**${cname}**${bank}${block}`
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
  const sessionCustomerIdRef = useRef<number | null | 'unset'>('unset')
  const location = useLocation()

  // Update customer context from URL; only reset chat when switching to a different customer detail page
  useEffect(() => {
    const match = location.pathname.match(/^\/customers\/(\d+)/)
    const reportMatch = location.pathname.match(/^\/reports\/(\d+)/)
    const customerId = match ? parseInt(match[1]) : null
    const reportId = reportMatch ? parseInt(reportMatch[1]) : null

    if (customerId) {
      const prevCustomerId = sessionCustomerIdRef.current
      if (
        prevCustomerId !== 'unset' &&
        prevCustomerId !== null &&
        prevCustomerId !== customerId
      ) {
        setSessions({ talk: undefined, write: undefined, fill: undefined })
        setMessages({ talk: [], write: [], fill: [] })
      }
      sessionCustomerIdRef.current = customerId

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
    const loadingMsg: Msg = { role: 'ai', text: '正在连接大模型...', loading: true }

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

      if (!resp.content?.trim()) {
        throw new Error('AI 返回内容为空')
      }

      const aiReply: Msg = { role: 'ai', text: resp.content }
      setMessages(prev => ({
        ...prev,
        [agent]: prev[agent].slice(0, -1).concat(aiReply),
      }))
    } catch (err) {
      console.error('[AiAssistant] chat API failed:', err)
      const detail = err instanceof Error ? err.message : '未知错误'
      const aiReply: Msg = {
        role: 'ai',
        text: `⚠️ AI 服务调用失败：${detail}\n\n请确认：\n1. 后端已启动（localhost:3000）\n2. backend-java/.env 已配置 AI_API_URL / AI_API_KEY\n3. 浏览器 Network 面板中 /c/chat/send 返回 200`,
      }
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
      {!open && (
        <button className="ai-float-btn" onClick={toggle} aria-label="AI助手">
          <span className="ai-float-badge">AI</span>
          AI 助手
        </button>
      )}

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
