import { useEffect, useState } from "react";
import { ChevronDown, Clock3, RefreshCw } from "lucide-react";
import { listTasteAgentMessages, type TasteAgentMessage } from "../api";
import { useAuth } from "../auth/AuthContext";
import { MiniMascot } from "../components/Mascot";
import { Button, Card } from "../components/ui";
import { cn } from "../lib/utils";

export function HistoryPage() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<TasteAgentMessage[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    if (!token) return;
    try {
      const data = await listTasteAgentMessages(token);
      setMessages(data.messages);
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
              <p className="text-xs text-zinc-400">근거 메모와 함께 이전 추천을 다시 보세요</p>
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
            {messages.map((m) => {
              const isUser = m.role === "user";
              const hasContext = m.retrieved_context.length > 0;
              const open = openId === m.id;
              return (
                <div key={m.id} className="px-5 py-3.5">
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={cn(
                        "text-[11px] font-semibold",
                        isUser ? "text-zinc-500" : "text-leaf-600",
                      )}
                    >
                      {isUser ? "나" : "NyamBot"}
                    </span>
                    {hasContext && (
                      <button
                        type="button"
                        onClick={() => setOpenId(open ? null : m.id)}
                        className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600"
                      >
                        근거 {m.retrieved_context.length}개
                        <ChevronDown
                          size={12}
                          className={cn("transition-transform", open && "rotate-180")}
                        />
                      </button>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
                    {m.content}
                  </p>
                  {hasContext && open && (
                    <ul className="mt-2 space-y-1.5">
                      {m.retrieved_context.map((ctx, i) => (
                        <li
                          key={i}
                          className="border-l-2 border-leaf-200 bg-leaf-50/50 px-3 py-1.5 text-xs italic text-zinc-600"
                        >
                          {ctx}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}

            {!messages.length && !error && (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <MiniMascot className="h-14 w-14" />
                <span className="text-sm text-zinc-400">
                  아직 대화 기록이 없어요.
                  <br />
                  먼저 채팅에서 질문을 해볼까요?
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
