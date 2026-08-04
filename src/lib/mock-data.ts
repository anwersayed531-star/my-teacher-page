// TODO: connect to Supabase — all data below is local mock data for UI development.
import type { GradeLevel } from "./grades";

export type Role = "teacher" | "student" | "assistant";

export interface Course {
  id: string;
  title: string;
  description: string;
  cover: string;
  isPaid: boolean;
  price?: number;
  studentsCount: number;
  gradeLevel: GradeLevel;
  units: Unit[];
}

export interface Unit {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  videos: LessonVideo[];
  files: LessonFile[];
  exams: LessonExam[];
  status?: "watched" | "in-progress" | "not-started" | "locked";
  progress?: number;
}

export interface LessonVideo {
  id: string;
  title: string;
  url: string; // external URL (Bunny/Vimeo etc.)
  durationSec?: number;
}
export interface LessonFile {
  id: string;
  name: string;
  kind: "pdf" | "image" | "note" | "book";
  url: string;
  dataUrl?: string; // in-memory upload (base64); TODO: replace with Supabase Storage URL.
  size?: number;
}
export interface LessonExam {
  id: string;
  title: string;
  questionsCount: number;
  durationMin?: number;
  questions?: ExamQuestion[];
  shuffleQuestions?: boolean;
  shuffleAnswers?: boolean;
  passingPct?: number;
  attempts?: ExamAttempt[];
}

export interface ExamAttemptAnswer {
  questionId: string;
  correct: boolean;
  points: number;
  earned: number;
  raw: any;
}

export interface ExamAttempt {
  id: string;
  studentName: string;
  scorePct: number;
  earned: number;
  total: number;
  timeSec: number;
  submittedAt: string;
  answers: ExamAttemptAnswer[];
}

// ==== Exam question types (shared between builder and runner) ====
export type ExamQType =
  | "mcq" | "tf" | "multi" | "order" | "match" | "image" | "audio" | "essay";

export interface ExamQBase { id: string; type: ExamQType; text: string; points: number }
export interface ExamMCQ extends ExamQBase { type: "mcq"; options: string[]; correct: number }
export interface ExamTF extends ExamQBase { type: "tf"; correct: boolean }
export interface ExamMulti extends ExamQBase { type: "multi"; options: string[]; correct: number[] }
export interface ExamOrder extends ExamQBase { type: "order"; items: string[] }
export interface ExamMatch extends ExamQBase { type: "match"; pairs: { left: string; right: string }[] }
export interface ExamImage extends ExamQBase { type: "image"; imageUrl: string; options: string[]; correct: number }
export interface ExamAudio extends ExamQBase { type: "audio"; audioUrl: string; options: string[]; correct: number }
export interface ExamEssay extends ExamQBase { type: "essay" }
export type ExamQuestion =
  | ExamMCQ | ExamTF | ExamMulti | ExamOrder | ExamMatch | ExamImage | ExamAudio | ExamEssay;

export const EXAM_TYPE_LABELS: Record<ExamQType, string> = {
  mcq: "اختيار من متعدد", tf: "صح / خطأ", multi: "متعدد الإجابات",
  order: "ترتيب", match: "مطابقة", image: "سؤال بصورة", audio: "سؤال بصوت", essay: "مقالي",
};
export const EXAM_AUTO_GRADED: Record<ExamQType, boolean> = {
  mcq: true, tf: true, multi: true, order: true, match: true, image: true, audio: true, essay: false,
};

export function makeExamQuestion(type: ExamQType): ExamQuestion {
  const base = { id: `q${Date.now()}${Math.random().toString(36).slice(2, 5)}`, text: "", points: 1 };
  switch (type) {
    case "mcq": return { ...base, type, options: ["", "", "", ""], correct: 0 };
    case "tf": return { ...base, type, correct: true };
    case "multi": return { ...base, type, options: ["", "", "", ""], correct: [] };
    case "order": return { ...base, type, items: ["", "", ""] };
    case "match": return { ...base, type, pairs: [{ left: "", right: "" }, { left: "", right: "" }] };
    case "image": return { ...base, type, imageUrl: "", options: ["", ""], correct: 0 };
    case "audio": return { ...base, type, audioUrl: "", options: ["", ""], correct: 0 };
    case "essay": return { ...base, type };
  }
}

/** Find a lesson exam by id across all courses (in-memory lookup). */
export function findExamById(examId: string): LessonExam | null {
  for (const c of mockCourses) {
    for (const u of c.units) {
      for (const l of u.lessons) {
        const e = l.exams.find((x) => x.id === examId);
        if (e) return e;
      }
    }
  }
  return null;
}

/** Locate the course/unit/lesson containing an exam. */
export function findExamLocation(examId: string):
  | { course: Course; unit: Unit; lesson: Lesson; exam: LessonExam }
  | null {
  for (const course of mockCourses) {
    for (const unit of course.units) {
      for (const lesson of unit.lessons) {
        const exam = lesson.exams.find((x) => x.id === examId);
        if (exam) return { course, unit, lesson, exam };
      }
    }
  }
  return null;
}

/** Insert an exam into a specific lesson (mutates in-memory mockCourses). */
export function addExamToLesson(
  courseId: string, unitId: string, lessonId: string, exam: LessonExam,
): boolean {
  const c = mockCourses.find((x) => x.id === courseId); if (!c) return false;
  const u = c.units.find((x) => x.id === unitId); if (!u) return false;
  const l = u.lessons.find((x) => x.id === lessonId); if (!l) return false;
  l.exams.push(exam);
  return true;
}

/** Append an attempt to an exam (in-memory). */
export function recordExamAttempt(examId: string, attempt: ExamAttempt): void {
  const e = findExamById(examId); if (!e) return;
  e.attempts = [...(e.attempts ?? []), attempt];
}

// Sample working YouTube video IDs (unlisted-style demo; real courses will use teacher's own unlisted uploads).
// TODO: connect to Supabase — teacher enters URL, we store the parsed YouTube ID.
export const SAMPLE_YOUTUBE_ID = "aqz-KE-bpKQ"; // Big Buck Bunny on YouTube
export const SAMPLE_VIDEO_URL = `https://www.youtube.com/watch?v=${SAMPLE_YOUTUBE_ID}`;

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
    if (m) return m[2];
  } catch { /* not a URL */ }
  return null;
}

export const mockCourses: Course[] = [
  {
    id: "c1",
    title: "الرياضيات — الصف الثالث الثانوي",
    description: "منهج شامل مع تمارين وامتحانات دورية.",
    cover: "",
    isPaid: true,
    price: 250,
    studentsCount: 128,
    gradeLevel: "الصف الثالث الثانوي",
    units: [
      {
        id: "u1",
        title: "الشهر الأول — التفاضل",
        lessons: [
          {
            id: "l1",
            title: "مقدمة في التفاضل",
            status: "watched",
            progress: 100,
            videos: [
              { id: "v1", title: "الشرح النظري", url: SAMPLE_VIDEO_URL },
              { id: "v2", title: "أمثلة محلولة", url: SAMPLE_VIDEO_URL },
            ],
            files: [
              { id: "f1", name: "ملخص الدرس.pdf", kind: "pdf", url: "#" },
            ],
            exams: [{ id: "e1", title: "اختبار سريع", questionsCount: 5 }],
          },
          {
            id: "l2",
            title: "قواعد التفاضل",
            status: "in-progress",
            progress: 45,
            videos: [{ id: "v3", title: "قواعد الجمع والضرب", url: SAMPLE_VIDEO_URL }],
            files: [],
            exams: [],
          },
        ],
      },
      {
        id: "u2",
        title: "الشهر الثاني — التكامل",
        lessons: [
          {
            id: "l3",
            title: "مقدمة التكامل",
            status: "not-started",
            progress: 0,
            videos: [{ id: "v4", title: "المفهوم الأساسي", url: SAMPLE_VIDEO_URL }],
            files: [],
            exams: [],
          },
        ],
      },
    ],
  },
  {
    id: "c2",
    title: "الفيزياء — الصف الثاني الثانوي",
    description: "دورة مبسّطة للفيزياء الحديثة.",
    cover: "",
    isPaid: false,
    studentsCount: 64,
    gradeLevel: "الصف الثاني الثانوي",
    units: [],
  },
];

export const mockStats = {
  students: 192,
  courses: 4,
  lessons: 38,
  videos: 96,
  exams: 22,
};

export const mockActivity = [
  { id: "a1", text: "انضم الطالب أحمد إلى دورة الرياضيات", time: "قبل ٥ دقائق" },
  { id: "a2", text: "تم إضافة درس جديد إلى وحدة التفاضل", time: "قبل ساعة" },
  { id: "a3", text: "أنهى ١٢ طالبًا اختبار الشهر الأول", time: "قبل ٣ ساعات" },
  { id: "a4", text: "تم توليد ٢٠ كود اشتراك جديد", time: "أمس" },
];

export const mockChart = [
  { m: "يناير", v: 30 }, { m: "فبراير", v: 55 }, { m: "مارس", v: 48 },
  { m: "أبريل", v: 72 }, { m: "مايو", v: 90 }, { m: "يونيو", v: 84 },
];

export const mockStudents = [
  { id: "s1", name: "أحمد محمود", email: "ahmed@example.com", phone: "01000000001", courses: 2, avgGrade: 88, joined: "2025-09-01", gradeLevel: "الصف الثالث الثانوي" as const },
  { id: "s2", name: "فاطمة علي", email: "fatma@example.com", phone: "01000000002", courses: 1, avgGrade: 92, joined: "2025-09-12", gradeLevel: "الصف الثالث الثانوي" as const },
  { id: "s3", name: "يوسف حسن", email: "yousef@example.com", phone: "01000000003", courses: 3, avgGrade: 74, joined: "2025-08-20", gradeLevel: "الصف الثاني الثانوي" as const },
  { id: "s4", name: "مريم خالد", email: "mariam@example.com", phone: "01000000004", courses: 2, avgGrade: 81, joined: "2025-10-05", gradeLevel: "الصف الأول الثانوي" as const },
];

export const mockFiles = [
  { id: "f1", name: "ملخص التفاضل.pdf", kind: "pdf", access: "public", size: "1.2MB" },
  { id: "f2", name: "كتاب المراجعة.pdf", kind: "book", access: "subscribers", size: "8.4MB" },
  { id: "f3", name: "صورة الرسم البياني.png", kind: "image", access: "public", size: "340KB" },
  { id: "f4", name: "ملاحظات الحصة.docx", kind: "note", access: "private", size: "82KB" },
];

export const mockCodes = [
  { id: "k1", code: "MATH-2026-AB12", courseId: "c1", durationDays: 30, used: true, usedBy: "أحمد محمود", disabled: false },
  { id: "k2", code: "MATH-2026-CD34", courseId: "c1", durationDays: 30, used: false, usedBy: null, disabled: false },
  { id: "k3", code: "PHYS-2026-EF56", courseId: "c2", durationDays: 60, used: false, usedBy: null, disabled: true },
];

export const mockAssistants = [
  { id: "as1", email: "assistant1@example.com", permissions: { replyMessages: true, addLessons: false, editCourses: false, viewStats: false } },
  { id: "as2", email: "assistant2@example.com", permissions: { replyMessages: true, addLessons: true, editCourses: false, viewStats: true } },
];

export const mockMessages = [
  { id: "m1", studentId: "s1", studentName: "أحمد محمود", lastMessage: "شكرًا على الشرح!", unread: 2, thread: [
    { from: "student", text: "السلام عليكم يا أستاذ", time: "10:00" },
    { from: "teacher", text: "وعليكم السلام، أهلاً بك", time: "10:02" },
    { from: "student", text: "عندي سؤال في درس التفاضل", time: "10:05" },
    { from: "student", text: "شكرًا على الشرح!", time: "10:10" },
  ]},
  { id: "m2", studentId: "s2", studentName: "فاطمة علي", lastMessage: "متى الامتحان القادم؟", unread: 0, thread: [
    { from: "student", text: "متى الامتحان القادم؟", time: "أمس" },
  ]},
];

export type AnnouncementKind = "normal" | "important";
export interface Announcement {
  id: string;
  text: string;
  kind: AnnouncementKind;
  createdAt: string;
}
export const initialAnnouncements: Announcement[] = [
  { id: "an1", text: "تم رفع مراجعة الشهر الأول في قسم الملفات.", kind: "normal", createdAt: "قبل ساعة" },
  { id: "an2", text: "امتحان الشهر يوم الجمعة القادم الساعة ٦ مساءً.", kind: "important", createdAt: "أمس" },
];

export const mockNotifications = [
  { id: "n1", text: "تم إضافة درس جديد في دورة الرياضيات", time: "قبل ١٠ دقائق", read: false },
  { id: "n2", text: "امتحان جديد متاح: مراجعة التفاضل", time: "قبل ساعتين", read: false },
  { id: "n3", text: "رد جديد من الأستاذ على رسالتك", time: "أمس", read: true },
];

export const mockExamResults = [
  { id: "r1", student: "أحمد محمود", score: 92, passed: true, timeSec: 720, attempts: 1 },
  { id: "r2", student: "فاطمة علي", score: 85, passed: true, timeSec: 640, attempts: 1 },
  { id: "r3", student: "يوسف حسن", score: 48, passed: false, timeSec: 900, attempts: 2 },
  { id: "r4", student: "مريم خالد", score: 77, passed: true, timeSec: 810, attempts: 1 },
];
