import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { listRestaurants, type Restaurant } from "../api";
import { useAuth } from "../auth/AuthContext";
import { MiniMascot } from "../components/Mascot";
import { Button, Tag, TextInput } from "../components/ui";
import { CITY_OPTIONS, DISTRICT_OPTIONS_BY_CITY } from "../data/koreaRegions";

const PAGE_SIZE = 50;

export function RestaurantsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showRegions, setShowRegions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedCity, selectedDistrict, searchQuery]);

  async function refresh() {
    if (!token) return;
    try {
      setRestaurants(await loadRestaurantPage(0));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "저장된 맛집을 불러오지 못했습니다.");
    }
  }

  async function loadRestaurantPage(offset: number) {
    if (!token) return [];
    const page = await listRestaurants(token, {
      city: selectedCity,
      district: selectedDistrict,
      query: searchQuery.trim(),
      limit: PAGE_SIZE + 1,
      offset,
    });
    setHasMore(page.length > PAGE_SIZE);
    return page.slice(0, PAGE_SIZE);
  }

  async function loadMore() {
    if (!token || loadingMore || !hasMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const nextPage = await loadRestaurantPage(restaurants.length);
      setRestaurants((current) => [...current, ...nextPage]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "맛집을 더 불러오지 못했습니다.");
    } finally {
      setLoadingMore(false);
    }
  }

  const locationRows = useMemo(
    () =>
      restaurants.map((restaurant) => ({
        restaurant,
        location: parseLocationParts(restaurant),
      })),
    [restaurants],
  );
  const cityOptions = CITY_OPTIONS;
  const districtOptions = selectedCity ? DISTRICT_OPTIONS_BY_CITY[selectedCity] ?? [] : [];
  const filteredRows = locationRows.filter((row) => {
    if (!regionMatches(row.location.city, selectedCity)) return false;
    if (!regionMatches(row.location.district, selectedDistrict)) return false;
    return true;
  });
  const hasLocationFilter = Boolean(selectedCity || selectedDistrict || searchQuery.trim());

  return (
    <div className="flex h-full flex-col">
      <div className="tf-scroll flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 p-4">
        {(restaurants.length > 0 || hasLocationFilter) && (
          <div className="space-y-2">
            <TextInput
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="식당명, 지역, 음식 종류, 태그 검색"
            />
            <button
              type="button"
              onClick={() => setShowRegions((value) => !value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                showRegions || selectedCity
                  ? "border-brand-300 bg-brand-100 text-brand-700"
                  : "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100",
              )}
            >
              {selectedCity ? `${selectedCity}${selectedDistrict ? ` ${selectedDistrict}` : ""}` : "지역"}
            </button>
            {showRegions && (
              <>
                {cityOptions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {cityOptions.map((city) => (
                      <FilterChip
                        key={city}
                        label={city}
                        selected={selectedCity === city}
                        onClick={() => {
                          const next = selectedCity === city ? "" : city;
                          setSelectedCity(next);
                          setSelectedDistrict("");
                          if (next && (DISTRICT_OPTIONS_BY_CITY[next] ?? []).length === 0) {
                            setShowRegions(false);
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
                {selectedCity && districtOptions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {districtOptions.map((district) => (
                      <FilterChip
                        key={district}
                        label={district}
                        selected={selectedDistrict === district}
                        onClick={() => {
                          const next = selectedDistrict === district ? "" : district;
                          setSelectedDistrict(next);
                          if (next) setShowRegions(false);
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </div>
        )}

        {filteredRows.map(({ restaurant }) => (
          <article
            key={restaurant.id}
            className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5"
          >
            <button
              type="button"
              onClick={() => navigate(`/restaurants/${restaurant.id}`, { state: { restaurant } })}
              className="min-w-0 flex-1 text-left transition-colors hover:text-brand-700"
            >
              <div className="flex items-center gap-2">
                <strong className="block min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900">
                  {restaurant.name}
                </strong>
              </div>
              <span className="text-xs text-zinc-500">
                {restaurant.area} · {restaurant.cuisine} · {restaurant.price_level}
              </span>
              {restaurant.mood_tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {restaurant.mood_tags.slice(0, 4).map((tag) => (
                    <Tag key={tag}>#{tag}</Tag>
                  ))}
                </div>
              )}
            </button>
          </article>
        ))}

        {!restaurants.length && !hasLocationFilter && !error && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <MiniMascot className="h-14 w-14" crying />
            <span className="text-sm text-zinc-400">
              아직 저장된 맛집이 없어요.
              <br />
              카카오 장소 검색이나 직접 입력으로 첫 맛집을 저장해보세요.
            </span>
          </div>
        )}

        {hasLocationFilter && filteredRows.length === 0 && !error && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <MiniMascot className="h-14 w-14" crying />
            <span className="text-sm text-zinc-400">선택한 지역에 저장된 맛집이 없어요.</span>
          </div>
        )}
        {hasMore && filteredRows.length > 0 && (
          <Button
            className="w-full"
            variant="secondary"
            disabled={loadingMore}
            onClick={() => void loadMore()}
          >
            {loadingMore ? "불러오는 중..." : "더 보기"}
          </Button>
        )}

      </div>
      </div>
      <div className="shrink-0 border-t border-zinc-200 bg-white p-4">
        <Button className="w-full" onClick={() => navigate("/restaurants/new")}>
          맛집 작성
        </Button>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        selected
          ? "border-brand-300 bg-brand-100 text-brand-700"
          : "border-brand-200 bg-brand-50 text-brand-700 hover:border-brand-300 hover:bg-brand-100",
      )}
    >
      {label}
    </button>
  );
}

function parseLocationParts(restaurant: Restaurant) {
  if (restaurant.city || restaurant.district || restaurant.town) {
    return {
      city: restaurant.city ?? "",
      district: restaurant.district ?? "",
      town: restaurant.town ?? "",
    };
  }

  const source = restaurant.road_address || restaurant.address || restaurant.area;
  const parts = source.split(" ").filter(Boolean);
  const city = parts[0] ?? restaurant.area;

  if (city === "세종특별자치시") {
    return {
      city,
      district: "세종시",
      town: parts.find((part, index) => index > 0 && /(동|읍|면|리)$/.test(part)) ?? "",
    };
  }

  return {
    city,
    district: parts[1] ?? restaurant.area,
    town: parts.find((part, index) => index > 1 && /(동|읍|면|리)$/.test(part)) ?? "",
  };
}

function regionMatches(actual: string, selected: string) {
  if (!selected) return true;
  if (!actual) return false;
  if (actual === selected) return true;

  const normalizedActual = normalizeRegionPart(actual);
  const normalizedSelected = normalizeRegionPart(selected);
  return (
    normalizedActual === normalizedSelected ||
    normalizedActual.includes(normalizedSelected) ||
    normalizedSelected.includes(normalizedActual)
  );
}

function normalizeRegionPart(value: string) {
  return value
    .replace(/\s+/g, "")
    .replace(/제?\d+동$/, "동")
    .replace(/본동$/, "동");
}
