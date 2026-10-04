"use client";
import { useState } from "react";
import Link from "next/link";
import { burst, useToast } from "@/components/fx";

const greet = () => {
  const h = new Date().getHours();
  return h < 5 ? "up late" : h < 12 ? "good morning" : h < 17 ? "good afternoon" : "good evening";
};

function Ring({ value, max, label, color, unit }) {
  const pct = Math.min(1, max ? value / max : 0);
  const C = 2 * Math.PI * 42;
  return (
    <div className="card ring" style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
      <svg width="96" height="96" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#e8e1cf" strokeWidth="12" />
        <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="12" strokeDasharray={`${C * pct} ${C}`} strokeLinecap="round" transform="rotate(-90 50 50)" style={{ transition: "stroke-dasharray .6s cubic-bezier(.2,.8,.2,1)" }} />
        <circle cx="50" cy="50" r="49" fill="none" stroke="var(--ink)" strokeWidth="2" />
        <circle cx="50" cy="50" r="35" fill="none" stroke="var(--ink)" strokeWidth="2" />
        <text x="50" y="55" textAnchor="middle" style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 18 }}>{Math.round(pct * 100)}%</text>
      </svg>
      <div>
        <div className="eyebrow muted">{label}</div>
        <div className="display" style={{ fontSize: 28 }}>{Math.round(value)}<span className="mono" style={{ fontSize: 13 }}> / {max}{unit}</span></div>
      </div>
    </div>
  );
}

export default function Today({ name, coach, date, day, targets, log: initial, streak, session, prog, note }) {
  const [log, setLog] = useState(initial);
  const [steps, setSteps] = useState(initial.steps || "");
  const [weight, setWeight] = useState(initial.weightKg || "");
  const [toast, toastNode] = useToast();

  const save = async (body) => {
    const r = await fetch("/api/log", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ date, ...body }) });
    const j = await r.json();
    if (!r.ok) { toast(j.error || "couldn't save"); return null; }
    setLog(j.log);
    return j.log;
  };

  const dish = (m, i) => {
    const s = log.swaps?.[i] || 0;
    return s && m.swaps?.[s - 1] ? { ...m.swaps[s - 1], slot: m.slot, time: m.time, swapped: true } : m;
  };
  const meals = day.meals.map(dish);
  const eaten = meals.reduce((a, m, i) => (log.meals?.[i] ? { kcal: a.kcal + m.kcal, protein: a.protein + m.protein } : a), { kcal: 0, protein: 0 });
  const doneCount = meals.filter((_, i) => log.meals?.[i]).length;

  const tick = async (i, e) => {
    const done = !log.meals?.[i];
    setLog((l) => ({ ...l, meals: { ...l.meals, [i]: done } }));
    if (done) burst(e.clientX, e.clientY);
    await save({ action: "meal", idx: i, done });
    if (done && doneCount + 1 === meals.length) toast("all meals done today 🏆 proud of you");
  };
  const swap = async (i) => {
    const m = day.meals[i];
    const next = ((log.swaps?.[i] || 0) + 1) % ((m.swaps?.length || 0) + 1);
    setLog((l) => ({ ...l, swaps: { ...l.swaps, [i]: next } }));
    await save({ action: "swap", idx: i, swap: next });
    toast(next ? `swapped to ${m.swaps[next - 1].name}` : `back to ${m.name}`);
  };
  const glasses = Math.round((log.waterMl || 0) / 250);
  const maxGlasses = Math.round(targets.water / 250);
  const setWater = async (n, e) => {
    const ml = n * 250 === log.waterMl ? (n - 1) * 250 : n * 250;
    setLog((l) => ({ ...l, waterMl: ml }));
    if (ml >= targets.water && (log.waterMl || 0) < targets.water) burst(e.clientX, e.clientY, ["💧", "🌊", "✨"]);
    await save({ waterMl: ml });
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      {toastNode}
      <div className="row between wrapflex" style={{ alignItems: "end", gap: 16 }}>
        <div>
          <div className="eyebrow muted">{new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</div>
          <h1 className="display" style={{ fontSize: "clamp(42px, 6vw, 76px)", marginTop: 6 }}>
            {greet()}, <span className="serif">{name}</span> ✌️
          </h1>
        </div>
        <div className="row wrapflex" style={{ gap: 8 }}>
          <span className="chip" style={{ background: streak ? "var(--orange)" : "#fffdf7", fontSize: 14 }}>🔥 {streak} day streak</span>
          <span className="chip" style={{ background: "var(--lime)", fontSize: 14 }}>{doneCount}/{meals.length} meals</span>
        </div>
      </div>

      {note && (
        <div className="card reveal" style={{ marginTop: 24, padding: 18, display: "flex", gap: 14, alignItems: "flex-start", background: "var(--butter)" }}>
          <span style={{ fontSize: 28 }}>💬</span>
          <div style={{ flex: 1 }}>
            <div className="eyebrow">{coach} · {note.title}</div>
            <p style={{ marginTop: 4 }}>{note.body}</p>
          </div>
          <Link href="/dashboard/inbox" className="mono" style={{ fontSize: 12, textDecoration: "underline" }}>inbox →</Link>
        </div>
      )}

      <div className="grid g3 rings" style={{ marginTop: 24 }}>
        <Ring value={eaten.kcal} max={targets.calories} label="calories" color="var(--orange)" unit="" />
        <Ring value={eaten.protein} max={targets.protein} label="protein" color="var(--pink)" unit="g" />
        <Ring value={log.steps || 0} max={targets.steps} label="steps" color="var(--sky)" unit="" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)", gap: 22, marginTop: 34 }} className="today-grid">
        <style>{`@media (max-width: 960px) { .today-grid { grid-template-columns: 1fr !important; } }`}</style>
        <section>
          <div className="row between">
            <h2 className="display" style={{ fontSize: 36 }}>today&apos;s <span className="serif">plate</span></h2>
            <span className="mono muted" style={{ fontSize: 12 }}>tap ✓ when eaten · ⇄ to swap</span>
          </div>
          <div className="stack" style={{ marginTop: 14 }}>
            {meals.map((m, i) => {
              const on = !!log.meals?.[i];
              return (
                <div key={i} className="card" style={{ padding: 16, display: "flex", gap: 14, alignItems: "flex-start", background: on ? "#effbc9" : "#fffdf7", transition: "background .3s" }}>
                  <button className={`tick ${on ? "on" : ""}`} onClick={(e) => tick(i, e)} aria-label="mark eaten" data-cursor={on ? "undo" : "ate it"}>
                    <svg width="18" height="18" viewBox="0 0 24 24"><path d="M4 12l5 5L20 6" fill="none" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row between" style={{ gap: 8 }}>
                      <span className="eyebrow muted">{m.slot} · {m.time}</span>
                      {m.swapped && <span className="pill lilac">swapped</span>}
                    </div>
                    <div key={m.name} className="display word-in" style={{ fontSize: 22, marginTop: 2, textDecoration: on ? "line-through" : "none", textDecorationThickness: 3 }}>{m.name}</div>
                    <div style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 4 }}>{m.items.map((it) => `${it.qty} ${it.food.toLowerCase()}`).join(" · ")}</div>
                    <div className="row" style={{ marginTop: 10, gap: 6, flexWrap: "wrap" }}>
                      <span className="pill butter">{m.kcal} kcal</span>
                      <span className="pill pink">{m.protein}g protein</span>
                      <span className="pill gray">{m.carbs}c · {m.fat}f</span>
                      {day.meals[i].swaps?.length > 0 && (
                        <button className="pill" style={{ background: "#fffdf7", cursor: "pointer", marginLeft: "auto" }} onClick={() => swap(i)} data-cursor="swap">⇄ swap dish</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="stack">
          <div className="card" style={{ padding: 18, background: "var(--sky)" }}>
            <div className="row between"><b className="display" style={{ fontSize: 22 }}>💧 water</b><span className="mono">{((log.waterMl || 0) / 1000).toFixed(2)} / {targets.water / 1000}L</span></div>
            <div className="row wrapflex" style={{ gap: 8, marginTop: 14 }}>
              {Array.from({ length: maxGlasses }).map((_, k) => (
                <button key={k} onClick={(e) => setWater(k + 1, e)} data-cursor="+250ml" aria-label={`glass ${k + 1}`}
                  style={{ width: 34, height: 44, border: "var(--line)", borderRadius: "4px 4px 10px 10px", background: "#fffdf7", position: "relative", overflow: "hidden", cursor: "pointer", padding: 0 }}>
                  <i style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: k < glasses ? "80%" : "0%", background: "#3aa0ff", transition: "height .4s cubic-bezier(.3,1.6,.6,1)" }} />
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <b className="display" style={{ fontSize: 22 }}>👟 steps</b>
            <form className="row" style={{ marginTop: 10 }} onSubmit={async (e) => { e.preventDefault(); if (await save({ steps })) { toast("steps saved 👟"); if (+steps >= targets.steps) burst(innerWidth / 2, 200, ["👟", "🔥"]); } }}>
              <input className="input" type="number" value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="8000" />
              <button className="btn sm">save</button>
            </form>
            <div className="progress" style={{ marginTop: 12 }}><i style={{ width: `${Math.min(100, ((log.steps || 0) / targets.steps) * 100)}%`, background: "var(--sky)" }} /></div>
            <div className="mono muted" style={{ fontSize: 11, marginTop: 6 }}>goal {targets.steps.toLocaleString("en-IN")}</div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <b className="display" style={{ fontSize: 22 }}>⚖️ morning weight</b>
            <form className="row" style={{ marginTop: 10 }} onSubmit={async (e) => { e.preventDefault(); if (await save({ weightKg: weight })) toast("logged ✓ your coach can see it"); }}>
              <input className="input" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="kg" />
              <button className="btn sm">log</button>
            </form>
            <p className="mono muted" style={{ fontSize: 11, marginTop: 8 }}>after the loo, before food. daily ups & downs are normal.</p>
          </div>

          <div className="card" style={{ padding: 18, background: session ? "var(--lime)" : "var(--lilac)" }}>
            <div className="row between">
              <b className="display" style={{ fontSize: 22 }}>{session ? `🏋️ ${session.focus}` : "😴 rest day"}</b>
              {session && <span className="pill" style={{ background: "#fffdf7" }}>wk {prog?.week}</span>}
            </div>
            {session ? (
              <>
                <ul style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: 14 }}>
                  {session.exercises.map((x) => <li key={x.name}>{x.name} <span className="mono muted">{x.timed ? `${prog?.sets}×${30 + (prog?.week || 1) * 5}s` : `${prog?.sets}×${prog?.reps}`}</span></li>)}
                </ul>
                <div className="row" style={{ marginTop: 14 }}>
                  <button className={`btn sm ${log.workoutDone ? "" : "ghost"}`} style={{ border: "var(--line)" }} onClick={async (e) => { const d = !log.workoutDone; if (d) burst(e.clientX, e.clientY, ["💪", "🔥", "⚡"]); await save({ workoutDone: d }); }}>
                    {log.workoutDone ? "✓ done!" : "mark done"}
                  </button>
                  <Link href="/dashboard/workout" className="mono" style={{ fontSize: 12, textDecoration: "underline" }}>full workout →</Link>
                </div>
              </>
            ) : (
              <p style={{ marginTop: 8, fontSize: 14 }}>Recovery is part of the plan. Go for a walk and hit your steps.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
