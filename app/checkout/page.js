import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { razorpayEnabled, paymentsEnabled } from "@/lib/billing";
import Checkout from "./Checkout";

export default async function Page() {
  const user = await getUser();
  if (!user) redirect("/login?next=/checkout");
  if (!user.onboarded) redirect("/start");
  return <Checkout name={user.name.split(" ")[0]} live={paymentsEnabled() && razorpayEnabled()} free={!paymentsEnabled()} renewing={user.subscription?.status === "active"} />;
}
