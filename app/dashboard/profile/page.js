import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import ProfileForm from "./ProfileForm";

export default async function Page() {
  await db();
  const user = await getUser();
  const p = user.profile?.toObject?.() || {};
  return <ProfileForm name={user.name} email={user.email} profile={JSON.parse(JSON.stringify(p))} />;
}
