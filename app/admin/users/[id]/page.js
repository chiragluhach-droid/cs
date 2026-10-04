import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import User from "@/models/User";
import Plan from "@/models/Plan";
import CheckIn from "@/models/CheckIn";
import Photo from "@/models/Photo";
import Payment from "@/models/Payment";
import Alert from "@/models/Alert";
import DailyLog from "@/models/DailyLog";
import { weightSeries } from "@/lib/adapt";
import { computeTargets } from "@/lib/nutrition";
import { istDate } from "@/lib/dates";
import { plain } from "@/lib/userData";
import WeightChart from "@/components/WeightChart";
import { ActionButton } from "@/components/AdminActions";
import PlanEditor from "./PlanEditor";
import ClientTools from "./ClientTools";

export default async function ClientPage({ params, searchParams }) {
  await db();
  const { id } = await params;
  const { plan: planId } = await searchParams;
  const user = await User.findById(id).select("-passwordHash").lean().catch(() => null);
  if (!user) notFound();

  const since = istDate(new Date(Date.now() - 13 * 86400000));
  const [plans, checkins, series, photos, payments, alerts, logs] = await Promise.all([
    Plan.find({ user: id }).sort({ version: -1 }).lean(),
    CheckIn.find({ user: id }).sort({ date: -1 }).limit(12).lean(),
    weightSeries(id, 365),
    Photo.find({ user: id }).sort({ createdAt: -1 }).limit(12).lean(),
    Payment.find({ user: id, status: "paid" }).sort({ createdAt: -1 }).lean(),
    Alert.find({ user: id, resolved: false }).sort({ createdAt: -1 }).lean(),
    DailyLog.find({ user: id, date: { $gte: since } }).lean(),
  ]);
  const selected = plans.find((p) => String(p._id) === planId) || plans.find((p) => p.status !== "active" && p.status !== "archived") || plans.find((p) => p.status === "active") || null;
  const live = plans.find((p) => p.status === "active");
  const pending = plans.find((p) => p.status === "review" || p.status === "drafting");
  const p = user.profile || {};
  const suggested = p.weightKg ? computeTargets({ ...p }, user.stage) : null;

  // 14-day adherence strip
  const days = Array.from({ length: 14 }, (_, k) => istDate(new Date(Date.now() - (13 - k) * 86400000)));
  const byDate = Object.fromEntries(logs.map((l) => [l.date, l]));
  const mealsPerDay = live?.diet?.[0]?.meals?.length || p.mealsPerDay || 4;

  const Info = ({ k, v }) => (v || v === 0 ? <div className="row between" style={{ padding: "6px 0", borderBottom: "1px dashed #c9c1ae", fontSize: 14 }}><span className="muted">{k}</span><b style={{ textAlign: "right" }}>{v}</b></div> : null);
  const left = user.subscription?.endsAt ? Math.ceil((new Date(user.subscription.endsAt) - Date.now()) / 86400000) : null;

  return (
    <div style={{ maxWidth: 1400 }}>
      <div className="row between wrapflex" style={{ alignItems: "end" }}>
        <div>
          <div className="eyebrow muted">{user.email}{p.phone ? ` · ${p.phone}` : ""}{p.city ? ` · ${p.city}` : ""}</div>
          <h1 className="display" style={{ fontSize: "clamp(40px, 5vw, 64px)" }}>{user.name}</h1>
          <div className="row wrapflex" style={{ gap: 6, marginTop: 8 }}>
            <span className={`pill ${user.subscription?.status === "active" ? "lime" : "gray"}`}>{user.subscription?.status === "active" ? `${user.subscription.plan}-day · ${left}d left` : user.subscription?.status || "none"}</span>
            <span className="pill lilac">phase: {user.stage?.replace("_", " ")}</span>
            {p.diet && <span className="pill butter">{p.diet}</span>}
            {(p.conditions || []).filter((c) => c !== "none").map((c) => <span key={c} className="pill pink">{c}</span>)}
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="stack" style={{ marginTop: 18 }}>
          {alerts.map((a) => (
            <div key={String(a._id)} className="card row between" style={{ padding: 12, background: "var(--butter)" }}>
              <span>🔔 <b>{a.type.replace("_", " ")}</b>: {a.message}</span>
              <ActionButton url={`/api/admin/alerts/${a._id}`} method="PATCH" className="btn sm ghost" style={{ border: "var(--line)" }}>✓</ActionButton>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "340px minmax(0, 1fr)", gap: 22, marginTop: 22, alignItems: "start" }} className="cl-grid">
        <style>{`@media (max-width: 1100px) { .cl-grid { grid-template-columns: 1fr !important; } }`}</style>
        <aside className="stack">
          <div className="card" style={{ padding: 18 }}>
            <div className="eyebrow">profile</div>
            <Info k="sex / age" v={p.sex && `${p.sex}, ${p.age}`} />
            <Info k="height" v={p.heightCm && `${p.heightCm} cm`} />
            <Info k="weight start → now → goal" v={`${user.startWeightKg ?? "–"} → ${series.at(-1)?.w ?? p.weightKg ?? "–"} → ${p.targetWeightKg ?? "–"}`} />
            <Info k="goal / after" v={p.goal && `${p.goal.replace("_", " ")} → ${p.afterGoal}`} />
            <Info k="activity" v={p.activity} />
            <Info k="training" v={p.workoutPlace && `${p.workoutPlace}, ${p.experience}, ${p.daysPerWeek}×/wk`} />
            <Info k="meals / day" v={p.mealsPerDay} />
            <Info k="loves" v={(p.likes || []).join(", ")} />
            <Info k="hates" v={(p.dislikes || []).join(", ")} />
            {p.notes && <p className="serif" style={{ fontSize: 18, marginTop: 10, background: "var(--paper-2)", padding: 10, borderRadius: 10 }}>&ldquo;{p.notes}&rdquo;</p>}
            {suggested && <div className="mono muted" style={{ fontSize: 11, marginTop: 10 }}>formula targets now: {suggested.calories} kcal · {suggested.protein}P · maint. {suggested.maintenance}</div>}
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div className="eyebrow">last 14 days</div>
            <div className="row" style={{ gap: 4, marginTop: 10 }}>
              {days.map((d) => {
                const l = byDate[d];
                const done = l ? Object.values(l.meals || {}).filter(Boolean).length : 0;
                const pct = done / mealsPerDay;
                return <div key={d} title={`${d}: ${done}/${mealsPerDay} meals${l?.workoutDone ? ", workout ✓" : ""}${l?.weightKg ? `, ${l.weightKg}kg` : ""}`} style={{ flex: 1, height: 34, borderRadius: 6, border: "1.5px solid var(--ink)", background: !l ? "#fffdf7" : pct >= 0.75 ? "var(--lime)" : pct > 0 ? "var(--butter)" : "#e3ddcf", position: "relative" }}>{l?.workoutDone && <span style={{ position: "absolute", bottom: -2, right: 1, fontSize: 10 }}>💪</span>}</div>;
              })}
            </div>
            <div className="mono muted" style={{ fontSize: 10, marginTop: 6 }}>green = 75%+ meals ticked · hover for details</div>
          </div>

          <ClientTools id={id} stage={user.stage} />

          <div className="card" style={{ padding: 18 }}>
            <div className="eyebrow">weight</div>
            <WeightChart series={series} goal={p.targetWeightKg} height={200} />
          </div>

          {checkins.length > 0 && (
            <div className="card" style={{ padding: 18 }}>
              <div className="eyebrow">check-ins</div>
              {checkins.map((c) => (
                <div key={String(c._id)} style={{ padding: "8px 0", borderBottom: "1px dashed #c9c1ae", fontSize: 13 }}>
                  <div className="row between"><b className="mono">{c.date}</b><span className="mono">{c.weightKg}kg{c.waistCm ? ` · waist ${c.waistCm}` : ""}</span></div>
                  {(c.energy || c.hunger) && <div className="muted">energy {c.energy}/5 · hunger {c.hunger}/5</div>}
                  {c.note && <div>&ldquo;{c.note}&rdquo;</div>}
                </div>
              ))}
            </div>
          )}

          {photos.length > 0 && (
            <div className="card" style={{ padding: 18 }}>
              <div className="eyebrow">photos</div>
              <div className="grid g3" style={{ marginTop: 10, gap: 8 }}>
                {photos.map((ph) => (
                  <a key={String(ph._id)} href={ph.data} target="_blank" rel="noreferrer" title={`${ph.date} · ${ph.angle}`}>
                    <img src={ph.data} alt="" style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: 8, border: "1.5px solid var(--ink)" }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 18 }}>
            <div className="eyebrow">payments</div>
            {payments.length === 0 && <p className="muted" style={{ fontSize: 14 }}>none</p>}
            {payments.map((x) => <Info key={String(x._id)} k={new Date(x.createdAt).toLocaleDateString("en-IN")} v={`${x.currency === "USD" ? "$" : "₹"}${x.amount} · ${x.plan}d${x.coupon ? ` · ${x.coupon}` : ""}`} />)}
          </div>
        </aside>

        <section className="stack">
          <div className="card" style={{ padding: 18 }}>
            <div className="row between wrapflex" style={{ gap: 10 }}>
              <div className="eyebrow">plans</div>
              {!pending && (
                <div className="row wrapflex">
                  <ActionButton url={`/api/admin/users/${id}/plan`} body={{ mode: "generate" }} className="btn sm lime" goToPlan={`/admin/users/${id}?plan=`}>⚡ generate draft</ActionButton>
                  {live && <ActionButton url={`/api/admin/users/${id}/plan`} body={{ mode: "clone" }} className="btn sm ghost" style={{ border: "var(--line)" }} goToPlan={`/admin/users/${id}?plan=`}>⧉ copy live plan & edit</ActionButton>}
                  <ActionButton url={`/api/admin/users/${id}/plan`} body={{ mode: "manual" }} className="btn sm ghost" style={{ border: "var(--line)" }} goToPlan={`/admin/users/${id}?plan=`}>✍️ write by hand</ActionButton>
                </div>
              )}
            </div>
            <div className="row wrapflex" style={{ gap: 6, marginTop: 12 }}>
              {plans.length === 0 && <span className="muted">no plans yet{user.subscription?.status !== "active" ? " (client hasn't paid)" : ""}</span>}
              {plans.map((pl) => (
                <a key={String(pl._id)} href={`/admin/users/${id}?plan=${pl._id}`} className={`pill ${pl.status === "active" ? "lime" : pl.status === "archived" ? "gray" : "pink"}`} style={{ outline: String(pl._id) === String(selected?._id) ? "3px solid var(--ink)" : "none", outlineOffset: 2, fontSize: 12, padding: "5px 12px" }}>
                  v{pl.version} · {pl.status} · {pl.reason.replace("_", " ")}
                </a>
              ))}
            </div>
          </div>
          {selected && <PlanEditor key={String(selected._id) + selected.updatedAt} plan={plain(selected)} />}
        </section>
      </div>
    </div>
  );
}
