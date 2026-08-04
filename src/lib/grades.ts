// TODO: connect to Supabase — grade levels will come from DB later.
export const GRADE_LEVELS = [
  "الصف الأول الإعدادي",
  "الصف الثاني الإعدادي",
  "الصف الثالث الإعدادي",
  "الصف الأول الثانوي",
  "الصف الثاني الثانوي",
  "الصف الثالث الثانوي",
] as const;

export type GradeLevel = (typeof GRADE_LEVELS)[number];
