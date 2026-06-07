import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Leaf, Search, Store } from "lucide-react";
import {
  addRestaurantNote,
  createRestaurant,
  listRestaurants,
  searchKakaoPlaces,
  type KakaoPlace,
  type Restaurant,
} from "../api";
import { useAuth } from "../auth/AuthContext";
import { Button, Field, TextArea, TextInput } from "../components/ui";
import { cn, extractArea, extractCuisine, splitCsv } from "../lib/utils";
import { SAMPLES } from "./restaurantSamples";

/**
 * 맛집 작성 화면 (목록과 분리).
 *   /restaurants/new   → 새 맛집 등록
 *   /restaurants/:id   → 기존 맛집에 방문 메모 추가
 */
export function RestaurantFormPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const editing = Boolean(id);

  // 메모 추가 모드일 때 대상 맛집 (목록에서 넘겨받거나 직접 진입 시 조회)
  const [target, setTarget] = useState<Restaurant | null>(
    (location.state as { restaurant?: Restaurant } | null)?.restaurant ?? null,
  );

  // 폼 상태
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [priceLevel, setPriceLevel] = useState("보통");
  const [signatureMenus, setSignatureMenus] = useState("");
  const [moodTags, setMoodTags] = useState("");
  const [note, setNote] = useState("");

  // 카카오 검색
  const [kakaoQuery, setKakaoQuery] = useState("");
  const [kakaoPlaces, setKakaoPlaces] = useState<KakaoPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<KakaoPlace | null>(null);

  const [saving, setSaving] = useState(false);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 직접 URL 진입 등으로 대상 정보가 없으면 목록에서 찾아온다.
  useEffect(() => {
    if (!editing || target || !token) return;
    listRestaurants(token)
      .then((list) => setTarget(list.find((r) => r.id === id) ?? null))
      .catch(() => {});
  }, [editing, target, token, id]);

  function loadSample(index: number) {
    const s = SAMPLES[index];
    setName(s.name);
    setArea(s.area);
    setCuisine(s.cuisine);
    setPriceLevel(s.price_level);
    setSignatureMenus(s.signature_menus.join(","));
    setMoodTags(s.mood_tags.join(","));
    setNote(s.note);
  }

  function selectPlace(place: KakaoPlace) {
    setSelectedPlace(place);
    setName(place.place_name);
    setArea(extractArea(place.address_name || place.road_address_name));
    setCuisine(extractCuisine(place.category_name));
    setNote((cur) =>
      cur.trim()
        ? cur
        : `${place.place_name}은 ${place.category_name || "음식점"} 카테고리의 장소입니다. 주소는 ${place.road_address_name || place.address_name}입니다.`,
    );
  }

  async function handleSearchKakao() {
    if (!kakaoQuery.trim()) return;
    setPlaceLoading(true);
    setError(null);
    try {
      const res = await searchKakaoPlaces(kakaoQuery.trim(), 5);
      setKakaoPlaces(res.places);
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
        await addRestaurantNote(id, { content: note, tags: splitCsv(moodTags) }, token);
      } else {
        await createRestaurant(
          {
            name,
            area,
            cuisine,
            price_level: priceLevel,
            mood_tags: splitCsv(moodTags),
            signature_menus: splitCsv(signatureMenus),
            note,
            kakao_place_id: selectedPlace?.id ?? null,
            kakao_place_url: selectedPlace?.place_url ?? "https://map.kakao.com",
            address: selectedPlace?.address_name ?? null,
            road_address: selectedPlace?.road_address_name ?? null,
            phone: selectedPlace?.phone ?? null,
            latitude: selectedPlace ? Number(selectedPlace.y) : null,
            longitude: selectedPlace ? Number(selectedPlace.x) : null,
          },
          token,
        );
      }
      navigate("/restaurants");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "맛집 저장에 실패했습니다.");
      setSaving(false);
    }
  }

  return (
    <div className="tf-scroll h-full overflow-y-auto">
      <div className="flex flex-col gap-4 p-4">
        {/* 뒤로 + 제목 */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/restaurants")} aria-label="목록으로">
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              {editing ? "방문 메모 추가" : "새 맛집 작성"}
            </h2>
            <p className="text-[11px] text-zinc-400">
              {editing
                ? target
                  ? `${target.name} · ${target.area} · ${target.cuisine}`
                  : "선택한 맛집에 메모를 남겨요"
                : "카카오 장소를 찾고 메모를 적어보세요"}
            </p>
          </div>
        </div>

        {!editing && (
          <>
            {/* 카카오 검색 */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-3">
              <div className="flex items-end gap-2">
                <Field label="카카오 장소 검색" className="flex-1">
                  <TextInput
                    value={kakaoQuery}
                    onChange={(e) => setKakaoQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
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
              {kakaoPlaces.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {kakaoPlaces.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectPlace(p)}
                      className={cn(
                        "block w-full rounded-xl border p-2.5 text-left transition-colors",
                        selectedPlace?.id === p.id
                          ? "border-brand-300 bg-brand-50"
                          : "border-zinc-200 bg-white hover:bg-zinc-50",
                      )}
                    >
                      <strong className="block text-sm text-zinc-900">{p.place_name}</strong>
                      <span className="text-[11px] text-zinc-500">{p.category_name}</span>
                      <small className="block text-[11px] text-zinc-400">
                        {p.road_address_name || p.address_name}
                      </small>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {SAMPLES.map((s, i) => (
                <Button key={s.name} variant="secondary" size="sm" onClick={() => loadSample(i)}>
                  <Leaf size={12} />
                  샘플 {i + 1}
                </Button>
              ))}
            </div>

            <Field label="식당명">
              <TextInput value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="지역">
                <TextInput value={area} onChange={(e) => setArea(e.target.value)} />
              </Field>
              <Field label="음식 종류">
                <TextInput value={cuisine} onChange={(e) => setCuisine(e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="가격대">
                <TextInput value={priceLevel} onChange={(e) => setPriceLevel(e.target.value)} />
              </Field>
              <Field label="대표 메뉴 (쉼표)">
                <TextInput value={signatureMenus} onChange={(e) => setSignatureMenus(e.target.value)} />
              </Field>
            </div>
          </>
        )}

        <Field label="분위기 / 상황 태그 (쉼표)">
          <TextInput value={moodTags} onChange={(e) => setMoodTags(e.target.value)} />
        </Field>
        <Field label="방문 메모 / 리뷰">
          <TextArea
            rows={5}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="조명, 좌석 간격, 분위기, 메뉴 추천 등 자세히 적을수록 좋아요"
          />
        </Field>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </div>
        )}

        <Button
          className="w-full"
          disabled={saving || (!editing && !name.trim()) || (editing && !note.trim())}
          onClick={handleSave}
        >
          <Store size={16} />
          {saving ? "저장 중..." : editing ? "메모 추가" : "맛집 저장"}
        </Button>
      </div>
    </div>
  );
}
