import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { MiniMascot } from "../components/Mascot";

export function LoginPage() {
  const { token, user, initialized, authError, login } = useAuth();

  // 이미 로그인돼 있으면 채팅으로.
  if (initialized && token && user) {
    return <Navigate to="/chat" replace />;
  }

  return (
    <div className="flex min-h-screen justify-center sm:py-6">
      {/* 폰 프레임 안 1단 중앙 정렬: 마스코트 → 브랜드 → 카피 → CTA */}
      <div className="flex h-screen w-full max-w-[440px] flex-col items-center justify-center bg-white px-7 py-10 text-center sm:h-[calc(100vh-3rem)] sm:max-h-[920px] sm:rounded-[2rem] sm:border sm:border-zinc-200 sm:shadow-xl">
        <MiniMascot className="h-40 w-40" />

        <div className="mt-5 text-xl font-bold">
          <span className="text-brand-500">NyamBot</span>
        </div>

        <h1 className="mt-3 text-lg font-semibold leading-snug text-zinc-800">
          오늘 어디 갈지 고민될 때,
          <br />
          <em className="not-italic text-brand-500">내 맛집 리뷰</em>가 답을 알아요.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          맛집을 기록해두면
          <br />
          AI가 다음에 갈 곳을 추천해드려요.
        </p>

        <div className="mt-7 w-full space-y-3">
          {authError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {authError}
            </div>
          )}
          <button
            type="button"
            onClick={login}
            aria-label="카카오로 시작하기"
            className="mx-auto flex items-center justify-center rounded-xl bg-[#FEE500] px-20 py-3.5 text-sm font-bold text-black transition hover:brightness-95"
          >
            KAKAO
          </button>
        </div>
      </div>
    </div>
  );
}
