// Validates and normalises a client profile (used by onboarding and the profile page).
const num = (v, min, max) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};
const list = (v) => (Array.isArray(v) ? v : String(v || "").split(","))
  .map((x) => String(x).trim()).filter(Boolean).slice(0, 20);

export const CONDITIONS = ["pcos", "thyroid", "diabetes", "bp", "lactose", "none"];

export function cleanProfile(b) {
  const p = {
    sex: b.sex === "male" ? "male" : "female",
    age: num(b.age, 14, 90),
    heightCm: num(b.heightCm, 120, 230),
    weightKg: num(b.weightKg, 30, 250),
    targetWeightKg: num(b.targetWeightKg, 30, 250),
    goal: ["fat_loss", "muscle_gain", "recomp", "maintain"].includes(b.goal) ? b.goal : "fat_loss",
    afterGoal: b.afterGoal === "build" ? "build" : "maintain",
    activity: ["sedentary", "light", "moderate", "active"].includes(b.activity) ? b.activity : "light",
    diet: ["vegan", "veg", "jain", "egg", "nonveg"].includes(b.diet) ? b.diet : "veg",
    conditions: (b.conditions || []).filter((c) => CONDITIONS.includes(c)),
    likes: list(b.likes),
    dislikes: list(b.dislikes),
    notes: String(b.notes || "").slice(0, 1000),
    mealsPerDay: [3, 4, 5].includes(+b.mealsPerDay) ? +b.mealsPerDay : 4,
    workoutPlace: b.workoutPlace === "gym" ? "gym" : "home",
    experience: ["beginner", "intermediate", "advanced"].includes(b.experience) ? b.experience : "beginner",
    daysPerWeek: [3, 4, 5].includes(+b.daysPerWeek) ? +b.daysPerWeek : 4,
    city: String(b.city || "").slice(0, 80),
    phone: String(b.phone || "").slice(0, 20),
  };
  if (!p.age || !p.heightCm || !p.weightKg) return { error: "Age, height and weight are needed" };
  if (!p.targetWeightKg) p.targetWeightKg = p.weightKg;
  return { profile: p };
}

// Fields that change what the plan should look like; editing them flags the coach.
export const PLAN_FIELDS = ["sex", "age", "heightCm", "weightKg", "targetWeightKg", "goal", "afterGoal", "activity", "diet", "conditions", "likes", "dislikes", "mealsPerDay", "workoutPlace", "experience", "daysPerWeek"];
