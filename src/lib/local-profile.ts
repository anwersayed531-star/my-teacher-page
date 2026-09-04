/**
 * بيانات الطالب كلها محليّة على جهازه — لا شيء منها يُرسَل لقاعدة البيانات.
 */
export interface ExamResult {
  examId: string;
  examTitle: string;
  courseTitle: string;
  scorePct: number;
  earned: number;
  total: number;
  at: string;
}

export interface LocalProfile {
  version: 1;
  name: string;
  grade: string;
  /** معرّفات الفيديوهات/الدروس المكتملة */
  completed: string[];
  /** معرّفات الكورسات المفضّلة */
  favorites: string[];
  /** ملاحظات الطالب لكل درس */
  notes: Record<string, string>;
  results: ExamResult[];
  updatedAt: string;
}

const KEY = "school:profile:v1";

export function emptyProfile(): LocalProfile {
  return {
    version: 1,
    name: "",
    grade: "",
    completed: [],
    favorites: [],
    notes: {},
    results: [],
    updatedAt: new Date().toISOString(),
  };
}

export function readProfile(): LocalProfile {
  if (typeof window === "undefined") return emptyProfile();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyProfile();
    const parsed = JSON.parse(raw) as Partial<LocalProfile>;
    return { ...emptyProfile(), ...parsed, version: 1 };
  } catch {
    return emptyProfile();
  }
}

export function writeProfile(next: LocalProfile): LocalProfile {
  const value = { ...next, updatedAt: new Date().toISOString() };
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("school-profile-change"));
  return value;
}

export function updateProfile(patch: (p: LocalProfile) => LocalProfile): LocalProfile {
  return writeProfile(patch(readProfile()));
}

export function toggleInList(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export function exportProfileFile() {
  const profile = readProfile();
  const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `نسخة-${profile.name || "طالب"}-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importProfileFile(file: File): Promise<LocalProfile> {
  const text = await file.text();
  const parsed = JSON.parse(text) as Partial<LocalProfile>;
  if (typeof parsed !== "object" || parsed === null || parsed.version !== 1) {
    throw new Error("الملف غير صالح — لازم يكون ملف نسخة احتياطية من نفس المنصة.");
  }
  return writeProfile({ ...emptyProfile(), ...parsed, version: 1 });
}
