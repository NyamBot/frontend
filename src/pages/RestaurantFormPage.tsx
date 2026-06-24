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
import { CITY_OPTIONS, DISTRICT_OPTIONS_BY_CITY, shortCityLabel } from "../data/koreaRegions";
import { cn, extractArea, extractCuisine } from "../lib/utils";

const PRICE_OPTIONS = ["1만원 이하", "1~2만원", "2~3만원", "3~5만원", "5만원 이상"];
const CUISINE_OPTIONS = ["한식", "일식", "중식", "양식", "분식", "카페", "술집", "기타"];
const REQUIRED_TAG_COUNT = 3;
const MIN_REVIEW_LENGTH = 10;

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
    setMoodTags(restaurant.mood_tags);
    if (restaurant.kakao_place_id) {
      setSelectedPlace(restaurantToPlace(restaurant));
      setManualEntry(false);
    } else {
      setSelectedPlace(null);
      setManualEntry(true);
    }
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
    setCuisine(normalizeCuisine(place.category_name));
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
  }

  function changePlace() {
    setSelectedPlace(null);
    setManualEntry(false);
    setName("");
    setArea("");
    setRegionCity("");
    setRegionDistrict("");
    setCuisine("");
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
    if (moodTags.length < REQUIRED_TAG_COUNT) {
      setError(`태그는 ${REQUIRED_TAG_COUNT}개 이상 입력해 주세요.`);
      return;
    }
    if (!editing && note.trim().length < MIN_REVIEW_LENGTH) {
      setError(`리뷰는 ${MIN_REVIEW_LENGTH}자 이상 입력해 주세요.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editing && id) {
        const placeChanged = Boolean(selectedPlace) && selectedPlace?.id !== (target?.kakao_place_id ?? "");
        const placeFields =
          placeChanged && selectedPlace
            ? {
                kakao_place_id: selectedPlace.id || null,
                kakao_place_url: selectedPlace.place_url || null,
                address: selectedPlace.address_name || null,
                road_address: selectedPlace.road_address_name || null,
                phone: selectedPlace.phone || null,
                latitude: selectedPlace.y ? Number(selectedPlace.y) : null,
                longitude: selectedPlace.x ? Number(selectedPlace.x) : null,
              }
            : {
                kakao_place_id: target?.kakao_place_id ?? null,
                kakao_place_url: target?.kakao_place_url ?? null,
                address: target?.address ?? null,
                road_address: target?.road_address ?? null,
                phone: target?.phone ?? null,
                latitude: target?.latitude ?? null,
                longitude: target?.longitude ?? null,
              };
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
            ...placeFields,
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

  const canSave = editing
    ? name.trim() && area.trim() && cuisine.trim() && moodTags.length >= REQUIRED_TAG_COUNT
    : name.trim() &&
      area.trim() &&
      cuisine.trim() &&
      moodTags.length >= REQUIRED_TAG_COUNT &&
      note.trim().length >= MIN_REVIEW_LENGTH;

  return (
    <div className="tf-scroll h-full overflow-y-auto">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-500! hover:bg-zinc-100! hover:text-zinc-700!"
            onClick={() => navigate(editing && id ? `/restaurants/${id}` : "/restaurants")}
            aria-label="뒤로"
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              {editing ? "맛집 수정" : "맛집 작성"}
            </h2>
            <p className="text-[11px] text-zinc-400">
              {editing
                ? "식당명, 지역, 음식 종류, 가격대, 태그를 수정해요."
                : "장소를 선택하거나 직접 입력한 뒤 가격대, 태그, 리뷰를 채워요."}
            </p>
          </div>
        </div>

        {selectedPlace ? (
              <div className="rounded-2xl border border-brand-300 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-brand-600">선택한 장소</span>
                    <strong className="mt-1 block truncate text-sm text-zinc-900">
                      {selectedPlace.place_name}
                    </strong>
                    <span className="text-[11px] text-zinc-500">{selectedPlace.category_name}</span>
                    <small className="block truncate text-[11px] text-zinc-400">
                      {selectedPlace.road_address_name || selectedPlace.address_name}
                    </small>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="border-zinc-300! bg-white! text-zinc-600! hover:bg-zinc-50!"
                    onClick={changePlace}
                  >
                    장소 변경
                  </Button>
                </div>
              </div>
            ) : manualEntry ? (
              <ManualFields
                name={name}
                regionCity={regionCity}
                regionDistrict={regionDistrict}
                onNameChange={setName}
                onRegionChange={updateRegion}
                onBack={changePlace}
                showBack
              />
            ) : (
              <div>
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
                  <Button
                    disabled={placeLoading}
                    onClick={handleSearchKakao}
                    aria-label="검색"
                  >
                    <Search size={15} />
                  </Button>
                </div>
                <Button
                  className="mt-2 px-0 text-zinc-500! hover:bg-transparent! hover:text-zinc-700! hover:underline"
                  variant="ghost"
                  size="sm"
                  onClick={startManualEntry}
                >
                  검색에 없으면 직접 입력
                </Button>
                {kakaoPlaces.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {kakaoPlaces.map((place) => (
                      <button
                        key={place.id}
                        type="button"
                        onClick={() => selectPlace(place)}
                        className="block w-full rounded-xl border border-brand-200 bg-white p-2.5 text-left transition-colors hover:border-brand-300 hover:bg-brand-50"
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

        <Field label="음식 종류">
          <ChipRow>
            {CUISINE_OPTIONS.map((option) => (
              <ChoiceChip
                key={option}
                label={option}
                selected={cuisine === option}
                onClick={() => setCuisine(option)}
              />
            ))}
          </ChipRow>
        </Field>

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

        <Field
          label={
            <RequiredFieldLabel
              label="태그"
              message={`필수로 취향을 잘 담을 수 있게 태그를 ${REQUIRED_TAG_COUNT}개 이상 골라주세요.`}
            />
          }
        >
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
            <Button
              variant="secondary"
              size="icon"
              className="border-zinc-300! bg-white! text-zinc-600! hover:bg-zinc-50!"
              onClick={() => addMoodTag()}
              aria-label="태그 추가"
            >
              <Plus size={16} />
            </Button>
          </div>
          {moodTags.length > 0 && (
            <ChipRow>
              {moodTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => removeMoodTag(tag)}
                  className="inline-flex items-center gap-1 rounded-full border border-brand-300 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
                >
                  #{tag}
                  <X size={12} />
                </button>
              ))}
            </ChipRow>
          )}
        </Field>

        {!editing && (
          <Field
            label={
              <RequiredFieldLabel
                label="리뷰"
                message={`필수로 추천 근거가 될 리뷰를 ${MIN_REVIEW_LENGTH}자 이상 입력해 주세요.`}
              />
            }
          >
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
          {saving ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  );
}

function RequiredFieldLabel({ label, message }: { label: string; message: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center gap-1.5">
      <span>{label}</span>
      <button
        type="button"
        className="inline-flex text-sm font-bold leading-none text-rose-500 transition hover:text-rose-600"
        aria-label={`${label} 필수 입력 안내`}
        onClick={(event) => {
          event.preventDefault();
          setOpen((current) => !current);
        }}
        onBlur={() => setOpen(false)}
      >
        *
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-rose-100 bg-white px-3 py-2 text-[11px] font-normal leading-relaxed text-zinc-600 shadow-lg"
        >
          <span className="absolute -top-1 left-3 h-2 w-2 rotate-45 border-l border-t border-rose-100 bg-white" />
          {message}
        </span>
      )}
    </span>
  );
}

function ManualFields({
  name,
  regionCity,
  regionDistrict,
  onNameChange,
  onRegionChange,
  onBack,
  showBack = false,
}: {
  name: string;
  regionCity: string;
  regionDistrict: string;
  onNameChange: (value: string) => void;
  onRegionChange: (city: string, district?: string) => void;
  onBack: () => void;
  showBack?: boolean;
}) {
  const districtOptions = useMemo(
    () => (regionCity ? DISTRICT_OPTIONS_BY_CITY[regionCity] ?? [] : []),
    [regionCity],
  );

  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50 p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-600">직접 입력</span>
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-500! hover:bg-zinc-100! hover:text-zinc-700!"
            onClick={onBack}
            aria-label="카카오 검색으로 돌아가기"
          >
            <ArrowLeft size={16} />
          </Button>
        )}
      </div>
      <div className="space-y-3">
        <Field label="식당명">
          <TextInput value={name} onChange={(event) => onNameChange(event.target.value)} />
        </Field>
        <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-3">
          <section className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-500">지역</h3>
            <ChipRow>
              {CITY_OPTIONS.map((city) => (
                <ChoiceChip
                  key={city}
                  variant="brand"
                  label={shortCityLabel(city)}
                  selected={regionCity === city}
                  onClick={() => onRegionChange(regionCity === city ? "" : city)}
                />
              ))}
            </ChipRow>
          </section>
          {regionCity && districtOptions.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-500">군·구</h3>
              <ChipRow>
                {districtOptions.map((district) => (
                  <ChoiceChip
                    key={district}
                    variant="brand"
                    label={district}
                    selected={regionDistrict === district}
                    onClick={() =>
                      onRegionChange(regionCity, regionDistrict === district ? "" : district)
                    }
                  />
                ))}
              </ChipRow>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function ChipRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

function ChoiceChip({
  label,
  selected,
  onClick,
  variant = "zinc",
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  variant?: "zinc" | "brand";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        selected
          ? "border-brand-300 bg-brand-100 text-brand-700"
          : variant === "brand"
            ? "border-brand-200 bg-brand-50 text-brand-700 hover:border-brand-300 hover:bg-brand-100"
            : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50",
      )}
    >
      {label}
    </button>
  );
}

function restaurantToPlace(restaurant: Restaurant): KakaoPlace {
  return {
    id: restaurant.kakao_place_id ?? "",
    place_name: restaurant.name,
    category_name: restaurant.cuisine,
    address_name: restaurant.address ?? restaurant.area,
    road_address_name: restaurant.road_address ?? "",
    phone: restaurant.phone ?? "",
    place_url: restaurant.kakao_place_url ?? "",
    x: restaurant.longitude != null ? String(restaurant.longitude) : "",
    y: restaurant.latitude != null ? String(restaurant.latitude) : "",
  };
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

function normalizeCuisine(category: string) {
  const normalized = category.replace(/\s+/g, "");
  if (/카페|커피|디저트|베이커리/.test(normalized)) return "카페";
  if (/술집|주점|호프|바$|이자카야/.test(normalized)) return "술집";
  const matched = CUISINE_OPTIONS.find((option) => option !== "기타" && normalized.includes(option));
  if (matched) return matched;
  const extracted = extractCuisine(category);
  return CUISINE_OPTIONS.includes(extracted) ? extracted : "기타";
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
  return [city ? shortCityLabel(city) : "", district].filter(Boolean).join(" ");
}
