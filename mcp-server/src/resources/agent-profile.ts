import { readFile } from "node:fs/promises";
import type { AgentStore, AgentCategory } from "../types.js";
import { AGENT_DIRS } from "../types.js";
import { findAgent } from "../loader.js";

export async function getAgentProfile(
  store: AgentStore,
  name: string
): Promise<{ content: string; mimeType: string } | null> {
  const profile = findAgent(store, name);
  if (!profile) {
    return null;
  }

  try {
    const content = await readFile(profile.filePath, "utf-8");
    return { content, mimeType: "text/markdown" };
  } catch {
    return {
      content: `# ${profile.name}\n\n${profile.body}`,
      mimeType: "text/markdown",
    };
  }
}

export function getAgentCatalog(
  store: AgentStore,
  category: string
): { content: string; mimeType: string } | null {
  if (!AGENT_DIRS.includes(category as AgentCategory)) {
    return null;
  }

  const profiles = store.byCategory.get(category as AgentCategory) || [];

  if (profiles.length === 0) {
    return {
      content: `# ${category} Catalog\n\nNo agents found in this category.`,
      mimeType: "text/markdown",
    };
  }

  const lines: string[] = [
    `# ${category} Agent Catalog`,
    "",
    `Total agents: ${profiles.length}`,
    "",
  ];

  for (const p of profiles) {
    lines.push(
      `- ${p.emoji ? p.emoji + " " : ""}**${p.name}** (\`${p.slug}\`) — ${p.description}`
    );
  }

  return { content: lines.join("\n"), mimeType: "text/markdown" };
}
