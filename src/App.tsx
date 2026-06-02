import { FileText, Hash, MessageSquare, Music2, Send, Sparkles, UserPlus, Video } from "lucide-react";
import { useEffect, useState } from "react";
import {
  AgentMessage,
  ClipIdea,
  ScriptPack,
  User,
  chatAgent,
  createSource,
  createUser,
  generateIdeas,
  generateScript,
  listAgentMessages,
  listUsers,
} from "./api";

const samples = [
  {
    title: "Why good ideas fail on short-form video",
    audience: "solo creators and marketers",
    platform: "YouTube Shorts",
    tone: "sharp, practical, creator-focused",
    goal: "lead generation",
    transcript: `Most creators do not have a content problem. They have a packaging problem.

The same idea can perform completely differently depending on the hook, the first visual, and the caption pacing.

If your first three seconds are slow, viewers never reach the useful part. That means the editor's job is not only to cut footage. The editor has to identify tension, curiosity, contrast, and payoff.

A strong short-form clip usually has one clear promise, one useful idea, and one reason to keep watching.`,
  },
  {
    title: "How AI changes the editing workflow",
    audience: "video editors and creator teams",
    platform: "TikTok",
    tone: "confident, useful, behind-the-scenes",
    goal: "brand awareness",
    transcript: `The fastest editors are not replacing taste with AI. They are using AI to remove the repetitive setup work.

Before editing, they summarize the transcript, mark the strongest emotional turns, and group moments by promise.

That gives the editor more time for rhythm, pacing, and the final human judgment that makes a clip feel intentional.

The workflow is simple: find the moment, write three hooks, choose one visual pattern, then cut everything that does not serve the promise.`,
  },
];

export function App() {
  const [title, setTitle] = useState(samples[0].title);
  const [audience, setAudience] = useState(samples[0].audience);
  const [platform, setPlatform] = useState(samples[0].platform);
  const [tone, setTone] = useState(samples[0].tone);
  const [goal, setGoal] = useState(samples[0].goal);
  const [transcript, setTranscript] = useState(samples[0].transcript);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<ClipIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<ClipIdea | null>(null);
  const [script, setScript] = useState<ScriptPack | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("배선영");
  const [email, setEmail] = useState("baesaa0304@naver.com");
  const [agentInput, setAgentInput] = useState("이 소재로 첫 3초 후킹을 어떻게 잡을까?");
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [agentLoading, setAgentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listUsers()
      .then((loadedUsers) => {
        setUsers(loadedUsers);
        setSelectedUserId((current) => current ?? loadedUsers[0]?.id ?? null);
      })
      .catch(() => setUsers([]));
  }, []);

  function loadSample(index: number) {
    const sample = samples[index];
    setTitle(sample.title);
    setAudience(sample.audience);
    setPlatform(sample.platform);
    setTone(sample.tone);
    setGoal(sample.goal);
    setTranscript(sample.transcript);
    setSourceId(null);
    setIdeas([]);
    setSelectedIdea(null);
    setScript(null);
    setAgentMessages([]);
    setError(null);
  }

  async function handleCreateUser() {
    setError(null);
    try {
      const user = await createUser({
        email,
        display_name: displayName,
        auth_provider: "demo",
        provider_subject: email,
      });
      setUsers((current) => [user, ...current.filter((item) => item.id !== user.id)]);
      setSelectedUserId(user.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to create user");
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const source = await createSource({ user_id: selectedUserId, title, transcript, audience, platform, tone, goal });
      setSourceId(source.id);
      setAgentMessages([]);
      const generated = await generateIdeas(source.id, title, platform, audience, goal);
      setIdeas(generated.ideas);
      setSelectedIdea(generated.ideas[0] ?? null);
      if (generated.ideas[0]) {
        setScript(await generateScript(source.id, generated.ideas[0]));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectIdea(idea: ClipIdea) {
    if (!sourceId) return;
    setSelectedIdea(idea);
    setError(null);
    try {
      setScript(await generateScript(sourceId, idea));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to generate script");
    }
  }

  async function handleAskAgent() {
    if (!sourceId || !agentInput.trim()) return;
    setAgentLoading(true);
    setError(null);
    try {
      await chatAgent(sourceId, agentInput.trim());
      const history = await listAgentMessages(sourceId);
      setAgentMessages(history.messages);
      setAgentInput("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to ask agent");
    } finally {
      setAgentLoading(false);
    }
  }

  return (
    <main className="app">
      <aside className="sidebar">
        <div className="brand">
          <Video size={24} />
          <div>
            <strong>ClipForge AI</strong>
            <span>RAG marketing agent</span>
          </div>
        </div>
        <nav>
          <a className="active">소스 입력</a>
          <a>클립 아이디어</a>
          <a>캠페인 팩</a>
          <a>RAG 에이전트</a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Vector DB 기반 RAG MVP</p>
            <h1>긴 원본 콘텐츠를 근거 있는 숏폼 마케팅 패키지로 변환합니다.</h1>
          </div>
          <button disabled={loading} onClick={handleGenerate}>
            <Sparkles size={18} />
            {loading ? "생성 중..." : "패키지 생성"}
          </button>
        </header>
        {error && <div className="error-banner">{error}</div>}

        <section className="grid">
          <article className="panel source-panel">
            <div className="panel-title">
              <FileText size={18} />
              <h2>소스 컨텍스트</h2>
            </div>

            <div className="user-box">
              <div className="panel-title">
                <UserPlus size={18} />
                <h2>사용자</h2>
              </div>
              <div className="row">
                <label>
                  이름
                  <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
                </label>
                <label>
                  이메일
                  <input value={email} onChange={(event) => setEmail(event.target.value)} />
                </label>
              </div>
              <div className="user-actions">
                <select
                  value={selectedUserId ?? ""}
                  onChange={(event) => setSelectedUserId(event.target.value || null)}
                >
                  <option value="">사용자 없이 진행</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.display_name} ({user.email})
                    </option>
                  ))}
                </select>
                <button type="button" onClick={handleCreateUser}>
                  <UserPlus size={16} />
                  생성
                </button>
              </div>
            </div>

            <div className="sample-row">
              {samples.map((sample, index) => (
                <button key={sample.title} type="button" onClick={() => loadSample(index)}>
                  Sample {index + 1}
                </button>
              ))}
            </div>
            <label>
              제목
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <div className="row">
              <label>
                플랫폼
                <input value={platform} onChange={(event) => setPlatform(event.target.value)} />
              </label>
              <label>
                고객 대상
                <input value={audience} onChange={(event) => setAudience(event.target.value)} />
              </label>
            </div>
            <label>
              목표
              <input value={goal} onChange={(event) => setGoal(event.target.value)} />
            </label>
            <label>
              톤
              <input value={tone} onChange={(event) => setTone(event.target.value)} />
            </label>
            <label>
              원본 텍스트
              <textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} />
            </label>
          </article>

          <article className="panel ideas-panel">
            <div className="panel-title">
              <Sparkles size={18} />
              <h2>클립 아이디어</h2>
            </div>
            <div className="idea-list">
              {ideas.map((idea) => (
                <button
                  className={selectedIdea?.id === idea.id ? "idea-card selected" : "idea-card"}
                  key={idea.id}
                  onClick={() => handleSelectIdea(idea)}
                >
                  <strong>{idea.title}</strong>
                  <span>{idea.hook}</span>
                  <small>
                    {idea.duration_seconds}s · Hook score {idea.hook_score}
                  </small>
                </button>
              ))}
              {!ideas.length && <p className="empty">패키지를 생성하면 RAG 기반 클립 아이디어가 표시됩니다.</p>}
            </div>
          </article>

          <article className="panel script-panel">
            <div className="panel-title">
              <Hash size={18} />
              <h2>캠페인 팩</h2>
            </div>
            {script ? (
              <div className="script-content">
                <h3>{script.hook}</h3>
                <Section title="장면 구성" items={script.scene_plan} />
                <Section title="자막" items={script.captions} />
                <Section title="B-roll" items={script.b_roll} />
                <div className="audio-block">
                  <div className="panel-title">
                    <Music2 size={18} />
                    <h2>보이스 & 오디오 방향</h2>
                  </div>
                  <Section title="음악/SFX" items={script.audio_direction} />
                  <Section title="라이선스 체크" items={script.license_checklist} />
                </div>
                <div className="tags">
                  {script.hashtags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="empty">클립 아이디어를 선택하면 캠페인 팩이 생성됩니다.</p>
            )}
          </article>

          <article className="panel agent-panel">
            <div className="panel-title">
              <MessageSquare size={18} />
              <h2>RAG 에이전트</h2>
            </div>
            <div className="chat-log">
              {agentMessages.map((message) => (
                <div className={`chat-message ${message.role}`} key={message.id}>
                  <strong>{message.role === "user" ? "나" : "AI"}</strong>
                  <p>{message.content}</p>
                  {message.retrieved_context.length > 0 && <small>근거 {message.retrieved_context.length}개 사용</small>}
                </div>
              ))}
              {!agentMessages.length && (
                <p className="empty">소스를 생성한 뒤 RAG 에이전트에게 후킹, 타깃, 카피 방향을 물어볼 수 있습니다.</p>
              )}
            </div>
            <div className="chat-input">
              <input
                value={agentInput}
                onChange={(event) => setAgentInput(event.target.value)}
                disabled={!sourceId || agentLoading}
              />
              <button type="button" disabled={!sourceId || agentLoading} onClick={handleAskAgent}>
                <Send size={16} />
              </button>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="section">
      <h4>{title}</h4>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
