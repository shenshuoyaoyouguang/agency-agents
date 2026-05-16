#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { AGENT_DIRS } from "./types.js";
import type { AgentStore } from "./types.js";
import {
  ListAgentsParams,
  InvokeAgentParams,
  OrchestrateParams,
} from "./types.js";
import { loadAgents } from "./loader.js";
import { listAgents } from "./tools/list-agents.js";
import { invokeAgent } from "./tools/invoke-agent.js";
import { orchestrate } from "./tools/orchestrate.js";
import { getAgentProfile, getAgentCatalog } from "./resources/agent-profile.js";
import { nexusPipelinePrompt } from "./prompts/nexus-pipeline.js";
import { getAgentActivationPrompt } from "./prompts/agent-activate.js";

function createServer(store: AgentStore) {
  try {
    const agentCount = store.profiles.length;

    const server = new Server(
      {
        name: "agency-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    try {
      return {
        tools: [
          {
            name: "list_agents",
            description:
              `Browse and search the Agency's directory of ${agentCount} specialized AI agents. Filter by category or search by keyword.`,
            inputSchema: {
              type: "object",
              properties: {
                category: {
                  type: "string",
                  enum: AGENT_DIRS,
                  description: "Filter by agent category",
                },
                query: {
                  type: "string",
                  description: "Keyword search in agent name and description",
                },
                format: {
                  type: "string",
                  enum: ["summary", "full"],
                  description: "Output format: summary (default) or full personality overview",
                },
              },
            },
          },
          {
            name: "invoke_agent",
            description:
              "Load a specific agent's complete personality definition and inject it into the current conversation context. Supports slug names or full display names.",
            inputSchema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Agent name or slug, e.g. 'devops-automator' or 'DevOps Automator'",
                },
                task: {
                  type: "string",
                  description: "Specific task description to append to the agent's instructions",
                },
                context: {
                  type: "string",
                  description: "Project context information (tech stack, constraints, etc.)",
                },
              },
              required: ["name"],
            },
          },
          {
            name: "orchestrate",
            description:
              "Generate a NEXUS multi-agent orchestration plan for complex tasks. Supports micro (5-10 core agents), sprint (15-25 core agents), and full (complete curated NEXUS core roster) modes.",
            inputSchema: {
              type: "object",
              properties: {
                task: {
                  type: "string",
                  description: "Task description, e.g. 'Build a SaaS MVP'",
                },
                mode: {
                  type: "string",
                  enum: ["micro", "sprint", "full"],
                  description: "Orchestration scale: micro (5-10 core agents, 1-5 days), sprint (15-25 core agents, 2-6 weeks), full (complete curated NEXUS core roster, 12-24 weeks)",
                },
                constraints: {
                  type: "string",
                  description: "Constraints, e.g. 'TypeScript only, limited budget'",
                },
              },
              required: ["task"],
            },
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to list tools: ${message}`);
    }
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "list_agents": {
          const parsed = ListAgentsParams.safeParse(args || {});
          if (!parsed.success) {
            return {
              content: [
                {
                  type: "text",
                  text: `Invalid parameters: ${parsed.error.message}`,
                },
              ],
            };
          }
          const result = listAgents(store, parsed.data);
          return { content: [{ type: "text", text: result }] };
        }

        case "invoke_agent": {
          const parsed = InvokeAgentParams.safeParse(args || {});
          if (!parsed.success) {
            return {
              content: [
                {
                  type: "text",
                  text: `Invalid parameters: ${parsed.error.message}`,
                },
              ],
            };
          }
          const result = invokeAgent(store, parsed.data);
          return { content: [{ type: "text", text: result }] };
        }

        case "orchestrate": {
          const parsed = OrchestrateParams.safeParse(args || {});
          if (!parsed.success) {
            return {
              content: [
                {
                  type: "text",
                  text: `Invalid parameters: ${parsed.error.message}`,
                },
              ],
            };
          }
          const result = orchestrate(store, {
            task: parsed.data.task,
            mode: parsed.data.mode,
            constraints: parsed.data.constraints,
          });
          return { content: [{ type: "text", text: result }] };
        }

        default:
          return {
            content: [
              {
                type: "text",
                text: `Unknown tool: ${name}. Available tools: list_agents, invoke_agent, orchestrate.`,
              },
            ],
            isError: true,
          };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to call tool '${name}': ${message}`,
          },
        ],
        isError: true,
      };
    }
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    try {
      return { resources: [] };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to list resources: ${message}`);
    }
  });

  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    try {
      return {
        resourceTemplates: [
          {
            uriTemplate: "agents://{name}/profile",
            name: "Agent Profile",
            description: "Full markdown definition of a specific agent",
            mimeType: "text/markdown",
          },
          {
            uriTemplate: "agents://{category}/catalog",
            name: "Category Catalog",
            description: "Summary list of all agents in a category",
            mimeType: "text/markdown",
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to list resource templates: ${message}`);
    }
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;

    try {
      const agentsPrefix = "agents://";
      if (!uri.startsWith(agentsPrefix)) {
        return {
          contents: [
            {
              uri,
              mimeType: "text/plain",
              text: `Unknown resource: ${uri}`,
            },
          ],
        };
      }

      const path = uri.slice(agentsPrefix.length);
      const parts = path.split("/");

      if (parts.length === 2 && parts[1] === "profile") {
        const result = await getAgentProfile(store, parts[0]);
        if (!result) {
          return {
            contents: [
              {
                uri,
                mimeType: "text/plain",
                text: `Agent "${parts[0]}" not found. Use list_agents to browse available agents.`,
              },
            ],
          };
        }
        return {
          contents: [{ uri, mimeType: result.mimeType, text: result.content }],
        };
      }

      if (parts.length === 2 && parts[1] === "catalog") {
        const result = getAgentCatalog(store, parts[0]);
        if (!result) {
          return {
            contents: [
              {
                uri,
                mimeType: "text/plain",
                text: `Unknown category "${parts[0]}". Available categories: ${AGENT_DIRS.join(", ")}`,
              },
            ],
          };
        }
        return {
          contents: [{ uri, mimeType: result.mimeType, text: result.content }],
        };
      }

      return {
        contents: [
          {
            uri,
            mimeType: "text/plain",
            text: `Unknown resource pattern: ${uri}. Use agents://{name}/profile or agents://{category}/catalog.`,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        contents: [
          {
            uri,
            mimeType: "text/plain",
            text: `Failed to read resource '${uri}': ${message}`,
          },
        ],
      };
    }
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    try {
      return {
        prompts: [
          {
            name: "nexus-pipeline",
            description:
              "Generate a complete NEXUS 7-phase execution guide prompt for multi-agent orchestration",
            arguments: [
              {
                name: "task",
                description: "The task or project to execute",
                required: true,
              },
              {
                name: "mode",
                description: "Orchestration mode: micro, sprint, or full",
                required: false,
              },
            ],
          },
          {
            name: "agent-activation",
            description:
              "Generate an agent activation instruction prompt with personality, task, and quality standards",
            arguments: [
              {
                name: "agent_name",
                description: "Name or slug of the agent to activate",
                required: true,
              },
              {
                name: "task",
                description: "The specific task for the agent to perform",
                required: true,
              },
            ],
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to list prompts: ${message}`);
    }
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "nexus-pipeline": {
          const task = (args?.task as string) || "";
          const mode = (args?.mode as "micro" | "sprint" | "full") || "sprint";
          if (!task) {
            return {
              messages: [
                {
                  role: "user",
                  content: {
                    type: "text",
                    text: "task is required for nexus-pipeline.",
                  },
                },
              ],
            };
          }
          const prompt = nexusPipelinePrompt({ task, mode });
          return {
            messages: [
              {
                role: "user",
                content: { type: "text", text: prompt },
              },
            ],
          };
        }

        case "agent-activation": {
          const agent_name = (args?.agent_name as string) || "";
          const task = (args?.task as string) || "";
          if (!agent_name || !task) {
            return {
              messages: [
                {
                  role: "user",
                  content: {
                    type: "text",
                    text: "Both agent_name and task are required.",
                  },
                },
              ],
            };
          }
          const prompt = getAgentActivationPrompt(store, { agent_name, task });
          return {
            messages: [
              {
                role: "user",
                content: { type: "text", text: prompt },
              },
            ],
          };
        }

        default:
          return {
            messages: [
              {
                role: "user",
                content: {
                  type: "text",
                  text: `Unknown prompt: ${name}`,
                },
              },
            ],
          };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Failed to get prompt '${name}': ${message}`,
            },
          },
        ],
      };
    }
  });

    return server;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to create MCP server:", error);
    throw new Error(`MCP server initialization failed: ${message}`);
  }
}

async function main() {
  const store = await loadAgents();
  const server = createServer(store);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Failed to start Agency MCP Server:", err);
  process.exit(1);
});
