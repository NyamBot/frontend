import type { Restaurant } from "../api";

export function getKakaoDirectionUrl(restaurant: Restaurant) {
  if (restaurant.latitude === null || restaurant.longitude === null) {
    return restaurant.kakao_place_url;
  }

  const destination = encodeURIComponent(restaurant.name);
  return `https://map.kakao.com/link/to/${destination},${restaurant.latitude},${restaurant.longitude}`;
}
