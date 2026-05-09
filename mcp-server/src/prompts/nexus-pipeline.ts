export function nexusPipelinePrompt(options: {
  task: string;
  mode: "micro" | "sprint" | "full";
}): string {
  const { task, mode } = options;

  const modeDescriptions: Record<string, string> = {
    micro:
      "NEXUS-Micro: 5-10 core agents, 1-5 days — for bug fixes, content campaigns, or single deliverables",
    sprint:
      "NEXUS-Sprint: 15-25 core agents, 2-6 weeks — for feature development or MVP builds",
    full:
      "NEXUS-Full: complete curated NEXUS core roster, 12-24 weeks — for enterprise product launches",
  };

  const lines: string[] = [
    "# NEXUS Pipeline Activation",
    "",
    `## Task: ${task}`,
    `## Mode: ${mode}`,
    `> ${modeDescriptions[mode] || modeDescriptions.sprint}`,
    "",
    "---",
    "",
    "## NEXUS 7-Phase Execution Guide",
    "",
    "### Phase 0 — Discovery & Intelligence",
    "Activate Trend Researcher, Feedback Synthesizer, UX Researcher, Analytics Reporter, Legal Compliance Checker, and Tool Evaluator.",
    "Goal: Validate the market opportunity, understand user needs, and assess regulatory and technical landscapes before committing resources.",
    "Gate Keeper: Executive Summary Generator",
    "Output: GO / NO-GO / PIVOT decision with supporting evidence.",
    "",
    "### Phase 1 — Strategy & Architecture",
    "Activate Studio Producer, Senior Project Manager, Sprint Prioritizer, UX Architect, Brand Guardian, Backend Architect, AI Engineer (if applicable), and Finance Tracker.",
    "Goal: Define what to build, how it's structured, and what success looks like before writing code.",
    "Gate Keeper: Studio Producer + Reality Checker (dual sign-off)",
    "Output: Approved Architecture Package with prioritized sprint plan.",
    "",
    "### Phase 2 — Foundation & Scaffolding",
    "Activate DevOps Automator, Frontend Developer, Backend Architect, UX Architect, Infrastructure Maintainer, and Studio Operations.",
    "Goal: Build the technical and operational foundation — CI/CD, scaffolding, database schema, design system.",
    "Gate Keeper: DevOps Automator + Evidence Collector",
    "Output: Working skeleton application with full DevOps pipeline.",
    "",
    "### Phase 3 — Build & Iterate",
    "Run the Dev↔QA Loop: Developer implements → Evidence Collector tests → Decision (PASS/FAIL). Maximum 3 retries per task before escalation.",
    "Primary developers: Frontend Developer, Backend Architect, AI Engineer, Mobile App Builder, Rapid Prototyper.",
    "QA agents: Evidence Collector, API Tester, Performance Benchmarker.",
    "Gate Keeper: Agents Orchestrator",
    "Output: Feature-complete application with all tasks passing QA.",
    "",
    "### Phase 4 — Quality & Hardening",
    "The final quality gauntlet. Reality Checker defaults to NEEDS WORK — prove production readiness.",
    "Activate Reality Checker, Evidence Collector, Performance Benchmarker, API Tester, Test Results Analyzer, Legal Compliance Checker, Infrastructure Maintainer, Workflow Optimizer.",
    "Gate Keeper: Reality Checker (sole authority)",
    "Output: READY verdict or specific fix list for Phase 3 rework.",
    "",
    "### Phase 5 — Launch & Growth",
    "Coordinate go-to-market across all channels.",
    "Activate Growth Hacker, Content Creator, Social Media Strategist, Twitter Engager, TikTok Strategist, Instagram Curator, Reddit Community Builder, App Store Optimizer, DevOps Automator.",
    "Gate Keeper: Studio Producer + Analytics Reporter",
    "Output: Stable launched product with active growth channels.",
    "",
    "### Phase 6 — Operate & Evolve",
    "Sustained operations with continuous improvement.",
    "Activate Infrastructure Maintainer, Support Responder, Analytics Reporter, Feedback Synthesizer, Finance Tracker, Legal Compliance Checker, Trend Researcher, Sprint Prioritizer, Experiment Tracker, Workflow Optimizer.",
    "Output: Continuous improvement loop with monthly executive reporting.",
    "",
    "---",
    "",
    "## Handoff Protocol",
    "Every agent-to-agent handoff must include: from/to agent, phase, task reference, priority, current state, deliverable request with acceptance criteria, quality expectations, and evidence requirements.",
    "",
    "## Quality Gate Rules",
    "- No phase advances without passing its gate",
    "- Every handoff carries full context — no agent starts cold",
    "- Independent workstreams run concurrently",
    "- All quality assessments require proof",
    "- Maximum 3 retries per task before escalation",
    "",
    "---",
    "",
    "## Instructions for the Host AI",
    `You are the Agents Orchestrator running the NEXUS pipeline in **${mode.toUpperCase()}** mode for: "${task}".`,
    "",
    "1. Start at Phase 0 and progress through all 7 phases.",
    "2. For each phase, invoke the specified agents using `invoke_agent`.",
    "3. Manage handoffs between phases using the handoff protocol.",
    "4. Enforce quality gates before advancing — do not skip gates.",
    "5. Run Dev↔QA loops for all implementation tasks in Phase 3.",
    "6. Escalate tasks that fail 3 QA attempts.",
    "7. Report status at each phase boundary.",
  ];

  return lines.join("\n");
}

export function agentActivationPrompt(options: {
  agent_name: string;
  task: string;
  agentProfile?: string;
}): string {
  const { agent_name, task, agentProfile } = options;

  const lines: string[] = [
    agentProfile
      ? agentProfile
      : `Activate the **${agent_name}** agent. Use \`invoke_agent\` to load the full personality if needed.`,
    "",
    "---",
    "",
    "## Task",
    task,
    "",
    "## Instructions",
    `You are now activated as **${agent_name}**.`,
    "- Follow your defined personality, core mission, and critical rules.",
    "- Use your standard workflow process and deliverable templates.",
    "- Communicate in your defined communication style.",
    "- Provide evidence-based outputs with concrete deliverables.",
    "- Quality check your work against your defined success metrics.",
  ];

  return lines.join("\n");
}
