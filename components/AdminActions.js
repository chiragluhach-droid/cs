"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Small button that calls an API then refreshes the page
export function ActionButton({ url, method = "POST", body, children, className = "btn sm", confirm: confirmMsg, goToPlan, style }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const go = async () => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(true); setErr("");
    const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error || "failed");
    // goToPlan is a URL prefix (serialisable, unlike a callback) that gets the new plan id appended
    goToPlan ? router.push(goToPlan + j.id) : router.refresh();
  };
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
      <button className={className} onClick={go} disabled={busy} style={style}>{busy ? "…" : children}</button>
      {err && <span className="mono" style={{ fontSize: 11, color: "#b42318" }}>{err}</span>}
    </span>
  );
}
