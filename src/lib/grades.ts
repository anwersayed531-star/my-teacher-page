export const GRADES = [
  { slug: "sec1", name: "الصف الأول الثانوي", short: "أولى ثانوي" },
  { slug: "sec2", name: "الصف الثاني الثانوي", short: "ثانية ثانوي" },
  { slug: "sec3", name: "الصف الثالث الثانوي", short: "ثالثة ثانوي" },
] as const;

export type GradeSlug = (typeof GRADES)[number]["slug"];

export function isGradeSlug(value: string): value is GradeSlug {
  return GRADES.some((g) => g.slug === value);
}

export function gradeName(slug: string): string {
  return GRADES.find((g) => g.slug === slug)?.name ?? slug;
}
