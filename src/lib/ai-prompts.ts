import { readFileSync } from "fs";
import { join } from "path";
import { parse } from "yaml";
import { createAdminClient } from "@/lib/supabase";

export interface PersonaDefinition {
  name: string;
  tone: string;
  instruction: string;
  writing_style_rules?: string;
  negative_constraints?: string;
}

export interface AIPromptConfig {
  persona: {
    name: string;
    role: string;
    expertise: string[];
  };
  personas: Record<string, PersonaDefinition>;
  global_rules: {
    format: string;
    strict_tags: boolean;
    forbidden_phrases: string[];
    negative_constraints: string;
    writing_style_rules: string;
  };
  system_instruction: string;
  actions: Record<string, string>;
  image_prompt: string;
}

const _cache = new Map<string, { data: AIPromptConfig; time: number }>();
const CACHE_TTL = 60_000; // 1 minute cache

/**
 * Load AI prompt configuration from YAML file (fallback).
 */
export function loadAIPromptsFromYAML(projectSlug: string = "music-blog"): AIPromptConfig {
  let filePath = join(process.cwd(), "src", "config", `ai-prompts-${projectSlug}.yaml`);
  try {
    const raw = readFileSync(filePath, "utf-8");
    return parse(raw) as AIPromptConfig;
  } catch {
    // If not found, default to music-blog just in case
    filePath = join(process.cwd(), "src", "config", `ai-prompts-music-blog.yaml`);
    const raw = readFileSync(filePath, "utf-8");
    return parse(raw) as AIPromptConfig;
  }
}

/**
 * Load AI prompt configuration from database, with YAML fallback.
 * Results are cached for 1 minute to avoid excessive DB calls.
 */
export async function loadAIPromptsFromDB(projectId: string): Promise<AIPromptConfig> {
  const now = Date.now();
  const cached = _cache.get(projectId);
  if (cached && now - cached.time < CACHE_TTL) return cached.data;

  try {
    const supabase = createAdminClient();

    const [projectRes, configRes, personasRes] = await Promise.all([
      supabase.from("projects").select("slug").eq("id", projectId).single(),
      supabase.from("project_ai_config").select("*").eq("project_id", projectId).single(),
      supabase
        .from("project_personas")
        .select("*")
        .eq("project_id", projectId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
    ]);

    const projectSlug = projectRes.data?.slug || "music-blog";

    if (!configRes.data) {
      // DB not seeded yet, fall back to YAML
      const yaml = loadAIPromptsFromYAML(projectSlug);
      _cache.set(projectId, { data: yaml, time: now });
      return yaml;
    }

    const config = configRes.data;
    const personas = personasRes.data ?? [];

    // Fallback: start with YAML personas, then override with DB personas
    const yamlFallback = loadAIPromptsFromYAML(projectSlug);
    const personasMap: Record<string, PersonaDefinition> = { ...yamlFallback.personas };
    
    for (const p of personas) {
      personasMap[p.id] = {
        name: p.name,
        tone: p.tone,
        instruction: p.instruction,
        writing_style_rules: p.writing_style_rules || undefined,
        negative_constraints: p.negative_constraints || undefined,
      };
    }

    const result: AIPromptConfig = {
      persona: config.persona_defaults ?? {},
      personas: personasMap,
      global_rules: config.global_rules as AIPromptConfig["global_rules"],
      system_instruction: config.system_instruction,
      actions: config.actions as Record<string, string>,
      image_prompt: config.image_prompt,
    };

    _cache.set(projectId, { data: result, time: now });
    return result;
  } catch {
    // DB error, fall back to YAML
    // Note: If DB error on getting slug, we'll probably just use the default music-blog
    const yaml = loadAIPromptsFromYAML("music-blog");
    _cache.set(projectId, { data: yaml, time: now });
    return yaml;
  }
}

/**
 * Load and cache AI prompt configuration.
 * Synchronous version — reads from YAML file (for backward compatibility).
 */
export function loadAIPrompts(projectSlug: string = "music-blog"): AIPromptConfig {
  const cached = _cache.get(`yaml-${projectSlug}`);
  if (cached && Date.now() - cached.time < CACHE_TTL) return cached.data;
  const yaml = loadAIPromptsFromYAML(projectSlug);
  _cache.set(`yaml-${projectSlug}`, { data: yaml, time: Date.now() });
  return yaml;
}

/**
 * Invalidate the cache so next call reloads from source.
 */
export function invalidateAIPromptsCache(projectId?: string): void {
  if (projectId) {
    _cache.delete(projectId);
  } else {
    _cache.clear();
  }
}

/**
 * Get persona definition by ID. Falls back to philosopher_editor.
 */
export function getPersona(
  personaId?: string,
  config?: AIPromptConfig
): PersonaDefinition & { id: string } {
  const c = config ?? loadAIPrompts();
  const keys = Object.keys(c.personas);
  const fallbackId = keys[0] ?? "default";
  const id =
    personaId && c.personas[personaId] ? personaId : fallbackId;
  const persona = c.personas[id];
  if (!persona) {
    return { id, name: "Default", tone: "", instruction: "" };
  }
  return { id, ...persona };
}

/**
 * Get list of available persona IDs and names for the UI.
 */
export function getPersonaList(
  config?: AIPromptConfig
): { id: string; name: string; tone: string }[] {
  const c = config ?? loadAIPrompts();
  return Object.entries(c.personas).map(([id, p]) => ({
    id,
    name: p.name,
    tone: p.tone,
  }));
}

/**
 * Interpolate template variables in a prompt string.
 * Replaces {key} patterns with values from the vars object.
 */
export function interpolate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}
