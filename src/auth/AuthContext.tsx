import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { KAKAO_LOGIN_URL, exchangeAuthCode, getCurrentUser, type User } from "../api";

const TOKEN_KEY = "nyambot_token";
const LEGACY_TOKEN_KEY = "tasteforge_token";

type AuthState = {
  token: string;
  user: User | null;
  /** 부트스트랩(토큰 검증) 완료 여부 — 끝나기 전엔 화면 깜빡임 방지용 로딩 표시 */
  initialized: boolean;
  /** 카카오 콜백/세션 오류 메시지 */
  authError: string | null;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [completingAuth, setCompletingAuth] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has("auth_code");
  });
  const [token, setToken] = useState(() => {
    const token = localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(LEGACY_TOKEN_KEY) ?? "";
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
    }
    return token;
  });
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(!completingAuth);
  const [authError, setAuthError] = useState<string | null>(null);

  // 카카오 콜백 처리: URL 의 ?auth_code= / ?auth_error= 를 1회 흡수한다.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authCode = params.get("auth_code");
    const error = params.get("auth_error");
    if (authCode) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setInitialized(false);
      exchangeAuthCode(authCode)
        .then(({ access_token }) => {
          localStorage.setItem(TOKEN_KEY, access_token);
          setToken(access_token);
        })
        .catch((caught) => {
          setAuthError(caught instanceof Error ? caught.message : "카카오 로그인을 완료하지 못했습니다.");
          setInitialized(true);
        })
        .finally(() => {
          setCompletingAuth(false);
        });
    } else if (error) {
      setAuthError(`카카오 로그인 실패: ${error}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // 토큰이 바뀌면 현재 사용자 검증/로드.
  useEffect(() => {
    let alive = true;
    if (completingAuth) return;
    if (!token) {
      setUser(null);
      setInitialized(true);
      return;
    }
    setInitialized(false);
    getCurrentUser(token)
      .then((loaded) => {
        if (!alive) return;
        setUser(loaded);
        setAuthError(null);
      })
      .catch((caught) => {
        if (!alive) return;
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        setUser(null);
        setAuthError(caught instanceof Error ? caught.message : "로그인이 만료되었습니다.");
      })
      .finally(() => {
        if (alive) setInitialized(true);
      });
    return () => {
      alive = false;
    };
  }, [completingAuth, token]);

  const login = useCallback(() => {
    window.location.href = KAKAO_LOGIN_URL;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ token, user, initialized, authError, login, logout }),
    [token, user, initialized, authError, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
