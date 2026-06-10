import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Search, X } from "lucide-react";
import {
  createRestaurant,
  getRestaurant,
  searchKakaoPlaces,
  updateRestaurant,
  type KakaoPlace,
  type Restaurant,
} from "../api";
import { useAuth } from "../auth/AuthContext";
import { Button, Field, TextArea, TextInput } from "../components/ui";
import { CITY_OPTIONS, DISTRICT_OPTIONS_BY_CITY } from "../data/koreaRegions";
import { cn, extractArea, extractCuisine } from "../lib/utils";

const PRICE_OPTIONS = ["1만원 이하", "1~2만원", "2~3만원", "3~5만원", "5만원 이상"];
const RATING_OPTIONS = ["인생맛집", "맛남", "쏘쏘"] as const;
const TAG_EXAMPLES = ["조용한", "혼밥", "재방문"];

export function RestaurantFormPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const editing = Boolean(id);
  const locationState = location.state as
    | {
        restaurant?: Restaurant;
        mapLocation?: { latitude: number; longitude: number };
        selectedPlace?: KakaoPlace;
      }
    | null;
  const mapLocation = locationState?.mapLocation;
  const initialSelectedPlace = locationState?.selectedPlace ?? null;

  const [target, setTarget] = useState<Restaurant | null>(locationState?.restaurant ?? null);

  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [regionCity, setRegionCity] = useState("");
  const [regionDistrict, setRegionDistrict] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [priceLevel, setPriceLevel] = useState(PRICE_OPTIONS[1]);
  const [ratingLevel, setRatingLevel] = useState<(typeof RATING_OPTIONS)[number]>("맛남");
  const [moodTags, setMoodTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [note, setNote] = useState("");

  const [kakaoQuery, setKakaoQuery] = useState("");
  const [kakaoPlaces, setKakaoPlaces] = useState<KakaoPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<KakaoPlace | null>(initialSelectedPlace);
  const [manualEntry, setManualEntry] = useState(editing || Boolean(mapLocation));

  const [saving, setSaving] = useState(false);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing || !token || !id) return;
    if (target) {
      hydrateFromRestaurant(target);
      return;
    }
    getRestaurant(id, token)
      .then((loaded) => {
        setTarget(loaded);
        hydrateFromRestaurant(loaded);
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "맛집 정보를 불러오지 못했습니다.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, token, id, target]);

  useEffect(() => {
    if (editing || !initialSelectedPlace) return;
    hydrateFromPlace(initialSelectedPlace);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, initialSelectedPlace]);

  function hydrateFromRestaurant(restaurant: Restaurant) {
    const region = parseRegionParts(restaurant.road_address || restaurant.address || restaurant.area);
    setName(restaurant.name);
    setRegionCity(region.city);
    setRegionDistrict(region.district);
    setArea(region.area || restaurant.area);
    setCuisine(restaurant.cuisine);
    setPriceLevel(restaurant.price_level);
    setRatingLevel(normalizeRatingLevel(restaurant.rating_level));
    setMoodTags(restaurant.mood_tags);
    setManualEntry(true);
  }

  function selectPlace(place: KakaoPlace) {
    setSelectedPlace(place);
    setManualEntry(false);
    hydrateFromPlace(place);
    setKakaoPlaces([]);
    setKakaoQuery("");
  }

  function hydrateFromPlace(place: KakaoPlace) {
    const region = parseRegionParts(place.road_address_name || place.address_name);
    setName(place.place_name);
    setRegionCity(region.city);
    setRegionDistrict(region.district);
    setArea(region.area || extractArea(place.address_name || place.road_address_name));
    setCuisine(extractCuisine(place.category_name));
    setRatingLevel("맛남");
    setNote((current) =>
      current.trim()
        ? current
        : `${place.place_name}에 다녀온 느낌, 분위기, 맛, 재방문 의사를 적어주세요.`,
    );
  }

  function startManualEntry() {
    setManualEntry(true);
    setSelectedPlace(null);
    setKakaoPlaces([]);
    setKakaoQuery("");
    setName("");
    setArea("");
    setRegionCity("");
    setRegionDistrict("");
    setCuisine("");
    setRatingLevel("맛남");
  }

  function changePlace() {
    setSelectedPlace(null);
    setManualEntry(false);
    setName("");
    setArea("");
    setRegionCity("");
    setRegionDistrict("");
    setCuisine("");
    setRatingLevel("맛남");
  }

  function updateRegion(nextCity: string, nextDistrict = "") {
    setRegionCity(nextCity);
    setRegionDistrict(nextDistrict);
    setArea(buildRegionArea(nextCity, nextDistrict));
  }

  function addMoodTag(rawValue = tagInput) {
    const normalized = rawValue.trim().replace(/^#+/, "");
    if (!normalized) return;
    setMoodTags((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
    setTagInput("");
  }

  function removeMoodTag(tag: string) {
    setMoodTags((prev) => prev.filter((item) => item !== tag));
  }

  async function handleSearchKakao() {
    if (!kakaoQuery.trim()) return;
    setPlaceLoading(true);
    setError(null);
    try {
      const result = await searchKakaoPlaces(kakaoQuery.trim(), 5);
      setKakaoPlaces(result.places);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "카카오 장소 검색에 실패했습니다.");
      setKakaoPlaces([]);
    } finally {
      setPlaceLoading(false);
    }
  }

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      if (editing && id) {
        const updated = await updateRestaurant(
          id,
          {
            name,
            area,
            city: regionCity || null,
            district: regionDistrict || null,
            town: null,
            cuisine,
            price_level: priceLevel,
            mood_tags: moodTags,
            kakao_place_id: target?.kakao_place_id ?? null,
            kakao_place_url: target?.kakao_place_url ?? null,
            address: target?.address ?? null,
            road_address: target?.road_address ?? null,
            phone: target?.phone ?? null,
            latitude: target?.latitude ?? null,
            longitude: target?.longitude ?? null,
            rating_level: ratingLevel,
          },
          token,
        );
        navigate(`/restaurants/${updated.id}`, { state: { restaurant: updated } });
      } else {
        const created = await createRestaurant(
          {
            name,
            area,
            city: regionCity || null,
            district: regionDistrict || null,
            town: null,
            cuisine,
            price_level: priceLevel,
            mood_tags: moodTags,
            signature_menus: [],
            note,
            kakao_place_id: selectedPlace?.id ?? null,
            kakao_place_url: selectedPlace?.place_url ?? null,
            address: selectedPlace?.address_name ?? null,
            road_address: selectedPlace?.road_address_name ?? null,
            phone: selectedPlace?.phone ?? null,
            latitude: selectedPlace ? Number(selectedPlace.y) : mapLocation?.latitude ?? null,
            longitude: selectedPlace ? Number(selectedPlace.x) : mapLocation?.longitude ?? null,
            rating_level: ratingLevel,
          },
          token,
        );
        navigate(`/restaurants/${created.id}`, { state: { restaurant: created } });
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "맛집 저장에 실패했습니다.");
      setSaving(false);
    }
  }

  const canSave = editing ? name.trim() && area.trim() && cuisine.trim() : name.trim() && note.trim();

  return (
    <div className="tf-scroll h-full overflow-y-auto">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(editing && id ? `/restaurants/${id}` : "/restaurants")}
            aria-label="뒤로"
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              {editing ? "맛집 수정" : "새 맛집 작성"}
            </h2>
            <p className="text-[11px] text-zinc-400">
              {editing
                ? "식당명, 지역, 음식 종류, 가격대, 분위기 태그를 수정해요."
                : "장소를 선택하거나 직접 입력한 뒤 가격대, 태그, 기록을 채워요."}
            </p>
          </div>
        </div>

        {!editing && (
          <>
            {selectedPlace ? (
              <div className="rounded-2xl border border-brand-300 bg-brand-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-leaf-600">선택한 장소</span>
                    <strong className="mt-1 block truncate text-sm text-zinc-900">
                      {selectedPlace.place_name}
                    </strong>
                    <span className="text-[11px] text-zinc-500">{selectedPlace.category_name}</span>
                    <small className="block truncate text-[11px] text-zinc-400">
                      {selectedPlace.road_address_name || selectedPlace.address_name}
                    </small>
                  </div>
                  <Button variant="secondary" size="sm" onClick={changePlace}>
                    장소 변경
                  </Button>
                </div>
              </div>
            ) : manualEntry ? (
              <ManualFields
                name={name}
                area={area}
                regionCity={regionCity}
                regionDistrict={regionDistrict}
                cuisine={cuisine}
                onNameChange={setName}
                onAreaChange={setArea}
                onRegionChange={updateRegion}
                onCuisineChange={setCuisine}
                onBack={changePlace}
                showBack
              />
            ) : (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-3">
                <div className="flex items-end gap-2">
                  <Field label="카카오 장소 검색" className="flex-1">
                    <TextInput
                      value={kakaoQuery}
                      onChange={(event) => setKakaoQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleSearchKakao();
                        }
                      }}
                      placeholder="예: 성수 파스타"
                    />
                  </Field>
                  <Button variant="secondary" disabled={placeLoading} onClick={handleSearchKakao}>
                    <Search size={15} />
                    {placeLoading ? "검색 중" : "검색"}
                  </Button>
                </div>
                <Button className="mt-2 w-full" variant="ghost" size="sm" onClick={startManualEntry}>
                  검색에 없으면 직접 입력
                </Button>
                {kakaoPlaces.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {kakaoPlaces.map((place) => (
                      <button
                        key={place.id}
                        type="button"
                        onClick={() => selectPlace(place)}
                        className="block w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-left transition-colors hover:bg-zinc-50"
                      >
                        <strong className="block text-sm text-zinc-900">{place.place_name}</strong>
                        <span className="text-[11px] text-zinc-500">{place.category_name}</span>
                        <small className="block text-[11px] text-zinc-400">
                          {place.road_address_name || place.address_name}
                        </small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {editing && (
          <ManualFields
            name={name}
            area={area}
            regionCity={regionCity}
            regionDistrict={regionDistrict}
            cuisine={cuisine}
            onNameChange={setName}
            onAreaChange={setArea}
            onRegionChange={updateRegion}
            onCuisineChange={setCuisine}
            onBack={() => undefined}
          />
        )}

        <Field label="가격대">
          <ChipRow>
            {PRICE_OPTIONS.map((option) => (
              <ChoiceChip
                key={option}
                label={option}
                selected={priceLevel === option}
                onClick={() => setPriceLevel(option)}
              />
            ))}
          </ChipRow>
        </Field>

        <Field label="내 평가">
          <ChipRow>
            {RATING_OPTIONS.map((option) => (
              <ChoiceChip
                key={option}
                label={option}
                selected={ratingLevel === option}
                onClick={() => setRatingLevel(option)}
              />
            ))}
          </ChipRow>
        </Field>

        <Field label="분위기 태그">
          <div className="flex items-center gap-2">
            <TextInput
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addMoodTag();
                }
              }}
              placeholder="예: #조용한"
            />
            <Button variant="secondary" size="icon" onClick={() => addMoodTag()} aria-label="태그 추가">
              <Plus size={16} />
            </Button>
          </div>
          <ChipRow>
            {TAG_EXAMPLES.map((tag) => (
              <ChoiceChip
                key={tag}
                label={`#${tag}`}
                selected={moodTags.includes(tag)}
                onClick={() => addMoodTag(tag)}
              />
            ))}
          </ChipRow>
          {moodTags.length > 0 && (
            <ChipRow>
              {moodTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => removeMoodTag(tag)}
                  className="inline-flex items-center gap-1 rounded-full border border-brand-300 bg-brand-50 px-3 py-1.5 text-xs font-medium text-leaf-600"
                >
                  #{tag}
                  <X size={12} />
                </button>
              ))}
            </ChipRow>
          )}
        </Field>

        {!editing && (
          <Field label="저장 기록">
            <TextArea
              rows={5}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="분위기, 좌석 간격, 맛, 재방문 의사처럼 나중에 추천 근거가 될 내용을 적어주세요."
            />
          </Field>
        )}

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </div>
        )}

        <Button className="w-full" disabled={saving || !canSave} onClick={handleSave}>
          {saving ? "저장 중..." : editing ? "저장" : "맛집 저장"}
        </Button>
      </div>
    </div>
  );
}

function ManualFields({
  name,
  area,
  regionCity,
  regionDistrict,
  cuisine,
  onNameChange,
  onAreaChange,
  onRegionChange,
  onCuisineChange,
  onBack,
  showBack = false,
}: {
  name: string;
  area: string;
  regionCity: string;
  regionDistrict: string;
  cuisine: string;
  onNameChange: (value: string) => void;
  onAreaChange: (value: string) => void;
  onRegionChange: (city: string, district?: string) => void;
  onCuisineChange: (value: string) => void;
  onBack: () => void;
  showBack?: boolean;
}) {
  const districtOptions = useMemo(
    () => (regionCity ? DISTRICT_OPTIONS_BY_CITY[regionCity] ?? [] : []),
    [regionCity],
  );

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-600">직접 입력</span>
        {showBack && (
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="카카오 검색으로 돌아가기">
            <ArrowLeft size={16} />
          </Button>
        )}
      </div>
      <div className="space-y-3">
        <Field label="식당명">
          <TextInput value={name} onChange={(event) => onNameChange(event.target.value)} />
        </Field>
        <Field label="지역 선택">
          <div className="grid grid-cols-2 gap-2">
            <RegionSelect
              ariaLabel="시 선택"
              placeholder="시"
              options={CITY_OPTIONS}
              value={regionCity}
              onChange={(value) => onRegionChange(value)}
            />
            <RegionSelect
              ariaLabel="군·구 선택"
              placeholder="군·구"
              options={districtOptions}
              value={regionDistrict}
              disabled={!regionCity || districtOptions.length === 0}
              onChange={(value) => onRegionChange(regionCity, value)}
            />
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="저장 지역명">
            <TextInput
              value={area}
              onChange={(event) => onAreaChange(event.target.value)}
              placeholder="예: 서울특별시 성동구 성수동1가"
            />
          </Field>
          <Field label="음식 종류">
            <TextInput value={cuisine} onChange={(event) => onCuisineChange(event.target.value)} />
          </Field>
        </div>
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
    <select
      aria-label={ariaLabel}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "min-w-0 rounded-xl border border-zinc-200 bg-white px-2 py-2 text-xs font-medium outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-200 disabled:bg-zinc-50 disabled:text-zinc-300",
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
  );
}

function ChipRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

function ChoiceChip({
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
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        selected
          ? "border-brand-300 bg-brand-50 text-leaf-600"
          : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50",
      )}
    >
      {label}
    </button>
  );
}

function parseRegionParts(source: string) {
  const parts = source.split(" ").filter(Boolean);
  const city = normalizeCity(parts[0] ?? "");
  const district = parts[1] ?? "";
  return {
    city,
    district,
    area: buildRegionArea(city, district),
  };
}

function normalizeRatingLevel(value: string | null | undefined): (typeof RATING_OPTIONS)[number] {
  if (value === "상" || value === "진짜 맛집") return "인생맛집";
  if (value === "중" || value === "맛있음") return "맛남";
  if (value === "하" || value === "보통") return "쏘쏘";
  return RATING_OPTIONS.includes(value as (typeof RATING_OPTIONS)[number])
    ? (value as (typeof RATING_OPTIONS)[number])
    : "맛남";
}

function normalizeCity(value: string) {
  const aliases: Record<string, string> = {
    강원: "강원특별자치도",
    경기: "경기도",
    경남: "경상남도",
    경북: "경상북도",
    광주: "광주광역시",
    대구: "대구광역시",
    대전: "대전광역시",
    부산: "부산광역시",
    서울: "서울특별시",
    세종: "세종특별자치시",
    울산: "울산광역시",
    인천: "인천광역시",
    전남: "전라남도",
    전북: "전북특별자치도",
    제주: "제주특별자치도",
    충남: "충청남도",
    충북: "충청북도",
  };
  return aliases[value] ?? value;
}

function buildRegionArea(city: string, district = "") {
  return [city, district].filter(Boolean).join(" ");
}
