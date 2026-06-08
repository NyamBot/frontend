import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Plus, RefreshCw, Trash2 } from "lucide-react";
import { deleteRestaurant, listRestaurants, type Restaurant } from "../api";
import { useAuth } from "../auth/AuthContext";
import { MiniMascot } from "../components/Mascot";
import { Button, Tag } from "../components/ui";
import { CITY_OPTIONS, DISTRICT_OPTIONS_BY_CITY, TOWN_OPTIONS_BY_DISTRICT } from "../data/koreaRegions";


export function RestaurantsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedTown, setSelectedTown] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<Restaurant | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    if (!token) return;
    try {
      setRestaurants(await listRestaurants(token));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "저장된 맛집을 불러오지 못했습니다.");
    }
  }

  async function handleDelete(restaurant: Restaurant) {
    if (!token || deletingId) return;

    setDeletingId(restaurant.id);
    setError(null);
    try {
      await deleteRestaurant(restaurant.id, token);
      setRestaurants((prev) => prev.filter((item) => item.id !== restaurant.id));
      setConfirmTarget(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "맛집 삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
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
  const townOptions = useMemo(
    () => {
      if (!selectedCity) return [];

      const officialTowns = selectedDistrict
        ? TOWN_OPTIONS_BY_DISTRICT[regionKey(selectedCity, selectedDistrict)] ?? []
        : Object.entries(TOWN_OPTIONS_BY_DISTRICT)
            .filter(([key]) => key.startsWith(`${selectedCity}|`))
            .flatMap(([, towns]) => towns);
      const savedTowns = locationRows
        .filter((row) => row.location.city === selectedCity)
        .filter((row) => !selectedDistrict || row.location.district === selectedDistrict)
        .map((row) => row.location.town);

      return unique([...officialTowns, ...savedTowns]);
    },
    [locationRows, selectedCity, selectedDistrict],
  );
  const filteredRows = locationRows.filter((row) => {
    if (selectedCity && row.location.city !== selectedCity) return false;
    if (selectedDistrict && row.location.district !== selectedDistrict) return false;
    if (selectedTown && row.location.town !== selectedTown) return false;
    return true;
  });
  const hasLocationFilter = Boolean(selectedCity || selectedDistrict || selectedTown);

  return (
    <div className="tf-scroll h-full overflow-y-auto">
      <div className="flex flex-col gap-3 p-4">
        <Button className="w-full" onClick={() => navigate("/restaurants/new")}>
          <Plus size={16} />
          새 맛집 작성
        </Button>

        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-medium text-zinc-500">
            저장된 맛집 {filteredRows.length}곳
          </span>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600"
          >
            <RefreshCw size={13} />
            새로고침
          </button>
        </div>

        {restaurants.length > 0 && (
          <section className="space-y-2 rounded-2xl border border-zinc-200 bg-white p-3">
            <FilterRow
              label="시"
              options={cityOptions}
              value={selectedCity}
              onChange={(value) => {
                setSelectedCity(value);
                setSelectedDistrict("");
                setSelectedTown("");
              }}
            />
            <FilterRow
              label="군/구"
              options={districtOptions}
              value={selectedDistrict}
              onChange={(value) => {
                setSelectedDistrict(value);
                setSelectedTown("");
              }}
            />
            <FilterRow label="동" options={townOptions} value={selectedTown} onChange={setSelectedTown} />
            {hasLocationFilter && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCity("");
                  setSelectedDistrict("");
                  setSelectedTown("");
                }}
                className="text-xs font-medium text-zinc-400 hover:text-zinc-600"
              >
                필터 초기화
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
            <button
              type="button"
              onClick={() => navigate(`/restaurants/${restaurant.id}`, { state: { restaurant } })}
              className="min-w-0 flex-1 text-left"
            >
              <strong className="block text-sm font-semibold text-zinc-900">{restaurant.name}</strong>
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
            <button
              type="button"
              onClick={() => setConfirmTarget(restaurant)}
              disabled={deletingId === restaurant.id}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-300 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
              aria-label={`${restaurant.name} 삭제`}
            >
              <Trash2 size={16} />
            </button>
            <ChevronRight size={18} className="shrink-0 text-zinc-300" />
          </article>
        ))}

        {confirmTarget && (
          <div className="fixed inset-0 z-50 flex items-end bg-zinc-950/25 px-4 pb-4 sm:items-center sm:justify-center sm:p-4">
            <section className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl">
              <h2 className="text-sm font-semibold text-zinc-900">맛집을 삭제할까요?</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                {confirmTarget.name}과 저장한 기록이 함께 삭제됩니다.
              </p>
              <div className="mt-4 flex gap-2">
                <Button
                  className="flex-1"
                  variant="secondary"
                  onClick={() => setConfirmTarget(null)}
                  disabled={Boolean(deletingId)}
                >
                  취소
                </Button>
                <Button
                  className="flex-1 bg-rose-500 text-white hover:bg-rose-600"
                  onClick={() => void handleDelete(confirmTarget)}
                  disabled={Boolean(deletingId)}
                >
                  {deletingId ? "삭제 중..." : "삭제"}
                </Button>
              </div>
            </section>
          </div>
        )}

        {!restaurants.length && !error && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <MiniMascot className="h-14 w-14" />
            <span className="text-sm text-zinc-400">
              아직 저장된 맛집이 없어요.
              <br />
              카카오 장소 검색이나 직접 입력으로 첫 맛집을 저장해보세요.
            </span>
          </div>
        )}

        {restaurants.length > 0 && filteredRows.length === 0 && !error && (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-400">
            선택한 지역에 저장된 맛집이 없어요.
          </div>
        )}
      </div>
    </div>
  );
}

function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  if (!options.length) return null;

  return (
    <div className="space-y-1.5">
      <div className="text-[11px] font-semibold text-zinc-400">{label}</div>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        <LocationChip label="전체" selected={!value} onClick={() => onChange("")} />
        {options.map((option) => (
          <LocationChip key={option} label={option} selected={value === option} onClick={() => onChange(option)} />
        ))}
      </div>
    </div>
  );
}

function LocationChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        selected
          ? "border-brand-300 bg-brand-50 text-leaf-600"
          : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
      }`}
    >
      {label}
    </button>
  );
}

function parseLocationParts(restaurant: Restaurant) {
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

function regionKey(city: string, district: string) {
  return `${city}|${district}`;
}
