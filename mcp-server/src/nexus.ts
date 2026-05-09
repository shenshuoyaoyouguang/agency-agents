import type {
  AgentCategory,
  AgentProfile,
  AgentStore,
  NexusPhase,
  NexusPhaseAgent,
  OrchestrationMode,
  OrchestrationPlan,
} from "./types.js";

export interface PhaseDefinition {
  phase_id: number;
  phase_name: string;
  objective: string;
  gateKeepers: string[];
}

export interface NexusConfig {
  phaseDefinitions: PhaseDefinition[];
  phaseAgentMap: Record<number, string[]>;
  taskKeywordAgents: Record<string, string[]>;
}

const DEFAULT_PHASE_DEFINITIONS: PhaseDefinition[] = [
  {
    phase_id: 0,
    phase_name: "Discovery & Intelligence",
    objective: "Validate the opportunity before committing resources.",
    gateKeepers: ["Executive Summary Generator"],
  },
  {
    phase_id: 1,
    phase_name: "Strategy & Architecture",
    objective: "Define what to build, how it's structured, and what success looks like.",
    gateKeepers: ["Studio Producer", "Reality Checker"],
  },
  {
    phase_id: 2,
    phase_name: "Foundation & Scaffolding",
    objective: "Build technical and operational foundation.",
    gateKeepers: ["DevOps Automator", "Evidence Collector"],
  },
  {
    phase_id: 3,
    phase_name: "Build & Iterate",
    objective: "Implement features through Dev↔QA loops.",
    gateKeepers: ["Agents Orchestrator"],
  },
  {
    phase_id: 4,
    phase_name: "Quality & Hardening",
    objective: "The final quality gauntlet before launch.",
    gateKeepers: ["Reality Checker"],
  },
  {
    phase_id: 5,
    phase_name: "Launch & Growth",
    objective: "Coordinate go-to-market execution across all channels.",
    gateKeepers: ["Studio Producer", "Analytics Reporter"],
  },
  {
    phase_id: 6,
    phase_name: "Operate & Evolve",
    objective: "Sustained operations with continuous improvement.",
    gateKeepers: ["Studio Producer"],
  },
];

const DEFAULT_PHASE_AGENT_MAP: Record<number, string[]> = {
  0: [
    "trend-researcher",
    "feedback-synthesizer",
    "ux-researcher",
    "analytics-reporter",
    "legal-compliance-checker",
    "tool-evaluator",
  ],
  1: [
    "studio-producer",
    "senior-project-manager",
    "sprint-prioritizer",
    "ux-architect",
    "brand-guardian",
    "backend-architect",
    "ai-engineer",
    "finance-tracker",
  ],
  2: [
    "devops-automator",
    "frontend-developer",
    "backend-architect",
    "ux-architect",
    "infrastructure-maintainer",
    "studio-operations",
  ],
  3: [
    "frontend-developer",
    "backend-architect",
    "ai-engineer",
    "mobile-app-builder",
    "rapid-prototyper",
    "evidence-collector",
    "api-tester",
    "performance-benchmarker",
    "senior-developer",
  ],
  4: [
    "reality-checker",
    "evidence-collector",
    "performance-benchmarker",
    "api-tester",
    "test-results-analyzer",
    "legal-compliance-checker",
    "infrastructure-maintainer",
    "workflow-optimizer",
  ],
  5: [
    "growth-hacker",
    "content-creator",
    "social-media-strategist",
    "twitter-engager",
    "tiktok-strategist",
    "instagram-curator",
    "reddit-community-builder",
    "app-store-optimizer",
    "devops-automator",
    "infrastructure-maintainer",
    "support-responder",
    "analytics-reporter",
  ],
  6: [
    "infrastructure-maintainer",
    "support-responder",
    "analytics-reporter",
    "feedback-synthesizer",
    "finance-tracker",
    "legal-compliance-checker",
    "trend-researcher",
    "sprint-prioritizer",
    "experiment-tracker",
    "workflow-optimizer",
    "executive-summary-generator",
  ],
};

const DEFAULT_TASK_KEYWORD_AGENTS: Record<string, string[]> = {
  mobile: ["mobile-app-builder", "app-store-optimizer"],
  api: ["backend-architect", "api-tester"],
  frontend: ["frontend-developer", "ui-designer"],
  ui: ["ui-designer", "ux-architect", "frontend-developer"],
  ux: ["ux-researcher", "ux-architect", "ui-designer"],
  devops: ["devops-automator", "infrastructure-maintainer"],
  deploy: ["devops-automator", "infrastructure-maintainer"],
  ci: ["devops-automator"],
  cd: ["devops-automator"],
  database: ["backend-architect", "database-optimizer"],
  security: ["security-engineer", "legal-compliance-checker"],
  ai: ["ai-engineer"],
  ml: ["ai-engineer"],
  marketing: [
    "growth-hacker",
    "content-creator",
    "social-media-strategist",
  ],
  seo: ["seo-specialist", "app-store-optimizer"],
  content: ["content-creator", "visual-storyteller"],
  brand: ["brand-guardian", "ui-designer"],
  game: [
    "game-designer",
    "level-designer",
    "technical-artist",
  ],
  spatial: ["xr-interface-architect", "xr-immersive-developer"],
  "3d": ["technical-artist", "xr-immersive-developer"],
  china: ["china-market-localization-strategist"],
  wechat: ["wechat-mini-program-developer"],
  sales: [
    "sales-engineer",
    "sales-deal-strategist",
    "sales-pipeline-analyst",
  ],
  finance: ["financial-analyst", "finance-tracker", "fpa-analyst"],
  legal: ["legal-compliance-checker", "legal-document-review"],
  blockchain: ["blockchain-security-auditor", "solidity-smart-contract-engineer"],
};

const MODE_PHASE_BUDGETS: Record<OrchestrationMode, number[]> = {
  micro: [1, 1, 1, 2, 1, 1, 1],
  sprint: [2, 3, 3, 4, 4, 4, 4],
  full: [6, 8, 6, 9, 8, 12, 11],
};

const CATEGORY_PHASE_PREFERENCES: Record<AgentCategory, number[]> = {
  academic: [0],
  design: [1, 3],
  engineering: [2, 3],
  finance: [1, 6],
  "game-development": [3],
  marketing: [5],
  "paid-media": [5],
  product: [0, 1],
  "project-management": [1, 6],
  sales: [5],
  "spatial-computing": [3],
  specialized: [3, 6],
  support: [4, 6],
  testing: [4],
};

const SLUG_PHASE_OVERRIDES: Record<string, number[]> = {
  "agents-orchestrator": [3, 4],
  "ai-engineer": [1, 3],
  "analytics-reporter": [0, 5, 6],
  "api-tester": [3, 4],
  "app-store-optimizer": [5],
  "backend-architect": [1, 2, 3],
  "brand-guardian": [1],
  "content-creator": [5],
  "devops-automator": [2, 5],
  "evidence-collector": [2, 3, 4],
  "executive-summary-generator": [0, 5, 6],
  "experiment-tracker": [6],
  "feedback-synthesizer": [0, 6],
  "finance-tracker": [1, 6],
  "frontend-developer": [2, 3],
  "growth-hacker": [5],
  "infrastructure-maintainer": [2, 4, 5, 6],
  "instagram-curator": [5],
  "legal-compliance-checker": [0, 4, 6],
  "mobile-app-builder": [3],
  "performance-benchmarker": [3, 4],
  "rapid-prototyper": [3],
  "reality-checker": [1, 4],
  "reddit-community-builder": [5],
  "senior-project-manager": [1],
  "social-media-strategist": [5],
  "sprint-prioritizer": [1, 6],
  "studio-operations": [2],
  "studio-producer": [1, 5, 6],
  "support-responder": [5, 6],
  "test-results-analyzer": [4],
  "tiktok-strategist": [5],
  "tool-evaluator": [0, 6],
  "trend-researcher": [0, 6],
  "twitter-engager": [5],
  "ux-architect": [1, 2],
  "ux-researcher": [0],
  "workflow-optimizer": [4, 6],
};

let activeConfig: NexusConfig = {
  phaseDefinitions: DEFAULT_PHASE_DEFINITIONS,
  phaseAgentMap: DEFAULT_PHASE_AGENT_MAP,
  taskKeywordAgents: DEFAULT_TASK_KEYWORD_AGENTS,
};

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function scorePhaseCandidate(
  slug: string,
  baseIndex: Map<string, number>,
  relevantSet: Set<string>
): number {
  let score = 0;
  if (relevantSet.has(slug)) score += 2;
  if (baseIndex.has(slug)) score += 1;
  return score;
}

function getModeBudget(mode: OrchestrationMode, phaseId: number, candidateCount: number): number {
  if (mode === "full") {
    return candidateCount;
  }
  return MODE_PHASE_BUDGETS[mode][phaseId] ?? candidateCount;
}

function getRelevantAgentSlugs(task: string, constraints: string): Set<string> {
  const relevantSlugs = new Set<string>();
  const haystacks = [task.toLowerCase(), constraints.toLowerCase()].filter(Boolean);

  for (const haystack of haystacks) {
    for (const [keyword, slugs] of Object.entries(activeConfig.taskKeywordAgents)) {
      if (!haystack.includes(keyword)) continue;
      for (const slug of slugs) {
        relevantSlugs.add(slug);
      }
    }
  }

  return relevantSlugs;
}

function getPreferredPhasesForAgent(profile: AgentProfile): number[] {
  const override = SLUG_PHASE_OVERRIDES[profile.slug];
  if (override) {
    return override;
  }

  const mappedPhases = Object.entries(activeConfig.phaseAgentMap)
    .filter(([, slugs]) => slugs.includes(profile.slug))
    .map(([phaseId]) => Number(phaseId));

  if (mappedPhases.length > 0) {
    return mappedPhases;
  }

  return CATEGORY_PHASE_PREFERENCES[profile.category] || [3];
}

function buildRelevantPhaseMap(
  store: AgentStore,
  relevantSlugs: Set<string>
): Map<number, Set<string>> {
  const relevantByPhase = new Map<number, Set<string>>();

  for (const slug of relevantSlugs) {
    const profile = store.bySlug.get(slug);
    if (!profile) continue;

    for (const phaseId of getPreferredPhasesForAgent(profile)) {
      const slugs = relevantByPhase.get(phaseId) || new Set<string>();
      slugs.add(slug);
      relevantByPhase.set(phaseId, slugs);
    }
  }

  return relevantByPhase;
}

function compareAgentNames(
  store: AgentStore,
  left: string,
  right: string
): number {
  const leftName = store.bySlug.get(left)?.name || left;
  const rightName = store.bySlug.get(right)?.name || right;
  return leftName.localeCompare(rightName);
}

function buildPhaseCandidates(
  store: AgentStore,
  phaseId: number,
  relevantByPhase: Map<number, Set<string>>
): string[] {
  const baseSlugs = activeConfig.phaseAgentMap[phaseId] || [];
  const relevantSet = relevantByPhase.get(phaseId) || new Set<string>();
  const baseIndex = new Map(baseSlugs.map((slug, index) => [slug, index]));
  const candidateSlugs = uniqueStrings([...baseSlugs, ...relevantSet]);

  return candidateSlugs
    .filter((slug) => store.bySlug.has(slug))
    .sort((left, right) => {
      const scoreDiff =
        scorePhaseCandidate(right, baseIndex, relevantSet) -
        scorePhaseCandidate(left, baseIndex, relevantSet);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      const leftIndex = baseIndex.get(left) ?? Number.MAX_SAFE_INTEGER;
      const rightIndex = baseIndex.get(right) ?? Number.MAX_SAFE_INTEGER;
      if (leftIndex !== rightIndex) {
        return leftIndex - rightIndex;
      }

      return compareAgentNames(store, left, right);
    });
}

function buildPhaseAgents(
  store: AgentStore,
  phaseId: number,
  mode: OrchestrationMode,
  relevantByPhase: Map<number, Set<string>>
): NexusPhaseAgent[] {
  const candidateSlugs = buildPhaseCandidates(store, phaseId, relevantByPhase);
  const budget = getModeBudget(mode, phaseId, candidateSlugs.length);
  const selectedSlugs = candidateSlugs.slice(0, budget);

  return selectedSlugs
    .map((slug) => store.bySlug.get(slug))
    .filter((profile): profile is AgentProfile => Boolean(profile))
    .map((profile) => ({
      name: profile.name,
      slug: profile.slug,
      role: `Phase ${phaseId} contributor`,
      primaryOutput: profile.description,
    }));
}

function buildParallelTracks(agents: NexusPhaseAgent[]): string[][] {
  if (agents.length === 0) {
    return [];
  }

  if (agents.length === 1) {
    return [[agents[0].name]];
  }

  const midpoint = Math.ceil(agents.length / 2);
  const tracks = [agents.slice(0, midpoint).map((agent) => agent.name)];
  const remainder = agents.slice(midpoint).map((agent) => agent.name);

  if (remainder.length > 0) {
    tracks.push(remainder);
  }

  return tracks;
}

export function getNexusConfig(): NexusConfig {
  return activeConfig;
}

export function setNexusConfig(config: Partial<NexusConfig>): void {
  activeConfig = {
    phaseDefinitions: config.phaseDefinitions ?? activeConfig.phaseDefinitions,
    phaseAgentMap: config.phaseAgentMap ?? activeConfig.phaseAgentMap,
    taskKeywordAgents: config.taskKeywordAgents ?? activeConfig.taskKeywordAgents,
  };
}

export function generateOrchestrationPlan(
  store: AgentStore,
  task: string,
  mode: OrchestrationMode,
  constraints: string
): OrchestrationPlan {
  const relevantSlugs = getRelevantAgentSlugs(task, constraints);
  const relevantByPhase = buildRelevantPhaseMap(store, relevantSlugs);
  const phases: NexusPhase[] = [];

  for (const def of activeConfig.phaseDefinitions) {
    const agents = buildPhaseAgents(store, def.phase_id, mode, relevantByPhase);
    const gateKeepers = [...def.gateKeepers];
    const gateKeeperEvidence =
      gateKeepers.length > 1
        ? `${gateKeepers.join(" + ")} sign-off`
        : `${gateKeepers[0]} sign-off`;

    phases.push({
      phase_id: def.phase_id,
      phase_name: def.phase_name,
      objective: def.objective,
      agents,
      parallel_tracks: buildParallelTracks(agents),
      quality_gate: {
        gate_keepers: gateKeepers,
        criteria: [
          {
            criterion: "Phase deliverables complete",
            threshold: "100%",
            evidence: `${def.phase_name} deliverables as defined in the NEXUS plan`,
          },
          {
            criterion: "Quality standards met",
            threshold: "All criteria satisfied",
            evidence: gateKeeperEvidence,
          },
        ],
      },
      handoff: `Handoff from ${def.phase_name} to Phase ${
        def.phase_id + 1
      }. Carry forward all deliverables, key decisions, constraints, and open issues.`,
    });
  }

  const uniqueAgents = new Set(
    phases.flatMap((phase) => phase.agents.map((agent) => agent.slug))
  );

  return {
    task,
    mode,
    phases,
    total_agents: uniqueAgents.size,
    estimated_phases: activeConfig.phaseDefinitions.length,
    constraints,
  };
}
