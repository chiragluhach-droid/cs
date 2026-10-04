"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Logo from "@/components/Logo";
import { PLANS } from "@/lib/pricing";
import { burst, Tilt } from "@/components/fx";

export default function Checkout({ name, live, renewing, free }) {
  const router = useRouter();
  const [plan, setPlan] = useState("90");
  const [cur, setCur] = useState("INR");
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    try { const p = localStorage.getItem("khao_plan"); if (PLANS[p]) setPlan(p); } catch {}
    if (Intl.DateTimeFormat().resolvedOptions().timeZone !== "Asia/Calcutta" && Intl.DateTimeFormat().resolvedOptions().timeZone !== "Asia/Kolkata") setCur("USD");
  }, []);

  const sym = cur === "INR" ? "₹" : "$";
  const list = PLANS[plan][cur];

  const applyCode = async () => {
    if (!code.trim()) return;
    const r = await fetch(`/api/coupons/validate?plan=${plan}&currency=${cur}&code=${encodeURIComponent(code)}`);
    const j = await r.json();
    if (j.valid) { setApplied(j); setErr(""); burst(innerWidth / 2, innerHeight / 2, ["🎟️", "💸", "✨"]); }
    else { setApplied(null); setErr("That code isn't valid (or has expired)."); }
  };
  useEffect(() => { if (applied) applyCode(); /* re-price on plan/currency change */ }, [plan, cur]); // eslint-disable-line

  const total = free ? 0 : applied ? applied.amount : list;

  const verify = async (body) => {
    const r = await fetch("/api/checkout/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) { setBusy(false); return setErr(j.error); }
    setDone(true);
    for (let k = 0; k < 4; k++) setTimeout(() => burst(Math.random() * innerWidth, Math.random() * innerHeight * 0.6), k * 200);
    setTimeout(() => { router.push("/dashboard"); router.refresh(); }, 2600);
  };

  const pay = async () => {
    setBusy(true); setErr("");
    const r = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ plan, currency: cur, coupon: applied?.code }) });
    const j = await r.json();
    if (!r.ok) { setBusy(false); return setErr(j.error); }
    if (j.mode === "test" || j.mode === "free") return verify({ paymentId: j.paymentId });
    const rzp = new window.Razorpay({
      key: j.keyId, order_id: j.orderId, amount: j.amount, currency: j.currency, name: "KHAO", description: PLANS[plan].label,
      prefill: { name: j.name, email: j.email, contact: j.contact }, theme: { color: "#111010" },
      handler: (resp) => verify({ paymentId: j.paymentId, ...resp }),
      modal: { ondismiss: () => setBusy(false) },
    });
    rzp.on("payment.failed", () => { setBusy(false); setErr("Payment failed. No money was taken. Try again?"); });
    rzp.open();
  };

  if (done)
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--lime)", textAlign: "center", padding: 20 }}>
        <div className="word-in">
          <div style={{ fontSize: 90 }}>🎉</div>
          <h1 className="display" style={{ fontSize: "clamp(48px, 9vw, 110px)" }}>you&apos;re <span className="serif">in,</span> {name}.</h1>
          <p style={{ fontSize: 20, marginTop: 14 }}>{renewing ? "Renewed. Back to your dashboard…" : "Your coach is on it. Taking you to your dashboard…"}</p>
        </div>
      </div>
    );

  return (
    <div style={{ minHeight: "100vh" }}>
      {live && <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />}
      <div className="wrap" style={{ padding: "26px 0 80px" }}>
        <Logo />
        <h1 className="display" style={{ fontSize: "clamp(44px, 8vw, 96px)", marginTop: 40 }}>
          {renewing ? <>renew, <span className="serif">{name}.</span></> : <>last step, <span className="serif">{name}.</span></>}
        </h1>
        <p style={{ fontSize: 19, marginTop: 10 }}>{free ? "It's free during early access. Pick a length and your coach starts building right away." : "Pick your plan. Your coach starts building as soon as you're in."}</p>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)", gap: 28, marginTop: 40 }} className="co">
          <style>{`@media (max-width: 860px) { .co { grid-template-columns: 1fr !important; } }`}</style>
          <div className="stack">
            {!free && <div className="toggle" style={{ marginBottom: 10 }}>
              <button className={cur === "INR" ? "on" : ""} onClick={() => setCur("INR")}>🇮🇳 INR · UPI / cards</button>
              <button className={cur === "USD" ? "on" : ""} onClick={() => setCur("USD")}>🌍 USD · intl cards</button>
            </div>}
            <div className="grid g2">
              {Object.values(PLANS).map((p) => (
                <Tilt key={p.id} max={5} className="card" style={{ padding: 22, cursor: "pointer", background: plan === p.id ? "var(--lime)" : "#fffdf7", boxShadow: plan === p.id ? "var(--shadow-lg)" : "var(--shadow)" }} onClick={() => setPlan(p.id)} data-cursor="pick">
                  <div className="row between"><span className="eyebrow">{p.label}</span><span className="tick" style={{ width: 28, height: 28 }} data-on={plan === p.id}>{plan === p.id ? "✓" : ""}</span></div>
                  <div className="display" style={{ fontSize: 52, marginTop: 10 }}>{free ? <>free <s className="mono muted" style={{ fontSize: 16 }}>{sym}{p[cur].toLocaleString("en-IN")}</s></> : <>{sym}{p[cur].toLocaleString("en-IN")}</>}</div>
                  <div className="mono muted" style={{ fontSize: 12 }}>{p.days} days · ≈ {sym}{Math.round(p[cur] / p.days)}/day</div>
                  <ul style={{ paddingLeft: 18, marginTop: 14, fontSize: 14 }}>{p.perks.map((x) => <li key={x}>{x}</li>)}</ul>
                </Tilt>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: 24, alignSelf: "start", position: "sticky", top: 20 }}>
            <span className="eyebrow">summary</span>
            <div className="row between" style={{ marginTop: 16 }}><span>{PLANS[plan].label}</span><span className="mono">{free ? "free" : `${sym}${list.toLocaleString("en-IN")}`}</span></div>
            {applied && <div className="row between" style={{ marginTop: 8, color: "#1c7a2c" }}><span>code {applied.code}</span><span className="mono">−{sym}{applied.discount.toLocaleString("en-IN")}</span></div>}
            {!free && <div className="row" style={{ marginTop: 18 }}>
              <input className="input" placeholder="discount code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} style={{ padding: "10px 14px" }} />
              <button className="btn sm ghost" onClick={applyCode} style={{ border: "var(--line)" }}>apply</button>
            </div>}
            <div style={{ borderTop: "var(--line)", margin: "20px 0 16px" }} />
            <div className="row between"><b className="display" style={{ fontSize: 22 }}>total</b><b className="display" style={{ fontSize: 40 }}>{sym}{total.toLocaleString("en-IN")}</b></div>
            {err && <div className="err" style={{ marginTop: 14 }}>{err}</div>}
            <button className="btn lime" style={{ width: "100%", marginTop: 20 }} onClick={pay} disabled={busy} data-cursor="💸">
              {busy ? "processing…" : free ? "start my plan, free →" : `pay ${sym}${total.toLocaleString("en-IN")} →`}
            </button>
            <p className="mono muted" style={{ fontSize: 11, marginTop: 12, textAlign: "center" }}>
              {free ? "no payment needed during early access" : live ? "secured by razorpay · UPI · cards · netbanking" : "⚠ test mode: no real payment is taken"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
