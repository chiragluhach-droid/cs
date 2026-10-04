"use client";
import { useState } from "react";

const STAGE = { fat_loss: ["fat loss", "var(--orange)"], recomp: ["tone up", "var(--pink)"], maintain: ["maintain", "var(--sky)"], build: ["build muscle", "var(--lilac)"], muscle_gain: ["build muscle", "var(--lilac)"] };

export default function PlanView({ plan, today, coach, stage }) {
  const [d, setD] = useState(today);
  const [open, setOpen] = useState(null);
  const t = plan.targets;
  const day = plan.diet[d];
  const tot = day.meals.reduce((a, m) => ({ kcal: a.kcal + m.kcal, protein: a.protein + m.protein }), { kcal: 0, protein: 0 });
  const [label, color] = STAGE[stage] || STAGE.fat_loss;

  return (
    <div style={{ maxWidth: 1100 }}>
      <div className="row wrapflex" style={{ gap: 8 }}>
        <span className="pill" style={{ background: color }}>phase: {label}</span>
        <span className="pill gray">plan v{plan.version}</span>
        <span className="pill gray">since {new Date(plan.activatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
      </div>
      <h1 className="display" style={{ fontSize: "clamp(42px, 6vw, 76px)", marginTop: 12 }}>your <span className="serif">plan</span></h1>

      <div className="card reveal" style={{ marginTop: 22, padding: 24, background: "#fffdf7", position: "relative", rotate: "-0.4deg" }}>
        <span className="sticker" style={{ top: -16, left: 20, background: "var(--lime)", cursor: "default", fontSize: 13, padding: "6px 12px" }}>📝 note from {coach}</span>
        <p className="serif" style={{ fontSize: 23, lineHeight: 1.35, whiteSpace: "pre-line", marginTop: 10 }}>{plan.coachNote}</p>
      </div>

      <div className="grid g4" style={{ marginTop: 22 }}>
        {[["calories", t.calories, "kcal", "var(--orange)"], ["protein", t.protein, "g", "var(--pink)"], ["carbs", t.carbs, "g", "var(--sky)"], ["fat", t.fat, "g", "var(--butter)"]].map(([k, v, u, c]) => (
          <div key={k} className="card stat" style={{ background: c }}>
            <div className="v">{v}<span className="mono" style={{ fontSize: 14 }}>{u}</span></div>
            <div className="k" style={{ color: "var(--ink)" }}>{k} / day</div>
          </div>
        ))}
      </div>
      <div className="mono" style={{ marginTop: 12, fontSize: 13 }}>💧 {t.water / 1000}L water · 👟 {t.steps.toLocaleString("en-IN")} steps daily</div>

      <div className="row wrapflex hscroll" style={{ marginTop: 34, gap: 8 }}>
        {plan.diet.map((x, k) => (
          <button key={x.day} onClick={() => setD(k)} className={`btn sm ${k === d ? "" : "ghost"}`} style={{ border: "var(--line)" }}>
            {x.day}{k === today ? " •" : ""}
          </button>
        ))}
      </div>
      <div className="mono muted" style={{ marginTop: 10, fontSize: 12 }}>{day.day}: {tot.kcal} kcal · {tot.protein}g protein</div>

      <div className="stack" style={{ marginTop: 16 }} key={d}>
        {day.meals.map((m, i) => (
          <div key={i} className="card word-in" style={{ padding: 18, animationDelay: `${i * 50}ms` }}>
            <div className="row between wrapflex">
              <div>
                <div className="eyebrow muted">{m.slot} · {m.time}</div>
                <div className="display" style={{ fontSize: 24 }}>{m.name}</div>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <span className="pill butter">{m.kcal} kcal</span>
                <span className="pill pink">{m.protein}g P</span>
              </div>
            </div>
            <div className="tablewrap" style={{ marginTop: 12 }}>
              <table className="table">
                <tbody>
                  {m.items.map((it, k) => (
                    <tr key={k}><td>{it.food}</td><td className="mono">{it.qty}</td><td className="mono muted">{it.kcal} kcal · {it.protein}g P</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            {m.swaps?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <button className="mono" style={{ background: "none", border: 0, cursor: "pointer", textDecoration: "underline", fontSize: 13, padding: 0 }} onClick={() => setOpen(open === i ? null : i)}>
                  {open === i ? "hide" : "show"} {m.swaps.length} swap options ⇄
                </button>
                {open === i && (
                  <div className="grid g2" style={{ marginTop: 10 }}>
                    {m.swaps.map((s) => (
                      <div key={s.name} className="card" style={{ padding: 14, background: "var(--paper-2)", boxShadow: "none" }}>
                        <b>{s.name}</b>
                        <div style={{ fontSize: 13 }}>{s.items.map((it) => `${it.qty} ${it.food.toLowerCase()}`).join(" · ")}</div>
                        <div className="mono muted" style={{ fontSize: 12, marginTop: 4 }}>{s.kcal} kcal · {s.protein}g P</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
