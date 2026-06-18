/**
 * Database Seeder for 韬纪元AI
 *
 * Usage: npm run seed
 *
 * Seeds:
 * - 4 membership plans
 * - 1 demo institution
 * - 1 admin user (phone: 13800000000, password: Admin123)
 * - 3 sample banks with 1 product each
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

// Import all entities
import { Institution } from '../modules/institutions/institution.entity';
import { User, UserRole, DataScope } from '../modules/users/user.entity';
import { UserPermission } from '../modules/users/user-permission.entity';
import { Bank } from '../modules/banks/bank.entity';
import { BankProduct } from '../modules/banks/bank-product.entity';
import { BankMaterialConfig } from '../modules/banks/bank-material-config.entity';
import { MembershipPlan } from '../modules/memberships/membership-plan.entity';
import { InstitutionSubscription } from '../modules/memberships/institution-subscription.entity';
import { Customer } from '../modules/customers/customer.entity';
import { CustomerLabel } from '../modules/customers/customer-label.entity';
import { FollowUpRecord } from '../modules/customers/follow-up-record.entity';
import { CustomerAuthorization } from '../modules/customers/customer-authorization.entity';
import { CustomerDocument } from '../modules/documents/customer-document.entity';
import { AiRecognitionResult } from '../modules/documents/ai-recognition-result.entity';
import { AiRecognitionTask } from '../modules/documents/ai-recognition-task.entity';
import { ReportTask } from '../modules/reports/report-task.entity';
import { ReportFieldDraft } from '../modules/reports/report-field-draft.entity';
import { CallRecord } from '../modules/memberships/call-record.entity';
import { AiFillRule } from '../modules/config/ai-fill-rule.entity';
import { PlatformConfig } from '../modules/config/platform-config.entity';
import { ApiKey } from '../modules/config/api-key.entity';
import { ChatSession } from '../modules/chat/chat-session.entity';
import { ChatMessage } from '../modules/chat/chat-message.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'taoji',
  password: process.env.DATABASE_PASS || 'taoji123',
  database: process.env.DATABASE_NAME || 'taoji_db',
  entities: [
    Institution,
    User,
    UserPermission,
    Bank,
    BankProduct,
    BankMaterialConfig,
    MembershipPlan,
    InstitutionSubscription,
    Customer,
    CustomerLabel,
    FollowUpRecord,
    CustomerAuthorization,
    CustomerDocument,
    AiRecognitionResult,
    AiRecognitionTask,
    ReportTask,
    ReportFieldDraft,
    CallRecord,
    AiFillRule,
    PlatformConfig,
    ApiKey,
    ChatSession,
    ChatMessage,
  ],
  synchronize: false,
  logging: true,
});

async function seed() {
  console.log('🌱 Connecting to database...');
  await dataSource.initialize();
  console.log('✅ Connected!');

  // ---- 1. Membership Plans ----
  console.log('\n📋 Seeding membership plans...');
  const planRepo = dataSource.getRepository(MembershipPlan);

  const existingPlans = await planRepo.count();
  if (existingPlans === 0) {
    const plans = [
      {
        name: '免费版',
        monthlyQuota: 30,
        maxAdvisors: 1,
        priceMonthly: 0,
        sortOrder: 1,
        isActive: 1,
        features: { ai_recognition: true, report_fill: false, export: false, api_access: false },
      },
      {
        name: 'Plus版',
        monthlyQuota: 200,
        maxAdvisors: 3,
        priceMonthly: 299,
        sortOrder: 2,
        isActive: 1,
        features: { ai_recognition: true, report_fill: true, export: true, api_access: false },
      },
      {
        name: '机构版',
        monthlyQuota: 1000,
        maxAdvisors: 20,
        priceMonthly: 999,
        sortOrder: 3,
        isActive: 1,
        features: { ai_recognition: true, report_fill: true, export: true, api_access: false, team_management: true },
      },
      {
        name: '旗舰版',
        monthlyQuota: -1,
        maxAdvisors: -1,
        priceMonthly: 2999,
        sortOrder: 4,
        isActive: 1,
        features: { ai_recognition: true, report_fill: true, export: true, api_access: true, team_management: true, custom_rules: true },
      },
    ];

    for (const plan of plans) {
      await planRepo.save(planRepo.create(plan));
    }
    console.log(`  ✅ Created ${plans.length} membership plans`);
  } else {
    console.log(`  ⏭️ Membership plans already exist (${existingPlans} records), skipping`);
  }

  // ---- 2. Demo Institution ----
  console.log('\n🏢 Seeding demo institution...');
  const institutionRepo = dataSource.getRepository(Institution);

  let institution = await institutionRepo.findOne({ where: { name: '韬纪元演示机构' } });
  if (!institution) {
    institution = await institutionRepo.save(
      institutionRepo.create({
        name: '韬纪元演示机构',
        planId: 2, // Plus版
        quotaTotal: 200,
        quotaUsed: 0,
        status: 1,
      }),
    );
    console.log(`  ✅ Created institution: ${institution.name} (ID: ${institution.id})`);

    // Create institution subscription
    const subscriptionRepo = dataSource.getRepository(InstitutionSubscription);
    await subscriptionRepo.save(
      subscriptionRepo.create({
        institutionId: institution.id,
        planId: 2,
        startedAt: new Date(),
        expiredAt: null,
        status: 'active',
      }),
    );
    console.log(`  ✅ Created active subscription for institution`);
  } else {
    console.log(`  ⏭️ Institution already exists (ID: ${institution.id}), skipping`);
  }

  // ---- 3. Admin User ----
  console.log('\n👤 Seeding admin user...');
  const userRepo = dataSource.getRepository(User);

  let adminUser = await userRepo.findOne({ where: { phone: '13800000000' } });
  if (!adminUser) {
    const passwordHash = await bcrypt.hash('Admin123', 12);
    adminUser = await userRepo.save(
      userRepo.create({
        institutionId: institution.id,
        name: '系统管理员',
        phone: '13800000000',
        passwordHash,
        role: UserRole.ADMIN,
        dataScope: DataScope.ALL,
        status: 1,
      }),
    );
    console.log(`  ✅ Created admin user: ${adminUser.phone} / Admin123 (ID: ${adminUser.id})`);

    // Add all permissions to admin
    const permRepo = dataSource.getRepository(UserPermission);
    const permissions = [
      'view_customer', 'edit_customer', 'edit_followup', 'ai_parse',
      'maintain_bank_material', 'manage_plan', 'manage_account', 'config_permission',
    ];
    for (const perm of permissions) {
      await permRepo.save(permRepo.create({ userId: adminUser.id, permission: perm }));
    }
    console.log(`  ✅ Granted all permissions to admin`);
  } else {
    console.log(`  ⏭️ Admin user already exists (ID: ${adminUser.id}), skipping`);
  }

  // ---- 4. Sample Advisor User ----
  console.log('\n👤 Seeding sample advisor...');
  let advisorUser = await userRepo.findOne({ where: { phone: '13900000001' } });
  if (!advisorUser) {
    const passwordHash = await bcrypt.hash('Advisor123', 12);
    advisorUser = await userRepo.save(
      userRepo.create({
        institutionId: institution.id,
        name: '张顾问',
        phone: '13900000001',
        passwordHash,
        role: UserRole.ADVISOR,
        dataScope: DataScope.SELF,
        status: 1,
      }),
    );
    console.log(`  ✅ Created advisor user: ${advisorUser.phone} / Advisor123 (ID: ${advisorUser.id})`);
  } else {
    console.log(`  ⏭️ Advisor user already exists (ID: ${advisorUser.id}), skipping`);
  }

  // ---- 5. Sample Banks ----
  console.log('\n🏦 Seeding sample banks...');
  const bankRepo = dataSource.getRepository(Bank);
  const productRepo = dataSource.getRepository(BankProduct);
  const configRepo = dataSource.getRepository(BankMaterialConfig);

  const bankData = [
    {
      name: '中国工商银行',
      shortName: '工商银行',
      sortOrder: 1,
      product: {
        name: '工行普惠贷',
        productType: 'business',
        loanMin: 10,
        loanMax: 500,
        rateMin: 0.0360,
        description: '面向中小微企业的普惠信贷产品，手续简便，放款快速',
        requirements: '企业成立满1年，营业执照有效，近6个月流水良好',
      },
      fields: [
        { fieldKey: 'company_name', fieldLabel: '企业名称', fieldType: 'text', required: 1, sourceHint: '来自营业执照', sortOrder: 1 },
        { fieldKey: 'unified_credit_code', fieldLabel: '统一社会信用代码', fieldType: 'text', required: 1, sourceHint: '来自营业执照', sortOrder: 2 },
        { fieldKey: 'legal_person', fieldLabel: '法定代表人', fieldType: 'text', required: 1, sourceHint: '来自营业执照', sortOrder: 3 },
        { fieldKey: 'loan_amount', fieldLabel: '申请贷款金额（万元）', fieldType: 'number', required: 1, sourceHint: '客户填写', sortOrder: 4 },
        { fieldKey: 'loan_purpose', fieldLabel: '贷款用途', fieldType: 'text', required: 1, sourceHint: '客户填写', sortOrder: 5 },
        { fieldKey: 'avg_monthly_flow', fieldLabel: '月均流水（万元）', fieldType: 'number', required: 1, sourceHint: '来自银行流水', sortOrder: 6 },
        { fieldKey: 'establishment_date', fieldLabel: '成立日期', fieldType: 'date', required: 1, sourceHint: '来自营业执照', sortOrder: 7 },
        { fieldKey: 'registered_capital', fieldLabel: '注册资本', fieldType: 'text', required: 0, sourceHint: '来自营业执照', sortOrder: 8 },
      ],
    },
    {
      name: '中国建设银行',
      shortName: '建设银行',
      sortOrder: 2,
      product: {
        name: '建行小微快贷',
        productType: 'credit',
        loanMin: 5,
        loanMax: 300,
        rateMin: 0.0380,
        description: '小微企业专属信用贷款，无需抵押',
        requirements: '企业成立满2年，近1年无不良记录',
      },
      fields: [
        { fieldKey: 'company_name', fieldLabel: '企业名称', fieldType: 'text', required: 1, sourceHint: '来自营业执照', sortOrder: 1 },
        { fieldKey: 'credit_score', fieldLabel: '企业信用评级', fieldType: 'text', required: 0, sourceHint: '来自征信报告', sortOrder: 2 },
        { fieldKey: 'loan_amount', fieldLabel: '申请金额（万元）', fieldType: 'number', required: 1, sourceHint: '客户填写', sortOrder: 3 },
        { fieldKey: 'loan_period', fieldLabel: '贷款期限（月）', fieldType: 'number', required: 1, sourceHint: '客户填写', sortOrder: 4 },
        { fieldKey: 'repayment_method', fieldLabel: '还款方式', fieldType: 'enum', required: 1, sourceHint: '客户选择', sortOrder: 5 },
      ],
    },
    {
      name: '招商银行',
      shortName: '招商银行',
      sortOrder: 3,
      product: {
        name: '招行闪电贷',
        productType: 'credit',
        loanMin: 1,
        loanMax: 100,
        rateMin: 0.0420,
        description: '个人经营性贷款，线上申请，快速到账',
        requirements: '个体工商户或小微企业主，有招行流水',
      },
      fields: [
        { fieldKey: 'applicant_name', fieldLabel: '申请人姓名', fieldType: 'text', required: 1, sourceHint: '来自身份证', sortOrder: 1 },
        { fieldKey: 'id_number', fieldLabel: '身份证号', fieldType: 'text', required: 1, sourceHint: '来自身份证', sortOrder: 2 },
        { fieldKey: 'business_type', fieldLabel: '经营类型', fieldType: 'text', required: 1, sourceHint: '来自营业执照', sortOrder: 3 },
        { fieldKey: 'loan_amount', fieldLabel: '申请金额（万元）', fieldType: 'number', required: 1, sourceHint: '客户填写', sortOrder: 4 },
        { fieldKey: 'contact_phone', fieldLabel: '联系电话', fieldType: 'text', required: 1, sourceHint: '客户填写', sortOrder: 5 },
      ],
    },
  ];

  for (const bd of bankData) {
    let bank = await bankRepo.findOne({ where: { name: bd.name } });
    if (!bank) {
      bank = await bankRepo.save(bankRepo.create({
        name: bd.name,
        shortName: bd.shortName,
        sortOrder: bd.sortOrder,
        status: 1,
      }));
      console.log(`  ✅ Created bank: ${bank.name} (ID: ${bank.id})`);

      const product = await productRepo.save(productRepo.create({
        bankId: bank.id,
        ...bd.product,
        status: 1,
      }));
      console.log(`    ✅ Created product: ${product.name} (ID: ${product.id})`);

      for (const field of bd.fields) {
        await configRepo.save(configRepo.create({ productId: product.id, ...field, reviewRequired: 1 }));
      }
      console.log(`    ✅ Created ${bd.fields.length} material config fields`);
    } else {
      console.log(`  ⏭️ Bank ${bd.name} already exists (ID: ${bank.id}), skipping`);
    }
  }

  // ---- 6. Platform Configs ----
  console.log('\n⚙️ Seeding platform configs...');
  const platformConfigRepo = dataSource.getRepository(PlatformConfig);
  const configs = [
    { configKey: 'ai_compliance_footer', configVal: 'AI输出仅供参考，最终以银行及持牌金融机构审核为准', description: 'AI结果页底部合规提示' },
    { configKey: 'platform_name', configVal: '韬纪元AI', description: '平台名称' },
    { configKey: 'support_phone', configVal: '400-000-0000', description: '客服电话' },
    { configKey: 'default_quota_free', configVal: '30', description: '免费版默认月配额' },
  ];

  for (const cfg of configs) {
    const existing = await platformConfigRepo.findOne({ where: { configKey: cfg.configKey } });
    if (!existing) {
      await platformConfigRepo.save(platformConfigRepo.create(cfg));
    }
  }
  console.log(`  ✅ Created platform configs`);

  // ---- 7. AI Fill Rules ----
  console.log('\n🤖 Seeding default AI fill rules...');
  const ruleRepo = dataSource.getRepository(AiFillRule);
  const rules = [
    {
      institutionId: null,
      name: '默认表单填写规则',
      scene: 'form_fill',
      reviewPolicy: 'advisor_confirm',
      mappingDesc: '所有字段由AI预填，顾问逐一确认',
      status: 1,
      sortOrder: 1,
      createdBy: adminUser.id,
    },
    {
      institutionId: null,
      name: '金额字段强制复核',
      scene: 'biz_data',
      reviewPolicy: 'amount_fields',
      mappingDesc: '贷款金额、流水等数值字段需顾问强制复核',
      status: 1,
      sortOrder: 2,
      createdBy: adminUser.id,
    },
  ];

  for (const rule of rules) {
    const existing = await ruleRepo.findOne({ where: { name: rule.name } });
    if (!existing) {
      await ruleRepo.save(ruleRepo.create(rule as any));
    }
  }
  console.log(`  ✅ Created AI fill rules`);

  console.log('\n🎉 Seeding complete!\n');
  console.log('Login credentials:');
  console.log('  Admin:   phone=13800000000  password=Admin123');
  console.log('  Advisor: phone=13900000001  password=Advisor123');
  console.log('  POST /api/v1/auth/login with {"phone":"...", "password":"..."}\n');

  await dataSource.destroy();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
