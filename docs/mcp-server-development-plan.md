# Agency MCP Server — 开发规划

> 版本: 1.0-draft
> 日期: 2026-05-09
> 状态: 待评审

---

## 1. 项目背景与动机

### 1.1 现状

Agency Agents 项目包含仓库内的专业 AI Agent 定义（Markdown + YAML Frontmatter 格式），覆盖工程、设计、营销、产品、测试等 14 个专业领域。当前通过 `convert.sh` + `install.sh` 管道转换为各 IDE 的规则文件（如 Cursor `.mdc`、Trae `.md`），以静态文本注入方式使用。

### 1.2 问题

| 问题 | 影响 |
|------|------|
| Agent 不可发现 | 用户必须记住 Agent 名称才能通过 `#name` 引用 |
| 无编排能力 | NEXUS 7 阶段流水线策略无法在 IDE 中原生执行 |
| 语义错配 | Agent 人格被塞入"规则"容器，丢失动态决策能力 |
| 项目级绑定 | 每个项目需独立安装规则文件，无法跨项目复用 |
| 无状态管理 | Agent 无法跨会话记忆，每次激活都是冷启动 |

### 1.3 目标

构建 Agency MCP Server，将 Agent 从"静态规则文本"升级为"可发现、可调用、可编排"的动态服务，同时与现有 Rules 方式并存互补。

---

## 2. 架构设计

### 2.1 系统架构

```text
┌─────────────────────────────────────────────────────────────┐
│                  宿主 AI (Trae / Claude / Cursor)            │
│                                                             │
│   Rules 方式 (现有)           MCP Server 方式 (新增)         │
│   ─────────────────          ──────────────────────         │
│   #devops-automator          invoke_agent                    │
│   手动记忆名称                list_agents 浏览发现            │
│   单 Agent 激活              orchestrate 多 Agent 编排       │
│   零依赖                     需 Node.js 运行时               │
└───────────────────────────┬─────────────────────────────────┘
                            │ MCP Protocol (Stdio)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Agency MCP Server (Node.js)                 │
│                                                             │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │  list_agents  │  │ invoke_agent  │  │  orchestrate    │  │
│  │  浏览 + 搜索  │  │ 加载 Agent 人格│  │  NEXUS 编排     │  │
│  └──────────────┘  └───────────────┘  └─────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Resources: agents://{name}/profile                 │    │
│  │  Prompts:  nexus-pipeline, agent-activation         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  数据层: 运行时读取 */*.md Agent 定义 + strategy/*.md       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 设计原则

| 原则 | 说明 |
|------|------|
| **只路由，不执行** | Server 返回 Agent 人格和编排计划，由宿主 AI 执行，Server 本身无 LLM 调用 |
| **零外部 API** | 不依赖任何云服务，纯本地文件读取 + 结构化输出 |
| **与 Rules 并存** | MCP 不替代 Rules，两者服务不同场景 |
| **增量复杂度** | 阶段 1 可独立交付，后续阶段按需叠加 |
| **源文件唯一真相** | Agent 定义仍由 `*/.md` 源文件维护，Server 运行时读取 |

### 2.3 Tool 详细规格

#### `list_agents` — Agent 发现与浏览

```
描述: 浏览和搜索 Agency 当前仓库中的专业 Agent 目录

参数:
  - category (可选): 按分类过滤
    枚举: engineering | design | marketing | product | project-management |
          testing | support | spatial-computing | specialized | finance |
          sales | academic | game-development | paid-media
  - query (可选): 关键词搜索（匹配 name + description）
  - format (可选): 输出格式
    枚举: summary (默认，名称+描述) | full (完整人格概要)

返回: Agent 列表，每项包含:
  - name: Agent 名称
  - slug: URL 安全标识符
  - description: 一句话描述
  - category: 所属分类
  - emoji: 标识图标
```

#### `invoke_agent` — Agent 人格加载

```text
描述: 加载指定 Agent 的完整人格定义，注入到当前对话上下文

参数:
  - name (必需): Agent 名称或 slug
    示例: "devops-automator" | "DevOps Automator"
  - task (可选): 要执行的具体任务描述
    作用: 附加到 Agent 人格之后，作为任务指令
  - context (可选): 项目上下文信息
    作用: 技术栈、约束条件等，帮助 Agent 更精准响应

返回: 结构化 Agent 激活指令:
  - system_prompt: Agent 完整 System Prompt
  - task_instruction: 任务指令（如有）
  - suggested_globs: 建议关联的文件模式
  - quality_gates: 该 Agent 的质量验证标准
```

#### `orchestrate` — NEXUS 多 Agent 编排

```
描述: 根据 NEXUS 策略，为复杂任务生成多 Agent 编排计划

参数:
  - task (必需): 任务描述
    示例: "构建一个 SaaS 产品的 MVP"
  - mode (可选): 编排规模
    枚举: micro (5-10 核心 Agent, 1-5天) |
          sprint (15-25 核心 Agent, 2-6周) |
          full (完整 NEXUS 核心 roster, 12-24周)
    默认: sprint
  - constraints (可选): 约束条件
    示例: "只用 TypeScript" | "预算有限"

返回: NEXUS 编排计划:
  - phases: 各阶段详情
    - phase_name: 阶段名称 (Discovery → Strategy → ...)
    - agents: 该阶段激活的 Agent 列表
    - parallel_tracks: 可并行的工作流
    - quality_gate: 阶段质量门禁标准
    - handoff: 下一阶段的交接内容
  - total_agents: 涉及的 Agent 总数
  - estimated_phases: 预计阶段数
```

### 2.4 Resource 规格

```text
agents://{name}/profile
  → 返回指定 Agent 的完整 Markdown 定义（原始源文件内容）

agents://{category}/catalog
  → 返回指定分类下所有 Agent 的摘要列表
```

### 2.5 Prompt Template 规格

```
nexus-pipeline
  参数: task, mode
  → 生成完整的 NEXUS 7 阶段执行引导 Prompt

agent-activation
  参数: agent_name, task
  → 生成 Agent 激活指令（含人格 + 任务 + 质量标准）
```

---

## 3. 技术选型

| 组件 | 选型 | 理由 |
|------|------|------|
| **运行时** | Node.js 18+ | MCP SDK 原生支持，与项目 MCP Builder Agent 推荐一致 |
| **语言** | TypeScript 5 | 类型安全，MCP SDK 一等公民 |
| **MCP SDK** | `@modelcontextprotocol/sdk` | 官方 SDK，Stdio 传输开箱即用 |
| **参数校验** | `zod` | MCP SDK 内置依赖，Schema 定义即文档 |
| **YAML 解析** | `gray-matter` | 轻量 Frontmatter 解析，零配置 |
| **传输方式** | Stdio | 本地使用零配置，所有主流 IDE 支持 |
| **构建** | `tsc` | 无需打包器，直接编译 |

### 依赖清单

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.0",
    "gray-matter": "^4.0.3",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0"
  }
}
```

---

## 4. 目录结构

```
mcp-server/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                  # 入口：创建 Server + 注册 Tool/Resource/Prompt
│   ├── loader.ts                 # Agent 加载器：扫描目录 + 解析 Frontmatter
│   ├── types.ts                  # TypeScript 类型定义
│   ├── nexus.ts                  # NEXUS 策略解析 + 编排引擎
│   ├── tools/
│   │   ├── list-agents.ts        # list_agents Tool 实现
│   │   ├── invoke-agent.ts       # invoke_agent Tool 实现
│   │   └── orchestrate.ts        # orchestrate Tool 实现
│   ├── resources/
│   │   └── agent-profile.ts      # agents:// Resource 实现
│   └── prompts/
│       ├── nexus-pipeline.ts     # NEXUS 流水线 Prompt 模板
│       └── agent-activate.ts     # Agent 激活 Prompt 模板
├── dist/                         # 编译输出 (.gitignore)
└── README.md
```

---

## 5. 分阶段交付计划

### 阶段 1: 项目骨架与 Agent 加载器

**交付物**: 可启动的 MCP Server，`list_agents` 可用

| 编号 | 任务 | 验收标准 |
|------|------|----------|
| 1.1 | 初始化 `mcp-server/` 目录结构 | `package.json` + `tsconfig.json` 就绪 |
| 1.2 | 安装依赖并验证编译 | `npm run build` 无错误 |
| 1.3 | 定义 `AgentProfile`、`AgentCategory` 等类型 | 类型完整覆盖 Frontmatter 字段 |
| 1.4 | 实现 Agent 加载器 `loader.ts` | 扫描 14 个目录，解析仓库内全部 Agent，构建索引 |
| 1.5 | 实现 `list_agents` Tool | 返回 Agent 目录，支持 category 过滤和 query 搜索 |
| 1.6 | 实现 Server 入口 `index.ts` | Stdio 传输，可被 IDE 连接 |
| 1.7 | 端到端验证 | 在 Trae IDE 中调用 `list_agents` 成功返回 |

### 阶段 2: 核心 Tool 实现

**交付物**: `invoke_agent` + `orchestrate` + Resources + Prompts

| 编号 | 任务 | 验收标准 |
|------|------|----------|
| 2.1 | 实现 `invoke_agent` Tool | 输入 Agent 名称，返回完整 System Prompt |
| 2.2 | 实现 `agents://{name}/profile` Resource | 返回 Agent 原始 Markdown |
| 2.3 | 实现 `agents://{category}/catalog` Resource | 返回分类摘要 |
| 2.4 | 实现 `nexus-pipeline` Prompt 模板 | 输入 task + mode，生成 7 阶段引导 |
| 2.5 | 实现 `agent-activation` Prompt 模板 | 输入 agent + task，生成激活指令 |
| 2.6 | 端到端验证 | 在 IDE 中调用 `invoke_agent` 成功加载人格 |

### 阶段 3: NEXUS 编排引擎

**交付物**: `orchestrate` 返回完整的 NEXUS 执行计划

| 编号 | 任务 | 验收标准 |
|------|------|----------|
| 3.1 | 解析 `strategy/nexus-strategy.md` | 提取 Phase-Agent 映射表 |
| 3.2 | 解析 7 个 Phase playbook | 提取各阶段 Agent 角色、并行工作流、质量门禁 |
| 3.3 | 实现编排引擎 `nexus.ts` | 根据 task + mode 生成编排计划 |
| 3.4 | 实现 `orchestrate` Tool | 返回结构化编排计划（Agent 组合 + 执行顺序 + 质量门禁） |
| 3.5 | 支持 micro / sprint / full 三种模式 | 各模式返回合理规模的 Agent 集合 |
| 3.6 | 端到端验证 | 输入 "构建 SaaS MVP"，返回合理的 NEXUS 计划 |

### 阶段 4: 集成与发布

**交付物**: 一键安装，与项目工具链完整整合

| 编号 | 任务 | 验收标准 |
|------|------|----------|
| 4.1 | 在 `convert.sh` 注册 `mcp-server` | `--tool mcp-server` 生成配置片段 |
| 4.2 | 在 `install.sh` 注册 `mcp-server` | 自动写入 IDE 的 `mcpServers` 配置 |
| 4.3 | 创建 `integrations/mcp-server/README.md` | 安装和使用文档 |
| 4.4 | 添加构建与启动脚本 | `npm run build` + `npm start` 可用 |
| 4.5 | 更新 `.gitignore` | 忽略 `mcp-server/dist/` 和 `node_modules/` |
| 4.6 | 全流程端到端测试 | convert → install → IDE 连接 → Tool 调用 全链路通过 |

---

## 6. 关键技术决策

### 6.1 为什么 Server 不调用 LLM？

Server 只做**路由和结构化**，不做推理。原因：
- 避免引入 API Key 管理复杂度
- 保持零外部依赖、纯本地运行
- 宿主 AI 本身就是 LLM，不需要 Server 再调一次
- 编排计划由规则驱动（NEXUS 策略文件），不需要 LLM 推理

### 6.2 为什么用 Stdio 而非 SSE？

- 本地使用场景，Stdio 零配置
- 所有主流 IDE（Trae、Claude Desktop、Cursor）原生支持 Stdio
- 无需端口管理、无 CORS 问题
- 后续如需远程部署，可增量添加 SSE 传输

### 6.3 为什么 invoke_agent 返回 Prompt 而非直接执行？

MCP Tool 的返回值是文本内容，宿主 AI 将其作为上下文使用。返回 System Prompt 让宿主 AI "扮演"该 Agent 是当前 MCP 协议下最合理的方式：
- 宿主 AI 拥有完整的推理能力
- Agent 人格 + 任务指令的组合效果远超纯规则注入
- 无需 Server 维护对话状态

### 6.4 编排引擎为什么是规则驱动而非 AI 驱动？

NEXUS 策略已经明确定义了 Phase-Agent 映射关系，不需要 AI 推理来决定"哪个 Agent 在哪个阶段"。规则驱动的好处：
- 确定性：相同输入总是返回相同编排计划
- 可审计：编排逻辑来自可读的策略文件
- 可维护：修改策略文件即可调整编排行为
- 零延迟：无 LLM 调用开销

---

## 7. 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| MCP SDK 版本不兼容 | 中 | 高 | 锁定 SDK 版本，跟进官方 Release |
| Agent 名称模糊匹配不准 | 中 | 低 | 优先精确匹配 slug，模糊匹配时返回候选列表 |
| NEXUS 策略文件格式变更 | 低 | 中 | 解析层做防御性编程，缺失字段用默认值 |
| 宿主 AI 误解编排计划 | 中 | 中 | Prompt 模板中强化指令清晰度，提供示例 |
| Node.js 环境未安装 | 中 | 低 | 文档中说明前置条件，install.sh 检测 Node |

---

## 8. 与 Rules 方式的定位对比

```text
场景决策树:

用户需求
  │
  ├── "帮我做一件具体的事" (单 Agent)
  │     │
  │     ├── 我知道 Agent 名字 → Rules: #name (更快)
  │     └── 我不知道有哪些 Agent → MCP: list_agents → invoke_agent
  │
  └── "帮我完成一个复杂项目" (多 Agent)
        │
        ├── 简单顺序 → MCP: invoke_agent × N (手动编排)
        └── 需要 NEXUS 流水线 → MCP: orchestrate (自动编排)
```

| 维度 | Rules | MCP Server |
|------|-------|------------|
| 依赖 | 零 | Node.js |
| 发现 | 无 | list_agents |
| 编排 | 无 | orchestrate |
| 跨项目 | 每项目安装 | 一个 Server 服务所有项目 |
| 状态 | 无 | 无（Phase 1-4 均无状态） |
| 适合 | 快速单次任务 | 复杂多 Agent 协作 |

---

## 9. 后续演进方向（Phase 5+）

以下为未来可探索的方向，不在当前 4 阶段范围内：

| 方向 | 说明 |
|------|------|
| **Agent 状态持久化** | 跨会话记忆，Agent 记住之前的工作上下文 |
| **SSE 传输** | 支持远程部署，团队共享一个 Agency Server |
| **动态 Tool 注册** | Agent 可注册自己的专属 MCP Tool（如 DevOps Agent 注册 `deploy` Tool） |
| **Agent 间通信** | 多个 Agent 通过 Server 共享上下文和中间产物 |
| **Web UI** | Agent 目录浏览 + 编排计划可视化的 Web 界面 |
| **CI/CD 集成** | Agency Server 作为 CI Pipeline 的 Agent 调度器 |
