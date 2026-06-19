import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, MoreVertical, Trash2 } from "lucide-react";
import {
  deleteTasteAgentSession,
  listTasteAgentSessions,
  type TasteAgentMessage,
  type TasteAgentSession,
} from "../api";
import { useAuth } from "../auth/AuthContext";
import { MiniMascot } from "../components/Mascot";
import { RecommendationMessage } from "../components/RecommendationCards";
import { Button } from "../components/ui";
import { cn } from "../lib/utils";

export function HistoryDetailPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const location = useLocation();
  const [session, setSession] = useState<TasteAgentSession | null>(
    (location.state as { session?: TasteAgentSession } | null)?.session ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (session || !token || !sessionId) return;
    listTasteAgentSessions(token, { session_id: sessionId, limit: 1 })
      .then((data) => {
        const loadedSession = data.sessions[0] ?? null;
        setSession(loadedSession);
        if (!loadedSession) {
          setError("대화 기록을 찾을 수 없습니다.");
          return;
        }
        setError(null);
      })
      .catch((caught) => {
        setError("대화 기록을 불러오지 못했습니다.");
      });
  }, [session, token, sessionId]);

  async function handleDelete() {
    if (!token || !session || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteTasteAgentSession(session.id, token);
      navigate("/history");
    } catch (caught) {
      setError("대화 기록 삭제에 실패했습니다.");
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {error}
        </div>
      </div>
    );
  }

  if (!session) {
    return <div className="p-4 text-sm text-zinc-400">대화 기록을 불러오는 중...</div>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/history")} aria-label="기록 목록으로">
          <ArrowLeft size={18} />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-zinc-900">{session.title}</h2>
          <p className="text-[11px] text-zinc-400">{formatDate(session.updated_at)}</p>
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="더보기"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <MoreVertical size={18} />
          </Button>
          {menuOpen && (
            <>
              <button
                type="button"
                aria-hidden
                tabIndex={-1}
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/chat", { state: { session } });
                  }}
                  disabled={!session.messages.length}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-brand-700 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <MessageCircle size={14} />
                  이어서 대화
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-brand-700 transition-colors hover:bg-brand-50"
                >
                  <Trash2 size={14} />
                  삭제
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="tf-scroll flex-1 space-y-5 overflow-y-auto px-4 py-5">
        {session.messages.map((message) =>
          message.role === "assistant" && message.metadata.recommendations?.length ? (
            <RecommendationMessage key={message.id} recommendations={message.metadata.recommendations} />
          ) : (
            <HistoryBubble key={message.id} message={message} />
          ),
        )}
        {!session.messages.length && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <MiniMascot className="h-14 w-14" />
            <span className="text-sm text-zinc-400">이 세션에는 저장된 메시지가 없어요.</span>
          </div>
        )}
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-zinc-950/25 px-4 pb-4 sm:items-center sm:justify-center sm:p-4">
          <section className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl">
            <h2 className="text-sm font-semibold text-zinc-900">대화 기록을 삭제할까요?</h2>
            <div className="mt-4 flex gap-2">
              <Button
                className="flex-1"
                variant="secondary"
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
              >
                취소
              </Button>
              <Button
                className="flex-1 bg-brand-300 text-brand-700 hover:bg-brand-200"
                onClick={() => void handleDelete()}
                disabled={deleting}
              >
                {deleting ? "삭제 중..." : "삭제"}
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function HistoryBubble({ message }: { message: TasteAgentMessage }) {
  const isUser = message.role === "user";
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
              isUser ? "bg-brand-300 text-leaf-600" : "bg-leaf-50 text-leaf-600",
            )}
          >
            {message.content}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
