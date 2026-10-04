import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { unreadCount } from "@/lib/userData";
import { coachName } from "@/lib/plans";
import SideNav from "@/components/SideNav";
import { RevealOnScroll } from "@/components/fx";

export default async function DashLayout({ children }) {
  await db();
  const user = await getUser();
  if (!user) redirect("/login");
  if (!user.onboarded) redirect("/start");
  if (user.role !== "admin" && user.subscription?.status !== "active") redirect("/checkout");
  const unread = await unreadCount(user._id);
  const daysLeft = user.subscription?.endsAt ? Math.max(0, Math.ceil((user.subscription.endsAt - Date.now()) / 86400000)) : null;

  return (
    <div className="shell">
      <SideNav
        home="/dashboard"
        mobileExtra={daysLeft != null && (
          <a href="/checkout" className="chip" style={{ background: daysLeft <= 7 ? "var(--orange)" : "var(--butter)", padding: "5px 10px", fontSize: 11 }}>
            {daysLeft}d left
          </a>
        )}
        items={[
          ["/dashboard", "🍽️", "today"],
          ["/dashboard/plan", "📋", "plan"],
          ["/dashboard/workout", "🏋️", "workout"],
          ["/dashboard/progress", "📈", "progress"],
          ["/dashboard/inbox", "💬", "coach", unread],
        ]}
        footer={
          <div className="card" style={{ padding: 14, background: "var(--butter)" }}>
            <div className="row" style={{ gap: 10 }}>
              <span style={{ width: 38, height: 38, borderRadius: "50%", border: "var(--line)", background: "var(--lime)", display: "grid", placeItems: "center", fontSize: 18 }}>🧑‍🍳</span>
              <div>
                <div className="eyebrow" style={{ fontSize: 10 }}>your coach</div>
                <b>{coachName()}</b>
              </div>
            </div>
            {daysLeft != null && (
              <div className="mono" style={{ fontSize: 11, marginTop: 10 }}>
                {daysLeft} days left · <a href="/checkout" style={{ textDecoration: "underline" }}>renew</a>
              </div>
            )}
          </div>
        }
      />
      <main className="main">
        <RevealOnScroll />
        {children}
      </main>
    </div>
  );
}
