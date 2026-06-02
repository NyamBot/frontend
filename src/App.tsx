import { MapPin, MessageSquare, Plus, RefreshCw, Search, Sparkles, Store, Utensils } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Restaurant,
  RestaurantRecommendation,
  TasteAgentMessage,
  chatTasteAgent,
  createRestaurant,
  listRestaurants,
  listTasteAgentMessages,
} from "./api";

const sampleRestaurants = [
  {
    name: "온기식당",
    area: "성수",
    cuisine: "일식",
    price_level: "보통",
    mood_tags: ["조용함", "데이트", "대화하기 좋음"],
    signature_menus: ["사시미 플레이트", "사케"],
    note: "조명이 은은하고 테이블 간격이 넓어서 조용히 대화하기 좋았다. 소개팅이나 데이트에 잘 맞고, 주말 저녁에는 약간 웨이팅이 있었다.",
    kakao_place_url: "https://map.kakao.com",
  },
  {
    name: "성수면옥",
    area: "성수",
    cuisine: "한식",
    price_level: "저렴",
    mood_tags: ["혼밥", "점심", "회전율 빠름"],
    signature_menus: ["냉면", "만두"],
    note: "점심 혼밥하기 편하고 회전율이 빠르다. 분위기는 캐주얼해서 조용한 데이트보다는 빠른 식사에 더 잘 맞는다.",
    kakao_place_url: "https://map.kakao.com",
  },
];

export function App() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [messages, setMessages] = useState<TasteAgentMessage[]>([]);
  const [recommendations, setRecommendations] = useState<RestaurantRecommendation[]>([]);
  const [query, setQuery] = useState("성수에서 조용한 데이트 맛집 알려줘");
  const [area, setArea] = useState("성수");
  const [cuisine, setCuisine] = useState("");
  const [tags, setTags] = useState("조용함,데이트");
  const [name, setName] = useState(sampleRestaurants[0].name);
  const [restaurantArea, setRestaurantArea] = useState(sampleRestaurants[0].area);
  const [restaurantCuisine, setRestaurantCuisine] = useState(sampleRestaurants[0].cuisine);
  const [priceLevel, setPriceLevel] = useState(sampleRestaurants[0].price_level);
  const [moodTags, setMoodTags] = useState(sampleRestaurants[0].mood_tags.join(","));
  const [signatureMenus, setSignatureMenus] = useState(sampleRestaurants[0].signature_menus.join(","));
  const [note, setNote] = useState(sampleRestaurants[0].note);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    try {
      const [restaurantList, messageList] = await Promise.all([
        listRestaurants(),
        listTasteAgentMessages(),
      ]);
      setRestaurants(restaurantList);
      setMessages(messageList.messages);
    } catch {
      setRestaurants([]);
      setMessages([]);
    }
  }

  function loadSample(index: number) {
    const sample = sampleRestaurants[index];
    setName(sample.name);
    setRestaurantArea(sample.area);
    setRestaurantCuisine(sample.cuisine);
    setPriceLevel(sample.price_level);
    setMoodTags(sample.mood_tags.join(","));
    setSignatureMenus(sample.signature_menus.join(","));
    setNote(sample.note);
  }

  async function handleSaveRestaurant() {
    setSaving(true);
    setError(null);
    try {
      await createRestaurant({
        name,
        area: restaurantArea,
        cuisine: restaurantCuisine,
        price_level: priceLevel,
        mood_tags: splitCsv(moodTags),
        signature_menus: splitCsv(signatureMenus),
        note,
        kakao_place_url: "https://map.kakao.com",
      });
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "맛집 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAsk() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await chatTasteAgent({
        query,
        message: query,
        area: area || null,
        cuisine: cuisine || null,
        tags: splitCsv(tags),
        limit: 3,
      });
      setRecommendations(response.recommendations);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "맛집 추천에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app taste-app">
      <aside className="sidebar">
        <div className="brand">
          <Utensils size={24} />
          <div>
            <strong>TasteForge AI</strong>
            <span>Hybrid RAG dining agent</span>
          </div>
        </div>
        <nav>
          <a className="active">맛집 채팅</a>
          <a>맛집 등록</a>
          <a>추천 결과</a>
          <a>저장된 메모</a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Vector DB + RAG + Hybrid Search</p>
            <h1>채팅으로 물어보면 저장된 맛집 메모를 근거로 추천합니다.</h1>
          </div>
          <button disabled={loading} onClick={handleAsk}>
            <Sparkles size={18} />
            {loading ? "추천 중..." : "맛집 추천"}
          </button>
        </header>
        {error && <div className="error-banner">{error}</div>}

        <section className="taste-grid">
          <article className="panel chat-panel">
            <div className="panel-title">
              <MessageSquare size={18} />
              <h2>맛집 추천 채팅</h2>
            </div>
            <label>
              질문
              <textarea className="question-box" value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
            <div className="row">
              <label>
                지역 필터
                <input value={area} onChange={(event) => setArea(event.target.value)} />
              </label>
              <label>
                음식 종류
                <input value={cuisine} onChange={(event) => setCuisine(event.target.value)} placeholder="비워도 됨" />
              </label>
            </div>
            <label>
              분위기/상황 태그
              <input value={tags} onChange={(event) => setTags(event.target.value)} />
            </label>
            <button className="wide-button" disabled={loading} onClick={handleAsk}>
              <Search size={18} />
              {loading ? "저장된 메모 검색 중..." : "하이브리드 RAG 추천 받기"}
            </button>
          </article>

          <article className="panel register-panel">
            <div className="panel-title">
              <Plus size={18} />
              <h2>맛집 데이터 등록</h2>
            </div>
            <div className="sample-row">
              {sampleRestaurants.map((sample, index) => (
                <button key={sample.name} type="button" onClick={() => loadSample(index)}>
                  샘플 {index + 1}
                </button>
              ))}
            </div>
            <label>
              식당명
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <div className="row">
              <label>
                지역
                <input value={restaurantArea} onChange={(event) => setRestaurantArea(event.target.value)} />
              </label>
              <label>
                음식 종류
                <input value={restaurantCuisine} onChange={(event) => setRestaurantCuisine(event.target.value)} />
              </label>
            </div>
            <label>
              가격대
              <input value={priceLevel} onChange={(event) => setPriceLevel(event.target.value)} />
            </label>
            <label>
              태그
              <input value={moodTags} onChange={(event) => setMoodTags(event.target.value)} />
            </label>
            <label>
              대표 메뉴
              <input value={signatureMenus} onChange={(event) => setSignatureMenus(event.target.value)} />
            </label>
            <label>
              방문 메모/리뷰
              <textarea value={note} onChange={(event) => setNote(event.target.value)} />
            </label>
            <button className="wide-button" disabled={saving} onClick={handleSaveRestaurant}>
              <Store size={18} />
              {saving ? "저장 중..." : "맛집 메모 저장"}
            </button>
          </article>

          <article className="panel result-panel">
            <div className="panel-title">
              <Sparkles size={18} />
              <h2>추천 결과</h2>
            </div>
            <div className="recommendation-list">
              {recommendations.map((recommendation) => (
                <section className="recommendation-card" key={recommendation.restaurant.id}>
                  <div>
                    <strong>{recommendation.restaurant.name}</strong>
                    <span>{recommendation.restaurant.area} · {recommendation.restaurant.cuisine} · {recommendation.restaurant.price_level}</span>
                  </div>
                  <p>{recommendation.reason}</p>
                  {recommendation.evidence.map((item) => (
                    <blockquote key={item}>{item}</blockquote>
                  ))}
                  <small>{recommendation.menu_tip}</small>
                  {recommendation.restaurant.kakao_place_url && (
                    <a href={recommendation.restaurant.kakao_place_url} target="_blank" rel="noreferrer">
                      카카오 지도 열기
                    </a>
                  )}
                </section>
              ))}
              {!recommendations.length && <p className="empty">맛집 메모를 저장한 뒤 질문하면 추천 카드가 표시됩니다.</p>}
            </div>
          </article>

          <article className="panel saved-panel">
            <div className="panel-title">
              <MapPin size={18} />
              <h2>저장된 맛집</h2>
              <button className="icon-button" type="button" onClick={refresh}>
                <RefreshCw size={16} />
              </button>
            </div>
            <div className="source-list">
              {restaurants.map((restaurant) => (
                <section className="source-card" key={restaurant.id}>
                  <strong>{restaurant.name}</strong>
                  <span>{restaurant.area} · {restaurant.cuisine}</span>
                  <small>{restaurant.mood_tags.join(", ")} · 메모 {restaurant.note_count}개</small>
                </section>
              ))}
              {!restaurants.length && <p className="empty">아직 저장된 맛집이 없습니다.</p>}
            </div>
          </article>

          <article className="panel history-panel">
            <div className="panel-title">
              <MessageSquare size={18} />
              <h2>채팅 기록</h2>
            </div>
            <div className="chat-log">
              {messages.map((message) => (
                <div className={`chat-message ${message.role}`} key={message.id}>
                  <strong>{message.role === "user" ? "나" : "AI"}</strong>
                  <p>{message.content}</p>
                  {message.retrieved_context.length > 0 && <small>근거 {message.retrieved_context.length}개 사용</small>}
                </div>
              ))}
              {!messages.length && <p className="empty">추천 질문을 하면 대화 기록이 저장됩니다.</p>}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}

function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
