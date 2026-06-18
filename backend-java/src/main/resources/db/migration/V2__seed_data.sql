-- Membership plans
INSERT INTO membership_plans (name, monthly_quota, max_advisors, features, price_monthly, sort_order, is_active) VALUES
('免费版', 30, 1, '{"ai_recognition":true,"report_fill":false,"export":false,"api_access":false,"team_management":false,"custom_rules":false}', 0, 1, 1),
('Plus版', 200, 3, '{"ai_recognition":true,"report_fill":true,"export":true,"api_access":false,"team_management":false,"custom_rules":false}', 299, 2, 1),
('机构版', 1000, 20, '{"ai_recognition":true,"report_fill":true,"export":true,"api_access":false,"team_management":true,"custom_rules":false}', 999, 3, 1),
('旗舰版', -1, -1, '{"ai_recognition":true,"report_fill":true,"export":true,"api_access":true,"team_management":true,"custom_rules":true}', 2999, 4, 1);

-- Demo institution
INSERT INTO institutions (name, plan_id, quota_total, quota_used, status) VALUES ('韬纪元演示机构', 2, 200, 0, 1);

-- Admin user (password: 123456)
INSERT INTO users (institution_id, name, phone, password_hash, role, data_scope, status)
VALUES (1, '系统管理员', '13800000000', '$2b$10$COh.LnT.oQBYbcnuwoAxA.2crHPqrLaCqxxiYr5TRdASDz4dUjLyC', 'ADMIN', 'ALL', 1);

-- Advisor user (password: Advisor123)
INSERT INTO users (institution_id, name, phone, password_hash, role, data_scope, status)
VALUES (1, '示例顾问', '13900000001', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADVISOR', 'SELF', 1);

-- All permissions for admin
INSERT INTO user_permissions (user_id, permission) VALUES
(1, 'view_customer'), (1, 'edit_customer'), (1, 'edit_followup'),
(1, 'ai_parse'), (1, 'maintain_bank_material'), (1, 'manage_plan'),
(1, 'manage_account'), (1, 'config_permission');

-- Institution subscription
INSERT INTO institution_subscriptions (institution_id, plan_id, started_at, expired_at, status)
VALUES (1, 2, NOW(), NOW() + INTERVAL '1 year', 'active');

-- Banks
INSERT INTO banks (name, short_name, sort_order, status) VALUES
('中国工商银行', '工行', 1, 1),
('中国建设银行', '建行', 2, 1),
('招商银行', '招行', 3, 1);

-- Bank products
INSERT INTO bank_products (bank_id, name, product_type, loan_min, loan_max, rate_min, description, sort_order, status) VALUES
(1, '普惠贷', 'business', 10000, 2000000, 0.0398, '面向小微企业主的信用贷款产品', 1, 1),
(2, '小微快贷', 'business', 50000, 5000000, 0.0428, '小微企业快速融资方案', 1, 1),
(3, '闪电贷', 'credit', 10000, 500000, 0.0488, '个人消费信用贷款', 1, 1);

-- Material configs for 普惠贷
INSERT INTO bank_material_configs (product_id, field_key, field_label, field_type, required, review_required, sort_order) VALUES
(1, 'company_name', '企业名称', 'text', 1, 0, 1),
(1, 'business_license_no', '营业执照号', 'text', 1, 1, 2),
(1, 'legal_person', '法定代表人', 'text', 1, 0, 3),
(1, 'registered_capital', '注册资本(万元)', 'number', 1, 1, 4),
(1, 'established_date', '成立日期', 'date', 1, 0, 5),
(1, 'annual_revenue', '年营业额(万元)', 'number', 1, 1, 6),
(1, 'loan_purpose_detail', '贷款用途说明', 'text', 1, 1, 7),
(1, 'contact_phone', '联系电话', 'text', 1, 0, 8);

-- Material configs for 小微快贷
INSERT INTO bank_material_configs (product_id, field_key, field_label, field_type, required, review_required, sort_order) VALUES
(2, 'company_name', '企业名称', 'text', 1, 0, 1),
(2, 'business_license_no', '营业执照号', 'text', 1, 1, 2),
(2, 'annual_tax', '年纳税额(万元)', 'number', 1, 1, 3),
(2, 'bank_flow_months', '银行流水月数', 'number', 1, 0, 4),
(2, 'collateral', '抵押物情况', 'text', 0, 1, 5);

-- Material configs for 闪电贷
INSERT INTO bank_material_configs (product_id, field_key, field_label, field_type, required, review_required, sort_order) VALUES
(3, 'id_card_no', '身份证号', 'text', 1, 1, 1),
(3, 'monthly_income', '月收入(元)', 'number', 1, 1, 2),
(3, 'employment_type', '就业类型', 'enum', 1, 0, 3),
(3, 'social_security_months', '社保缴纳月数', 'number', 0, 0, 4),
(3, 'credit_score', '征信分数', 'number', 0, 1, 5);

-- Platform configs
INSERT INTO platform_configs (config_key, config_val, description) VALUES
('ai_compliance_footer', 'AI生成结果仅供参考，最终以顾问审核为准', 'AI合规免责声明'),
('platform_name', '韬纪元AI贷款助手', '平台名称'),
('support_phone', '400-800-8888', '客服电话'),
('default_quota_free', '30', '免费版默认月度配额');

-- Default AI fill rules
INSERT INTO ai_fill_rules (institution_id, name, scene, review_policy, mapping_desc, status, sort_order) VALUES
(NULL, '默认表单填写规则', 'form_fill', 'advisor_confirm', '按照银行材料清单自动填写，顾问确认后提交', 1, 1),
(NULL, '金额字段强制复核', 'biz_data', 'amount_fields', '涉及金额字段必须顾问手动复核确认', 1, 2);
