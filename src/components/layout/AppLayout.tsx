import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Clock3, LogOut, MapPinned, MessageCircle, NotebookPen, type LucideIcon } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { BrandMark } from "../Mascot";
import { Button } from "../ui";
import { cn } from "../../lib/utils";

const NAV: Array<{ to: string; label: string; icon: LucideIcon; end?: boolean }> = [
  { to: "/chat", label: "추천", icon: MessageCircle },
  { to: "/restaurants", label: "맛집", icon: NotebookPen, end: true },
  { to: "/restaurants/map", label: "지도", icon: MapPinned },
  { to: "/history", label: "기록", icon: Clock3 },
] as const;

const PAGE_META: Record<string, { title: string; sub: string }> = {
  "/chat": { title: "오늘은 어디 갈까?", sub: "내 메모를 근거로 골라줘요." },
  "/restaurants/new": { title: "새 맛집 작성", sub: "식당을 담고 기록을 적어요." },
  "/restaurants/:id": { title: "맛집 상세", sub: "저장된 맛집 정보를 확인해요." },
  "/restaurants/:id/edit": { title: "맛집 수정", sub: "저장된 맛집 정보를 수정해요." },
  "/restaurants": { title: "내 맛집", sub: "저장한 식당을 모아 봐요." },
  "/restaurants/map": { title: "맛집 지도", sub: "저장한 식당을 지도에서 봐요." },
  "/history": { title: "취향 채팅 기록", sub: "이전 질문과 추천 근거를 다시 보세요." },
  "/history/:sessionId": { title: "대화 기록", sub: "저장된 대화를 다시 확인해요." },
};

/** 현재 경로에 맞는 페이지 메타 선택 (가장 구체적인 prefix 우선). */
function resolveMeta(pathname: string) {
  if (pathname === "/restaurants/new") return PAGE_META["/restaurants/new"];
  if (pathname === "/restaurants/map") return PAGE_META["/restaurants/map"];
  if (/^\/restaurants\/[^/]+\/edit$/.test(pathname)) return PAGE_META["/restaurants/:id/edit"];
  if (/^\/restaurants\/[^/]+$/.test(pathname)) return PAGE_META["/restaurants/:id"];
  if (/^\/history\/[^/]+$/.test(pathname)) return PAGE_META["/history/:sessionId"];
  return PAGE_META[pathname] ?? PAGE_META["/chat"];
}

/** 전체 앱을 폰 폭(≈440px) 카드로 고정. 데스크탑에선 가운데 정렬된 폰 프레임, 모바일에선 전체 화면. */
export function AppLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const meta = resolveMeta(pathname);

  return (
    <div className="flex min-h-screen justify-center sm:py-6">
      <div className="flex h-screen w-full max-w-[440px] flex-col overflow-hidden bg-white sm:h-[calc(100vh-3rem)] sm:max-h-[920px] sm:rounded-[2rem] sm:border sm:border-zinc-200 sm:shadow-xl">
        {/* 헤더 */}
        <header className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3">
          <BrandMark size={18} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold text-zinc-900">{meta.title}</h1>
            <p className="truncate text-[11px] text-zinc-400">{meta.sub}</p>
          </div>
          {user?.display_name && (
            <span className="max-w-[90px] truncate text-xs text-zinc-400">
              {user.display_name}
            </span>
          )}
          <Button variant="ghost" size="icon" onClick={logout} aria-label="로그아웃">
            <LogOut size={16} />
          </Button>
        </header>

        {/* 본문 */}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </main>

        {/* 하단 탭 */}
        <nav className="flex shrink-0 border-t border-zinc-200 bg-white">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  isActive ? "text-leaf-600" : "text-zinc-400 hover:text-zinc-600",
                )
              }
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
