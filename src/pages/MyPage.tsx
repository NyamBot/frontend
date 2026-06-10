import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Clock3, LogOut, Trash2 } from "lucide-react";
import { deleteCurrentUser, listTasteAgentSessions, type TasteAgentSession } from "../api";
import { useAuth } from "../auth/AuthContext";
import { MiniMascot } from "../components/Mascot";
import { Card } from "../components/ui";

const PREVIEW_COUNT = 3;

export function MyPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<TasteAgentSession[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleDeleteAccount() {
    if (!token || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteCurrentUser(token);
      logout();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "회원탈퇴에 실패했습니다.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

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

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </div>
        )}

        <Card className="p-4">
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <span>
              <span className="block text-sm font-semibold text-rose-500">회원탈퇴</span>
              <span className="mt-1 block text-xs text-zinc-400">저장 맛집과 대화 기록이 함께 삭제됩니다.</span>
            </span>
            <Trash2 size={17} className="shrink-0 text-rose-400" />
          </button>
        </Card>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end bg-zinc-950/25 px-4 pb-4 sm:items-center sm:justify-center sm:p-4">
          <section className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl">
            <h2 className="text-sm font-semibold text-zinc-900">회원탈퇴할까요?</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              계정, 저장한 맛집, 맛집 메모, 대화 기록이 모두 삭제됩니다.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 rounded-xl bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-600 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteAccount()}
                disabled={deleting}
                className="flex-1 rounded-xl bg-rose-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {deleting ? "탈퇴 중..." : "탈퇴"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
