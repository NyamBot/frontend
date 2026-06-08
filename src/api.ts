const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export type SourceResponse = {
  id: string;
  title: string;
  chunk_count: number;
};

export type SourceDetail = SourceResponse & {
  user_id: string | null;
  audience: string;
  platform: string;
  tone: string;
  goal: string;
  created_at: string;
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
  id?: string | null;
  source_id?: string | null;
  clip_idea_id?: string | null;
  title: string;
  hook: string;
  scene_plan: string[];
  captions: string[];
  b_roll: string[];
  audio_direction: string[];
  hashtags: string[];
  license_checklist: string[];
  created_at?: string | null;
};

export type AgentMessage = {
  id: string;
  source_id: string;
  role: "user" | "assistant";
  content: string;
  retrieved_context: string[];
  created_at: string;
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

export async function listSources(userId?: string | null) {
  const query = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
  const response = await fetch(`${API_BASE}/api/sources${query}`);
  if (!response.ok) throw new Error("Failed to list sources");
  return response.json() as Promise<SourceDetail[]>;
}

export async function getSource(sourceId: string) {
  const response = await fetch(`${API_BASE}/api/sources/${encodeURIComponent(sourceId)}`);
  if (!response.ok) throw new Error("Failed to load source");
  return response.json() as Promise<SourceDetail>;
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

export async function generateIdeas(
  sourceId: string,
  title: string,
  platform: string,
  audience: string,
  goal: string,
) {
  const response = await fetch(`${API_BASE}/api/clips/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source_id: sourceId,
      title,
      platform,
      audience,
      goal,
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

export async function listClipIdeas(sourceId: string) {
  const response = await fetch(`${API_BASE}/api/clips?source_id=${encodeURIComponent(sourceId)}`);
  if (!response.ok) throw new Error("Failed to list clip ideas");
  return response.json() as Promise<{ source_id: string; ideas: ClipIdea[] }>;
}

export async function listCampaignPacks(sourceId: string, clipIdeaId?: string | null) {
  const params = new URLSearchParams({ source_id: sourceId });
  if (clipIdeaId) params.set("clip_idea_id", clipIdeaId);
  const response = await fetch(`${API_BASE}/api/clips/packs?${params.toString()}`);
  if (!response.ok) throw new Error("Failed to list campaign packs");
  return response.json() as Promise<ScriptPack[]>;
}

export async function chatAgent(sourceId: string, message: string) {
  const response = await fetch(`${API_BASE}/api/agent/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source_id: sourceId, message }),
  });
  if (!response.ok) throw new Error("Failed to ask agent");
  return response.json() as Promise<{ answer: string; context: string[] }>;
}

export async function listAgentMessages(sourceId: string) {
  const response = await fetch(`${API_BASE}/api/agent/messages?source_id=${encodeURIComponent(sourceId)}`);
  if (!response.ok) throw new Error("Failed to list agent messages");
  return response.json() as Promise<{ source_id: string; messages: AgentMessage[] }>;
}
