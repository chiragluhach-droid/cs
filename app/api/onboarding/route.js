import { NextResponse } from "next/server";
import { requireUser, bad } from "@/lib/auth";
import { cleanProfile } from "@/lib/profile";

export async function POST(req) {
  const [user, err] = await requireUser();
  if (err) return err;
  const b = await req.json().catch(() => ({}));
  const { profile: p, error } = cleanProfile(b);
  if (error) return bad(error);

  user.profile = p;
  user.onboarded = true;
  user.startWeightKg ??= p.weightKg;
  user.stage = p.goal === "muscle_gain" ? "build" : p.goal;
  await user.save();
  return NextResponse.json({ ok: true, next: user.subscription?.status === "active" ? "/dashboard" : "/checkout" });
}
