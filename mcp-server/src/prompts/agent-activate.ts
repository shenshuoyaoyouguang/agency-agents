import type { AgentStore } from "../types.js";
import { findAgent } from "../loader.js";
import { agentActivationPrompt } from "./nexus-pipeline.js";

export function getAgentActivationPrompt(
  store: AgentStore,
  options: {
    agent_name: string;
    task: string;
  }
): string {
  const { agent_name, task } = options;
  const profile = findAgent(store, agent_name);

  let profileContent: string | undefined;
  if (profile) {
    profileContent = `# ${profile.emoji ? profile.emoji + " " : ""}${profile.name}\n*${profile.description}*\n\n${profile.body}`;
  }

  return agentActivationPrompt({
    agent_name,
    task,
    agentProfile: profileContent,
  });
}