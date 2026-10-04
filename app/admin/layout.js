import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import SideNav from "@/components/SideNav";
import Plan from "@/models/Plan";
import Alert from "@/models/Alert";

export default async function AdminLayout({ children }) {
  await db();
  const user = await getUser();
  if (!user || user.role !== "admin") redirect("/login");
  const [reviews, alerts] = await Promise.all([Plan.countDocuments({ status: { $in: ["review", "drafting"] } }), Alert.countDocuments({ resolved: false, type: { $ne: "review" } })]);
  return (
    <div className="shell">
      <SideNav
        home="/admin"
        items={[
          ["/admin", "📊", "overview", alerts],
          ["/admin/reviews", "🧾", "plan reviews", reviews],
          ["/admin/users", "👥", "clients"],
          ["/admin/payments", "💸", "payments"],
          ["/admin/coupons", "🎟️", "coupons"],
        ]}
        footer={<div className="chip" style={{ background: "var(--pink)", justifyContent: "center" }}>admin mode</div>}
      />
      <main className="main">{children}</main>
    </div>
  );
}
