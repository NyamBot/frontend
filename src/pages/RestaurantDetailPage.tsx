import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, MapPin, Pencil } from "lucide-react";
import { getRestaurant, type Restaurant } from "../api";
import { useAuth } from "../auth/AuthContext";
import { KakaoMap } from "../components/KakaoMap";
import { Button, Card, Tag } from "../components/ui";

export function RestaurantDetailPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(
    (location.state as { restaurant?: Restaurant } | null)?.restaurant ?? null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    getRestaurant(id, token)
      .then((loaded) => {
        setRestaurant(loaded);
        setError(null);
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "맛집 정보를 불러오지 못했습니다.");
      });
  }, [token, id]);

  if (error) {
    return (
      <div className="p-4">
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {error}
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return <div className="p-4 text-sm text-zinc-400">맛집 정보를 불러오는 중...</div>;
  }

  return (
    <div className="tf-scroll h-full overflow-y-auto">
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/restaurants")} aria-label="목록으로">
            <ArrowLeft size={18} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/restaurants/${restaurant.id}/edit`, { state: { restaurant } })}
          >
            <Pencil size={14} />
            수정
          </Button>
        </div>

        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-zinc-900">{restaurant.name}</h2>
              <p className="mt-1 text-sm text-zinc-500">
                {restaurant.area} · {restaurant.cuisine} · {restaurant.price_level}
              </p>
            </div>
          </div>

          {restaurant.mood_tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {restaurant.mood_tags.map((tag) => (
                <Tag key={tag}>#{tag}</Tag>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-zinc-900">장소 정보</h3>
            {restaurant.kakao_place_url && (
              <a
                href={restaurant.kakao_place_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <MapPin size={13} />
                식당 보기
                <ExternalLink size={12} />
              </a>
            )}
          </div>

          {restaurant.latitude && restaurant.longitude && (
            <div className="mb-4">
              <KakaoMap
                latitude={restaurant.latitude}
                longitude={restaurant.longitude}
                title={restaurant.name}
              />
            </div>
          )}

          <div className="space-y-2 text-sm text-zinc-600">
            <InfoRow label="주소" value={restaurant.road_address || restaurant.address || "등록된 주소 없음"} />
            <InfoRow label="전화" value={restaurant.phone || "등록된 전화번호 없음"} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[72px_1fr] gap-3">
      <span className="text-zinc-400">{label}</span>
      <span className="min-w-0 break-words text-zinc-700">{value}</span>
    </div>
  );
}
