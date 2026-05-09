import { z } from "zod";

export const AGENT_DIRS = [
  "academic",
  "design",
  "engineering",
  "finance",
  "game-development",
  "marketing",
  "paid-media",
  "product",
  "project-management",
  "sales",
  "spatial-computing",
  "specialized",
  "support",
  "testing",
] as const;

export type AgentCategory = (typeof AGENT_DIRS)[number];

export interface AgentProfile {
  name: string;
  slug: string;
  description: string;
  category: AgentCategory;
  emoji: string;
  color: string;
  vibe: string;
  body: string;
  filePath: string;
}

export interface AgentSummary {
  name: string;
  slug: string;
  description: string;
  category: AgentCategory;
  emoji: string;
}

export interface AgentInvocation {
  system_prompt: string;
  task_instruction: string;
  suggested_globs: string[];
  quality_gates: string[];
}

export interface NexusPhaseAgent {
  name: string;
  slug: string;
  role: string;
  primaryOutput: string;
}

export interface NexusPhase {
  phase_id: number;
  phase_name: string;
  objective: string;
  agents: NexusPhaseAgent[];
  parallel_tracks: string[][];
  quality_gate: {
    gate_keepers: string[];
    criteria: { criterion: string; threshold: string; evidence: string }[];
  };
  handoff: string;
}

export type OrchestrationMode = "micro" | "sprint" | "full";

export interface OrchestrationPlan {
  task: string;
  mode: OrchestrationMode;
  phases: NexusPhase[];
  total_agents: number;
  estimated_phases: number;
  constraints: string;
}

export interface AgentStore {
  profiles: AgentProfile[];
  bySlug: Map<string, AgentProfile>;
  byCategory: Map<AgentCategory, AgentProfile[]>;
}

export const ListAgentsParams = z.object({
  category: z
    .enum(AGENT_DIRS)
    .optional()
    .describe("Filter by agent category"),
  query: z.string().optional().describe("Keyword search in name and description"),
  format: z
    .enum(["summary", "full"])
    .optional()
    .default("summary")
    .describe("Output format: summary (default) or full"),
});

export const InvokeAgentParams = z.object({
  name: z.string().describe("Agent name or slug, e.g. 'devops-automator' or 'DevOps Automator'"),
  task: z.string().optional().describe("Specific task description to append"),
  context: z.string().optional().describe("Project context to help agent respond precisely"),
});

export const OrchestrateParams = z.object({
  task: z.string().describe("Task description, e.g. 'Build a SaaS MVP'"),
  mode: z
    .enum(["micro", "sprint", "full"])
    .optional()
    .default("sprint")
    .describe("Orchestration scale: micro (5-10 core agents, 1-5 days), sprint (15-25 core agents, 2-6 weeks), full (complete curated NEXUS core roster, 12-24 weeks)"),
  constraints: z.string().optional().describe("Constraints, e.g. 'TypeScript only, limited budget'"),
});
