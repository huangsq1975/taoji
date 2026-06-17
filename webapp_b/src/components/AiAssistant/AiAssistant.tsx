import { useState, useRef, useEffect } from 'react'
import './AiAssistant.css'

type AgentType = 'recommend' | 'talk' | 'fill'

interface Msg {
  role: 'ai' | 'user'
  text: string
}

const CUSTOMER = { name: '苏州盛晨科技有限公司', industry: '科技制造', complete: 82, block: '流水月均未达标', bank: '浦发银行', product: '科创贷', owner: '陈建明', years: 8 }

const AGENT_META: Record<AgentType, { label: string; icon: string; placeholder: string; quick: string[] }> = {
  recommend: {
    label: '金融产品推荐',
    icon: '🏦',
    placeholder: '例如：这个客户还能推哪些银行？',
    quick: ['推荐匹配银行产品', '哪家银行最容易通过', '查企业征信报告', '补齐流水能多匹配哪些'],
  },
  talk: {
    label: '话术助手',
    icon: '💬',
    placeholder: '例如：帮我写一段催客户补流水的话术',
    quick: ['写催补流水话术', '写银行沟通话术', '写下户准备说明', '客户问利率怎么回'],
  },
  fill: {
    label: '填表修改助手',
    icon: '📝',
    placeholder: '例如：把月营业收入改成95万',
    quick: ['修改月营业收入', '更新征信查询次数', '重写资金用途说明', '按最新流水重新计算'],
  },
}

const WELCOME: Record<AgentType, string> = {
  recommend: `我可以根据 **${CUSTOMER.name}** 的资料情况，推荐可能匹配的银行产品，并说明匹配度和资料缺口。\n\n当前客户资料完整度 ${CUSTOMER.complete}%，已有目标银行 ${CUSTOMER.bank}。你可以问我：\n• 这个客户还能推哪些银行？\n• 跟当前目标银行比，哪家更容易通过？\n• 如果补齐流水，能多匹配哪些产品？\n• 查一下这个客户的企业征信情况`,
  talk: `我可以帮你生成各种沟通话术：\n• 银行客户经理沟通话术\n• 催客户补件话术\n• 下户前准备说明\n• 客户异议应对话术\n\n当前客户：**${CUSTOMER.name}**，卡点：${CUSTOMER.block}`,
  fill: `我可以帮你修改 AI 已填写的银行制式表格字段。\n\n你可以直接告诉我要改什么，比如：\n• "把月营业收入改成95万"\n• "征信查询次数写错了，应该是3次"\n• "用途说明改成采购原材料"\n\n修改后我会标注数据来源变更，等你确认。`,
}

function agentReply(agent: AgentType, msg: string): string {
  const c = CUSTOMER
  if (agent === 'recommend') {
    if (msg.includes('推荐') || msg.includes('匹配') || msg.includes('哪些'))
      return `根据 ${c.name} 当前资料（完整度 ${c.complete}%），推荐以下银行产品：\n\n**1. ${c.bank} · ${c.product}**\n匹配度：较高，资料基本满足，当前卡点：${c.block}\n\n**2. 广发银行 · 企业税票贷**\n匹配度：中等，需补开票数据连续性证明\n\n**3. 微众银行 · 微业流水贷**\n匹配度：较高，流水连续性较好\n\n以上为参考推荐，最终以银行审核为准。`
    if (msg.includes('容易') || msg.includes('通过'))
      return `从资料匹配度看：\n\n• ${c.bank}：当前目标银行，资料匹配度最高，卡点是${c.block}\n• 微众银行：门槛相对较低，但利率区间偏高（4.8%-8.5%）\n• 广发银行：需补开票数据，其他资料基本满足\n\n建议优先推进 ${c.bank}，同时准备微众作为备选。`
    if (msg.includes('补齐') || msg.includes('流水'))
      return `如果补齐近6个月经营流水，预计可新增匹配：\n\n• 建行经营快贷（额度20-500万，利率3.6%-5.6%）\n• 微众微业流水贷（额度10-200万，利率4.8%-8.5%）\n\n流水是多数银行产品的基础材料，补齐后资料完整度预计提升到 ${Math.min(95, c.complete + 15)}%。`
    if (msg.includes('征信'))
      return `${c.name} 企业征信查询情况：\n\n📋 **征信授权状态**\n• 企业征信授权：已上传授权书\n• 法人个人征信：已授权\n\n📊 **征信关注点**\n• 近半年查询次数：建议控制在6次以内\n• 对外担保：需确认是否有关联企业互保\n• 逾期记录：近2年无逾期是多数银行的硬性要求\n\n⚠️ **提醒**\n• 征信报告有效期通常为1个月，超期需重新查询\n• ${c.bank} · ${c.product} 要求企业征信+法人征信双查`
    return `已分析 ${c.name} 的资料情况。当前资料完整度 ${c.complete}%，目标银行 ${c.bank}。如需推荐其他银行产品或对比准入条件，请告诉我具体需求。`
  }
  if (agent === 'talk') {
    if (msg.includes('催') || msg.includes('补') || msg.includes('流水'))
      return `以下是催补流水话术（已适配 ${c.name}）：\n\n"${c.owner}您好，关于贵司融资申请，目前还需要补充近6个月的经营流水明细（2026年1月-6月）。\n\n建议优先提供银行盖章版或电子流水导出件，格式为PDF或Excel。如果部分月份有缺口，请一并说明原因，我们可以协助整理说明材料。\n\n资料补齐后我会尽快帮您整理好银行材料包，争取尽早推进。请问您这边方便这两天提供吗？"\n\n需要我调整语气或补充其他要求吗？`
    if (msg.includes('银行') || msg.includes('沟通') || msg.includes('客户经理'))
      return `以下是银行沟通话术（${c.bank}）：\n\n"X经理您好，我这边有一个${c.industry}客户（${c.name}），成立${c.years}年。\n\n目前资料已基本齐全（完整度${c.complete}%），主要卡点是${c.block}。\n\n想跟您确认一下贵行 ${c.product} 目前的准入口径和材料要求是否有更新，我好尽快对齐材料包。"\n\n需要我补充风险点说明或调整话术重点吗？`
    if (msg.includes('下户') || msg.includes('准备'))
      return `下户准备说明（${c.name}）：\n\n**1. 现场准备**\n• 接待人：${c.owner}（需提前确认）\n• 现场材料：营业执照原件、公章、法人身份证原件\n\n**2. 重点展示**\n• 生产/经营现场（拍照留存）\n• 设备清单和库存情况\n\n**3. 注意事项**\n• 提前清理现场，确保经营状态真实\n• 准备好用途合同原件\n• ${c.block}\n\n需要我生成更详细的下户检查清单吗？`
    if (msg.includes('利率') || msg.includes('怎么回'))
      return `客户问利率的应对话术：\n\n"关于利率，目前各家银行都是根据企业资质、经营数据和征信情况综合定价的，我们在申请阶段无法确定最终利率。\n\n不过根据贵司的情况，参考${c.bank} · ${c.product} 的利率区间大约在3%-6%，具体以银行审批为准。\n\n我们能做的是尽量把资料整理到位，争取更好的审批条件。"\n\n**注意：** 不要承诺具体利率数字，只说参考区间。`
    return `已根据 ${c.name} 的情况生成话术建议。如需针对特定场景（催件、银行沟通、下户、异议处理）生成话术，请告诉我具体场景。`
  }
  if (agent === 'fill') {
    if (msg.includes('月营业收入') || msg.includes('收入'))
      return `已修改：\n\n**${c.product}采集表 - 月营业收入**\n• 原值：118万（来源：近12个月流水均值）\n• 新值：95万（来源：近3个月流水均值）\n• 数据来源变更：从"近12个月均值"改为"近3个月均值"\n\n⚠️ 提醒：修改后月营收与年纳税额的比例从1.47变为1.18，仍在合理范围内。\n\n确认修改吗？`
    if (msg.includes('征信') || msg.includes('查询次数'))
      return `已修改：\n\n**${c.product}采集表 - 近半年征信查询次数**\n• 原值：4次（来源：法人征信报告AI识别）\n• 新值：3次（来源：顾问人工核对）\n• 数据来源变更：从"AI识别"改为"顾问核对"\n\n确认修改吗？`
    if (msg.includes('用途') || msg.includes('资金'))
      return `已修改：\n\n**${c.product}采集表 - 资金用途说明**\n• 原值：经营周转（来源：AI根据客户需求生成）\n• 新值：采购原材料（来源：顾问修改）\n• 补充：建议同步更新用途合同，确保合同内容与用途说明一致\n\n确认修改吗？`
    if (msg.includes('重新计算') || msg.includes('最新流水'))
      return `已根据最新上传的流水重新计算：\n\n**变更字段汇总（3项）：**\n• 月均进账：118万 → 105万\n• 月均支出：89万 → 82万\n• 净流入：29万 → 23万\n\n数据来源统一更新为"2026年1-6月流水重新计算"。\n\n⚠️ 提醒：净流入下降可能影响还款能力评估，建议顾问关注。\n\n确认更新这3项吗？`
    return `请告诉我要修改哪个字段，以及修改为什么值。例如：\n• "把月营业收入改成95万"\n• "征信查询次数改为3次"\n• "用途说明改成采购原材料"`
  }
  return '请告诉我你的具体需求。'
}

function renderText(text: string) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g)
    return (
      <span key={i}>
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    )
  })
}

interface AiAssistantProps {
  onPanelChange?: (open: boolean) => void
}

export default function AiAssistant({ onPanelChange }: AiAssistantProps) {
  const [open, setOpen] = useState(false)
  const [agent, setAgent] = useState<AgentType>('recommend')
  const [messages, setMessages] = useState<Record<AgentType, Msg[]>>({ recommend: [], talk: [], fill: [] })
  const [input, setInput] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)

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

  function send(text: string) {
    const msg = text.trim()
    if (!msg) return
    const reply = agentReply(agent, msg)
    setMessages(prev => ({
      ...prev,
      [agent]: [...prev[agent], { role: 'user', text: msg }, { role: 'ai', text: reply }],
    }))
    setInput('')
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
            {(['recommend', 'talk', 'fill'] as AgentType[]).map(a => (
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
          当前客户：<strong>{CUSTOMER.name}</strong> · {CUSTOMER.industry} · 资料完整度 {CUSTOMER.complete}% · 目标银行：<strong>{CUSTOMER.bank}</strong>
        </div>

        <div className="ai-panel-chat" ref={chatRef}>
          {msgs.length === 0 ? (
            <div className="ai-chat-welcome">
              <div className="ai-welcome-icon">{meta.icon}</div>
              <div className="ai-welcome-label">{meta.icon} {meta.label}</div>
              <div className="ai-chat-bubble ai-bubble-ai">
                {renderText(WELCOME[agent])}
              </div>
            </div>
          ) : (
            msgs.map((m, i) => (
              <div key={i} className={`ai-chat-bubble ${m.role === 'ai' ? 'ai-bubble-ai' : 'ai-bubble-user'}`}>
                <div className="ai-bubble-author">{m.role === 'ai' ? `${meta.icon} ${meta.label}` : '顾问'}</div>
                {renderText(m.text)}
              </div>
            ))
          )}
        </div>

        <div className="ai-panel-quick">
          {meta.quick.map(q => (
            <button key={q} className="ai-quick-btn" onClick={() => send(q)}>{q}</button>
          ))}
        </div>

        <div className="ai-panel-input">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send(input) }}
            placeholder={meta.placeholder}
          />
          <button onClick={() => send(input)}>发送</button>
        </div>
      </div>
    </>
  )
}
