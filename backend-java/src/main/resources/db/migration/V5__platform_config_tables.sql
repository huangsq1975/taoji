-- V5: 平台配置 - AI填表规则 & Prompt配置表

-- ai_rules: 前端平台配置页使用的AI填表规则
CREATE TABLE ai_rules (
    id          SERIAL PRIMARY KEY,
    institution_id BIGINT REFERENCES institutions(id),
    name        VARCHAR(100) NOT NULL,
    fields      TEXT NOT NULL,
    trigger     VARCHAR(255) NOT NULL,
    priority    VARCHAR(10)  NOT NULL DEFAULT 'MEDIUM',  -- HIGH / MEDIUM / LOW
    status      VARCHAR(10)  NOT NULL DEFAULT 'ENABLED', -- ENABLED / DISABLED
    description TEXT,
    created_by  BIGINT REFERENCES users(id),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- prompt_configs: 机构可自定义的AI Prompt配置
CREATE TABLE prompt_configs (
    id          SERIAL PRIMARY KEY,
    institution_id BIGINT REFERENCES institutions(id), -- NULL = 系统默认
    type        VARCHAR(50)  NOT NULL,
    icon        VARCHAR(10)  NOT NULL DEFAULT '🤖',
    model       VARCHAR(50)  NOT NULL DEFAULT 'GPT-4o',
    prompt      TEXT NOT NULL,
    status      VARCHAR(10)  NOT NULL DEFAULT 'ENABLED', -- ENABLED / DISABLED
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 系统默认 Prompt 种子数据
INSERT INTO prompt_configs (institution_id, type, icon, model, prompt, status) VALUES
(NULL, '字段提取', '📑', 'GPT-4o',
 '从上传文档中提取结构化字段信息，包括企业名称、法人姓名、营业执照号、注册资本、成立日期等关键信息，并按标准字段名输出 JSON。',
 'ENABLED'),
(NULL, '风险分析', '🔍', 'GPT-4o',
 '分析征信报告，识别潜在风险点，包括逾期记录、最高逾期金额、当前负债总额、担保情况，输出风险等级和摘要说明。',
 'ENABLED'),
(NULL, '材料整理', '📋', 'GPT-4o',
 '根据银行产品材料清单，核对已上传材料的完整性和合规性，列出缺失项及补充建议，输出结构化核查结果。',
 'ENABLED'),
(NULL, '报告生成', '📄', 'GPT-4o',
 '根据客户基本信息、经营数据和银行产品要求，生成规范的贷款申请报告草稿，结论须注明"AI生成仅供参考，须顾问复核"。',
 'ENABLED');

-- 系统默认 AI填表规则种子数据
INSERT INTO ai_rules (institution_id, name, fields, trigger, priority, status, description) VALUES
(NULL, '营业执照自动识别',
 '企业名称/注册资本/成立日期/统一社会信用代码',
 '上传营业执照时', 'HIGH', 'ENABLED',
 '通过OCR识别营业执照关键字段，自动填入客户资料表单'),
(NULL, '征信报告风险提取',
 '逾期次数/最高逾期金额/当前负债/担保情况',
 '上传征信报告时', 'HIGH', 'ENABLED',
 '自动提取征信风险指标，超阈值字段标注警告'),
(NULL, '银行流水经营分析',
 '月均流水/最大单笔/季度波动率',
 '上传银行流水时', 'MEDIUM', 'ENABLED',
 '分析近12个月银行流水，计算核心经营指标'),
(NULL, '材料包排序规则',
 '材料顺序/文档优先级',
 '发起AI填表时', 'LOW', 'ENABLED',
 '按银行标准对材料包进行排序，确保提交顺序符合要求');
