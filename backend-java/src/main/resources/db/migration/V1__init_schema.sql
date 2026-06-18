-- institutions
CREATE TABLE institutions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    plan_id INT NOT NULL DEFAULT 1,
    quota_total INT NOT NULL DEFAULT 30,
    quota_used INT NOT NULL DEFAULT 0,
    quota_reset_at TIMESTAMP,
    status SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- users
CREATE TYPE user_role AS ENUM ('ADVISOR', 'SUPERVISOR', 'ADMIN');
CREATE TYPE data_scope AS ENUM ('SELF', 'TEAM', 'ALL');

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    institution_id BIGINT NOT NULL REFERENCES institutions(id),
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    wx_openid VARCHAR(100),
    wx_unionid VARCHAR(100),
    role user_role NOT NULL DEFAULT 'ADVISOR',
    data_scope data_scope NOT NULL DEFAULT 'SELF',
    status SMALLINT NOT NULL DEFAULT 1,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- user_permissions
CREATE TABLE user_permissions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    permission VARCHAR(50) NOT NULL,
    UNIQUE(user_id, permission)
);

-- customers
CREATE TYPE customer_status AS ENUM ('COLLECTING', 'REVIEWING', 'REPORTING', 'SUBMITTED', 'DONE', 'PAUSED');

CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    institution_id BIGINT NOT NULL REFERENCES institutions(id),
    advisor_id BIGINT REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    contact_name VARCHAR(50),
    contact_phone VARCHAR(20),
    wx_openid VARCHAR(100),
    financing_need TEXT,
    loan_purpose TEXT,
    loan_amount DECIMAL(15,2),
    status customer_status NOT NULL DEFAULT 'COLLECTING',
    doc_completeness SMALLINT NOT NULL DEFAULT 0,
    ai_summary TEXT,
    risk_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- customer_labels
CREATE TYPE label_type AS ENUM ('auto', 'manual');

CREATE TABLE customer_labels (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    label VARCHAR(50) NOT NULL,
    label_type label_type NOT NULL DEFAULT 'manual'
);

-- follow_up_records
CREATE TYPE follow_up_type AS ENUM ('NOTE', 'SUPPLEMENT_REQUEST', 'BANK_SUBMIT', 'BANK_FEEDBACK', 'SYSTEM');

CREATE TABLE follow_up_records (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    advisor_id BIGINT REFERENCES users(id),
    type follow_up_type NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- customer_authorizations
CREATE TYPE auth_type AS ENUM ('credit_check', 'data_use', 'third_party');
CREATE TYPE auth_status AS ENUM ('pending', 'signed', 'expired', 'revoked');

CREATE TABLE customer_authorizations (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    auth_type auth_type NOT NULL,
    signed_at TIMESTAMP,
    expired_at TIMESTAMP,
    file_url VARCHAR(500),
    status auth_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- customer_documents
CREATE TYPE doc_type AS ENUM ('BUSINESS_LICENSE', 'BANK_STATEMENT', 'CREDIT_REPORT', 'TAX_INVOICE', 'PROPERTY_CERT', 'ID_CARD', 'FINANCIAL_STATEMENT', 'OTHER');
CREATE TYPE uploader_type AS ENUM ('customer', 'advisor');
CREATE TYPE ai_parse_status AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

CREATE TABLE customer_documents (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    uploader_id BIGINT,
    uploader_type uploader_type NOT NULL DEFAULT 'advisor',
    doc_type doc_type NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    ai_parse_status ai_parse_status NOT NULL DEFAULT 'PENDING',
    ai_parsed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- ai_recognition_results
CREATE TYPE recognition_field_status AS ENUM ('ok', 'missing', 'abnormal', 'needs_review');

CREATE TABLE ai_recognition_results (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES customer_documents(id),
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    field_key VARCHAR(100) NOT NULL,
    field_label VARCHAR(100) NOT NULL,
    field_value TEXT,
    confidence DECIMAL(5,4),
    status recognition_field_status NOT NULL DEFAULT 'ok',
    note VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ai_recognition_tasks
CREATE TYPE recognition_scope AS ENUM ('single_doc', 'all_docs', 'reparse');
CREATE TYPE recognition_status AS ENUM ('QUEUED', 'PROCESSING', 'DONE', 'FAILED');

CREATE TABLE ai_recognition_tasks (
    id BIGSERIAL PRIMARY KEY,
    institution_id BIGINT NOT NULL REFERENCES institutions(id),
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    trigger_user_id BIGINT REFERENCES users(id),
    scope recognition_scope NOT NULL,
    document_ids JSONB,
    status recognition_status NOT NULL DEFAULT 'QUEUED',
    result_summary TEXT,
    started_at TIMESTAMP,
    finished_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- banks
CREATE TABLE banks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    short_name VARCHAR(20) NOT NULL,
    logo_url VARCHAR(500),
    sort_order INT NOT NULL DEFAULT 0,
    status SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- bank_products
CREATE TYPE product_type AS ENUM ('credit', 'mortgage', 'business', 'other');

CREATE TABLE bank_products (
    id SERIAL PRIMARY KEY,
    bank_id INT NOT NULL REFERENCES banks(id),
    name VARCHAR(100) NOT NULL,
    product_type product_type NOT NULL DEFAULT 'credit',
    loan_min DECIMAL(15,2),
    loan_max DECIMAL(15,2),
    rate_min DECIMAL(6,4),
    description TEXT,
    requirements TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    status SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- bank_material_configs
CREATE TYPE field_type AS ENUM ('text', 'number', 'date', 'enum', 'file', 'boolean');

CREATE TABLE bank_material_configs (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES bank_products(id),
    field_key VARCHAR(100) NOT NULL,
    field_label VARCHAR(100) NOT NULL,
    field_type field_type NOT NULL DEFAULT 'text',
    required SMALLINT NOT NULL DEFAULT 0,
    review_required SMALLINT NOT NULL DEFAULT 0,
    source_hint VARCHAR(255),
    sort_order INT NOT NULL DEFAULT 0
);

-- report_tasks
CREATE TYPE report_status AS ENUM ('PENDING', 'AI_FILLING', 'AI_DONE', 'REVIEWING', 'REVIEW_DONE', 'EXPORTING', 'EXPORTED', 'SUBMITTED');

CREATE TABLE report_tasks (
    id BIGSERIAL PRIMARY KEY,
    institution_id BIGINT NOT NULL REFERENCES institutions(id),
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    advisor_id BIGINT REFERENCES users(id),
    product_id INT NOT NULL REFERENCES bank_products(id),
    status report_status NOT NULL DEFAULT 'PENDING',
    ai_fill_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    exported_at TIMESTAMP,
    submitted_at TIMESTAMP,
    export_url VARCHAR(500),
    issue_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- report_field_drafts
CREATE TYPE ai_field_status AS ENUM ('ok', 'issue', 'missing', 'needs_review');
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'corrected', 'rejected');

CREATE TABLE report_field_drafts (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES report_tasks(id),
    source_doc_id BIGINT REFERENCES customer_documents(id),
    reviewed_by BIGINT REFERENCES users(id),
    field_key VARCHAR(100) NOT NULL,
    field_label VARCHAR(100) NOT NULL,
    ai_value TEXT,
    final_value TEXT,
    source_hint VARCHAR(255),
    ai_status ai_field_status NOT NULL DEFAULT 'missing',
    ai_note VARCHAR(500),
    review_status review_status NOT NULL DEFAULT 'pending',
    reviewed_at TIMESTAMP
);

-- membership_plans
CREATE TABLE membership_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    monthly_quota INT NOT NULL,
    max_advisors INT NOT NULL DEFAULT 1,
    features JSONB NOT NULL DEFAULT '{}',
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    is_active SMALLINT NOT NULL DEFAULT 1
);

-- institution_subscriptions
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled');

CREATE TABLE institution_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    institution_id BIGINT NOT NULL REFERENCES institutions(id),
    plan_id INT NOT NULL REFERENCES membership_plans(id),
    started_at TIMESTAMP NOT NULL,
    expired_at TIMESTAMP NOT NULL,
    status subscription_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- call_records
CREATE TYPE call_type AS ENUM ('AI_RECOGNITION', 'REPORT_FILL', 'DOC_EXPORT', 'API_CALL');

CREATE TABLE call_records (
    id BIGSERIAL PRIMARY KEY,
    institution_id BIGINT NOT NULL REFERENCES institutions(id),
    user_id BIGINT REFERENCES users(id),
    customer_id BIGINT REFERENCES customers(id),
    task_id BIGINT,
    call_type call_type NOT NULL,
    quota_cost INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'success',
    detail VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ai_fill_rules
CREATE TYPE ai_fill_scene AS ENUM ('form_fill', 'biz_data', 'credit_parse', 'doc_export', 'source_diagram');
CREATE TYPE review_policy AS ENUM ('advisor_confirm', 'amount_fields', 'all_fields', 'auto_no_review');

CREATE TABLE ai_fill_rules (
    id SERIAL PRIMARY KEY,
    institution_id BIGINT REFERENCES institutions(id),
    name VARCHAR(100) NOT NULL,
    scene ai_fill_scene NOT NULL,
    review_policy review_policy NOT NULL DEFAULT 'advisor_confirm',
    mapping_desc TEXT,
    created_by BIGINT REFERENCES users(id),
    status SMALLINT NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- platform_configs
CREATE TABLE platform_configs (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_val TEXT,
    description VARCHAR(255),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- api_keys
CREATE TYPE api_key_status AS ENUM ('active', 'revoked');

CREATE TABLE api_keys (
    id BIGSERIAL PRIMARY KEY,
    institution_id BIGINT NOT NULL REFERENCES institutions(id),
    key_hash VARCHAR(64) NOT NULL,
    key_prefix VARCHAR(10) NOT NULL,
    name VARCHAR(100),
    status api_key_status NOT NULL DEFAULT 'active',
    last_used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- chat_sessions
CREATE TYPE chat_source AS ENUM ('c_end', 'advisor_mobile', 'advisor_pc');

CREATE TABLE chat_sessions (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT REFERENCES customers(id),
    source chat_source NOT NULL DEFAULT 'c_end',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- chat_messages
CREATE TYPE chat_role AS ENUM ('user', 'assistant');

CREATE TABLE chat_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES chat_sessions(id),
    role chat_role NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_institution ON users(institution_id);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_customers_institution ON customers(institution_id);
CREATE INDEX idx_customers_advisor ON customers(advisor_id);
CREATE INDEX idx_customers_wx_openid ON customers(wx_openid);
CREATE INDEX idx_documents_customer ON customer_documents(customer_id);
CREATE INDEX idx_recognition_results_document ON ai_recognition_results(document_id);
CREATE INDEX idx_recognition_results_customer ON ai_recognition_results(customer_id);
CREATE INDEX idx_recognition_tasks_customer ON ai_recognition_tasks(customer_id);
CREATE INDEX idx_report_tasks_customer ON report_tasks(customer_id);
CREATE INDEX idx_report_tasks_institution ON report_tasks(institution_id);
CREATE INDEX idx_report_field_drafts_task ON report_field_drafts(task_id);
CREATE INDEX idx_call_records_institution ON call_records(institution_id);
CREATE INDEX idx_call_records_created ON call_records(created_at);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
