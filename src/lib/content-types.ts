import type { GradeLevel } from "./grades";

export interface Course { id: string; title: string; description: string; cover: string; isPaid: boolean; price?: number; studentsCount: number; gradeLevel: GradeLevel; units: Unit[] }
export interface Unit { id: string; title: string; lessons: Lesson[]; sortOrder?: number }
export interface Lesson { id: string; title: string; videos: LessonVideo[]; files: LessonFile[]; exams: LessonExam[]; sortOrder?: number; status?: "watched" | "in-progress" | "not-started" | "locked"; progress?: number }
export interface LessonVideo { id: string; title: string; url: string; durationSec?: number; sortOrder?: number }
export interface LessonFile { id: string; name: string; kind: "pdf" | "image" | "note" | "book"; url: string; size?: number }
export interface LessonExam { id: string; title: string; questionsCount: number; durationMin?: number; questions?: ExamQuestion[]; shuffleQuestions?: boolean; shuffleAnswers?: boolean; passingPct?: number; attempts?: ExamAttempt[] }
export interface ExamAttemptAnswer { questionId: string; correct: boolean; points: number; earned: number; raw: any }
export interface ExamAttempt { id: string; studentName: string; scorePct: number; earned: number; total: number; timeSec: number; submittedAt: string; answers: ExamAttemptAnswer[] }
export type ExamQType = "mcq" | "tf" | "multi" | "order" | "match" | "image" | "audio" | "essay";
export interface ExamQBase { id: string; type: ExamQType; text: string; points: number }
export interface ExamMCQ extends ExamQBase { type: "mcq"; options: string[]; correct: number }
export interface ExamTF extends ExamQBase { type: "tf"; correct: boolean }
export interface ExamMulti extends ExamQBase { type: "multi"; options: string[]; correct: number[] }
export interface ExamOrder extends ExamQBase { type: "order"; items: string[] }
export interface ExamMatch extends ExamQBase { type: "match"; pairs: { left: string; right: string }[] }
export interface ExamImage extends ExamQBase { type: "image"; imageUrl: string; options: string[]; correct: number }
export interface ExamAudio extends ExamQBase { type: "audio"; audioUrl: string; options: string[]; correct: number }
export interface ExamEssay extends ExamQBase { type: "essay" }
export type ExamQuestion = ExamMCQ | ExamTF | ExamMulti | ExamOrder | ExamMatch | ExamImage | ExamAudio | ExamEssay;
export const EXAM_TYPE_LABELS: Record<ExamQType, string> = { mcq: "اختيار من متعدد", tf: "صح / خطأ", multi: "متعدد الإجابات", order: "ترتيب", match: "مطابقة", image: "سؤال بصورة", audio: "سؤال بصوت", essay: "مقالي" };
export const EXAM_AUTO_GRADED: Record<ExamQType, boolean> = { mcq: true, tf: true, multi: true, order: true, match: true, image: true, audio: true, essay: false };
export function makeExamQuestion(type: ExamQType): ExamQuestion { const base = { id: crypto.randomUUID(), text: "", points: 1 }; switch (type) { case "mcq": return { ...base, type, options: ["", "", "", ""], correct: 0 }; case "tf": return { ...base, type, correct: true }; case "multi": return { ...base, type, options: ["", "", "", ""], correct: [] }; case "order": return { ...base, type, items: ["", "", ""] }; case "match": return { ...base, type, pairs: [{ left: "", right: "" }, { left: "", right: "" }] }; case "image": return { ...base, type, imageUrl: "", options: ["", ""], correct: 0 }; case "audio": return { ...base, type, audioUrl: "", options: ["", ""], correct: 0 }; case "essay": return { ...base, type }; } }
export function parseYouTubeId(input: string): string | null { if (!input) return null; const s = input.trim(); if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s; try { const u = new URL(s); if (u.hostname.includes("youtu.be")) { const id = u.pathname.slice(1); return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null; } const v = u.searchParams.get("v"); if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v; const m = u.pathname.match(/\/(embed|shorts)\/([A-Za-z0-9_-]{11})/); return m?.[2] ?? null; } catch { return null; } }