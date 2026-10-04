"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const LINES = ["reading your profile…", "working out your calories…", "picking meals you'll actually like…", "removing karela (just in case)…", "checking protein for every meal…", "planning your workouts…"];
const STEPS = [["📝", "profile in"], ["🍛", "plan drafted"], ["🧑‍🍳", "coach check"], ["🎉", "all yours"]];
const TODO = [
  ["/dashboard/progress", "📸", "take “before” photos", "Future you will thank you. Only you and your coach see them.", "var(--lime)"],
  ["/dashboard/progress", "📏", "log measurements", "Waist, hips, arms. The scale lies, the tape doesn't.", "var(--sky)"],
  ["/dashboard/inbox", "💬", "check your inbox", "Your plan and coach messages land here.", "var(--pink)"],
];

export default function Waiting({ name, coach }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % LINES.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ maxWidth: 760 }}>
      <span className="chip" style={{ background: "var(--butter)" }}><span className="blink">●</span>&nbsp;in progress</span>
      <h1 className="display" style={{ fontSize: "clamp(44px, 7vw, 80px)", marginTop: 14 }}>
        hey {name}, <span className="serif">your plan is</span> cooking.
      </h1>

      <div className="card" style={{ marginTop: 22, padding: 18, background: "var(--lilac)" }}>
        <div className="row" style={{ gap: 14, alignItems: "center" }}>
          <div className="float" style={{ fontSize: 34, width: 64, height: 64, flex: "none", borderRadius: "50%", background: "#fffdf7", border: "var(--line)", display: "grid", placeItems: "center" }}>🧑‍🍳</div>
          <div style={{ minWidth: 0 }}>
            <div className="eyebrow" style={{ fontSize: 11 }}>{coach} is on it</div>
            <p key={i} className="display word-in" style={{ fontSize: 22, marginTop: 4, lineHeight: 1.05 }}>{LINES[i]}</p>
          </div>
        </div>
        <ol style={{ listStyle: "none", padding: 0, margin: "18px 0 0", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
          {STEPS.map(([e, t], k) => (
            <li key={t} style={{ textAlign: "center", fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", opacity: k > 2 ? 0.55 : 1 }}>
              <div style={{ height: 44, borderRadius: 12, border: "var(--line)", display: "grid", placeItems: "center", fontSize: 20, marginBottom: 6, background: k < 2 ? "var(--lime)" : k === 2 ? "var(--butter)" : "#fffdf7", boxShadow: k === 2 ? "var(--shadow)" : "none" }}>
                {k < 2 ? "✓" : e}
              </div>
              {t}
            </li>
          ))}
        </ol>
        <p style={{ marginTop: 14, fontSize: 14 }}>Every plan is checked by hand. Usually a few hours, 24 max. We&apos;ll ping your coach inbox.</p>
      </div>

      <h2 className="display" style={{ fontSize: 30, marginTop: 34 }}>meanwhile…</h2>
      <div className="stack" style={{ marginTop: 14 }}>
        {TODO.map(([href, e, t, d, c]) => (
          <Link key={t} href={href} className="card" style={{ padding: 14, display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ width: 48, height: 48, flex: "none", borderRadius: 14, border: "var(--line)", background: c, display: "grid", placeItems: "center", fontSize: 24 }}>{e}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b className="display" style={{ fontSize: 19 }}>{t}</b>
              <p style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 2 }}>{d}</p>
            </div>
            <span className="display" style={{ fontSize: 22 }}>→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
