import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { loadAgents } from "../dist/loader.js";
import { generateOrchestrationPlan } from "../dist/nexus.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mcpRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(mcpRoot, "..");
const serverEntry = path.resolve(mcpRoot, "dist/index.js");

const TIMEOUT_MS = 15_000;

function withTimeout(promise, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Timeout (${TIMEOUT_MS}ms) waiting for: ${label}`)),
      TIMEOUT_MS
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

process.chdir(repoRoot);

function extractText(result) {
  return result.content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");
}

const store = await loadAgents();
assert.ok(store.profiles.length > 0, "Agent loader should load at least one agent");
assert.ok(store.bySlug.size > 0, "Agent loader should build slug index");
assert.ok(store.byCategory.size > 0, "Agent loader should build category index");
assert.ok(
  store.byCategory.has("engineering"),
  "Agent loader should include 'engineering' category"
);
assert.ok(
  store.profiles.some((p) => p.slug === "frontend-developer"),
  "Agent loader should include known agent 'frontend-developer'"
);

const microPlan = generateOrchestrationPlan(store, "Fix a production bug", "micro", "");
assert.ok(
  microPlan.total_agents >= 5 && microPlan.total_agents <= 10,
  `Micro mode should stay within 5-10 core agents, got ${microPlan.total_agents}`
);

const sprintPlan = generateOrchestrationPlan(
  store,
  "Build a SaaS MVP",
  "sprint",
  "TypeScript only"
);
assert.ok(
  sprintPlan.total_agents >= 15 && sprintPlan.total_agents <= 25,
  `Sprint mode should stay within 15-25 core agents, got ${sprintPlan.total_agents}`
);

const fullPlan = generateOrchestrationPlan(store, "Build a SaaS MVP", "full", "");
assert.ok(
  fullPlan.total_agents >= sprintPlan.total_agents,
  "Full mode should include at least as many core agents as sprint mode"
);
assert.deepEqual(
  sprintPlan.phases[1]?.quality_gate.gate_keepers,
  ["Studio Producer", "Reality Checker"],
  "Dual gate keepers must be preserved in orchestration output"
);

for (const plan of [microPlan, sprintPlan, fullPlan]) {
  const uniqueAgents = new Set(
    plan.phases.flatMap((phase) => phase.agents.map((agent) => agent.slug))
  );
  assert.equal(
    plan.total_agents,
    uniqueAgents.size,
    `Plan ${plan.mode} should count unique core agents`
  );
}

const client = new Client({
  name: "agency-mcp-smoke-test",
  version: "1.0.0",
});

const transport = new StdioClientTransport({
  command: "node",
  args: [serverEntry],
});

try {
  await withTimeout(client.connect(transport), "client.connect");

  const tools = await withTimeout(client.listTools(), "client.listTools");
  const toolNames = tools.tools.map((tool) => tool.name).sort();
  assert.deepEqual(
    toolNames,
    ["invoke_agent", "list_agents", "orchestrate"],
    "MCP server should expose the expected tools"
  );

  const resources = await withTimeout(client.listResources(), "client.listResources");
  assert.equal(
    resources.resources.length,
    0,
    "Dynamic agent resources should be exposed via resource templates rather than static resources"
  );

  const templates = await withTimeout(client.listResourceTemplates(), "client.listResourceTemplates");
  const templateUris = templates.resourceTemplates
    .map((template) => template.uriTemplate)
    .sort();
  assert.deepEqual(
    templateUris,
    ["agents://{category}/catalog", "agents://{name}/profile"],
    "MCP server should expose both dynamic resource templates"
  );

  const catalog = await withTimeout(
    client.readResource({ uri: "agents://engineering/catalog" }),
    "client.readResource(catalog)"
  );
  assert.ok(
    catalog.contents[0]?.text?.includes("Frontend Developer"),
    "Engineering catalog should include known engineering agents"
  );

  const profile = await withTimeout(
    client.readResource({ uri: "agents://devops-automator/profile" }),
    "client.readResource(profile)"
  );
  assert.ok(
    profile.contents[0]?.text?.includes("DevOps Automator"),
    "Agent profile should return the original markdown content"
  );

  const listAgentsResult = await withTimeout(
    client.callTool({ name: "list_agents", arguments: { category: "engineering" } }),
    "client.callTool(list_agents)"
  );
  assert.ok(
    extractText(listAgentsResult).includes("engineering"),
    "list_agents should respond with engineering content"
  );

  const orchestrateResult = await withTimeout(
    client.callTool({ name: "orchestrate", arguments: { task: "Build a SaaS MVP", mode: "sprint" } }),
    "client.callTool(orchestrate)"
  );
  const orchestrationText = extractText(orchestrateResult);
  assert.ok(
    orchestrationText.includes(`**Total Agents**: ${sprintPlan.total_agents}`),
    "orchestrate tool output should report the unique core agent count"
  );
  assert.ok(
    orchestrationText.includes("Gate Keepers"),
    "orchestrate tool output should surface multiple gate keepers"
  );
} finally {
  await transport.close();
  await client.close();
}

console.log("Agency MCP Server smoke tests passed.");
