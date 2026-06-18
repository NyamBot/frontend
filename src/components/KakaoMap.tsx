import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    kakao?: {
      maps: {
        load: (callback: () => void) => void;
        LatLng: new (latitude: number, longitude: number) => unknown;
        Map: new (container: HTMLElement, options: { center: unknown; level: number }) => unknown;
        Marker: new (options: { position: unknown }) => { setMap: (map: unknown) => void };
      };
    };
  }
}

const KAKAO_MAP_SCRIPT_ID = "kakao-map-sdk";

type KakaoMapProps = {
  latitude: number;
  longitude: number;
  title: string;
};

export function KakaoMap({ latitude, longitude, title }: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    loadKakaoMapScript()
      .then(() => {
        if (!alive || !containerRef.current || !window.kakao) return;
        window.kakao.maps.load(() => {
          if (!alive || !containerRef.current || !window.kakao) return;
          const center = new window.kakao.maps.LatLng(latitude, longitude);
          const map = new window.kakao.maps.Map(containerRef.current, {
            center,
            level: 3,
          });
          const marker = new window.kakao.maps.Marker({ position: center });
          marker.setMap(map);
        });
      })
      .catch(() => {
        if (alive) setError("카카오맵을 불러오지 못했습니다.");
      });

    return () => {
      alive = false;
    };
  }, [latitude, longitude]);

  if (error) {
    return (
      <div className="flex h-52 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-400">
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={`${title} 지도`}
      className="h-52 w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100"
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
