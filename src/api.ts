const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export type SourceResponse = {
  id: string;
  title: string;
  chunk_count: number;
};

export type User = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  auth_provider: string;
  provider_subject: string | null;
  created_at: string;
  last_login_at: string | null;
};

export type ClipIdea = {
  id: string;
  title: string;
  hook: string;
  summary: string;
  platform: string;
  duration_seconds: number;
  hook_score: number;
  audience_angle: string;
  cta: string;
  platform_fit: string;
  source_moments: string[];
};

export type ScriptPack = {
  title: string;
  hook: string;
  scene_plan: string[];
  captions: string[];
  b_roll: string[];
  audio_direction: string[];
  hashtags: string[];
  license_checklist: string[];
};

export async function createSource(payload: {
  user_id?: string | null;
  title: string;
  transcript: string;
  audience: string;
  platform: string;
  tone: string;
  goal?: string;
}) {
  const response = await fetch(`${API_BASE}/api/sources`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to create source");
  return response.json() as Promise<SourceResponse>;
}

export async function listUsers() {
  const response = await fetch(`${API_BASE}/api/users`);
  if (!response.ok) throw new Error("Failed to list users");
  return response.json() as Promise<User[]>;
}

export async function createUser(payload: {
  email: string;
  display_name: string;
  avatar_url?: string | null;
  auth_provider?: string;
  provider_subject?: string | null;
}) {
  const response = await fetch(`${API_BASE}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to create user");
  return response.json() as Promise<User>;
}

export async function generateIdeas(sourceId: string, title: string, platform: string) {
  const response = await fetch(`${API_BASE}/api/clips/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source_id: sourceId,
      title,
      platform,
      audience: "general creators",
      goal: "awareness",
      count: 3,
    }),
  });
  if (!response.ok) throw new Error("Failed to generate clip ideas");
  return response.json() as Promise<{ source_id: string; ideas: ClipIdea[] }>;
}

export async function generateScript(sourceId: string, idea: ClipIdea) {
  const response = await fetch(`${API_BASE}/api/clips/script`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source_id: sourceId, idea }),
  });
  if (!response.ok) throw new Error("Failed to generate script");
  return response.json() as Promise<ScriptPack>;
}
