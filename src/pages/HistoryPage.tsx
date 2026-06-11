import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, RefreshCw } from "lucide-react";
import { listTasteAgentSessions, type TasteAgentSession } from "../api";
import { useAuth } from "../auth/AuthContext";
import { MiniMascot } from "../components/Mascot";

export function HistoryPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<TasteAgentSession[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    if (!token) return;
    try {
      const data = await listTasteAgentSessions(token);
      setSessions(data.sessions);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "기록을 불러오지 못했습니다.");
    }
  }

  return (
    <div className="tf-scroll h-full overflow-y-auto">
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-medium text-zinc-500">대화 {sessions.length}개</span>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
          >
            <RefreshCw size={13} />
            새로고침
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </div>
        )}

        {sessions.length > 0 && (
          <div className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => navigate(`/history/${session.id}`, { state: { session } })}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-brand-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-1 text-sm font-medium text-zinc-900">
                    {getSessionTitle(session)}
                  </div>
                  <div className="mt-0.5 text-[11px] text-zinc-400">{formatDate(session.updated_at)}</div>
                </div>
                <ChevronRight size={16} className="shrink-0 text-zinc-300" />
              </button>
            ))}
          </div>
        )}

        {!sessions.length && !error && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <MiniMascot className="h-14 w-14" />
            <span className="text-sm text-zinc-400">
              아직 대화 기록이 없어요.
              <br />
              먼저 채팅에서 질문해볼까요?
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function getSessionTitle(session: TasteAgentSession) {
  const title = session.title?.trim();
  if (title) return title;
  const firstQuestion = session.messages.find((message) => message.role === "user")?.content;
  return firstQuestion ?? "새 대화";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
  }).format(date);
}
