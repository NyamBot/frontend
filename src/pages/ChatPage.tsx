import { useEffect, useRef, useState } from "react";
import { Compass, RefreshCw, Send, SlidersHorizontal, Sparkles, SquarePen } from "lucide-react";
import {
  chatTasteAgent,
  type RestaurantRecommendation,
  type TasteAgentMessage,
} from "../api";
import { useAuth } from "../auth/AuthContext";
import { MiniMascot } from "../components/Mascot";
import { Button, TextInput } from "../components/ui";
import { cn, splitCsv } from "../lib/utils";

const QUICK_QUERIES = [
  "성수에서 조용한 데이트 맛집 알려줘",
  "혼밥하기 좋은 곳 추천해줘",
  "회식으로 무난한 맛집 골라줘",
];

export function ChatPage() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<TasteAgentMessage[]>([]);
  const [recommendations, setRecommendations] = useState<RestaurantRecommendation[]>([]);
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [tags, setTags] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const threadRef = useRef<HTMLDivElement>(null);

  // 채팅은 일회성: 마운트/새로고침 시 이전 대화를 불러오지 않고 빈 상태로 시작한다.
  // (서버에는 계속 저장되며 "기록" 탭에서 확인 가능)

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, recommendations, loading]);

  function clearChat() {
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
    // 낙관적으로 내 질문을 스레드에 추가
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${prev.length}`,
        user_id: null,
        role: "user",
        content: asked,
        retrieved_context: [],
        created_at: new Date().toISOString(),
      },
    ]);
    try {
      const response = await chatTasteAgent(
        {
          query: asked,
          message: asked,
          area: area || null,
          cuisine: cuisine || null,
          tags: splitCsv(tags),
          limit: 3,
        },
        token,
      );
      // 답변을 로컬 스레드에만 누적 (서버 재조회 없음 → 새로고침하면 사라짐)
      setMessages((prev) => [
        ...prev,
        {
          id: `local-a-${prev.length}`,
          user_id: null,
          role: "assistant",
          content: response.answer,
          retrieved_context: response.context,
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
      {/* 필터 토글 바 */}
      <div className="flex items-center justify-between px-4 pt-3">
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
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

      {showFilters && (
        <div className="mx-4 mt-2 grid grid-cols-1 gap-2 rounded-2xl border border-zinc-200 bg-white p-3">
          <TextInput placeholder="지역 (예: 성수)" value={area} onChange={(e) => setArea(e.target.value)} />
          <TextInput placeholder="음식 종류 (전체)" value={cuisine} onChange={(e) => setCuisine(e.target.value)} />
          <TextInput placeholder="태그 (조용함,데이트)" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
      )}

      {/* 스레드 */}
      <div ref={threadRef} className="tf-scroll flex-1 space-y-5 overflow-y-auto px-4 py-5">
        <Bubble role="assistant">
          저장해둔 맛집 메모를 기준으로 골라볼게요. 상황을 편하게 말해주세요.
        </Bubble>

        {messages.map((m) => (
          <Bubble key={m.id} role={m.role}>
            {m.content}
          </Bubble>
        ))}

        {loading && (
          <Bubble role="assistant" muted>
            저장된 메모와 태그를 비교하고 있어요...
          </Bubble>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-3 pl-11">
            {recommendations.map((rec, index) => (
              <RecommendationCard key={rec.restaurant.id} rec={rec} rank={index + 1} />
            ))}
          </div>
        )}

        {!hasThread && !loading && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <MiniMascot className="h-14 w-14" />
            <strong className="text-sm font-semibold text-zinc-700">아직 추천 결과가 없어요</strong>
            <span className="text-xs text-zinc-400">
              아래 입력창에서 질문하면 답변과 추천 카드가 쌓여요.
            </span>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {QUICK_QUERIES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuery(q)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 hover:border-brand-300 hover:bg-brand-50"
                >
                  <Sparkles size={12} />
                  {q}
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

      {/* 입력창 */}
      <div className="border-t border-zinc-200 bg-white px-4 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleAsk();
          }}
          className="flex items-end gap-2 rounded-2xl border border-zinc-200 bg-white p-2 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-200"
        >
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleAsk();
              }
            }}
            rows={1}
            placeholder="예: 성수에서 조용한 데이트 맛집 알려줘"
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
        <span className="text-[11px] font-medium text-zinc-400">{isUser ? "나" : "NyamBot"}</span>
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
  const r = rec.restaurant;
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <strong className="block truncate text-sm font-semibold text-zinc-900">{r.name}</strong>
          <span className="text-xs text-zinc-500">
            {r.area} · {r.cuisine} · {r.price_level}
          </span>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-leaf-600">
          <Sparkles size={11} />
          {rank}순위
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-700">{rec.reason}</p>
      {rec.evidence.slice(0, 1).map((ev) => (
        <blockquote
          key={ev}
          className="mt-2 border-l-2 border-leaf-200 bg-leaf-50/50 px-3 py-1.5 text-xs italic text-zinc-600"
        >
          {ev}
        </blockquote>
      ))}
      <div className="mt-3 flex items-center justify-between gap-2">
        {rec.menu_tip && <small className="text-xs text-zinc-500">{rec.menu_tip}</small>}
        {r.kakao_place_url && (
          <a
            href={r.kakao_place_url}
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
