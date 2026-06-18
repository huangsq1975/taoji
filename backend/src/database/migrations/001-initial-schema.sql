-- ============================================================
-- 韬纪元AI — PostgreSQL Initial Schema
-- Version: 1.0
-- Converted from MySQL schema in 开发文档.md
-- ============================================================

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('advisor', 'supervisor', 'admin');
CREATE TYPE data_scope AS ENUM ('self', 'team', 'all');
CREATE TYPE customer_status AS ENUM ('collecting', 'reviewing', 'reporting', 'submitted', 'done', 'paused');
CREATE TYPE label_type AS ENUM ('auto', 'manual');
CREATE TYPE follow_up_type AS ENUM ('note', 'supplement_request', 'bank_submit', 'bank_feedback', 'system');
CREATE TYPE auth_type AS ENUM ('credit_check', 'data_use', 'third_party');
CREATE TYPE auth_status AS ENUM ('pending', 'signed', 'expired', 'revoked');
CREATE TYPE uploader_type AS ENUM ('customer', 'advisor');
CREATE TYPE doc_type AS ENUM (
  'business_license',
  'bank_statement',
  'credit_report',
  'tax_invoice',
  'property_cert',
  'id_card',
  'financial_statement',
  'other'
);
CREATE TYPE ai_parse_status AS ENUM ('pending', 'processing', 'done', 'failed');
CREATE TYPE recognition_status AS ENUM ('ok', 'missing', 'abnormal', 'needs_review');
CREATE TYPE recognition_task_status AS ENUM ('queued', 'processing', 'done', 'failed');
CREATE TYPE recognition_scope AS ENUM ('single_doc', 'all_docs', 'reparse');
CREATE TYPE product_type AS ENUM ('credit', 'mortgage', 'business', 'other');
CREATE TYPE field_type AS ENUM ('text', 'number', 'date', 'enum', 'file', 'boolean');
CREATE TYPE report_task_status AS ENUM (
  'pending', 'ai_filling', 'ai_done', 'reviewing',
  'review_done', 'exporting', 'exported', 'submitted'
);
CREATE TYPE ai_fill_status AS ENUM ('ok', 'issue', 'missing', 'needs_review');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'corrected', 'rejected');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled');
CREATE TYPE call_type AS ENUM ('ai_recognition', 'report_fill', 'doc_export', 'api_call');
CREATE TYPE call_status AS ENUM ('success', 'failed');
CREATE TYPE ai_scene AS ENUM ('form_fill', 'biz_data', 'credit_parse', 'doc_export', 'source_diagram');
CREATE TYPE review_policy AS ENUM ('advisor_confirm', 'amount_fields', 'all_fields', 'auto_no_review');
CREATE TYPE api_key_status AS ENUM ('active', 'revoked');
CREATE TYPE chat_source AS ENUM ('c_end', 'advisor_mobile', 'advisor_pc');
CREATE TYPE chat_role AS ENUM ('user', 'assistant');

-- ============================================================
-- 5.1 ACCOUNT & PERMISSIONS
-- ============================================================

CREATE TABLE institutions (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name            VARCHAR(100)    NOT NULL,
  plan_id         INTEGER         NOT NULL DEFAULT 1,
  quota_total     INTEGER         NOT NULL DEFAULT 30,
  quota_used      INTEGER         NOT NULL DEFAULT 0,
  quota_reset_at  DATE,
  status          SMALLINT        NOT NULL DEFAULT 1,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP
);

COMMENT ON TABLE institutions IS '机构表';
COMMENT ON COLUMN institutions.status IS '1=启用 0=停用';

CREATE TABLE users (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  institution_id  BIGINT          NOT NULL,
  name            VARCHAR(50)     NOT NULL,
  phone           VARCHAR(20)     UNIQUE NOT NULL,
  password_hash   VARCHAR(255)    NOT NULL,
  wx_openid       VARCHAR(64),
  wx_unionid      VARCHAR(64),
  role            user_role       NOT NULL DEFAULT 'advisor',
  data_scope      data_scope      NOT NULL DEFAULT 'self',
  status          SMALLINT        NOT NULL DEFAULT 1,
  last_login_at   TIMESTAMP,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP
);

COMMENT ON TABLE users IS '系统用户表';
COMMENT ON COLUMN users.data_scope IS '仅本人/本团队/全部客户';

CREATE INDEX idx_users_institution ON users (institution_id);
CREATE INDEX idx_users_phone ON users (phone);

CREATE TABLE user_permissions (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     BIGINT          NOT NULL,
  permission  VARCHAR(50)     NOT NULL
);

COMMENT ON TABLE user_permissions IS '用户功能权限表';
COMMENT ON COLUMN user_permissions.permission IS '如: view_customer, edit_followup, ai_parse, maintain_bank_material, manage_plan, manage_account, config_permission';

CREATE INDEX idx_user_permissions_user ON user_permissions (user_id);

-- ============================================================
-- 5.2 CUSTOMER DATA
-- ============================================================

CREATE TABLE customers (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  institution_id  BIGINT          NOT NULL,
  advisor_id      BIGINT          NOT NULL,
  name            VARCHAR(100)    NOT NULL,
  contact_name    VARCHAR(50),
  contact_phone   VARCHAR(20),
  wx_openid       VARCHAR(64),
  financing_need  TEXT,
  loan_amount     DECIMAL(15,2),
  loan_purpose    VARCHAR(255),
  status          customer_status NOT NULL DEFAULT 'collecting',
  doc_completeness SMALLINT       DEFAULT 0,
  ai_summary      TEXT,
  risk_notes      TEXT,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP
);

COMMENT ON TABLE customers IS '客户表';
COMMENT ON COLUMN customers.advisor_id IS '负责顾问';
COMMENT ON COLUMN customers.doc_completeness IS '资料完整度 0-100';

CREATE INDEX idx_customers_institution ON customers (institution_id);
CREATE INDEX idx_customers_advisor ON customers (advisor_id);
CREATE INDEX idx_customers_status ON customers (status);

CREATE TABLE customer_labels (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT          NOT NULL,
  label       VARCHAR(50)     NOT NULL,
  label_type  label_type      DEFAULT 'auto'
);

COMMENT ON TABLE customer_labels IS '客户标签';
COMMENT ON COLUMN customer_labels.label IS '如: 经营稳定、流水良好、有不动产';

CREATE INDEX idx_customer_labels_customer ON customer_labels (customer_id);

CREATE TABLE follow_up_records (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT          NOT NULL,
  advisor_id  BIGINT          NOT NULL,
  type        follow_up_type  NOT NULL DEFAULT 'note',
  content     TEXT            NOT NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE follow_up_records IS '跟进记录';

CREATE INDEX idx_follow_up_customer ON follow_up_records (customer_id);

CREATE TABLE customer_authorizations (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT          NOT NULL,
  auth_type   auth_type       NOT NULL,
  signed_at   TIMESTAMP,
  expired_at  TIMESTAMP,
  file_url    VARCHAR(500),
  status      auth_status     DEFAULT 'pending',
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE customer_authorizations IS '客户授权记录';

CREATE INDEX idx_customer_auth ON customer_authorizations (customer_id);

-- ============================================================
-- 5.3 DOCUMENT MANAGEMENT
-- ============================================================

CREATE TABLE customer_documents (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id     BIGINT          NOT NULL,
  uploader_id     BIGINT,
  uploader_type   uploader_type   DEFAULT 'customer',
  doc_type        doc_type        NOT NULL DEFAULT 'other',
  file_name       VARCHAR(255)    NOT NULL,
  file_url        VARCHAR(500)    NOT NULL,
  file_size       INTEGER,
  mime_type       VARCHAR(50),
  ai_parse_status ai_parse_status DEFAULT 'pending',
  ai_parsed_at    TIMESTAMP,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP
);

COMMENT ON TABLE customer_documents IS '客户上传资料';
COMMENT ON COLUMN customer_documents.uploader_id IS 'NULL=客户自传';
COMMENT ON COLUMN customer_documents.file_url IS 'COS/OSS URL';

CREATE INDEX idx_customer_docs_customer ON customer_documents (customer_id);
CREATE INDEX idx_customer_docs_type ON customer_documents (doc_type);

CREATE TABLE ai_recognition_results (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  document_id BIGINT          NOT NULL,
  customer_id BIGINT          NOT NULL,
  field_key   VARCHAR(100)    NOT NULL,
  field_label VARCHAR(100)    NOT NULL,
  field_value TEXT,
  confidence  DECIMAL(5,4),
  status      recognition_status DEFAULT 'ok',
  note        VARCHAR(255),
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ai_recognition_results IS 'AI资料识别结果';
COMMENT ON COLUMN ai_recognition_results.confidence IS '置信度 0-1';

CREATE INDEX idx_ai_recog_document ON ai_recognition_results (document_id);
CREATE INDEX idx_ai_recog_customer ON ai_recognition_results (customer_id);

CREATE TABLE ai_recognition_tasks (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  institution_id  BIGINT                      NOT NULL,
  customer_id     BIGINT                      NOT NULL,
  trigger_user_id BIGINT                      NOT NULL,
  scope           recognition_scope           DEFAULT 'all_docs',
  document_ids    JSONB,
  status          recognition_task_status     DEFAULT 'queued',
  result_summary  TEXT,
  started_at      TIMESTAMP,
  finished_at     TIMESTAMP,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ai_recognition_tasks IS 'AI识别任务';
COMMENT ON COLUMN ai_recognition_tasks.document_ids IS '指定文件IDs，NULL=全部';

CREATE INDEX idx_ai_task_customer ON ai_recognition_tasks (customer_id);

-- ============================================================
-- 5.4 BANKS & PRODUCTS
-- ============================================================

CREATE TABLE banks (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        VARCHAR(100)    NOT NULL,
  short_name  VARCHAR(20),
  logo_url    VARCHAR(500),
  sort_order  INTEGER         DEFAULT 0,
  status      SMALLINT        DEFAULT 1,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE banks IS '银行表';

CREATE TABLE bank_products (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bank_id     INTEGER         NOT NULL,
  name        VARCHAR(100)    NOT NULL,
  product_type product_type   DEFAULT 'business',
  loan_min    DECIMAL(15,2),
  loan_max    DECIMAL(15,2),
  rate_min    DECIMAL(5,4),
  description TEXT,
  requirements TEXT,
  sort_order  INTEGER         DEFAULT 0,
  status      SMALLINT        DEFAULT 1,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE bank_products IS '银行金融产品';
COMMENT ON COLUMN bank_products.loan_min IS '最低贷款额（万元）';
COMMENT ON COLUMN bank_products.loan_max IS '最高贷款额（万元）';
COMMENT ON COLUMN bank_products.rate_min IS '参考利率（年化）';

CREATE INDEX idx_bank_products_bank ON bank_products (bank_id);

CREATE TABLE bank_material_configs (
  id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id      INTEGER         NOT NULL,
  field_key       VARCHAR(100)    NOT NULL,
  field_label     VARCHAR(100)    NOT NULL,
  field_type      field_type      DEFAULT 'text',
  required        SMALLINT        DEFAULT 1,
  source_hint     VARCHAR(255),
  review_required SMALLINT        DEFAULT 1,
  sort_order      INTEGER         DEFAULT 0
);

COMMENT ON TABLE bank_material_configs IS '银行产品固定资料字段配置';
COMMENT ON COLUMN bank_material_configs.source_hint IS '数据来源提示，如：来自营业执照';
COMMENT ON COLUMN bank_material_configs.review_required IS '是否强制顾问复核';

CREATE INDEX idx_bank_material_product ON bank_material_configs (product_id);

-- ============================================================
-- 5.5 REPORT WORKBENCH
-- ============================================================

CREATE TABLE report_tasks (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  institution_id  BIGINT              NOT NULL,
  customer_id     BIGINT              NOT NULL,
  advisor_id      BIGINT              NOT NULL,
  product_id      INTEGER             NOT NULL,
  status          report_task_status  NOT NULL DEFAULT 'pending',
  ai_fill_at      TIMESTAMP,
  reviewed_at     TIMESTAMP,
  exported_at     TIMESTAMP,
  submitted_at    TIMESTAMP,
  export_url      VARCHAR(500),
  issue_count     INTEGER             DEFAULT 0,
  created_at      TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE report_tasks IS 'AI填表任务（报告作业台核心表）';
COMMENT ON COLUMN report_tasks.issue_count IS 'AI标记的问题字段数';

CREATE INDEX idx_report_tasks_customer ON report_tasks (customer_id);
CREATE INDEX idx_report_tasks_advisor ON report_tasks (advisor_id);
CREATE INDEX idx_report_tasks_status ON report_tasks (status);

CREATE TABLE report_field_drafts (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  task_id         BIGINT          NOT NULL,
  field_key       VARCHAR(100)    NOT NULL,
  field_label     VARCHAR(100)    NOT NULL,
  ai_value        TEXT,
  final_value     TEXT,
  source_doc_id   BIGINT,
  source_hint     VARCHAR(255),
  ai_status       ai_fill_status  DEFAULT 'ok',
  ai_note         VARCHAR(255),
  review_status   review_status   DEFAULT 'pending',
  reviewed_by     BIGINT,
  reviewed_at     TIMESTAMP
);

COMMENT ON TABLE report_field_drafts IS '填表字段草稿';
COMMENT ON COLUMN report_field_drafts.ai_value IS 'AI预填值';
COMMENT ON COLUMN report_field_drafts.final_value IS '顾问确认后的最终值';

CREATE INDEX idx_report_field_drafts_task ON report_field_drafts (task_id);

-- ============================================================
-- 5.6 MEMBERSHIP & CALL RECORDS
-- ============================================================

CREATE TABLE membership_plans (
  id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name            VARCHAR(50)     NOT NULL,
  monthly_quota   INTEGER         NOT NULL,
  max_advisors    INTEGER         NOT NULL DEFAULT 1,
  features        JSONB,
  price_monthly   DECIMAL(10,2)   DEFAULT 0,
  sort_order      INTEGER         DEFAULT 0,
  is_active       SMALLINT        DEFAULT 1
);

COMMENT ON TABLE membership_plans IS '套餐定义';
COMMENT ON COLUMN membership_plans.monthly_quota IS '每月调用次数，-1=不限';
COMMENT ON COLUMN membership_plans.max_advisors IS '最多员工数，-1=不限';

CREATE TABLE institution_subscriptions (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  institution_id  BIGINT              NOT NULL,
  plan_id         INTEGER             NOT NULL,
  started_at      TIMESTAMP           NOT NULL,
  expired_at      TIMESTAMP,
  status          subscription_status DEFAULT 'active',
  created_at      TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE institution_subscriptions IS '机构套餐订阅';
COMMENT ON COLUMN institution_subscriptions.expired_at IS 'NULL=永久/按月续';

CREATE INDEX idx_inst_subs_institution ON institution_subscriptions (institution_id);

CREATE TABLE call_records (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  institution_id  BIGINT          NOT NULL,
  user_id         BIGINT          NOT NULL,
  customer_id     BIGINT,
  task_id         BIGINT,
  call_type       call_type       NOT NULL,
  quota_cost      INTEGER         NOT NULL DEFAULT 1,
  status          call_status     DEFAULT 'success',
  detail          VARCHAR(255),
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE call_records IS '调用记录';

CREATE INDEX idx_call_records_inst_date ON call_records (institution_id, created_at);
CREATE INDEX idx_call_records_user ON call_records (user_id);

-- ============================================================
-- 5.7 PLATFORM CONFIG
-- ============================================================

CREATE TABLE ai_fill_rules (
  id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  institution_id  BIGINT,
  name            VARCHAR(100)    NOT NULL,
  scene           ai_scene        NOT NULL,
  review_policy   review_policy   NOT NULL DEFAULT 'advisor_confirm',
  mapping_desc    TEXT,
  status          SMALLINT        DEFAULT 1,
  sort_order      INTEGER         DEFAULT 0,
  created_by      BIGINT,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ai_fill_rules IS 'AI填表规则';
COMMENT ON COLUMN ai_fill_rules.institution_id IS 'NULL=平台级规则';

CREATE TABLE platform_configs (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  config_key  VARCHAR(100)    UNIQUE NOT NULL,
  config_val  TEXT,
  description VARCHAR(255),
  updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE platform_configs IS '平台全局配置KV';

CREATE TABLE api_keys (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  institution_id  BIGINT          NOT NULL,
  key_hash        VARCHAR(255)    NOT NULL,
  key_prefix      VARCHAR(10)     NOT NULL,
  name            VARCHAR(50),
  status          api_key_status  DEFAULT 'active',
  last_used_at    TIMESTAMP,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE api_keys IS '对外API Key（企业版预留）';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA256 hash';
COMMENT ON COLUMN api_keys.key_prefix IS '展示用前缀';

CREATE INDEX idx_api_keys_institution ON api_keys (institution_id);

-- ============================================================
-- 5.8 C-END CHAT
-- ============================================================

CREATE TABLE chat_sessions (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT          NOT NULL,
  source      chat_source     DEFAULT 'c_end',
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE chat_sessions IS '对话会话';

CREATE TABLE chat_messages (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id  BIGINT          NOT NULL,
  role        chat_role       NOT NULL,
  content     TEXT            NOT NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE chat_messages IS '对话消息';

CREATE INDEX idx_chat_messages_session ON chat_messages (session_id);
