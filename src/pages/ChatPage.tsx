import { useEffect, useRef, useState } from "react";
import { Compass, Crosshair, RefreshCw, Send, SlidersHorizontal, Sparkles, SquarePen } from "lucide-react";
import {
  chatTasteAgent,
  type RestaurantRecommendation,
  type TasteAgentMessage,
} from "../api";
import { useAuth } from "../auth/AuthContext";
import { MiniMascot } from "../components/Mascot";
import { Button, TextInput } from "../components/ui";
import { cn } from "../lib/utils";

const QUICK_QUERIES = [
  "조용한 데이트 맛집 골라줘",
  "혼밥하기 좋은 곳 추천해줘",
  "회식으로 무난한 맛집 골라줘",
];

const CUISINE_OPTIONS = ["한식", "일식", "중식", "양식", "분식", "카페", "술집"];
const PRICE_OPTIONS = ["1만원 이하", "1~2만원", "2~3만원", "3~5만원", "5만원 이상"];

export function ChatPage() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<TasteAgentMessage[]>([]);
  const [recommendations, setRecommendations] = useState<RestaurantRecommendation[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [priceLevel, setPriceLevel] = useState("");
  const [useLocation, setUseLocation] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "ready" | "failed">("idle");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const threadRef = useRef<HTMLDivElement>(null);
  const locationEnabledRef = useRef(useLocation);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, recommendations, loading]);

  useEffect(() => {
    if (useLocation) requestCurrentLocation();
    locationEnabledRef.current = useLocation;
  }, [useLocation]);

  function requestCurrentLocation() {
    if (!window.isSecureContext || !navigator.geolocation) {
      setLocationStatus("failed");
      return;
    }

    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!locationEnabledRef.current) return;
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus("ready");
      },
      () => {
        if (!locationEnabledRef.current) return;
        setCurrentLocation(null);
        setLocationStatus("failed");
      },
      { enableHighAccuracy: false, timeout: 3000, maximumAge: 300000 },
    );
  }

  function clearChat() {
    setSessionId(null);
    setMessages([]);
    setRecommendations([]);
    setError(null);
  }

  async function handleAsk() {
    if (!token || !query.trim() || loading) return;
    const asked = query.trim();
    setQuery("");
    setLoading(true);
    setError(null);

    setMessages((prev) => [
      ...prev,
      {
        id: `local-${prev.length}`,
        session_id: sessionId,
        user_id: null,
        role: "user",
        content: asked,
        retrieved_context: [],
        metadata: {
          cuisine: cuisine || null,
          price_level: priceLevel || null,
          tags: [],
          latitude: useLocation ? currentLocation?.latitude ?? null : null,
          longitude: useLocation ? currentLocation?.longitude ?? null : null,
          limit: 3,
        },
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      const response = await chatTasteAgent(
        {
          query: asked,
          message: asked,
          session_id: sessionId,
          cuisine: cuisine || null,
          price_level: priceLevel || null,
          tags: [],
          latitude: useLocation ? currentLocation?.latitude ?? null : null,
          longitude: useLocation ? currentLocation?.longitude ?? null : null,
          limit: 3,
        },
        token,
      );
      setSessionId(response.session_id);
      setMessages((prev) => [
        ...prev,
        {
          id: `local-a-${prev.length}`,
          session_id: response.session_id,
          user_id: null,
          role: "assistant",
          content: response.answer,
          retrieved_context: response.context,
          metadata: {
            recommendation_count: response.recommendations.length,
            restaurant_names: response.recommendations.map((recommendation) => recommendation.restaurant.name),
          },
          created_at: new Date().toISOString(),
        },
      ]);
      setRecommendations(response.recommendations);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "맛집 추천에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const hasThread = messages.length > 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pt-3">
        <button
          type="button"
          onClick={() => setShowFilters((value) => !value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            showFilters
              ? "border-brand-300 bg-brand-50 text-leaf-600"
              : "border-zinc-200 text-zinc-500 hover:bg-zinc-50",
          )}
        >
          <SlidersHorizontal size={13} />
          검색 조건
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearChat}
          disabled={!hasThread && recommendations.length === 0}
          aria-label="새 대화"
        >
          <SquarePen size={14} />
          새 대화
        </Button>
      </div>

      <div className="mx-4 mt-2 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2">
        <span
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
            useLocation && locationStatus === "ready" ? "bg-brand-50 text-leaf-600" : "bg-zinc-50 text-zinc-400",
          )}
        >
          {locationStatus === "loading" ? <RefreshCw size={14} className="animate-spin" /> : <Crosshair size={14} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-zinc-700">위치 반영</div>
          <div className="truncate text-[11px] text-zinc-400">
            {!useLocation
              ? "저장 기록만 보고 추천해요."
              : locationStatus === "ready"
                ? "현재 위치를 추천에 반영해요."
                : locationStatus === "loading"
                  ? "위치를 빠르게 확인하는 중이에요."
                  : "위치 없이도 추천할 수 있어요."}
          </div>
        </div>
        {useLocation && locationStatus === "failed" && (
          <button
            type="button"
            onClick={requestCurrentLocation}
            className="inline-flex h-8 shrink-0 items-center rounded-xl bg-zinc-50 px-2.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100"
          >
            재시도
          </button>
        )}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={useLocation}
            aria-label="위치 반영"
            onClick={() => {
              const next = !useLocation;
              locationEnabledRef.current = next;
              setUseLocation(next);
              if (!next) {
                setCurrentLocation(null);
                setLocationStatus("idle");
              }
            }}
            className={cn(
              "relative h-7 w-12 rounded-full transition-colors",
              useLocation ? "bg-leaf-500" : "bg-zinc-200",
            )}
          >
            <span
              className={cn(
                "absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                useLocation ? "translate-x-5" : "translate-x-0",
              )}
            />
          </button>
          <span
            className={cn(
              "w-7 text-right text-[11px] font-bold",
              useLocation ? "text-leaf-600" : "text-zinc-400",
            )}
          >
            {useLocation ? "ON" : "OFF"}
          </span>
        </div>
      </div>

      {showFilters && (
        <div className="mx-4 mt-2 space-y-3 rounded-2xl border border-zinc-200 bg-white p-3">
          <FilterGroup label="음식 종류">
            <ChipRow>
              {CUISINE_OPTIONS.map((option) => (
                <ChoiceChip
                  key={option}
                  label={option}
                  selected={cuisine === option}
                  onClick={() => setCuisine(cuisine === option ? "" : option)}
                />
              ))}
            </ChipRow>
          </FilterGroup>

          <FilterGroup label="가격대">
            <ChipRow>
              {PRICE_OPTIONS.map((option) => (
                <ChoiceChip
                  key={option}
                  label={option}
                  selected={priceLevel === option}
                  onClick={() => setPriceLevel(priceLevel === option ? "" : option)}
                />
              ))}
            </ChipRow>
          </FilterGroup>

        </div>
      )}

      <div ref={threadRef} className="tf-scroll flex-1 space-y-5 overflow-y-auto px-4 py-5">
        <Bubble role="assistant">
          저장해둔 맛집 메모를 기준으로 골라볼게요. 원하는 상황을 편하게 말해주세요.
        </Bubble>

        {messages.map((message) => (
          <Bubble key={message.id} role={message.role}>
            {message.content}
          </Bubble>
        ))}

        {loading && (
          <Bubble role="assistant" muted>
            저장된 메모와 조건을 비교하고 있어요...
          </Bubble>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-3 pl-11">
            {recommendations.map((recommendation, index) => (
              <RecommendationCard key={recommendation.restaurant.id} rec={recommendation} rank={index + 1} />
            ))}
          </div>
        )}

        {!hasThread && !loading && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <MiniMascot className="h-14 w-14" />
            <strong className="text-sm font-semibold text-zinc-700">아직 추천 결과가 없어요.</strong>
            <span className="text-xs text-zinc-400">
              아래 입력창에서 질문하면 답변과 추천 카드가 나타나요.
            </span>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {QUICK_QUERIES.map((quickQuery) => (
                <button
                  key={quickQuery}
                  type="button"
                  onClick={() => setQuery(quickQuery)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:border-brand-300 hover:bg-brand-50"
                >
                  <Sparkles size={12} />
                  {quickQuery}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-4 mb-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="border-t border-zinc-200 bg-white px-4 py-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleAsk();
          }}
          className="flex items-end gap-2 rounded-2xl border border-zinc-200 bg-white p-2 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-200"
        >
          <textarea
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleAsk();
              }
            }}
            rows={1}
            placeholder="예: 성수에서 조용한 데이트 맛집 골라줘"
            className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none"
          />
          <Button type="submit" size="icon" disabled={loading || !query.trim()} aria-label="전송">
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
          </Button>
        </form>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-bold text-zinc-500">{label}</h3>
      {children}
    </section>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

function ChoiceChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        selected
          ? "border-brand-300 bg-brand-50 text-leaf-600"
          : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50",
      )}
    >
      {label}
    </button>
  );
}

function Bubble({
  role,
  muted,
  children,
}: {
  role: "user" | "assistant";
  muted?: boolean;
  children: React.ReactNode;
}) {
  const isUser = role === "user";
  return (
    <div className={cn("flex w-full", isUser && "justify-end")}>
      <div className={cn("flex max-w-[88%] gap-2.5", isUser && "flex-row-reverse")}>
        {!isUser && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center">
            <MiniMascot className="h-8 w-8" />
          </div>
        )}
        <div className={cn("min-w-0 space-y-1", isUser && "text-right")}>
          <span className="text-[11px] font-medium text-zinc-400">
            {isUser ? "나" : "NyamBot"}
          </span>
          <div
            className={cn(
              "whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
              isUser
                ? "bg-brand-300 text-leaf-600"
                : muted
                  ? "animate-pulse bg-zinc-50 text-zinc-400"
                  : "bg-zinc-100 text-zinc-800",
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({ rec, rank }: { rec: RestaurantRecommendation; rank: number }) {
  const restaurant = rec.restaurant;
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <strong className="block truncate text-sm font-semibold text-zinc-900">{restaurant.name}</strong>
          <span className="text-xs text-zinc-500">
            {restaurant.area} · {restaurant.cuisine} · {restaurant.price_level}
          </span>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-leaf-600">
          <Sparkles size={11} />
          {rank}순위
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-700">{rec.reason}</p>
      {rec.evidence.slice(0, 1).map((evidence) => (
        <blockquote
          key={evidence}
          className="mt-2 border-l-2 border-leaf-200 bg-leaf-50/50 px-3 py-1.5 text-xs italic text-zinc-600"
        >
          {evidence}
        </blockquote>
      ))}
      <div className="mt-3 flex items-center justify-between gap-2">
        {rec.menu_tip && <small className="text-xs text-zinc-500">{rec.menu_tip}</small>}
        {restaurant.kakao_place_url && (
          <a
            href={restaurant.kakao_place_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-leaf-500 hover:text-leaf-600"
          >
            <Compass size={12} />
            지도
          </a>
        )}
      </div>
    </article>
  );
}
