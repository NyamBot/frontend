import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { MapPinned, MessageCircle, NotebookPen, UserRound, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

const NAV: Array<{ to: string; label: string; icon: LucideIcon; end?: boolean }> = [
  { to: "/chat", label: "추천", icon: MessageCircle },
  { to: "/restaurants", label: "맛집", icon: NotebookPen, end: true },
  { to: "/restaurants/map", label: "지도", icon: MapPinned },
  { to: "/mypage", label: "마이", icon: UserRound },
] as const;

/** 전체 앱을 폰 폭(≈440px) 카드로 고정. 데스크탑에선 가운데 정렬된 폰 프레임, 모바일에선 전체 화면. */
export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex min-h-screen justify-center sm:py-6">
      <div className="flex h-screen w-full max-w-[440px] flex-col overflow-hidden bg-white sm:h-[calc(100vh-3rem)] sm:max-h-[920px] sm:rounded-[2rem] sm:border sm:border-zinc-200 sm:shadow-xl">
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
              onClick={(event) => {
                // 추천 탭을 다시 누르면 새 채팅으로 초기화
                if (to === "/chat" && location.pathname === "/chat") {
                  event.preventDefault();
                  navigate("/chat", { state: { fresh: Date.now() } });
                }
              }}
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
