const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const API_PREFIX = import.meta.env.VITE_API_PREFIX ?? "/api/v1";
const API_URL = `${API_BASE}${API_PREFIX}`;

export const KAKAO_LOGIN_URL = `${API_URL}/auth/kakao/login`;

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

export type RatingLevel = "인생맛집" | "맛남" | "쏘쏘";

export type Restaurant = {
  id: string;
  user_id: string | null;
  name: string;
  area: string;
  city: string | null;
  district: string | null;
  town: string | null;
  cuisine: string;
  price_level: string;
  mood_tags: string[];
  signature_menus: string[];
  kakao_place_id: string | null;
  kakao_place_url: string | null;
  address: string | null;
  road_address: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  rating_level: RatingLevel;
  note_count: number;
  created_at: string;
};

export type KakaoPlace = {
  id: string;
  place_name: string;
  category_name: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  place_url: string;
  x: string;
  y: string;
};

export type RestaurantRecommendation = {
  restaurant: Restaurant;
  reason: string;
  evidence: string[];
  menu_tip: string;
  caution: string;
  score: number;
};

export type TasteAgentMessage = {
  id: string;
  session_id: string | null;
  user_id: string | null;
  role: "user" | "assistant";
  content: string;
  retrieved_context: string[];
  metadata: {
    area?: string | null;
    cuisine?: string | null;
    price_level?: string | null;
    tags?: string[];
    limit?: number;
    recommendation_count?: number;
    restaurant_names?: string[];
    recommendations?: RestaurantRecommendation[];
  };
  created_at: string;
};

export type TasteAgentSession = {
  id: string;
  user_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
  messages: TasteAgentMessage[];
};

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function parseError(response: Response, fallback: string) {
  try {
    const data = await response.json();
    if (typeof data.detail === "string") return data.detail;
  } catch {
    // Ignore non-JSON error bodies.
  }
  return fallback;
}

export async function getCurrentUser(token: string) {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(await parseError(response, "Failed to load current user"));
  return response.json() as Promise<User>;
}

export async function exchangeAuthCode(code: string) {
  const response = await fetch(`${API_URL}/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) throw new Error(await parseError(response, "Failed to complete login"));
  return response.json() as Promise<{ access_token: string; token_type: "bearer" }>;
}

export async function listUsers() {
  const response = await fetch(`${API_URL}/users`);
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
  const response = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to create user");
  return response.json() as Promise<User>;
}

export async function deleteCurrentUser(token: string) {
  const response = await fetch(`${API_URL}/users/me`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(await parseError(response, "Failed to delete current user"));
}

export async function createRestaurant(payload: {
  name: string;
  area: string;
  city?: string | null;
  district?: string | null;
  town?: string | null;
  cuisine: string;
  price_level: string;
  mood_tags: string[];
  signature_menus: string[];
  note: string;
  kakao_place_id?: string | null;
  kakao_place_url?: string | null;
  address?: string | null;
  road_address?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string | null;
  rating_level?: RatingLevel;
}, token: string) {
  const response = await fetch(`${API_URL}/restaurants`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await parseError(response, "Failed to create restaurant"));
  return response.json() as Promise<Restaurant>;
}

export async function listRestaurants(
  token: string,
  filters: { city?: string; district?: string; town?: string; query?: string; rating_level?: string } = {},
) {
  const params = new URLSearchParams();
  if (filters.city) params.set("city", filters.city);
  if (filters.district) params.set("district", filters.district);
  if (filters.town) params.set("town", filters.town);
  if (filters.query) params.set("query", filters.query);
  if (filters.rating_level) params.set("rating_level", filters.rating_level);
  const query = params.toString();
  const response = await fetch(`${API_URL}/restaurants${query ? `?${query}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(await parseError(response, "Failed to list restaurants"));
  return response.json() as Promise<Restaurant[]>;
}

export async function getRestaurant(restaurantId: string, token: string) {
  const response = await fetch(`${API_URL}/restaurants/${encodeURIComponent(restaurantId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(await parseError(response, "Failed to load restaurant"));
  return response.json() as Promise<Restaurant>;
}

export async function updateRestaurant(
  restaurantId: string,
  payload: {
    name: string;
    area: string;
    city?: string | null;
    district?: string | null;
    town?: string | null;
    cuisine: string;
    price_level: string;
    mood_tags: string[];
    kakao_place_id?: string | null;
    kakao_place_url?: string | null;
    address?: string | null;
    road_address?: string | null;
    phone?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    image_url?: string | null;
    rating_level?: RatingLevel;
  },
  token: string,
) {
  const response = await fetch(`${API_URL}/restaurants/${encodeURIComponent(restaurantId)}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await parseError(response, "Failed to update restaurant"));
  return response.json() as Promise<Restaurant>;
}

export async function addRestaurantNote(
  restaurantId: string,
  payload: {
    content: string;
    tags: string[];
  },
  token: string,
) {
  const response = await fetch(`${API_URL}/restaurants/${encodeURIComponent(restaurantId)}/notes`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await parseError(response, "Failed to add restaurant note"));
  return response.json() as Promise<Restaurant>;
}

export async function deleteRestaurant(restaurantId: string, token: string) {
  const response = await fetch(`${API_URL}/restaurants/${encodeURIComponent(restaurantId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(await parseError(response, "Failed to delete restaurant"));
}

export async function searchKakaoPlaces(query: string, size = 5) {
  const params = new URLSearchParams({ query, size: String(size) });
  const response = await fetch(`${API_URL}/restaurants/kakao/search?${params.toString()}`);
  if (!response.ok) throw new Error("Failed to search Kakao places");
  return response.json() as Promise<{ query: string; places: KakaoPlace[] }>;
}

export async function chatTasteAgent(payload: {
  user_id?: string | null;
  session_id?: string | null;
  query: string;
  message: string;
  area?: string | null;
  cuisine?: string | null;
  price_level?: string | null;
  tags: string[];
  latitude?: number | null;
  longitude?: number | null;
  limit?: number;
}, token: string) {
  const response = await fetch(`${API_URL}/restaurants/chat`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await parseError(response, "Failed to ask taste agent"));
  return response.json() as Promise<{
    session_id: string;
    answer: string;
    recommendations: RestaurantRecommendation[];
    context: string[];
  }>;
}

export async function listTasteAgentMessages(token: string) {
  const response = await fetch(`${API_URL}/restaurants/chat/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(await parseError(response, "Failed to list taste agent messages"));
  return response.json() as Promise<{ user_id: string | null; messages: TasteAgentMessage[] }>;
}

export async function listTasteAgentSessions(token: string) {
  const response = await fetch(`${API_URL}/restaurants/chat/sessions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(await parseError(response, "Failed to list taste agent sessions"));
  return response.json() as Promise<{ user_id: string | null; sessions: TasteAgentSession[] }>;
}
