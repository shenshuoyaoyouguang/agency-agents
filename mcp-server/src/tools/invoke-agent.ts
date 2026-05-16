import type { AgentStore } from "../types.js";
import { findAgent, slugify } from "../loader.js";

export function invokeAgent(
  store: AgentStore,
  options: {
    name: string;
    task?: string;
    context?: string;
  }
): string {
  const { name, task, context } = options;
  const profile = findAgent(store, name);

  if (!profile) {
    const q = name.toLowerCase();
    const slugQ = slugify(name);
    const suggestions = store.profiles
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.includes(slugQ)
      )
      .slice(0, 10)
      .map((p) => `- **${p.name}** (\`${p.slug}\`) — ${p.description}`);

    const lines: string[] = [
      `Agent "${name}" not found.`,
      "",
      suggestions.length > 0
        ? "Did you mean one of these?"
        : `Use \`list_agents\` to browse all ${store.profiles.length} available agents.`,
    ];

    if (suggestions.length > 0) {
      lines.push(...suggestions);
      lines.push(
        "",
        `Tip: Use \`list_agents\` to see all ${store.profiles.length} available agents.`
      );
    }

    return lines.join("\n");
  }

  const lines: string[] = [];

  lines.push(`# ${profile.emoji ? profile.emoji + " " : ""}${profile.name}`);
  lines.push(`*${profile.description}*`);
  lines.push("");

  if (context) {
    lines.push("## Project Context");
    lines.push(context);
    lines.push("");
  }

  lines.push("## Agent Personality & Instructions");
  lines.push(profile.body);

  if (task) {
    lines.push("");
    lines.push("---");
    lines.push("");
    lines.push("## Task Instruction");
    lines.push(task);
    lines.push("");
    lines.push(
      "Please complete the above task following the agent personality and instructions. Provide concrete deliverables with code, analysis, or documentation as appropriate."
    );
  }

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Quality Standards");
  lines.push(
    "- Follow the agent's workflow process and deliverable templates as defined above"
  );
  lines.push("- Provide evidence-based outputs (code, screenshots, data, analysis)");
  lines.push(
    "- Ensure all outputs align with the agent's core mission and critical rules"
  );
  lines.push(
    "- Communicate in the agent's defined communication style throughout"
  );

  return lines.join("\n");
}