import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Leaf, Plus, RefreshCw } from "lucide-react";
import { createRestaurant, listRestaurants, type Restaurant } from "../api";
import { useAuth } from "../auth/AuthContext";
import { MiniMascot } from "../components/Mascot";
import { Button, Tag } from "../components/ui";
import { SAMPLES } from "./restaurantSamples";

/** 맛집 목록 화면. 작성/메모추가는 별도 화면(/restaurants/new, /restaurants/:id)으로 이동. */
export function RestaurantsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    if (!token) return;
    try {
      setRestaurants(await listRestaurants(token));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "저장된 맛집을 불러오지 못했습니다.");
    }
  }

  async function handleSaveSamples() {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await Promise.all(SAMPLES.map((s) => createRestaurant({ ...s }, token)));
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "샘플 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="tf-scroll h-full overflow-y-auto">
      <div className="flex flex-col gap-3 p-4">
        {/* 새 맛집 작성 */}
        <Button className="w-full" onClick={() => navigate("/restaurants/new")}>
          <Plus size={16} />새 맛집 작성
        </Button>

        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-medium text-zinc-500">저장된 맛집 {restaurants.length}곳</span>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600"
          >
            <RefreshCw size={13} />
            새로고침
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </div>
        )}

        {restaurants.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => navigate(`/restaurants/${r.id}`, { state: { restaurant: r } })}
            className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 text-left transition-colors hover:bg-zinc-50"
          >
            <div className="min-w-0 flex-1">
              <strong className="block text-sm font-semibold text-zinc-900">{r.name}</strong>
              <span className="text-xs text-zinc-500">
                {r.area} · {r.cuisine} · {r.price_level}
              </span>
              {r.mood_tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.mood_tags.slice(0, 4).map((t) => (
                    <Tag key={t}>#{t}</Tag>
                  ))}
                </div>
              )}
              <small className="mt-2 block text-[11px] text-zinc-400">방문 메모 {r.note_count}개</small>
            </div>
            <ChevronRight size={18} className="shrink-0 text-zinc-300" />
          </button>
        ))}

        {!restaurants.length && !error && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <MiniMascot className="h-14 w-14" />
            <span className="text-sm text-zinc-400">
              아직 저장된 맛집이 없어요.
              <br />
              샘플로 먼저 채워볼까요?
            </span>
            <Button variant="secondary" size="sm" disabled={saving} onClick={handleSaveSamples}>
              <Leaf size={13} />
              샘플 전체 저장
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
