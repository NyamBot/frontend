import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Clock3, LogOut } from "lucide-react";
import { listTasteAgentSessions, type TasteAgentSession } from "../api";
import { useAuth } from "../auth/AuthContext";
import { MiniMascot } from "../components/Mascot";
import { Card } from "../components/ui";

const PREVIEW_COUNT = 3;

export function MyPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<TasteAgentSession[]>([]);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    listTasteAgentSessions(token)
      .then((data) => {
        if (alive) setSessions(data.sessions);
      })
      .catch(() => {
        // 미리보기 로드 실패는 조용히 무시 — 전체 보기에서 다시 시도할 수 있다.
      });
    return () => {
      alive = false;
    };
  }, [token]);

  const recentSessions = sessions.slice(0, PREVIEW_COUNT);

  return (
    <div className="tf-scroll h-full overflow-y-auto">
      <div className="space-y-4 p-4">
        <Card className="flex items-center gap-3 px-5 py-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50">
            <MiniMascot className="h-9 w-9" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-zinc-900">
              {user?.display_name ?? "사용자"}님
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="로그아웃"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-300 text-leaf-600 shadow-sm transition-colors hover:bg-brand-200"
          >
            <LogOut size={16} />
          </button>
        </Card>

        <Card className="overflow-hidden">
          <header className="flex items-center gap-2 px-5 pb-2 pt-4">
            <Clock3 size={15} className="text-leaf-600" />
            <h2 className="text-sm font-semibold text-zinc-900">최근 대화</h2>
          </header>

          {recentSessions.length > 0 ? (
            <div className="divide-y divide-zinc-100">
              {recentSessions.map((session) => {
                const firstQuestion =
                  session.messages.find((message) => message.role === "user")?.content ?? session.title;

                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => navigate(`/history/${session.id}`, { state: { session } })}
                    className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-zinc-50"
                  >
                    <span className="line-clamp-1 min-w-0 flex-1 text-sm text-zinc-700">
                      {firstQuestion}
                    </span>
                    <ChevronRight size={16} className="shrink-0 text-zinc-300" />
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="px-5 pb-4 pt-1 text-xs text-zinc-400">아직 대화 기록이 없어요.</p>
          )}

          <button
            type="button"
            onClick={() => navigate("/history")}
            className="flex w-full items-center justify-center gap-1 border-t border-zinc-100 px-5 py-3 text-xs font-medium text-leaf-600 transition-colors hover:bg-zinc-50"
          >
            전체 보기
            <ChevronRight size={14} />
          </button>
        </Card>
      </div>
    </div>
  );
}
