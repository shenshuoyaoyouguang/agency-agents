import type { AgentStore, AgentCategory } from "../types.js";
import { AGENT_DIRS } from "../types.js";

export function listAgents(
  store: AgentStore,
  options: {
    category?: AgentCategory;
    query?: string;
    format?: "summary" | "full";
  }
): string {
  const { category, query, format = "summary" } = options;

  let profiles = store.profiles;

  if (category) {
    profiles = store.byCategory.get(category) || [];
  }

  if (query) {
    const q = query.toLowerCase();
    profiles = profiles.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  if (profiles.length === 0) {
    if (category && query) {
      return `No agents found in category "${category}" matching "${query}".`;
    }
    if (category) {
      return `No agents found in category "${category}". Available categories: ${AGENT_DIRS.join(", ")}`;
    }
    if (query) {
      return `No agents found matching "${query}". Try a different keyword or use list_agents without query to browse all ${store.profiles.length} agents.`;
    }
    return "No agents loaded.";
  }

  const lines: string[] = [];

  if (format === "full") {
    lines.push(`# Agency Agents Directory (${profiles.length} agents)\n`);
    for (const p of profiles) {
      lines.push(`## ${p.emoji ? p.emoji + " " : ""}${p.name}`);
      lines.push(`- **Slug**: \`${p.slug}\``);
      lines.push(`- **Category**: ${p.category}`);
      lines.push(`- **Description**: ${p.description}`);
      if (p.vibe) {
        lines.push(`- **Vibe**: ${p.vibe}`);
      }
      lines.push(
        `- **First 200 chars**: ${p.body.substring(0, 200).replace(/\n/g, " ")}...`
      );
      lines.push("");
    }
  } else {
    if (!category) {
      const byCategory = new Map<AgentCategory, typeof profiles>();
      for (const p of profiles) {
        const list = byCategory.get(p.category) || [];
        list.push(p);
        byCategory.set(p.category, list);
      }

      lines.push(
        `# Agency Agents Directory — ${profiles.length} agents across ${byCategory.size} categories\n`
      );

      for (const [cat, agents] of byCategory) {
        lines.push(`## ${cat} (${agents.length} agents)`);
        for (const a of agents) {
          lines.push(
            `- ${a.emoji ? a.emoji + " " : ""}**${a.name}** (\`${a.slug}\`) — ${a.description}`
          );
        }
        lines.push("");
      }
    } else {
      lines.push(
        `# Agency Agents — ${category} (${profiles.length} agents)\n`
      );
      for (const p of profiles) {
        lines.push(
          `- ${p.emoji ? p.emoji + " " : ""}**${p.name}** (\`${p.slug}\`) — ${p.description}`
        );
      }
    }
  }

  lines.push(
    `\n---\nUse \`invoke_agent\` with the agent slug to load its full personality. Example: \`invoke_agent name="${profiles[0]?.slug || "devops-automator"}"\``
  );

  return lines.join("\n");
}