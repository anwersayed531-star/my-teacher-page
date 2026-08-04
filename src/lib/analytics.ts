// TODO: connect to Supabase — every metric below (attendance, videos watched,
// engagement score, last-login days, missed-questions percentages, at-risk flags)
// will come from real event/exam tables. All values here are UI-only mocks so
// the screens are fully clickable.
import { mockStudents } from "./mock-data";

export interface StudentMetrics {
  id: string;
  name: string;
  gradeLevel: string;
  avgGrade: number;
  // TODO: connect to Supabase — attendance = sessions attended / sessions scheduled.
  attendancePct: number;
  // TODO: connect to Supabase — count from video_watch events per student.
  videosWatched: number;
  // TODO: connect to Supabase — from auth.sessions / last_sign_in_at.
  lastLoginDays: number;
  // TODO: connect to Supabase — weighted score from views + comments + reactions + logins.
  engagementScore: number;
  // TODO: connect to Supabase — replay counts of comments and reactions authored.
  commentsCount: number;
  reactionsCount: number;
}

// Deterministic mock derivation, keyed to student id so it stays stable across renders.
export const studentMetrics: StudentMetrics[] = mockStudents.map((s, i) => {
  const seed = (i + 1) * 37;
  return {
    id: s.id,
    name: s.name,
    gradeLevel: s.gradeLevel,
    avgGrade: s.avgGrade,
    attendancePct: [92, 78, 58, 84][i % 4],
    videosWatched: [48, 32, 12, 27][i % 4],
    lastLoginDays: [0, 1, 14, 9][i % 4],
    engagementScore: [95, 82, 34, 68][i % 4],
    commentsCount: (seed % 11) + 3,
    reactionsCount: (seed % 17) + 5,
  };
});

// TODO: connect to Supabase — thresholds should be configurable per teacher.
export function isAtRisk(m: Pick<StudentMetrics, "avgGrade" | "attendancePct">) {
  return m.avgGrade < 60 || m.attendancePct < 70;
}

export function metricsForStudent(id: string): StudentMetrics {
  return (
    studentMetrics.find((m) => m.id === id) ?? {
      id,
      name: "طالب",
      gradeLevel: "",
      avgGrade: 0,
      attendancePct: 0,
      videosWatched: 0,
      lastLoginDays: 0,
      engagementScore: 0,
      commentsCount: 0,
      reactionsCount: 0,
    }
  );
}

// TODO: connect to Supabase — aggregated from exam_answers per question.
export const mostMissedQuestions = [
  { id: "q1", exam: "اختبار الشهر الأول — الرياضيات", text: "أوجد نهاية الدالة عند س = ٠", errorPct: 78, correctAnswer: "٢" },
  { id: "q2", exam: "اختبار التفاضل السريع", text: "مشتقة sin(x)·cos(x)", errorPct: 71, correctAnswer: "cos(2x)" },
  { id: "q3", exam: "اختبار الوحدة الثانية", text: "التكامل بالتجزئة لـ x·eˣ", errorPct: 65, correctAnswer: "eˣ(x-1)" },
  { id: "q4", exam: "اختبار المراجعة", text: "قاعدة السلسلة في المشتقات", errorPct: 59, correctAnswer: "f'(g(x))·g'(x)" },
  { id: "q5", exam: "اختبار التكامل", text: "تكامل 1/x من ١ إلى e", errorPct: 52, correctAnswer: "١" },
];

// TODO: connect to Supabase — schedule reminder via edge function + email/SMS.
export function sendReminder(_studentId: string) {
  // no-op mock
}

export function exportRowsToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv =
    headers.join(",") +
    "\n" +
    rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
