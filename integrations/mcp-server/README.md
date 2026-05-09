# Agency MCP Server

Agency MCP Server 将 Agency Agents 仓库中的专业 AI Agent 从静态规则文本升级为可发现、可调用、可编排的动态 MCP 服务。

## 安装

### 前置条件

- Node.js 18+
- 已克隆 [agency-agents](https://github.com/msitarzewski/agency-agents) 仓库

### 方式 1: 使用 install.sh

```bash
cd agency-agents
./scripts/install.sh --tool mcp-server
```

### 方式 2: 手动安装

```bash
cd agency-agents/mcp-server
npm ci
npm run build
npm test
```

然后在 IDE 的 mcpServers 配置中添加:

```json
{
  "mcpServers": {
    "agency": {
      "command": "node",
      "args": ["<repo-path>/mcp-server/dist/index.js"]
    }
  }
}
```

### IDE 配置文件位置

| IDE | 配置文件 |
|-----|---------|
| **Trae** | `.trae/mcp.json` |
| **Cursor** | `.cursor/mcp.json` |
| **Claude Desktop** | `claude_desktop_config.json` |

## 功能

### Tools

- **`list_agents`** — 浏览和搜索当前仓库中的 Agent 目录，支持按分类过滤和关键词搜索
- **`invoke_agent`** — 加载指定 Agent 的完整人格定义到当前对话上下文
- **`orchestrate`** — 基于 NEXUS 7 阶段策略生成多 Agent 编排计划，`micro` / `sprint` / `full` 分别对应小型、标准与完整核心 roster

### Resource Templates

- **`agents://{name}/profile`** — 返回 Agent 的原始 Markdown 定义
- **`agents://{category}/catalog`** — 返回分类下所有 Agent 的摘要列表

### Prompts

- **`nexus-pipeline`** — 生成 NEXUS 7 阶段执行引导 Prompt
- **`agent-activation`** — 生成 Agent 激活指令

## 使用示例

```
# 浏览所有 Agent
list_agents

# 搜索特定领域
list_agents category="engineering"

# 关键词搜索
list_agents query="devops"

# 激活 Agent
invoke_agent name="devops-automator" task="设置 CI/CD 流水线"

# 编排多 Agent
orchestrate task="构建 SaaS MVP" mode="sprint"
```

## 与 Rules 方式的关系

MCP Server 与现有的 Rules 方式并存互补:
- **Rules**: 快速单次任务，提前知道 Agent 名称
- **MCP Server**: 浏览发现 Agent + 复杂多 Agent 协作编排

## 开发

```bash
cd mcp-server
npm ci
npm run build    # 编译 TypeScript
npm test         # 运行 smoke test
npm start        # 启动 Server
```

修改源文件后重新构建:
```bash
npm run build
```
