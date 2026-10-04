import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireUser, bad } from "@/lib/auth";
import { cleanProfile, PLAN_FIELDS } from "@/lib/profile";
import Alert from "@/models/Alert";

// Update the signed-in client's name, profile details and (optionally) password
export async function PATCH(req) {
  const [user, err] = await requireUser();
  if (err) return err;
  const b = await req.json().catch(() => ({}));

  const name = String(b.name ?? user.name).trim().slice(0, 80);
  if (!name) return bad("Name can't be empty");

  const before = user.profile?.toObject?.() || user.profile || {};
  const { profile: p, error } = cleanProfile({ ...before, ...(b.profile || {}) });
  if (error) return bad(error);

  if (b.newPassword) {
    if (String(b.newPassword).length < 8) return bad("New password needs at least 8 characters");
    if (!(await bcrypt.compare(String(b.currentPassword || ""), user.passwordHash))) return bad("Current password is incorrect");
    user.passwordHash = await bcrypt.hash(String(b.newPassword), 10);
  }

  const changed = PLAN_FIELDS.filter((k) => JSON.stringify(before[k] ?? null) !== JSON.stringify(p[k] ?? null));
  user.name = name;
  user.profile = p;
  await user.save();

  // Let the coach know when something that affects the plan changed
  if (user.role !== "admin" && changed.length) {
    await Alert.create({ user: user._id, type: "health", message: `${name} updated their profile: ${changed.join(", ")}. Check whether the plan needs an update.` });
  }
  return NextResponse.json({ ok: true, changed });
}
