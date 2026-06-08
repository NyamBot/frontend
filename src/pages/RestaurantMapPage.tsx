import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crosshair, ExternalLink, MapPin, Star } from "lucide-react";
import { listRestaurants, type Restaurant } from "../api";
import { useAuth } from "../auth/AuthContext";
import { RestaurantMap } from "../components/RestaurantMap";
import { Button, Tag } from "../components/ui";
import { getKakaoDirectionUrl } from "../lib/kakaoMap";

export function RestaurantMapPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "ready" | "failed">("idle");
  const [locationMessage, setLocationMessage] = useState("현재 위치를 확인하는 중이에요.");
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
    if (!window.isSecureContext) {
      setLocationStatus("failed");
      setLocationMessage("현재 위치는 localhost 또는 HTTPS 환경에서만 사용할 수 있어요.");
      return;
    }

    if (!navigator.geolocation) {
      setLocationStatus("failed");
      setLocationMessage("이 브라우저에서는 현재 위치를 사용할 수 없어요.");
      return;
    }

    setLocationStatus("loading");
    setLocationMessage("현재 위치를 확인하는 중이에요.");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus("ready");
        setLocationMessage("현재 위치 기준으로 지도를 보고 있어요.");
      },
      (geoError) => {
        setCurrentLocation(null);
        setLocationStatus("failed");
        setLocationMessage(getLocationErrorMessage(geoError));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  const selectRestaurant = useCallback((restaurant: Restaurant) => {
    setSelectedId(restaurant.id);
  }, []);

  useEffect(() => {
    requestCurrentLocation();
  }, [requestCurrentLocation]);

  return (
    <div className="tf-scroll h-full overflow-y-auto">
      <div className="flex flex-col gap-3 p-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={locationStatus === "ready" ? "primary" : "secondary"}
              onClick={requestCurrentLocation}
              disabled={locationStatus === "loading"}
              className="shrink-0"
            >
              <Crosshair size={14} />
              {locationStatus === "loading" ? "확인 중" : "내 위치"}
            </Button>
            <p
              className={`min-w-0 flex-1 text-xs ${
                locationStatus === "failed" ? "text-rose-500" : "text-zinc-500"
              }`}
            >
              {locationMessage}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </div>
        )}

        <RestaurantMap
          restaurants={pinnedRestaurants}
          selectedId={selectedRestaurant?.id ?? null}
          currentLocation={currentLocation}
          onSelect={selectRestaurant}
        />

        {selectedRestaurant && (
          <article className="rounded-2xl border border-leaf-200 bg-leaf-50 p-3.5 text-left">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-500">
                <Star size={17} fill="currentColor" />
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
                      className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-xl border border-leaf-200 bg-white text-xs font-semibold text-leaf-600"
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
                    className="inline-flex h-8 flex-1 items-center justify-center rounded-xl bg-leaf-600 text-xs font-semibold text-white"
                  >
                    상세보기
                  </button>
                </div>
              </div>
            </div>
          </article>
        )}

        {pinnedRestaurants.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center">
            <MapPin className="text-zinc-300" size={30} />
            <div className="text-sm text-zinc-500">저장한 맛집이 지도에 표시돼요.</div>
            <Button variant="secondary" onClick={() => navigate("/restaurants/new")}>
              맛집 저장하기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function getLocationErrorMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    return "위치 권한이 꺼져 있어요. 브라우저 주소창 권한에서 위치를 허용해주세요.";
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return "현재 위치를 찾지 못했어요. 잠시 후 다시 눌러주세요.";
  }
  if (error.code === error.TIMEOUT) {
    return "위치 확인 시간이 초과됐어요. 다시 한 번 눌러주세요.";
  }
  return "현재 위치를 가져오지 못했어요.";
}
