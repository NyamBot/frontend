import { FileText, Hash, Music2, Sparkles, Video } from "lucide-react";
import { useState } from "react";
import { ClipIdea, ScriptPack, createSource, generateIdeas, generateScript } from "./api";

const samples = [
  {
    title: "Why good ideas fail on short-form video",
    audience: "solo creators and marketers",
    platform: "YouTube Shorts",
    tone: "sharp, practical, creator-focused",
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
  const [transcript, setTranscript] = useState(samples[0].transcript);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<ClipIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<ClipIdea | null>(null);
  const [script, setScript] = useState<ScriptPack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadSample(index: number) {
    const sample = samples[index];
    setTitle(sample.title);
    setAudience(sample.audience);
    setPlatform(sample.platform);
    setTone(sample.tone);
    setTranscript(sample.transcript);
    setSourceId(null);
    setIdeas([]);
    setSelectedIdea(null);
    setScript(null);
    setError(null);
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const source = await createSource({ title, transcript, audience, platform, tone });
      setSourceId(source.id);
      const generated = await generateIdeas(source.id, title, platform);
      setIdeas(generated.ideas);
      setSelectedIdea(generated.ideas[0] ?? null);
      if (generated.ideas[0]) {
        const pack = await generateScript(source.id, generated.ideas[0]);
        setScript(pack);
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
          <a className="active">Source Context</a>
          <a>Clip Assets</a>
          <a>Campaign Pack</a>
          <a>Voice & Audio</a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Vector DB-based RAG MVP</p>
            <h1>Turn long source content into grounded short-form marketing assets.</h1>
          </div>
          <button disabled={loading} onClick={handleGenerate}>
            <Sparkles size={18} />
            {loading ? "Generating..." : "Generate assets"}
          </button>
        </header>
        {error && <div className="error-banner">{error}</div>}

        <section className="grid">
          <article className="panel source-panel">
            <div className="panel-title">
              <FileText size={18} />
              <h2>Source Context</h2>
            </div>
            <div className="sample-row">
              {samples.map((sample, index) => (
                <button key={sample.title} type="button" onClick={() => loadSample(index)}>
                  Sample {index + 1}
                </button>
              ))}
            </div>
            <label>
              Title
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <div className="row">
              <label>
                Platform
                <input value={platform} onChange={(event) => setPlatform(event.target.value)} />
              </label>
              <label>
                Audience
                <input value={audience} onChange={(event) => setAudience(event.target.value)} />
              </label>
            </div>
            <label>
              Tone
              <input value={tone} onChange={(event) => setTone(event.target.value)} />
            </label>
            <label>
              Transcript
              <textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} />
            </label>
          </article>

          <article className="panel ideas-panel">
            <div className="panel-title">
              <Sparkles size={18} />
              <h2>Clip Ideas</h2>
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
                  <small>{idea.duration_seconds}s · Hook score {idea.hook_score}</small>
                </button>
              ))}
              {!ideas.length && <p className="empty">Generate assets to see retrieval-grounded clip ideas.</p>}
            </div>
          </article>

          <article className="panel script-panel">
            <div className="panel-title">
              <Hash size={18} />
              <h2>Campaign Pack</h2>
            </div>
            {script ? (
              <div className="script-content">
                <h3>{script.hook}</h3>
                <Section title="Scene Plan" items={script.scene_plan} />
                <Section title="Captions" items={script.captions} />
                <Section title="B-roll" items={script.b_roll} />
                <div className="audio-block">
                  <div className="panel-title">
                    <Music2 size={18} />
                    <h2>Voice & Audio Direction</h2>
                  </div>
                  <Section title="Music and SFX" items={script.audio_direction} />
                  <Section title="License Checklist" items={script.license_checklist} />
                </div>
                <div className="tags">{script.hashtags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              </div>
            ) : (
              <p className="empty">Select a clip idea to generate the campaign asset pack.</p>
            )}
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
