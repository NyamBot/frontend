import { useEffect, useRef, useState } from "react";
import { useLocation as useRouteLocation } from "react-router-dom";
import { AlertTriangle, MapPin, MapPinOff, RefreshCw, Send, Square, SquarePen } from "lucide-react";
import {
  cancelTasteAgentChat,
  chatTasteAgent,
  type ChatSearchMode,
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

export function ChatPage() {
  const { token } = useAuth();
  const location = useRouteLocation();
  const [messages, setMessages] = useState<TasteAgentMessage[]>([]);
  const [recommendations, setRecommendations] = useState<RestaurantRecommendation[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<ChatSearchMode>("normal");
  const [useLocation, setUseLocation] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "ready" | "failed">("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const threadRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);
  const suppressStoppedMessageRef = useRef(false);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, recommendations, loading]);

  useEffect(() => {
    return () => {
      stopResponse({ showStoppedMessage: false });
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
    stopResponse({ showStoppedMessage: false });
    setSessionId(null);
    setMessages([]);
    setRecommendations([]);
    setError(null);
  }

  function stopResponse({ showStoppedMessage = true }: { showStoppedMessage?: boolean } = {}) {
    const requestId = activeRequestIdRef.current;
    const activeSessionId = activeSessionIdRef.current;
    suppressStoppedMessageRef.current = !showStoppedMessage;
    if (token && (requestId || activeSessionId)) {
      void cancelTasteAgentChat(
        {
          request_id: requestId,
          session_id: activeSessionId,
        },
        token,
      ).catch(() => {
        // The local abort still stops the UI even if the cancel request loses the race.
      });
    }
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    activeRequestIdRef.current = null;
    activeSessionIdRef.current = null;
    setLoading(false);
  }

  async function handleAsk(rawQuery: string = query) {
    if (!token || !rawQuery.trim() || loading) return;
    const asked = rawQuery.trim();
    const abortController = new AbortController();
    const requestId = createRequestId();
    abortControllerRef.current = abortController;
    activeRequestIdRef.current = requestId;
    activeSessionIdRef.current = sessionId;
    suppressStoppedMessageRef.current = false;
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
          tags: [],
          latitude: useLocation ? currentLocation?.latitude ?? null : null,
          longitude: useLocation ? currentLocation?.longitude ?? null : null,
          limit: 3,
          search_mode: searchMode,
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
          request_id: requestId,
          tags: [],
          latitude: useLocation ? currentLocation?.latitude ?? null : null,
          longitude: useLocation ? currentLocation?.longitude ?? null : null,
          limit: 3,
          search_mode: searchMode,
        },
        token,
        abortController.signal,
      );
      abortControllerRef.current = null;
      activeRequestIdRef.current = null;
      activeSessionIdRef.current = null;
      setSessionId(response.session_id);
      if (response.cancelled) {
        setMessages((prev) => [
          ...prev,
          {
            id: `local-stopped-${prev.length}`,
            session_id: response.session_id,
            user_id: null,
            role: "assistant",
            content: response.answer,
            retrieved_context: [],
            metadata: { request_id: response.request_id },
            created_at: new Date().toISOString(),
          },
        ]);
        setRecommendations([]);
        return;
      }
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
            request_id: response.request_id,
            recommendation_count: response.recommendations.length,
            restaurant_names: response.recommendations.map((recommendation) => recommendation.restaurant.name),
            recommendations: response.recommendations,
            search_mode: searchMode,
          },
          created_at: new Date().toISOString(),
        },
      ]);
      setRecommendations(response.recommendations);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") {
        if (suppressStoppedMessageRef.current) return;
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
      activeRequestIdRef.current = null;
      activeSessionIdRef.current = null;
      suppressStoppedMessageRef.current = false;
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
        <div className="mb-2 inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1">
          {(["normal", "advanced"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setSearchMode(mode)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                searchMode === mode
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-zinc-500 hover:bg-white/70 hover:text-zinc-700",
              )}
              aria-pressed={searchMode === mode}
            >
              {mode === "normal" ? "Normal" : "Advanced"}
            </button>
          ))}
        </div>
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
            onClick={loading ? () => stopResponse() : undefined}
          >
            {loading ? <Square size={16} /> : <Send size={16} />}
          </Button>
        </form>
      </div>
    </div>
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

function createRequestId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
