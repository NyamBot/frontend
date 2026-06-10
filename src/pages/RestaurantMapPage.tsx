import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crosshair, ExternalLink, MapPin, RefreshCw, X } from "lucide-react";
import { listRestaurants, type Restaurant } from "../api";
import { useAuth } from "../auth/AuthContext";
import { RestaurantMap } from "../components/RestaurantMap";
import { Tag } from "../components/ui";
import { getKakaoDirectionUrl } from "../lib/kakaoMap";
import { cn } from "../lib/utils";

export function RestaurantMapPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "ready" | "failed">("idle");
  const [error, setError] = useState<string | null>(null);

  const pinnedRestaurants = useMemo(
    () => restaurants.filter((restaurant) => restaurant.latitude !== null && restaurant.longitude !== null),
    [restaurants],
  );

  const selectedRestaurant = pinnedRestaurants.find((restaurant) => restaurant.id === selectedId) ?? null;

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const nextRestaurants = await listRestaurants(token);
      setRestaurants(nextRestaurants);
      setSelectedId((current) => {
        if (current && nextRestaurants.some((restaurant) => restaurant.id === current)) return current;
        return current;
      });
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "저장된 맛집을 불러오지 못했습니다.");
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const requestCurrentLocation = useCallback(() => {
    if (!window.isSecureContext || !navigator.geolocation) {
      setLocationStatus("failed");
      return;
    }

    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus("ready");
      },
      () => {
        setCurrentLocation(null);
        setLocationStatus("failed");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  const selectRestaurant = useCallback((restaurant: Restaurant) => {
    setSelectedId((current) => (current === restaurant.id ? null : restaurant.id));
  }, []);

  useEffect(() => {
    requestCurrentLocation();
  }, [requestCurrentLocation]);

  return (
    <div className="relative h-full overflow-hidden">
      <RestaurantMap
        restaurants={pinnedRestaurants}
        selectedId={selectedRestaurant?.id ?? null}
        currentLocation={currentLocation}
        onSelect={selectRestaurant}
      />

      {error && (
        <div className="absolute inset-x-3 top-3 z-20 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600 shadow-sm">
          {error}
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-end gap-2 p-3">
        <button
          type="button"
          onClick={requestCurrentLocation}
          disabled={locationStatus === "loading"}
          aria-label="내 위치로 이동"
          title={locationStatus === "failed" ? "위치를 가져오지 못했어요. 다시 시도하려면 누르세요." : "내 위치로 이동"}
          className={cn(
            "pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border bg-white shadow-md transition-colors",
            locationStatus === "ready"
              ? "border-brand-300 text-leaf-600"
              : locationStatus === "failed"
                ? "border-rose-200 text-rose-500 hover:bg-rose-50"
                : "border-zinc-200 text-zinc-500 hover:bg-zinc-50",
          )}
        >
          {locationStatus === "loading" ? (
            <RefreshCw size={18} className="animate-spin" />
          ) : (
            <Crosshair size={18} />
          )}
        </button>

        {selectedRestaurant && (
          <article className="pointer-events-auto relative w-full rounded-2xl border border-brand-200 bg-brand-50 p-3.5 text-left shadow-xl">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              aria-label="닫기"
              className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/70 hover:text-zinc-600"
            >
              <X size={15} />
            </button>
            <div className="flex items-start gap-3 pr-4">
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-500">
                <MapPin size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <strong className="block truncate text-sm font-semibold text-zinc-900">
                  {selectedRestaurant.name}
                </strong>
                <span className="text-xs text-zinc-500">
                  {selectedRestaurant.area} · {selectedRestaurant.cuisine} · {selectedRestaurant.price_level}
                </span>
                {selectedRestaurant.mood_tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedRestaurant.mood_tags.slice(0, 3).map((tag) => (
                      <Tag key={tag}>#{tag}</Tag>
                    ))}
                  </div>
                )}
                <dl className="mt-3 grid grid-cols-1 gap-2 text-xs">
                  <div className="rounded-xl bg-white/70 px-3 py-2">
                    <dt className="text-[11px] font-medium text-zinc-400">주소</dt>
                    <dd className="mt-0.5 text-zinc-700">
                      {selectedRestaurant.road_address || selectedRestaurant.address || "주소 정보 없음"}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-white/70 px-3 py-2">
                    <dt className="text-[11px] font-medium text-zinc-400">전화</dt>
                    <dd className="mt-0.5 truncate text-zinc-700">{selectedRestaurant.phone || "없음"}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex gap-2">
                  {selectedRestaurant.kakao_place_url && (
                    <a
                      href={getKakaoDirectionUrl(selectedRestaurant) ?? selectedRestaurant.kakao_place_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-300 bg-white text-xs font-semibold text-brand-700"
                    >
                      <ExternalLink size={13} />
                      길찾기
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/restaurants/${selectedRestaurant.id}`, {
                        state: { restaurant: selectedRestaurant },
                      })
                    }
                    className="inline-flex h-8 flex-1 items-center justify-center rounded-xl bg-brand-300 text-xs font-semibold text-brand-700 hover:bg-brand-200"
                  >
                    상세보기
                  </button>
                </div>
              </div>
            </div>
          </article>
        )}
      </div>

    </div>
  );
}
