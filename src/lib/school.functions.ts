import { createServerFn } from "@tanstack/react-start";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { ExamQuestion } from "@/lib/content-types";

/** عميل قراءة عام (بدون حساب) — مناسب لكل صفحات الطلاب. */
function publicClient(): SupabaseClient<Database> {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

async function sign(sb: SupabaseClient<Database>, value: string | null | undefined): Promise<string> {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const [bucket, ...rest] = value.split("/");
  if (!bucket || rest.length === 0) return "";
  const { data } = await sb.storage.from(bucket).createSignedUrl(rest.join("/"), 60 * 60 * 4);
  return data?.signedUrl ?? "";
}

export interface PublicTeacher {
  id: string;
  name: string;
  subject: string;
  bio: string;
  photo: string;
  coursesCount: number;
}

export const listGradeTeachers = createServerFn({ method: "GET" })
  .inputValidator((data: { grade: string }) => data)
  .handler(async ({ data }): Promise<PublicTeacher[]> => {
    const sb = publicClient();
    const { data: links } = await sb.from("teacher_grades").select("teacher_id").eq("grade", data.grade);
    const ids = (links ?? []).map((l) => l.teacher_id);
    if (ids.length === 0) return [];
    const [{ data: teachers }, { data: courses }] = await Promise.all([
      sb.from("teachers").select("id, name, subject, bio, photo_url, sort_order").in("id", ids).eq("is_published", true).order("sort_order"),
      sb.from("courses").select("id, teacher_id").in("teacher_id", ids).eq("grade", data.grade).eq("is_published", true),
    ]);
    return Promise.all(
      (teachers ?? []).map(async (t) => ({
        id: t.id,
        name: t.name,
        subject: t.subject,
        bio: t.bio,
        photo: await sign(sb, t.photo_url),
        coursesCount: (courses ?? []).filter((c) => c.teacher_id === t.id).length,
      })),
    );
  });

export interface PublicCourseCard {
  id: string;
  title: string;
  description: string;
  cover: string;
  lessonsCount: number;
}

export const getTeacherPage = createServerFn({ method: "GET" })
  .inputValidator((data: { teacherId: string; grade: string }) => data)
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: t } = await sb
      .from("teachers")
      .select("id, name, subject, bio, photo_url")
      .eq("id", data.teacherId)
      .eq("is_published", true)
      .maybeSingle();
    if (!t) return null;
    const { data: courses } = await sb
      .from("courses")
      .select("id, title, description, cover_url, sort_order")
      .eq("teacher_id", data.teacherId)
      .eq("grade", data.grade)
      .eq("is_published", true)
      .order("sort_order");
    const courseIds = (courses ?? []).map((c) => c.id);
    let lessonCounts: Record<string, number> = {};
    if (courseIds.length) {
      const { data: units } = await sb.from("units").select("id, course_id").in("course_id", courseIds);
      const unitIds = (units ?? []).map((u) => u.id);
      if (unitIds.length) {
        const { data: lessons } = await sb.from("lessons").select("id, unit_id").in("unit_id", unitIds);
        lessonCounts = (lessons ?? []).reduce<Record<string, number>>((acc, l) => {
          const courseId = (units ?? []).find((u) => u.id === l.unit_id)?.course_id;
          if (courseId) acc[courseId] = (acc[courseId] ?? 0) + 1;
          return acc;
        }, {});
      }
    }
    return {
      teacher: {
        id: t.id,
        name: t.name,
        subject: t.subject,
        bio: t.bio,
        photo: await sign(sb, t.photo_url),
      },
      courses: await Promise.all(
        (courses ?? []).map(async (c): Promise<PublicCourseCard> => ({
          id: c.id,
          title: c.title,
          description: c.description,
          cover: await sign(sb, c.cover_url),
          lessonsCount: lessonCounts[c.id] ?? 0,
        })),
      ),
    };
  });

export interface PublicLesson {
  id: string;
  title: string;
  videos: { id: string; title: string; url: string }[];
  files: { id: string; name: string; url: string }[];
  exams: { id: string; title: string; durationMin: number; questionsCount: number }[];
}

export const getCoursePage = createServerFn({ method: "GET" })
  .inputValidator((data: { courseId: string }) => data)
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: course } = await sb
      .from("courses")
      .select("id, title, description, cover_url, grade, teacher_id")
      .eq("id", data.courseId)
      .eq("is_published", true)
      .maybeSingle();
    if (!course) return null;
    const { data: teacher } = await sb.from("teachers").select("id, name, subject").eq("id", course.teacher_id).maybeSingle();
    const { data: units } = await sb.from("units").select("id, title, sort_order").eq("course_id", course.id).order("sort_order");
    const unitIds = (units ?? []).map((u) => u.id);
    const { data: lessons } = unitIds.length
      ? await sb.from("lessons").select("id, unit_id, title, sort_order").in("unit_id", unitIds).order("sort_order")
      : { data: [] };
    const lessonIds = (lessons ?? []).map((l) => l.id);
    const [videosRes, filesRes, examsRes] = lessonIds.length
      ? await Promise.all([
          sb.from("videos").select("id, lesson_id, title, url, sort_order").in("lesson_id", lessonIds).order("sort_order"),
          sb.from("lesson_files").select("id, lesson_id, name, url, sort_order").in("lesson_id", lessonIds).order("sort_order"),
          sb.from("exams").select("id, lesson_id, title, duration_min, questions, sort_order").in("lesson_id", lessonIds).eq("is_published", true).order("sort_order"),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }];

    const files = await Promise.all(
      (filesRes.data ?? []).map(async (f) => ({ ...f, signed: await sign(sb, f.url) })),
    );

    return {
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        cover: await sign(sb, course.cover_url),
        grade: course.grade,
      },
      teacher: teacher ? { id: teacher.id, name: teacher.name, subject: teacher.subject } : null,
      units: (units ?? []).map((u) => ({
        id: u.id,
        title: u.title,
        lessons: (lessons ?? [])
          .filter((l) => l.unit_id === u.id)
          .map((l): PublicLesson => ({
            id: l.id,
            title: l.title,
            videos: (videosRes.data ?? []).filter((v) => v.lesson_id === l.id).map((v) => ({ id: v.id, title: v.title, url: v.url })),
            files: files.filter((f) => f.lesson_id === l.id).map((f) => ({ id: f.id, name: f.name, url: f.signed })),
            exams: (examsRes.data ?? [])
              .filter((e) => e.lesson_id === l.id)
              .map((e) => ({
                id: e.id,
                title: e.title,
                durationMin: e.duration_min,
                questionsCount: Array.isArray(e.questions) ? e.questions.length : 0,
              })),
          })),
      })),
    };
  });

export const getExamPage = createServerFn({ method: "GET" })
  .inputValidator((data: { examId: string }) => data)
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: exam } = await sb
      .from("exams")
      .select("id, title, duration_min, passing_pct, shuffle_questions, questions, lesson_id")
      .eq("id", data.examId)
      .eq("is_published", true)
      .maybeSingle();
    if (!exam) return null;
    const { data: lesson } = await sb.from("lessons").select("id, title, unit_id").eq("id", exam.lesson_id).maybeSingle();
    const { data: unit } = lesson
      ? await sb.from("units").select("id, course_id").eq("id", lesson.unit_id).maybeSingle()
      : { data: null };
    const { data: course } = unit
      ? await sb.from("courses").select("id, title").eq("id", unit.course_id).maybeSingle()
      : { data: null };
    return {
      exam: {
        id: exam.id,
        title: exam.title,
        durationMin: exam.duration_min,
        passingPct: exam.passing_pct,
        shuffleQuestions: exam.shuffle_questions,
        questions: (Array.isArray(exam.questions) ? exam.questions : []) as unknown as ExamQuestion[],
      },
      lessonTitle: lesson?.title ?? "",
      course: course ? { id: course.id, title: course.title } : null,
    };
  });

/** أرقام الصفحة الرئيسية: عدد المدرسين والكورسات لكل صف. */
export const getSchoolSummary = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const [{ data: links }, { data: courses }] = await Promise.all([
    sb.from("teacher_grades").select("grade, teacher_id"),
    sb.from("courses").select("id, grade").eq("is_published", true),
  ]);
  const byGrade: Record<string, { teachers: number; courses: number }> = {};
  for (const l of links ?? []) {
    byGrade[l.grade] = byGrade[l.grade] ?? { teachers: 0, courses: 0 };
    byGrade[l.grade]!.teachers += 1;
  }
  for (const c of courses ?? []) {
    byGrade[c.grade] = byGrade[c.grade] ?? { teachers: 0, courses: 0 };
    byGrade[c.grade]!.courses += 1;
  }
  return byGrade;
});
