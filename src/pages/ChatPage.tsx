import { useEffect, useRef, useState } from "react";
import { useLocation as useRouteLocation } from "react-router-dom";
import { AlertTriangle, MapPin, MapPinOff, RefreshCw, Send, SlidersHorizontal, Square, SquarePen } from "lucide-react";
import {
  chatTasteAgent,
  type RestaurantRecommendation,
  type TasteAgentMessage,
  type TasteAgentSession,
} from "../api";
import { useAuth } from "../auth/AuthContext";
import { MiniMascot } from "../components/Mascot";
import { RecommendationMessage } from "../components/RecommendationCards";
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
  const location = useRouteLocation();
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
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, recommendations, loading]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    requestCurrentLocation();
  }, []);

  useEffect(() => {
    const routeSession = (location.state as { session?: TasteAgentSession } | null)?.session ?? null;
    if (routeSession) {
      activateSession(routeSession);
      return;
    }
    clearChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, location.state]);

  function activateSession(session: TasteAgentSession) {
    setSessionId(session.id);
    setMessages(session.messages);
    setRecommendations(getLatestAssistantRecommendations(session.messages));
    setError(null);
  }

  function requestCurrentLocation() {
    if (!window.isSecureContext || !navigator.geolocation) {
      setLocationStatus("failed");
      return;
    }

    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus("ready");
      },
      () => {
        setCurrentLocation(null);
        setLocationStatus("failed");
      },
      { enableHighAccuracy: false, timeout: 3000, maximumAge: 300000 },
    );
  }

  function clearChat() {
    stopResponse();
    setSessionId(null);
    setMessages([]);
    setRecommendations([]);
    setError(null);
  }

  function stopResponse() {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setLoading(false);
  }

  async function handleAsk(rawQuery: string = query) {
    if (!token || !rawQuery.trim() || loading) return;
    const asked = rawQuery.trim();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setQuery("");
    setLoading(true);
    setError(null);
    setRecommendations([]);

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
        abortController.signal,
      );
      abortControllerRef.current = null;
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
            recommendations: response.recommendations,
          },
          created_at: new Date().toISOString(),
        },
      ]);
      setRecommendations(response.recommendations);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") {
        setMessages((prev) => [
          ...prev,
          {
            id: `local-stopped-${prev.length}`,
            session_id: sessionId,
            user_id: null,
            role: "assistant",
            content: "응답 생성을 중지했어요.",
            retrieved_context: [],
            metadata: {},
            created_at: new Date().toISOString(),
          },
        ]);
        return;
      }
      setError(caught instanceof Error ? caught.message : "맛집 추천에 실패했습니다.");
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  }

  const hasThread = messages.length > 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              showFilters
                ? "border-brand-300 bg-brand-100 text-brand-700"
                : "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100",
            )}
          >
            <SlidersHorizontal size={13} />
            검색 조건
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={useLocation}
            aria-label="위치 반영"
            onClick={() => {
              if (useLocation && locationStatus === "failed") {
                requestCurrentLocation();
                return;
              }
              const next = !useLocation;
              setUseLocation(next);
              if (next) {
                requestCurrentLocation();
              } else {
                setCurrentLocation(null);
                setLocationStatus("idle");
              }
            }}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors",
              !useLocation
                ? "bg-brand-50 text-brand-700 hover:bg-brand-100"
                : locationStatus === "ready"
                  ? "bg-brand-100 text-brand-700 hover:bg-brand-200"
                  : locationStatus === "failed"
                    ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                    : "bg-brand-50 text-brand-700 hover:bg-brand-100",
            )}
          >
            {!useLocation ? (
              <MapPinOff size={12} />
            ) : locationStatus === "loading" ? (
              <RefreshCw size={11} className="animate-spin" />
            ) : locationStatus === "failed" ? (
              <AlertTriangle size={12} />
            ) : (
              <MapPin size={12} />
            )}
            {!useLocation
              ? "위치 꺼짐"
              : locationStatus === "ready"
                ? "위치 반영중"
                : locationStatus === "loading"
                  ? "위치 확인중"
                  : locationStatus === "failed"
                    ? "위치 안 잡힘"
                    : "위치 대기중"}
          </button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearChat}
          disabled={!hasThread}
          aria-label="새 대화"
        >
          <SquarePen size={14} />
          새 대화
        </Button>
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
        {messages.map((message) =>
          message.role === "assistant" && message.metadata.recommendations?.length ? (
            <RecommendationMessage key={message.id} recommendations={message.metadata.recommendations} />
          ) : (
            <Bubble key={message.id} role={message.role}>
              {message.content}
            </Bubble>
          ),
        )}

        {loading && (
          <Bubble role="assistant" muted>
            <TypingIndicator />
          </Bubble>
        )}

        {!hasThread && !loading && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <MiniMascot className="h-14 w-14" />
            <strong className="text-sm font-semibold text-zinc-700">오늘은 어디서 먹을까요?</strong>
            <span className="text-xs text-zinc-400">
              먹고 싶은 메뉴나 분위기를 말해주면 딱 맞는 맛집을 찾아드릴게요.
            </span>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {QUICK_QUERIES.map((quickQuery) => (
                <button
                  key={quickQuery}
                  type="button"
                  onClick={() => void handleAsk(quickQuery)}
                  className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs text-brand-700 hover:border-brand-300 hover:bg-brand-100"
                >
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
          <Button
            type={loading ? "button" : "submit"}
            size="icon"
            disabled={!loading && !query.trim()}
            aria-label={loading ? "응답 중지" : "전송"}
            onClick={loading ? stopResponse : undefined}
          >
            {loading ? <Square size={16} /> : <Send size={16} />}
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
          ? "border-brand-300 bg-brand-100 text-brand-700"
          : "border-brand-200 bg-brand-50 text-brand-700 hover:border-brand-300 hover:bg-brand-100",
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
            <MiniMascot className="h-8 w-8 nyam-bob" />
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

function TypingIndicator() {
  return (
    <div className="flex h-5 items-center gap-1.5" aria-label="추천 생성 중">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="h-2 w-2 rounded-full bg-zinc-400"
          style={{
            animation: "typing-dot 0.9s ease-in-out infinite",
            animationDelay: `${index * 0.14}s`,
          }}
        />
      ))}
      <style>
        {`
          @keyframes typing-dot {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
            40% { transform: translateY(-4px); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
}

function getLatestAssistantRecommendations(messages: TasteAgentMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role === "assistant" && message.metadata.recommendations?.length) {
      return message.metadata.recommendations;
    }
  }
  return [];
}
