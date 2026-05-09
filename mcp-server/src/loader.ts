import { lstat } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";
import type { AgentProfile, AgentCategory, AgentStore } from "./types.js";
import { AGENT_DIRS } from "./types.js";
import { resolveRepoRoot } from "./utils.js";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const MAX_DEPTH = 10;

async function scanDirectory(
  dirPath: string,
  category: AgentCategory
): Promise<{ profiles: AgentProfile[]; issues: string[] }> {
  const profiles: AgentProfile[] = [];
  const issues: string[] = [];

  async function walk(currentPath: string, depth: number) {
    if (depth > MAX_DEPTH) {
      issues.push(
        `Max directory depth (${MAX_DEPTH}) exceeded at ${currentPath}, skipping`
      );
      return;
    }
    if (!existsSync(currentPath)) return;

    const entries = await readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(currentPath, entry.name);
      if (entry.isDirectory()) {
        try {
          const stat = await lstat(fullPath);
          if (stat.isSymbolicLink()) {
            issues.push(
              `Skipping symbolic link directory: ${fullPath}`
            );
            continue;
          }
        } catch {
          continue;
        }
        await walk(fullPath, depth + 1);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        let content: string;
        try {
          content = await readFile(fullPath, "utf-8");
        } catch (err) {
          issues.push(
            `Failed to read ${fullPath}: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
          continue;
        }

        try {
          const { data, content: body } = matter(content);
          const name = data.name as string | undefined;
          if (!name) continue;

          const profile: AgentProfile = {
            name,
            slug: slugify(name),
            description: (data.description as string) || "",
            category,
            emoji: (data.emoji as string) || "",
            color: (data.color as string) || "",
            vibe: (data.vibe as string) || "",
            body: body.trim(),
            filePath: fullPath,
          };
          profiles.push(profile);
        } catch (err) {
          issues.push(
            `Failed to parse frontmatter in ${fullPath}: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
          continue;
        }
      }
    }
  }

  await walk(dirPath, 0);
  return { profiles, issues };
}

function throwIfLoadIssues(issues: string[]) {
  if (issues.length === 0) return;

  const preview = issues
    .slice(0, 10)
    .map((issue) => `- ${issue}`)
    .join("\n");
  const remaining =
    issues.length > 10 ? `\n- ... ${issues.length - 10} more issue(s)` : "";

  throw new Error(
    `Failed to load agent definitions:\n${preview}${remaining}`
  );
}

export async function loadAgents(): Promise<AgentStore> {
  const repoRoot = resolveRepoRoot();
  const allProfiles: AgentProfile[] = [];
  const issues: string[] = [];

  for (const dir of AGENT_DIRS) {
    const dirPath = join(repoRoot, dir);
    if (!existsSync(dirPath)) continue;

    const result = await scanDirectory(dirPath, dir);
    allProfiles.push(...result.profiles);
    issues.push(...result.issues);
  }

  throwIfLoadIssues(issues);

  const bySlug = new Map<string, AgentProfile>();
  const byCategory = new Map<AgentCategory, AgentProfile[]>();

  for (const profile of allProfiles) {
    bySlug.set(profile.slug, profile);

    const existing = byCategory.get(profile.category) || [];
    existing.push(profile);
    byCategory.set(profile.category, existing);
  }

  for (const [cat, profiles] of byCategory) {
    profiles.sort((a, b) => a.name.localeCompare(b.name));
  }

  return { profiles: allProfiles, bySlug, byCategory };
}

export function findAgent(
  store: AgentStore,
  nameOrSlug: string
): AgentProfile | undefined {
  const slug = slugify(nameOrSlug);
  if (store.bySlug.has(slug)) {
    return store.bySlug.get(slug);
  }
  for (const profile of store.profiles) {
    if (profile.name.toLowerCase() === nameOrSlug.toLowerCase().trim()) {
      return profile;
    }
  }
  return undefined;
}

export function searchAgents(
  store: AgentStore,
  query: string,
  category?: AgentCategory
): AgentProfile[] {
  const q = query.toLowerCase();
  let candidates = category
    ? store.byCategory.get(category) || []
    : store.profiles;

  return candidates.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
  );
}
