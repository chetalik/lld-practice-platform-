import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowLeft, CheckCircle2, Clock3, Sparkles, Target, Trophy } from "lucide-react";
import "./styles.css";

type Problem = {
  id: string;
  title: string;
  difficulty: string;
  description: string;
  requirements: { id: string; text: string }[];
  criteria: { id: string; name: string; description: string; weight: number }[];
};

type Attempt = {
  id: string;
  status: string;
  submission: { content: string };
  evaluation?: {
    score: number;
    strengths: string[];
    issues: string[];
    suggestions: string[];
    requirementCoverage: { requirementId: string; covered: boolean; explanation: string }[];
  };
  createdAt: string;
};

const API = "http://localhost:4000/api";

function App() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selected, setSelected] = useState<Problem | null>(null);
  const [solution, setSolution] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [submitted, setSubmitted] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/problems`)
      .then(r => r.json())
      .then(data => { setProblems(data); setLoading(false); });
  }, []);

  async function openProblem(problem: Problem) {
    setSelected(problem);
    setSubmitted(null);
    setSolution("");
    const history = await fetch(`${API}/problems/${problem.id}/attempts`).then(r => r.json());
    setAttempts(history);
  }

  async function submit() {
    if (!selected || !solution.trim()) return;
    const response = await fetch(`${API}/problems/${selected.id}/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: solution })
    });
    const attempt = await response.json();
    setSubmitted(attempt);
    setAttempts(prev => [attempt, ...prev]);
  }

  if (loading) return <main className="shell"><p>Loading practice problems...</p></main>;

  if (!selected) return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow"><Sparkles size={15}/> LLD PRACTICE</p>
          <h1>Think in objects.<br/><span>Design with intent.</span></h1>
          <p className="hero-copy">Practice real-world Low-Level Design problems and get feedback that explains the reasoning behind a stronger design.</p>
        </div>
        <div className="hero-stat"><Trophy/><strong>{problems.length}</strong><small>practice problems</small></div>
      </header>

      <section className="section-head">
        <div><p className="eyebrow">PROBLEM SET</p><h2>Choose your challenge</h2></div>
        <span className="muted">Build → submit → improve</span>
      </section>

      <div className="grid">
        {problems.map(p => (
          <button className="card" key={p.id} onClick={() => openProblem(p)}>
            <div className="card-top"><span className={`difficulty ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span><ArrowLeft className="arrow"/></div>
            <h3>{p.title}</h3>
            <p>{p.description}</p>
            <div className="requirements">{p.requirements.slice(0,3).map(r => <span key={r.id}>{r.text.split(".")[0]}</span>)}</div>
          </button>
        ))}
      </div>
    </main>
  );

  return (
    <main className="shell">
      <button className="back" onClick={() => setSelected(null)}><ArrowLeft size={17}/> All problems</button>
      <div className="practice-layout">
        <section>
          <div className="problem-header">
            <span className={`difficulty ${selected.difficulty.toLowerCase()}`}>{selected.difficulty}</span>
            <h1>{selected.title}</h1>
            <p>{selected.description}</p>
          </div>

          <div className="panel">
            <div className="panel-title"><Target size={18}/><h3>Requirements</h3></div>
            <ol className="reqs">{selected.requirements.map(r => <li key={r.id}>{r.text}</li>)}</ol>
          </div>

          <div className="panel editor-panel">
            <div className="panel-title"><span><h3>Your design</h3><small>Describe classes, interfaces, relationships, patterns and trade-offs.</small></span></div>
            <textarea value={solution} onChange={e => setSolution(e.target.value)} placeholder={"Example:\n\ninterface AllocationStrategy {\n  allocate(vehicle, spots): ParkingSpot;\n}\n\nParkingLot owns floors and delegates allocation to a strategy...\n\nExplain your trade-offs here."}/>
            <div className="submit-row"><span>{solution.length} characters</span><button onClick={submit} disabled={!solution.trim()}>Submit for feedback <Sparkles size={16}/></button></div>
          </div>

          {submitted?.evaluation && (
            <div className="feedback">
              <div className="score"><div><small>DESIGN SCORE</small><strong>{submitted.evaluation.score}</strong><span>/100</span></div><CheckCircle2 size={28}/></div>
              <div className="feedback-grid">
                <div><h4>What works</h4>{submitted.evaluation.strengths.map(x => <p key={x}>✓ {x}</p>)}</div>
                <div><h4>What to improve</h4>{submitted.evaluation.issues.map(x => <p key={x}>• {x}</p>)}</div>
              </div>
              <div><h4>Next iteration</h4>{submitted.evaluation.suggestions.map(x => <p key={x}>→ {x}</p>)}</div>
            </div>
          )}
        </section>

        <aside>
          <div className="side-card">
            <div className="panel-title"><Clock3 size={18}/><h3>Your attempts</h3></div>
            {attempts.length === 0 ? <p className="muted">No attempts yet. Your first submission will appear here.</p> :
              attempts.map((a, i) => <button className="attempt" key={a.id} onClick={() => setSubmitted(a)}>
                <span>Attempt {attempts.length - i}</span><strong>{a.evaluation?.score ?? "—"}</strong><small>{new Date(a.createdAt).toLocaleString()}</small>
              </button>)
            }
          </div>
          <div className="side-card">
            <div className="panel-title"><Sparkles size={18}/><h3>How feedback works</h3></div>
            <p className="muted">Objective requirement signals are checked first. Deeper design reasoning can then be evaluated by an LLM. This keeps feedback explainable rather than treating the model as the only source of truth.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
