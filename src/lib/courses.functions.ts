import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import type { Course, ExamQuestion, ExamAttempt, LessonExam } from "./mock-data";

// === Schemas ===
const courseInput = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().default(""),
  cover: z.string().default(""),
  isPaid: z.boolean().default(false),
  price: z.number().optional(),
  gradeLevel: z.string().default(""),
  studentsCount: z.number().default(0),
});

const unitInput = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  sortOrder: z.number().default(0),
});

const videoInput = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  url: z.string().min(1),
  durationSec: z.number().optional(),
  sortOrder: z.number().default(0),
});

const fileInput = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  kind: z.string().default("pdf"),
  url: z.string().default(""),
  size: z.number().optional(),
});

const examInput = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  durationMin: z.number().default(30),
  passingPct: z.number().default(60),
  shuffleQuestions: z.boolean().default(false),
  shuffleAnswers: z.boolean().default(false),
  questions: z.array(z.any()).default([]),
});

const lessonInput = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  sortOrder: z.number().default(0),
  videos: z.array(videoInput).default([]),
  files: z.array(fileInput).default([]),
  exams: z.array(examInput).default([]),
});

const saveCourseInput = z.object({
  course: courseInput,
  units: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string().min(1),
      sortOrder: z.number().default(0),
      lessons: z.array(lessonInput).default([]),
    })
  ).default([]),
});

const recordAttemptInput = z.object({
  examId: z.string(),
  answers: z.array(z.any()).default([]),
  timeSec: z.number().default(0),
});

// === Helpers ===
function toDbCourse(input: z.infer<typeof courseInput>) {
  return {
    title: input.title,
    description: input.description,
    cover_url: input.cover,
    is_paid: input.isPaid,
    price: input.price,
    grade_level: input.gradeLevel,
    students_count: input.studentsCount,
  };
}

function toCourse(row: any, units: any[] = [], cover = row.cover_url ?? ""): Course {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    cover,
    isPaid: row.is_paid ?? false,
    price: row.price ?? undefined,
    studentsCount: row.students_count ?? 0,
    gradeLevel: row.grade_level ?? "",
    units: units,
  };
}

async function resolveStorageUrl(supabase: any, value: string | null | undefined) {
  if (!value?.startsWith("storage://")) return value ?? "";
  const match = value.match(/^storage:\/\/([^/]+)\/(.+)$/);
  if (!match) return "";
  const { data } = await supabase.storage.from(match[1]).createSignedUrl(match[2], 3600);
  return data?.signedUrl ?? "";
}

function toUnit(row: any, lessons: any[] = []) {
  return {
    id: row.id,
    title: row.title,
    sortOrder: row.sort_order ?? 0,
    lessons,
  };
}

function toLesson(row: any, videos: any[], files: any[], exams: any[]) {
  return {
    id: row.id,
    title: row.title,
    sortOrder: row.sort_order ?? 0,
    videos: videos.map((v) => ({
      id: v.id,
      title: v.title,
      url: v.url,
      durationSec: v.duration_sec ?? undefined,
    })),
     files: files.map((f) => ({
      id: f.id,
      name: f.name,
      kind: f.kind ?? "pdf",
      url: f.public_url ?? "",
      size: f.size ?? undefined,
    })),
    exams: exams.map((e) => toLessonExam(e)),
  };
}

function toLessonExam(e: any): LessonExam {
  return {
    id: e.id,
    title: e.title,
    questionsCount: e.questions?.length ?? 0,
    durationMin: e.duration_min ?? 30,
    passingPct: e.passing_pct ?? 60,
    shuffleQuestions: e.shuffle_questions ?? false,
    shuffleAnswers: e.shuffle_answers ?? false,
    questions: (e.questions ?? []) as ExamQuestion[],
  };
}

function toDbExam(input: z.infer<typeof examInput>) {
  return {
    title: input.title,
    duration_min: input.durationMin,
    passing_pct: input.passingPct,
    shuffle_questions: input.shuffleQuestions,
    shuffle_answers: input.shuffleAnswers,
    questions: input.questions as unknown as Json,
  };
}

function toExamAttempt(row: any, name?: string): ExamAttempt {
  return {
    id: row.id,
    studentName: name ?? "طالب",
    scorePct: row.score_pct ?? 0,
    earned: row.earned ?? 0,
    total: row.total ?? 0,
    timeSec: row.time_sec ?? 0,
    submittedAt: row.submitted_at,
    answers: (row.answers ?? []) as ExamAttempt["answers"],
  };
}

function gradeExam(questions: ExamQuestion[], answers: any[]) {
  let total = 0;
  let earned = 0;
  const results: ExamAttempt["answers"] = [];

  for (const q of questions) {
    total += q.points ?? 1;
    const studentAnswer = answers.find((a) => a.questionId === q.id);
    const raw = studentAnswer?.value ?? null;
    let correct = false;
    let points = 0;

    switch (q.type) {
      case "mcq":
      case "image":
      case "audio":
        correct = raw === q.correct;
        break;
      case "tf":
        correct = raw === q.correct;
        break;
      case "multi":
        if (Array.isArray(raw) && Array.isArray(q.correct)) {
          correct = raw.length === q.correct.length && raw.every((v) => (q.correct as number[]).includes(v));
        }
        break;
      case "order":
        if (Array.isArray(raw) && Array.isArray(q.items)) {
          correct = raw.length === q.items.length && raw.every((v, i) => v === q.items[i]);
        }
        break;
      case "match":
        correct = false; // manual grading
        break;
      case "essay":
        correct = false; // manual grading
        break;
    }

    if (correct) {
      points = q.points ?? 1;
      earned += points;
    }

    results.push({
      questionId: q.id,
      correct,
      points: q.points ?? 1,
      earned: points,
      raw,
    });
  }

  const scorePct = total > 0 ? Math.round((earned / total) * 100) : 0;
  return { total, earned, scorePct, results };
}

// === Server functions ===

export const listTeacherCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("courses")
      .select("*")
      .eq("teacher_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return Promise.all((data ?? []).map(async (row) => toCourse(row, [], await resolveStorageUrl(context.supabase, row.cover_url))));
  });

export const listStudentCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("courses")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return Promise.all((data ?? []).map(async (row) => toCourse(row, [], await resolveStorageUrl(context.supabase, row.cover_url))));
  });

export const getCourse = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({ courseId: z.string() }).parse(data))
  .handler(async ({ context, data }) => {

    const { data: courseRow, error: courseError } = await context.supabase
      .from("courses")
      .select("*")
      .eq("id", data.courseId)
      .single();
    if (courseError || !courseRow) throw courseError ?? new Error("Course not found");

    const { data: units, error: unitsError } = await context.supabase
      .from("units")
      .select("*")
      .eq("course_id", data.courseId)
      .order("sort_order", { ascending: true });
    if (unitsError) throw unitsError;

    const unitIds = (units ?? []).map((u) => u.id);
    let lessons: any[] = [];
    if (unitIds.length > 0) {
      const { data: ls } = await context.supabase
        .from("lessons")
        .select("*")
        .in("unit_id", unitIds)
        .order("sort_order", { ascending: true });
      lessons = ls ?? [];
    }
    const lessonIds = lessons.map((l) => l.id);

    let videos: any[] = [];
    let files: any[] = [];
    let exams: any[] = [];
    if (lessonIds.length > 0) {
      const [{ data: v }, { data: f }, { data: e }] = await Promise.all([
        context.supabase.from("videos").select("*").in("lesson_id", lessonIds).order("sort_order", { ascending: true }),
        context.supabase.from("lesson_files").select("*").in("lesson_id", lessonIds),
        context.supabase.from("exams").select("*").in("lesson_id", lessonIds),
      ]);
      videos = v ?? [];
      files = await Promise.all((f ?? []).map(async (row) => ({
        ...row,
        public_url: await resolveStorageUrl(context.supabase, row.storage_path || row.public_url),
      })));
      exams = e ?? [];
    }

    const builtUnits = (units ?? []).map((u) => {
      const unitLessons = lessons
        .filter((l) => l.unit_id === u.id)
        .map((l) => {
          const lessonVideos = videos.filter((v) => v.lesson_id === l.id);
          const lessonFiles = files.filter((f) => f.lesson_id === l.id);
          const lessonExams = exams.filter((e) => e.lesson_id === l.id);
          return toLesson(l, lessonVideos, lessonFiles, lessonExams);
        });
      return toUnit(u, unitLessons);
    });

    return toCourse(courseRow, builtUnits, await resolveStorageUrl(context.supabase, courseRow.cover_url));
  });

export const saveCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => saveCourseInput.parse(data))
  .handler(async ({ context, data }) => {
    const courseData = {
      ...toDbCourse(data.course),
      teacher_id: context.userId,
    };

    const { data: courseRow, error: courseError } = data.course.id
      ? await context.supabase.from("courses").update(courseData).eq("id", data.course.id).eq("teacher_id", context.userId).select("*").single()
      : await context.supabase.from("courses").insert(courseData).select("*").single();
    if (courseError || !courseRow) throw courseError ?? new Error("Failed to save course");

    const courseId = courseRow.id;

    const keepUnitIds = data.units.map((u) => u.id).filter(Boolean) as string[];
    if (keepUnitIds.length > 0) {
      await context.supabase.from("units").delete().eq("course_id", courseId).not("id", "in", `(${keepUnitIds.join(",")})`);
    } else {
      await context.supabase.from("units").delete().eq("course_id", courseId);
    }

    for (const unit of data.units) {
      const unitData = { course_id: courseId, title: unit.title, sort_order: unit.sortOrder };
      const { data: unitRow } = unit.id
        ? await context.supabase.from("units").update(unitData).eq("id", unit.id).select("*").single()
        : await context.supabase.from("units").insert(unitData).select("*").single();
      if (!unitRow) continue;
      const unitId = unitRow.id;

      const keepLessonIds = unit.lessons.map((l) => l.id).filter(Boolean) as string[];
      if (keepLessonIds.length > 0) {
        await context.supabase.from("lessons").delete().eq("unit_id", unitId).not("id", "in", `(${keepLessonIds.join(",")})`);
      } else {
        await context.supabase.from("lessons").delete().eq("unit_id", unitId);
      }

      for (const lesson of unit.lessons) {
        const lessonData = { unit_id: unitId, title: lesson.title, sort_order: lesson.sortOrder };
        const { data: lessonRow } = lesson.id
          ? await context.supabase.from("lessons").update(lessonData).eq("id", lesson.id).select("*").single()
          : await context.supabase.from("lessons").insert(lessonData).select("*").single();
        if (!lessonRow) continue;
        const lessonId = lessonRow.id;

        const keepVideoIds = lesson.videos.map((v) => v.id).filter(Boolean) as string[];
        if (keepVideoIds.length > 0) {
          await context.supabase.from("videos").delete().eq("lesson_id", lessonId).not("id", "in", `(${keepVideoIds.join(",")})`);
        } else {
          await context.supabase.from("videos").delete().eq("lesson_id", lessonId);
        }
        const videoRows = lesson.videos.map((v, i) => ({
          ...(v.id ? { id: v.id } : {}),
          lesson_id: lessonId,
          title: v.title,
          url: v.url,
          duration_sec: v.durationSec,
          sort_order: v.sortOrder ?? i,
        }));
        if (videoRows.length > 0) {
          await context.supabase.from("videos").upsert(videoRows);
        }

        const keepFileIds = lesson.files.map((f) => f.id).filter(Boolean) as string[];
        if (keepFileIds.length > 0) {
          await context.supabase.from("lesson_files").delete().eq("lesson_id", lessonId).not("id", "in", `(${keepFileIds.join(",")})`);
        } else {
          await context.supabase.from("lesson_files").delete().eq("lesson_id", lessonId);
        }
        const fileRows = lesson.files.map((f) => ({
          ...(f.id ? { id: f.id } : {}),
          lesson_id: lessonId,
          name: f.name,
          kind: f.kind,
           public_url: f.url.startsWith("storage://") ? null : f.url,
           storage_path: f.url.startsWith("storage://") ? f.url.replace(/^storage:\/\/lesson-files\//, "") : null,
          size: f.size,
          created_by: context.userId,
        }));
        if (fileRows.length > 0) {
          await context.supabase.from("lesson_files").upsert(fileRows);
        }

        const keepExamIds = lesson.exams.map((e) => e.id).filter(Boolean) as string[];
        if (keepExamIds.length > 0) {
          await context.supabase.from("exams").delete().eq("lesson_id", lessonId).not("id", "in", `(${keepExamIds.join(",")})`);
        } else {
          await context.supabase.from("exams").delete().eq("lesson_id", lessonId);
        }
        const examRows = lesson.exams.map((e) => ({
          ...(e.id ? { id: e.id } : {}),
          lesson_id: lessonId,
          ...toDbExam(e),
          created_by: context.userId,
        }));
        if (examRows.length > 0) {
          await context.supabase.from("exams").upsert(examRows);
        }
      }
    }

    return { courseId };
  });

export const deleteCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({ courseId: z.string() }).parse(data))
  .handler(async ({ context, data }) => {

    const { error } = await context.supabase.from("courses").delete().eq("id", data.courseId).eq("teacher_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const getExam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({ examId: z.string() }).parse(data))
  .handler(async ({ context, data }) => {

    const { data: examRow, error } = await context.supabase.from("exams").select("*").eq("id", data.examId).single();
    if (error || !examRow) throw error ?? new Error("Exam not found");
    return toLessonExam(examRow);
  });

export const recordAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => recordAttemptInput.parse(data))
  .handler(async ({ context, data }) => {
    const { data: examRow, error } = await context.supabase.from("exams").select("*").eq("id", data.examId).single();
    if (error || !examRow) throw error ?? new Error("Exam not found");

    const questions = (examRow.questions ?? []) as unknown as ExamQuestion[];
    const { total, earned, scorePct, results } = gradeExam(questions, data.answers);

    const { error: insertError } = await context.supabase.from("exam_attempts").insert({
      exam_id: data.examId,
      student_id: context.userId,
      score_pct: scorePct,
      earned,
      total,
      time_sec: data.timeSec,
      answers: results as unknown as Json,
    });
    if (insertError) throw insertError;

    return { scorePct, earned, total, results };
  });

export const getExamResults = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data) => z.object({ examId: z.string() }).parse(data))
  .handler(async ({ context, data }) => {

    const { data: examRow, error } = await context.supabase.from("exams").select("*").eq("id", data.examId).single();
    if (error || !examRow) throw error ?? new Error("Exam not found");

    const { data: attempts, error: attemptsError } = await context.supabase
      .from("exam_attempts")
      .select("*")
      .eq("exam_id", data.examId)
      .order("submitted_at", { ascending: false });
    if (attemptsError) throw attemptsError;

    const studentIds = [...new Set((attempts ?? []).map((a: any) => a.student_id))];
    const names = new Map<string, string>();
    if (studentIds.length > 0) {
      const { data: profiles } = await context.supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", studentIds);
      for (const p of profiles ?? []) names.set((p as any).id, (p as any).full_name ?? "طالب");
    }

    return {
      exam: toLessonExam(examRow),
      attempts: (attempts ?? []).map((a: any) => toExamAttempt(a, names.get(a.student_id))),
    };
  });
