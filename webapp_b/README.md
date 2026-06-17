# 韬纪元AI · B端报告工作台

机构管理端 Web 应用，面向贷款顾问机构，提供客户管理、AI辅助填表、银行资料管理与机构运营后台的一体化工作台。

## 功能模块

### 工作台（Dashboard）
- 今日关键指标：资料缺口客户数、待处理作业、AI审查待处理、剩余调用次数
- 作业流程引导：看客户卡点 → 确认资料识别 → 选择银行产品 → AI填表审查 → 导出材料包
- 今日客户作业列表（按优先级 P0/P1/P2 排序）
- 当前关键待办事项聚合
- 今日 AI 填表任务快览

### 客户管理（Customers）
- 多维度搜索与筛选：企业名称、联系人、AI填表状态
- 四种排序模式：资料完整度、客户等级、下户材料优先、资料缺口优先
- 客户列表展示：优先级徽章、资质标签（国高/科小/专精特新等）、阶段、资料完整度进度条、当前卡点
- 新增客户入口

### 客户详情（CustomerDetail）
四个标签页：
- **客户总览**：就绪度评分卡、资质与风险标签、360 画像（企业基础/法人/经营/征信/需求）
- **客户资料**：资料状态三栏视图（已齐全/缺失/格式异常）、AI整理与补件提醒操作、材料参考依据评分表
- **报告产出**：目标产品选择、AI填写预览（字段名/AI填写值/数据来源/审查操作）
- **跟进记录**：顾问沟通时间线、新增跟进记录

### 报告作业台（Reports）
- 作业概览：待AI填写、待处理、可导出数量统计
- 任务列表：按状态/银行产品/客户名称筛选
- AI 填写进度可视化（X/Y 字段）
- 按任务状态显示对应操作按钮（发起AI填写 / 去复核 / 导出 / 查看）

### AI填表详情（ReportDetail）
五个标签页：
- **复核**：AI审查结论汇总（通过/需确认/严重问题）、逐项复核清单
- **基础主体资料 / 征信授权资料 / 经营财务资料 / 用途与增信资料**：字段级 AI 填写值、数据来源、人工审查操作
- 底部一键导出材料包（ZIP）

### AI资料识别（Parsing）
- 文件识别队列：上传人、归属客户、AI识别类型、置信度（颜色区分高/中/低）
- 状态管理：已确认 / 待确认 / 识别失败
- 按状态显示操作：确认 / 重新分类 / 人工标注
- 批量确认入口

### 银行资料管理（BankCenter / BankDetail）
- 已配置银行与产品总览
- 银行详情：按产品切换标签页，四个配置子标签：
  - **资料配置**：四类资料分组（基础/征信/经营财务/用途增信），含必填标识、来源方式、格式要求
  - **字段口径**：系统字段与银行要求口径对照
  - **制式表格**：表格列表，支持预览 AI 填写效果
  - **要求对比**：跨行对比同一资料项的要求差异，同时标注当前客户满足状态

### 管理后台

| 页面 | 功能 |
|------|------|
| 平台配置 | AI填表规则管理、提示词配置（资料识别/填表/导出） |
| 会员与套餐 | 当前套餐用量、报告/材料整理剩余次数、免费版/Plus版/机构版对比 |
| 调用记录 | 按类型（报告生成/材料整理/API调用）明细、员工用量统计 |
| 机构账号 | 员工账号管理、角色配置（顾问/主管/运营管理员）、数据范围、权限开关 |
| API配置 | API Key 展示与复制、接口地址（AI填表/任务查询）、集成说明 |

---

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| React | 18.3 | UI 框架 |
| TypeScript | 5.5 | 类型安全，strict 模式 |
| Vite | 5.4 | 构建工具，开发热更新 |
| React Router | 6.26 | 客户端路由 |
| CSS | 纯 CSS Modules | 无第三方 UI 库，自定义设计系统 |

当前数据层为 `src/utils/mock.ts` 中的静态 Mock 数据，对接真实后端时替换各页面的数据获取逻辑即可。

---

## 目录结构

```
webapp_b/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx              # 应用入口
│   ├── App.tsx               # 路由配置
│   ├── index.css             # 全局样式 / Reset
│   ├── types/
│   │   └── index.ts          # 全局 TypeScript 类型定义
│   ├── utils/
│   │   └── mock.ts           # Mock 数据层
│   ├── components/
│   │   └── Layout/           # 侧边栏 + 主区域布局
│   └── pages/
│       ├── Dashboard/        # 工作台
│       ├── Customers/        # 客户列表
│       ├── CustomerDetail/   # 客户详情
│       ├── Reports/          # 报告作业台
│       ├── ReportDetail/     # AI填表详情
│       ├── Parsing/          # AI资料识别
│       ├── BankCenter/       # 银行资料管理（列表）
│       ├── BankDetail/       # 银行资料管理（详情）
│       └── Settings/         # 管理后台（5个子页面）
```

---

## 本地开发

**环境要求：** Node.js 18+

```bash
# 进入项目目录
cd webapp_b

# 安装依赖
npm install

# 启动开发服务器（默认端口 5173）
npm run dev
```

浏览器访问 `http://localhost:5173`，支持热更新。

---

## 构建部署

### 构建生产包

```bash
npm run build
```

产物输出至 `dist/` 目录（静态文件：HTML + JS + CSS）。

### 本地预览构建产物

```bash
npm run preview
```

### 部署到服务器

`dist/` 目录为纯静态文件，可部署至任意 Web 服务器。

**Nginx 示例配置**（处理 SPA 路由）：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/taoji-b/dist;
    index index.html;

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

### 部署至云平台

| 平台 | 命令 / 操作 |
|------|-------------|
| Vercel | `vercel --prod`（根目录设为 `webapp_b/`） |
| Netlify | 构建命令 `npm run build`，发布目录 `dist` |
| 腾讯云 COS / 阿里云 OSS | 上传 `dist/` 内容，开启静态网站托管，配置 404 页面指向 `index.html` |

---

## 对接后端

页面数据当前来自 `src/utils/mock.ts`。接入真实 API 时：

1. 在 `src/utils/` 下新增 `api.ts`，封装 `fetch` 或 `axios` 请求
2. 各页面组件中将 `import { mockXxx } from '../../utils/mock'` 替换为对应 API 调用
3. 后端接口规范参见项目根目录 `docs/开发文档.md`

---

## 注意事项

- 本应用为机构内部工具，建议部署后配置访问鉴权（如 Nginx Basic Auth 或业务层 JWT）
- AI 填表结果须经顾问人工复核后方可导出，平台不直接对外发放贷款或承诺额度
- 当前 API 配置页面的 Key 为演示占位，生产环境需替换为真实密钥并通过环境变量注入
