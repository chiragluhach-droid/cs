"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/fx";

const OPT = {
  sex: [["female", "Female"], ["male", "Male"]],
  goal: [["fat_loss", "Lose fat"], ["recomp", "Tone up"], ["muscle_gain", "Build muscle"], ["maintain", "Eat better / maintain"]],
  afterGoal: [["maintain", "Maintain"], ["build", "Build muscle"]],
  activity: [["sedentary", "Mostly sitting"], ["light", "Lightly active"], ["moderate", "Moderately active"], ["active", "Very active"]],
  diet: [["veg", "Vegetarian"], ["vegan", "Vegan"], ["jain", "Jain"], ["egg", "Eggetarian"], ["nonveg", "Non-veg"]],
  mealsPerDay: [[3, "3 meals"], [4, "4 meals"], [5, "5 meals"]],
  workoutPlace: [["home", "Home"], ["gym", "Gym"]],
  experience: [["beginner", "Beginner"], ["intermediate", "Intermediate"], ["advanced", "Advanced"]],
  daysPerWeek: [[3, "3 days"], [4, "4 days"], [5, "5 days"]],
};
const CONDITIONS = [["pcos", "PCOS / PCOD"], ["thyroid", "Thyroid"], ["diabetes", "Diabetes / pre-diabetes"], ["bp", "High BP"], ["lactose", "Lactose intolerant"]];

// Defined outside the form so inputs keep focus between renders
function Field({ label, children, hint }) {
  return <div><label className="label">{label}</label>{children}{hint && <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{hint}</div>}</div>;
}
function Select({ k, value, onChange }) {
  return <select className="select" value={value} onChange={onChange}>{OPT[k].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>;
}

export default function ProfileForm({ name: initialName, email, profile }) {
  const router = useRouter();
  const [toast, toastNode] = useToast();
  const [name, setName] = useState(initialName);
  const [p, setP] = useState({ ...profile, likes: (profile.likes || []).join(", "), dislikes: (profile.dislikes || []).join(", ") });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setP((x) => ({ ...x, [k]: e.target.value }));
  const toggle = (c) => setP((x) => {
    const cur = (x.conditions || []).filter((y) => y !== "none");
    return { ...x, conditions: cur.includes(c) ? cur.filter((y) => y !== c) : [...cur, c] };
  });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    const r = await fetch("/api/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, profile: p, ...(pw.newPassword ? pw : {}) }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error || "Couldn't save, try again");
    setPw({ currentPassword: "", newPassword: "" });
    toast(j.changed?.length ? "saved ✓ your coach has been pinged" : "saved ✓");
    router.refresh();
  };

  const sel = (k) => ({ k, value: p[k] ?? "", onChange: set(k) });

  return (
    <form style={{ maxWidth: 760 }} onSubmit={save}>
      {toastNode}
      <h1 className="display" style={{ fontSize: "clamp(42px, 6vw, 76px)" }}>your <span className="serif">profile</span></h1>
      <p style={{ marginTop: 8, color: "var(--ink-2)" }}>Keep it fresh. Changes to your body, goal or food get flagged to your coach.</p>

      <h2 className="display prof__h">🙋 account</h2>
      <div className="card prof">
        <Field label="Full name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} /></Field>
        <Field label="Email" hint="Contact your coach to change your email."><input className="input" value={email} disabled /></Field>
        <Field label="Phone"><input className="input" type="tel" inputMode="tel" value={p.phone || ""} onChange={set("phone")} placeholder="+91 98765 43210" /></Field>
        <Field label="City"><input className="input" value={p.city || ""} onChange={set("city")} placeholder="Pune" /></Field>
      </div>

      <h2 className="display prof__h">📏 body &amp; goal</h2>
      <div className="card prof">
        <Field label="Sex"><Select {...sel("sex")} /></Field>
        <Field label="Age"><input className="input" type="number" inputMode="numeric" min={14} max={90} value={p.age ?? ""} onChange={set("age")} required /></Field>
        <Field label="Height (cm)"><input className="input" type="number" inputMode="decimal" min={120} max={230} value={p.heightCm ?? ""} onChange={set("heightCm")} required /></Field>
        <Field label="Weight (kg)" hint="Log daily weight from the Today tab."><input className="input" type="number" inputMode="decimal" step="0.1" min={30} max={250} value={p.weightKg ?? ""} onChange={set("weightKg")} required /></Field>
        <Field label="Target weight (kg)"><input className="input" type="number" inputMode="decimal" step="0.1" min={30} max={250} value={p.targetWeightKg ?? ""} onChange={set("targetWeightKg")} /></Field>
        <Field label="Main goal"><Select {...sel("goal")} /></Field>
        <Field label="After reaching it"><Select {...sel("afterGoal")} /></Field>
        <Field label="Daily activity"><Select {...sel("activity")} /></Field>
      </div>

      <h2 className="display prof__h">🍛 food &amp; health</h2>
      <div className="card prof">
        <Field label="Diet"><Select {...sel("diet")} /></Field>
        <Field label="Meals per day"><Select {...sel("mealsPerDay")} /></Field>
        <div className="prof__full">
          <label className="label">Health conditions</label>
          <div className="row wrapflex" style={{ gap: 8 }}>
            {CONDITIONS.map(([v, l]) => {
              const on = (p.conditions || []).includes(v);
              return <button type="button" key={v} onClick={() => toggle(v)} aria-pressed={on} className="pill" style={{ fontSize: 14, padding: "8px 14px", cursor: "pointer", background: on ? "var(--pink)" : "#fffdf7", transform: on ? "rotate(-3deg)" : "", transition: "transform .2s" }}>{on ? "✓ " : "+ "}{l}</button>;
            })}
          </div>
        </div>
        <div className="prof__full"><Field label="Foods you love" hint="Separate with commas"><input className="input" value={p.likes} onChange={set("likes")} placeholder="paneer, dal, poha" /></Field></div>
        <div className="prof__full"><Field label="Foods to avoid" hint="Separate with commas"><input className="input" value={p.dislikes} onChange={set("dislikes")} placeholder="karela, mushroom" /></Field></div>
      </div>

      <h2 className="display prof__h">🏋️ training</h2>
      <div className="card prof">
        <Field label="Where you train"><Select {...sel("workoutPlace")} /></Field>
        <Field label="Experience"><Select {...sel("experience")} /></Field>
        <Field label="Days per week"><Select {...sel("daysPerWeek")} /></Field>
        <div className="prof__full"><Field label="Anything else your coach should know?"><textarea className="textarea" rows={3} value={p.notes || ""} onChange={set("notes")} maxLength={1000} /></Field></div>
      </div>

      <h2 className="display prof__h">🔑 change password <span className="mono muted" style={{ fontSize: 12 }}>optional</span></h2>
      <div className="card prof">
        <Field label="Current password"><input className="input" type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
        <Field label="New password"><input className="input" type="password" autoComplete="new-password" minLength={8} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} placeholder="At least 8 characters" /></Field>
      </div>

      <div className="prof__save">
        {err && <div className="err" style={{ marginBottom: 10 }}>{err}</div>}
        <button className="btn lime" style={{ width: "100%" }} disabled={busy}>{busy ? "saving…" : "save changes ✓"}</button>
      </div>
    </form>
  );
}
