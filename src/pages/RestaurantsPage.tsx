import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Plus, RotateCcw } from "lucide-react";
import { cn } from "../lib/utils";
import { listRestaurants, type Restaurant } from "../api";
import { useAuth } from "../auth/AuthContext";
import { MiniMascot } from "../components/Mascot";
import { Button, Tag, TextInput } from "../components/ui";
import { CITY_OPTIONS, DISTRICT_OPTIONS_BY_CITY } from "../data/koreaRegions";

const RATING_OPTIONS = ["상", "중", "하"] as const;

export function RestaurantsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRating, setSelectedRating] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedCity, selectedDistrict, searchQuery, selectedRating]);

  async function refresh() {
    if (!token) return;
    try {
      setRestaurants(
        await listRestaurants(token, {
          city: selectedCity,
          district: selectedDistrict,
          query: searchQuery.trim(),
          rating_level: selectedRating,
        }),
      );
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "저장된 맛집을 불러오지 못했습니다.");
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
  const cityOptions = useMemo(
    () => unique([...CITY_OPTIONS, ...locationRows.map((row) => row.location.city)]),
    [locationRows],
  );
  const districtOptions = useMemo(
    () =>
      selectedCity
        ? unique([...(DISTRICT_OPTIONS_BY_CITY[selectedCity] ?? []), ...locationRows
            .filter((row) => row.location.city === selectedCity)
            .map((row) => row.location.district)])
        : [],
    [locationRows, selectedCity],
  );
  const filteredRows = locationRows.filter((row) => {
    if (!regionMatches(row.location.city, selectedCity)) return false;
    if (!regionMatches(row.location.district, selectedDistrict)) return false;
    return true;
  });
  const hasLocationFilter = Boolean(selectedCity || selectedDistrict || searchQuery.trim() || selectedRating);

  return (
    <div className="flex h-full flex-col">
      <div className="tf-scroll flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 p-4">
        {(restaurants.length > 0 || hasLocationFilter) && (
          <section className="space-y-2 rounded-2xl border border-zinc-200 bg-white p-3">
            <TextInput
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="식당명, 지역, 음식 종류, 태그 검색"
            />
            <div className="flex flex-wrap gap-1.5">
              {RATING_OPTIONS.map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setSelectedRating((current) => (current === rating ? "" : rating))}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    selectedRating === rating
                      ? "border-brand-300 bg-brand-50 text-leaf-600"
                      : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50",
                  )}
                >
                  {rating}
                </button>
              ))}
            </div>
          </section>
        )}
        {(restaurants.length > 0 || hasLocationFilter) && (
          <section className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-3">
            <RegionSelect
              ariaLabel="시"
              placeholder="시 전체"
              options={cityOptions}
              value={selectedCity}
              onChange={(value) => {
                setSelectedCity(value);
                setSelectedDistrict("");
              }}
            />
            <RegionSelect
              ariaLabel="군·구"
              placeholder="군·구"
              options={districtOptions}
              value={selectedDistrict}
              disabled={!selectedCity || districtOptions.length === 0}
              onChange={setSelectedDistrict}
            />
            {hasLocationFilter && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCity("");
                  setSelectedDistrict("");
                  setSearchQuery("");
                  setSelectedRating("");
                }}
                aria-label="지역 필터 초기화"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
              >
                <RotateCcw size={15} />
              </button>
            )}
          </section>
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
            {restaurant.image_url && (
              <img
                src={restaurant.image_url}
                alt=""
                className="h-14 w-14 shrink-0 rounded-xl object-cover"
                loading="lazy"
              />
            )}
            <button
              type="button"
              onClick={() => navigate(`/restaurants/${restaurant.id}`, { state: { restaurant } })}
              className="min-w-0 flex-1 text-left"
            >
              <div className="flex items-center gap-2">
                <strong className="block min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900">
                  {restaurant.name}
                </strong>
                <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-leaf-600">
                  {restaurant.rating_level}
                </span>
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
            <MiniMascot className="h-14 w-14" />
            <span className="text-sm text-zinc-400">
              아직 저장된 맛집이 없어요.
              <br />
              카카오 장소 검색이나 직접 입력으로 첫 맛집을 저장해보세요.
            </span>
          </div>
        )}

        {hasLocationFilter && filteredRows.length === 0 && !error && (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-400">
            선택한 지역에 저장된 맛집이 없어요.
          </div>
        )}

      </div>
      </div>
      <div className="shrink-0 border-t border-zinc-200 bg-white p-4">
        <Button className="w-full" onClick={() => navigate("/restaurants/new")}>
          <Plus size={16} />
          새 맛집 작성
        </Button>
      </div>
    </div>
  );
}

function RegionSelect({
  ariaLabel,
  placeholder,
  options,
  value,
  onChange,
  disabled,
}: {
  ariaLabel: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <select
        aria-label={ariaLabel}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "w-full appearance-none truncate rounded-xl border border-zinc-200 bg-white py-2 pl-3 pr-7 text-xs font-medium outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-200 disabled:bg-zinc-50 disabled:text-zinc-300",
          value ? "text-zinc-800" : "text-zinc-400",
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option} className="text-zinc-800">
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className={cn(
          "pointer-events-none absolute right-2 top-1/2 -translate-y-1/2",
          disabled ? "text-zinc-300" : "text-zinc-400",
        )}
      />
    </div>
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

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right, "ko"));
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
