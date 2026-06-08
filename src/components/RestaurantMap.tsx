import { useEffect, useMemo, useRef, useState } from "react";
import type { Restaurant } from "../api";

const KAKAO_MAP_SCRIPT_ID = "kakao-map-sdk";

type RestaurantMapProps = {
  restaurants: Restaurant[];
  selectedId: string | null;
  currentLocation: { latitude: number; longitude: number } | null;
  onSelect: (restaurant: Restaurant) => void;
};

export function RestaurantMap({
  restaurants,
  selectedId,
  currentLocation,
  onSelect,
}: RestaurantMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pinnedRestaurants = useMemo(
    () => restaurants.filter((item) => item.latitude !== null && item.longitude !== null),
    [restaurants],
  );

  useEffect(() => {
    let alive = true;
    const overlays: Array<{ setMap: (map: unknown | null) => void }> = [];

    loadKakaoMapScript()
      .then(() => {
        if (!alive || !containerRef.current || !window.kakao) return;
        window.kakao.maps.load(() => {
          if (!alive || !containerRef.current || !window.kakao) return;
          const maps = window.kakao.maps as any;
          const first = pinnedRestaurants[0];
          const center = new maps.LatLng(
            currentLocation?.latitude ?? first?.latitude ?? 37.5665,
            currentLocation?.longitude ?? first?.longitude ?? 126.978,
          );
          const map = new maps.Map(containerRef.current, { center, level: currentLocation ? 5 : first ? 5 : 8 });
          const bounds = new maps.LatLngBounds();

          if (currentLocation) {
            const position = new maps.LatLng(currentLocation.latitude, currentLocation.longitude);
            const currentOverlay = new maps.CustomOverlay({
              position,
              content: createCurrentLocationMarker(),
              yAnchor: 0.5,
            });
            currentOverlay.setMap(map);
            overlays.push(currentOverlay);
          }

          pinnedRestaurants.forEach((restaurant) => {
            if (restaurant.latitude === null || restaurant.longitude === null) return;
            const position = new maps.LatLng(restaurant.latitude, restaurant.longitude);
            bounds.extend(position);

            const overlay = new maps.CustomOverlay({
              position,
              content: createFavoriteMarker({
                restaurant,
                active: restaurant.id === selectedId,
                onClick: () => onSelect(restaurant),
              }),
              yAnchor: 1,
            });
            overlay.setMap(map);
            overlays.push(overlay);
          });

          if (!currentLocation && pinnedRestaurants.length > 1) {
            map.setBounds?.(bounds);
          }

          const selected = pinnedRestaurants.find((restaurant) => restaurant.id === selectedId);
          if (selected && selected.latitude !== null && selected.longitude !== null) {
            map.setCenter?.(new maps.LatLng(selected.latitude, selected.longitude));
          }
        });
      })
      .catch(() => {
        if (alive) setError("카카오맵을 불러오지 못했습니다.");
      });

    return () => {
      alive = false;
      overlays.forEach((overlay) => overlay.setMap(null));
    };
  }, [currentLocation, onSelect, pinnedRestaurants, selectedId]);

  if (error) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-400">
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="저장된 맛집 지도"
      className="h-[360px] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100"
    />
  );
}

function loadKakaoMapScript() {
  const appKey = import.meta.env.VITE_KAKAO_MAP_JS_KEY;
  if (!appKey) return Promise.reject(new Error("Missing Kakao map key"));
  if (window.kakao?.maps) return Promise.resolve();

  const existingScript = document.getElementById(KAKAO_MAP_SCRIPT_ID) as HTMLScriptElement | null;
  if (existingScript) {
    return new Promise<void>((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Kakao map")), {
        once: true,
      });
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = KAKAO_MAP_SCRIPT_ID;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Kakao map"));
    document.head.appendChild(script);
  });
}

function createFavoriteMarker({
  restaurant,
  active,
  onClick,
}: {
  restaurant: Restaurant;
  active: boolean;
  onClick: () => void;
}) {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", `${restaurant.name} 선택`);
  button.textContent = "★";
  button.style.cssText = `
    display:flex;
    align-items:center;
    justify-content:center;
    width:${active ? "38px" : "34px"};
    height:${active ? "38px" : "34px"};
    border:2px solid ${active ? "#65a30d" : "#f4c430"};
    border-radius:999px;
    background:${active ? "#ecfccb" : "#fff7d1"};
    color:${active ? "#3f6212" : "#854d0e"};
    box-shadow:0 8px 18px rgba(24,24,27,0.16);
    font-size:${active ? "22px" : "20px"};
    font-weight:800;
    line-height:1;
    cursor:pointer;
  `;
  button.addEventListener("click", onClick);
  return button;
}

function createCurrentLocationMarker() {
  const marker = document.createElement("div");
  marker.setAttribute("aria-label", "현재 위치");
  marker.style.cssText = `
    width:16px;
    height:16px;
    border:3px solid #ffffff;
    border-radius:999px;
    background:#2563eb;
    box-shadow:0 0 0 4px rgba(37,99,235,0.18), 0 6px 14px rgba(24,24,27,0.2);
  `;
  return marker;
}
