import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { ChatPage } from "./pages/ChatPage";
import { RestaurantsPage } from "./pages/RestaurantsPage";
import { RestaurantFormPage } from "./pages/RestaurantFormPage";
import { HistoryPage } from "./pages/HistoryPage";

/**
 * 라우트 구조
 *   /login        공개 (카카오 로그인 진입)
 *   /chat         추천 채팅
 *   /restaurants  맛집 저장/관리
 *   /history      대화 기록
 * 카카오 콜백 ?auth_code= 파싱은 AuthProvider 가 담당.
 */
export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/chat" replace />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/restaurants" element={<RestaurantsPage />} />
        <Route path="/restaurants/new" element={<RestaurantFormPage />} />
        <Route path="/restaurants/:id" element={<RestaurantFormPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
