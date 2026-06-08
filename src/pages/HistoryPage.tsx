import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Clock3, RefreshCw } from "lucide-react";
import { listTasteAgentSessions, type TasteAgentSession } from "../api";
import { useAuth } from "../auth/AuthContext";
import { MiniMascot } from "../components/Mascot";
import { Button, Card } from "../components/ui";

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
      <div className="p-4">
        <Card className="overflow-hidden">
          <header className="flex items-center gap-3 border-b border-zinc-100 px-5 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-leaf-50 text-leaf-600">
              <Clock3 size={18} />
            </span>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-zinc-900">대화 기록</h2>
              <p className="text-xs text-zinc-400">대화 세션을 선택해서 다시 확인해요.</p>
            </div>
            <Button variant="ghost" size="icon" onClick={refresh} aria-label="새로고침">
              <RefreshCw size={15} />
            </Button>
          </header>

          {error && (
            <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {error}
            </div>
          )}

          <div className="divide-y divide-zinc-100">
            {sessions.map((session) => {
              const questions = session.messages.filter((message) => message.role === "user");
              const firstQuestion = questions[0]?.content ?? session.title;

              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => navigate(`/history/${session.id}`, { state: { session } })}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-zinc-50"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xs font-bold text-leaf-600">
                    {questions.length}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm font-semibold leading-relaxed text-zinc-900">
                      {firstQuestion}
                    </span>
                    <span className="mt-1 block text-[11px] text-zinc-400">
                      {questions.length}개 질문 · {formatDate(session.updated_at)}
                    </span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-zinc-300" />
                </button>
              );
            })}

            {!sessions.length && !error && (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <MiniMascot className="h-14 w-14" />
                <span className="text-sm text-zinc-400">
                  아직 대화 기록이 없어요.
                  <br />
                  먼저 채팅에서 질문해볼까요?
                </span>
              </div>
            )}
          </div>
        </Card>
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
