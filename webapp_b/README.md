# 韬纪元AI · B端报告工作台

机构管理端 Web 应用，面向贷款顾问机构，提供客户管理、AI辅助填表、银行资料管理与机构运营后台的一体化工作台。

## 功能模块

### 工作台（Dashboard）
- 今日关键指标：资料缺口客户数、待处理作业数、AI审查待处理、剩余调用次数（实时从 API 聚合）
- 作业流程引导：看客户卡点 → 确认资料识别 → 选择银行产品 → AI填表审查 → 导出材料包
- 今日客户作业列表：优先级徽章（从 labels 读取或按完整度推导）、阶段、资料完整度进度条、卡点说明
- 当前关键待办：由客户 `riskNotes` 字段驱动，按完整度着色（红/橙/蓝）
- 今日 AI 填表任务快览：最新 3 条报告任务，状态标签实时映射

### 客户管理（Customers）
- 多维度搜索与筛选：企业名称、联系人、AI填表状态
- 四种排序模式：资料完整度、客户等级、下户材料优先、资料缺口优先
- 客户列表：优先级徽章、资质标签（国高/科小/专精特新等）、阶段、资料完整度进度条、当前卡点
- 新增客户弹窗

### 客户详情（CustomerDetail）
四个标签页：
- **客户总览**：就绪度评分卡、资质与风险标签、360 画像（企业基础/法人/经营/征信/需求）
- **客户资料**：资料状态三栏视图（已齐全/缺失/格式异常）、AI整理与补件提醒、文件上传
- **报告产出**：目标产品选择、AI填表任务列表、跳转填表详情
- **跟进记录**：顾问沟通时间线、新增跟进记录

### 报告作业台（Reports）
- 作业概览：待AI填写、待处理、可导出数量统计
- 任务列表：按状态/银行产品/客户名称筛选，分页
- AI 填写进度可视化
- 按任务状态显示对应操作按钮（发起AI填写 / 去复核 / 导出 / 查看）

### AI填表详情（ReportDetail）
三个标签页：
- **复核总览**：AI审查结论汇总（已审核/待审核/AI问题数）、复核说明、导出入口
- **字段明细**：字段级 AI 填写值、最终值、数据来源、AI状态（正常/有问题/缺失/待确认）、逐项审核操作（通过/修正/拒绝）
- **材料目录**：客户已上传文件按类型分组展示，文件下载链接，AI解析状态

**导出材料包（ExportModal）**：
- 文件清单：加载客户全部材料，按类型分组，单独勾选/全选，显示文件大小
- 格式选项：ZIP 压缩包（材料文件 + 可选 AI 字段明细 CSV）
- 进度处理：后端同步时直接下载；异步时轮询 `getReportTask` 最长 60 秒
- 完成后显示下载链接，支持重新导出

### AI资料识别（Parsing）
- 文件识别队列：上传人、归属客户、AI识别类型、置信度（高/中/低配色）
- 状态管理：已确认 / 待确认 / 识别失败
- 操作：确认 / 重新分类弹窗 / 重新识别
- 批量确认（Checkbox 全选 + Promise.all）
- 新上传文件入口

### 银行资料管理（BankCenter / BankDetail）
- 已配置银行与产品总览，客户端搜索
- 新增银行弹窗
- 银行详情四个标签页（按产品切换）：
  - **资料配置**：五类资料分组（基础主体/征信授权/经营财务/用途增信/银行表格），必填标识、来源方式、格式要求，新增/删除条目
  - **字段口径**：系统字段与银行要求口径对照，新增/删除
  - **制式表格**：表格列表，文件下载链接，新增/删除
  - **要求对比**：跨产品对比同类资料项差异

### 管理后台（Settings）

| 页面 | 功能 |
|------|------|
| 平台配置（Templates） | AI填表规则 CRUD（名称/字段/触发/优先级）、启用/停用；Prompt 配置查看与编辑（模型+内容） |
| 会员与套餐（Membership） | 当前套餐用量进度条（80% 橙色预警）、报告/材料整理/API/员工额度；套餐对比表；升级弹窗 |
| 调用记录（UsageLogs） | 按类型（报告生成/材料整理/API调用）+关键词筛选，400ms 防抖；员工用量统计进度条；导出记录入口 |
| 机构账号（OrgAccounts） | 员工账号管理（新增/停用）、角色（顾问/主管/运营管理员）、数据范围；9 项权限复选框弹窗 |
| API配置（ApiConfig） | API Key 展示（脱敏）/复制；重新生成（仅显示一次完整 Key）；接口列表；接入指南 |

---

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| React | 18.3 | UI 框架 |
| TypeScript | 5.5 | 类型安全，strict 模式 |
| Vite | 5.4 | 构建工具，开发热更新 |
| React Router | 6.26 | 客户端路由，含受保护路由 |
| CSS | 纯 CSS | 无第三方 UI 库，自定义设计系统 |

---

## 目录结构

```
webapp_b/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── main.tsx              # 应用入口
    ├── App.tsx               # 路由配置（含 ProtectedRoute）
    ├── index.css             # 全局样式 / Reset
    ├── utils/
    │   ├── api.ts            # 全部 API 调用封装（Bearer token，统一错误处理）
    │   ├── auth.ts           # Token 读写 / 清除
    │   └── mock.ts           # 历史 Mock 数据（已基本弃用）
    ├── components/
    │   └── Layout/           # 侧边栏 + 主区域布局
    └── pages/
        ├── Login/            # 登录页（手机号 + 密码，JWT）
        ├── Dashboard/        # 工作台
        ├── Customers/        # 客户列表
        ├── CustomerDetail/   # 客户详情（4 标签页）
        ├── Reports/          # 报告作业台
        ├── ReportDetail/     # AI填表详情（复核 / 字段 / 材料 + 导出弹窗）
        ├── Parsing/          # AI资料识别
        ├── BankCenter/       # 银行资料管理（列表）
        ├── BankDetail/       # 银行资料管理（详情，4 子标签）
        └── Settings/         # 管理后台
            ├── Templates.tsx    # 平台配置
            ├── Membership.tsx   # 会员与套餐
            ├── UsageLogs.tsx    # 调用记录
            ├── OrgAccounts.tsx  # 机构账号
            └── ApiConfig.tsx    # API配置
```

---

## API 层

所有数据请求统一通过 `src/utils/api.ts`，约定：

- **Base URL**：`/api/v1`（由 Vite proxy 或 Nginx 转发至后端）
- **认证**：每个请求自动附加 `Authorization: Bearer <token>`；401 时清除本地 token 并跳转登录页
- **响应格式**：`{ statusCode, message, data }` — 统一解包，非 2xx 时抛出 `Error(message)`

主要 API 分组：

| 分组 | 路径前缀 | 说明 |
|------|----------|------|
| 认证 | `/auth` | 登录 |
| 客户 | `/customers` | CRUD、概览、跟进记录 |
| 文件 | `/documents` | 上传、列表、确认、重试解析 |
| 报告 | `/reports` | 任务 CRUD、字段复核、导出（含 docIds / includeForm 参数） |
| 银行 | `/banks` | 银行/产品 CRUD |
| 产品配置 | `/products/:id` | 资料条目、字段口径、制式表格 |
| 设置 | `/settings` | AI规则、Prompt、会员、账号、调用记录、API Key |
| 工作台 | `/dashboard` | 统计汇总（待后端实现） |

---

## 本地开发

**环境要求：** Node.js 18+

```bash
cd webapp_b
npm install
npm run dev      # 默认端口 5173
```

**代理配置**（`vite.config.ts`）：开发时 `/api` 请求转发至本地后端（默认 `http://localhost:3000`）。

---

## 构建部署

```bash
npm run build    # 产物输出至 dist/
npm run preview  # 本地预览构建产物
```

`dist/` 为纯静态文件，可部署至任意 Web 服务器。

**Nginx 示例**（处理 SPA 路由 + API 反代）：

```nginx
server {
    listen 80;
    root /var/www/taoji-b/dist;
    index index.html;

    location /api/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
}
```

**Docker 示例**：

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

---

## 注意事项

- AI 填表结果须经顾问人工复核后方可导出，平台不直接对外发放贷款或承诺额度
- 导出材料包为异步操作，前端在导出后轮询任务状态（每 2 秒，最长 60 秒）获取下载链接
- API Key 重新生成后完整密钥仅显示一次，请即时复制保存
- 建议生产环境通过环境变量注入后端地址，避免硬编码
