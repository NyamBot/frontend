import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";

/** 미인증 사용자는 /login 으로 보낸다. 부트스트랩 중에는 로딩 표시. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, user, initialized } = useAuth();

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-400">
        불러오는 중...
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
