export type ExamQType = "mcq" | "tf" | "multi" | "essay";

export interface ExamQBase {
  id: string;
  type: ExamQType;
  text: string;
  points: number;
}
export interface ExamMCQ extends ExamQBase { type: "mcq"; options: string[]; correct: number }
export interface ExamTF extends ExamQBase { type: "tf"; correct: boolean }
export interface ExamMulti extends ExamQBase { type: "multi"; options: string[]; correct: number[] }
export interface ExamEssay extends ExamQBase { type: "essay" }
export type ExamQuestion = ExamMCQ | ExamTF | ExamMulti | ExamEssay;

export const EXAM_TYPE_LABELS: Record<ExamQType, string> = {
  mcq: "اختيار من متعدد",
  tf: "صح / خطأ",
  multi: "متعدد الإجابات",
  essay: "مقالي",
};

export const EXAM_AUTO_GRADED: Record<ExamQType, boolean> = { mcq: true, tf: true, multi: true, essay: false };

export function makeExamQuestion(type: ExamQType): ExamQuestion {
  const base = { id: crypto.randomUUID(), text: "", points: 1 };
  switch (type) {
    case "mcq":
      return { ...base, type, options: ["", "", "", ""], correct: 0 };
    case "tf":
      return { ...base, type, correct: true };
    case "multi":
      return { ...base, type, options: ["", "", "", ""], correct: [] };
    case "essay":
      return { ...base, type };
  }
}

export function parseYouTubeId(input: string): string | null {
  if (!input) return null;
  const s = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.slice(1);
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }
    const v = u.searchParams.get("v");
    if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
    const m = u.pathname.match(/\/(embed|shorts)\/([A-Za-z0-9_-]{11})/);
    return m?.[2] ?? null;
  } catch {
    return null;
  }
}
