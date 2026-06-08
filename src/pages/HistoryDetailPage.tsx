import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { listTasteAgentSessions, type TasteAgentMessage, type TasteAgentSession } from "../api";
import { useAuth } from "../auth/AuthContext";
import { MiniMascot } from "../components/Mascot";
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

  useEffect(() => {
    if (session || !token || !sessionId) return;
    listTasteAgentSessions(token)
      .then((data) => {
        setSession(data.sessions.find((item) => item.id === sessionId) ?? null);
        setError(null);
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "대화 기록을 불러오지 못했습니다.");
      });
  }, [session, token, sessionId]);

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
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-zinc-900">{session.title}</h2>
          <p className="text-[11px] text-zinc-400">{formatDate(session.updated_at)}</p>
        </div>
      </div>

      <div className="tf-scroll flex-1 space-y-5 overflow-y-auto px-4 py-5">
        {session.messages.map((message) => (
          <HistoryBubble key={message.id} message={message} />
        ))}
        {!session.messages.length && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <MiniMascot className="h-14 w-14" />
            <span className="text-sm text-zinc-400">이 세션에는 저장된 메시지가 없어요.</span>
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryBubble({ message }: { message: TasteAgentMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex w-full", isUser && "justify-end")}>
      <div className={cn("max-w-[88%] space-y-1", isUser && "text-right")}>
        <span className="text-[11px] font-medium text-zinc-400">{isUser ? "나" : "NyamBot"}</span>
        <div
          className={cn(
            "whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
            isUser ? "bg-brand-300 text-leaf-600" : "bg-zinc-100 text-zinc-800",
          )}
        >
          {message.content}
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
