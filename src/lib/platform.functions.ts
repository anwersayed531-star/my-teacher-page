import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ==================== الطلاب ====================

export interface StudentRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  studentCode: string;
  grade: string;
  joined: string;
  coursesCount: number;
  attemptsCount: number;
  avgScore: number | null;
}

export const listStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles, error: rolesError } = await context.supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "student");
    if (rolesError) throw rolesError;
    const ids = (roles ?? []).map((r) => r.user_id);
    if (ids.length === 0) return [] as StudentRow[];

    const [{ data: profiles }, { data: enrollments }, { data: attempts }] = await Promise.all([
      context.supabase.from("profiles").select("*").in("id", ids),
      context.supabase.from("enrollments").select("student_id, course_id").in("student_id", ids),
      context.supabase.from("exam_attempts").select("student_id, score_pct").in("student_id", ids),
    ]);

    return (profiles ?? []).map((p) => {
      const myEnroll = (enrollments ?? []).filter((e) => e.student_id === p.id);
      const myAttempts = (attempts ?? []).filter((a) => a.student_id === p.id);
      const avg = myAttempts.length
        ? Math.round(myAttempts.reduce((n, a) => n + (a.score_pct ?? 0), 0) / myAttempts.length)
        : null;
      return {
        id: p.id,
        name: p.full_name ?? "طالب",
        email: p.email ?? "",
        phone: p.phone ?? "",
        studentCode: p.student_code ?? "",
        grade: p.grade ?? "",
        joined: p.created_at,
        coursesCount: myEnroll.length,
        attemptsCount: myAttempts.length,
        avgScore: avg,
      } satisfies StudentRow;
    });
  });

export const getStudentDetail = createServerFn({ method: "GET" })
  .validator((data) => z.object({ studentId: z.string() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { data: p, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", data.studentId)
      .maybeSingle();
    if (error) throw error;
    if (!p) throw new Error("الطالب غير موجود");

    const [{ data: enrollments }, { data: attempts }] = await Promise.all([
      context.supabase.from("enrollments").select("course_id, created_at, source").eq("student_id", p.id),
      context.supabase
        .from("exam_attempts")
        .select("id, exam_id, score_pct, earned, total, time_sec, submitted_at")
        .eq("student_id", p.id)
        .order("submitted_at", { ascending: true }),
    ]);

    const courseIds = [...new Set((enrollments ?? []).map((e) => e.course_id))];
    const examIds = [...new Set((attempts ?? []).map((a) => a.exam_id))];

    const [{ data: courses }, { data: exams }] = await Promise.all([
      courseIds.length
        ? context.supabase.from("courses").select("id, title, grade_level").in("id", courseIds)
        : Promise.resolve({ data: [] as any[] }),
      examIds.length
        ? context.supabase.from("exams").select("id, title, passing_pct").in("id", examIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const scores = (attempts ?? []).map((a) => a.score_pct ?? 0);
    const avg = scores.length ? Math.round(scores.reduce((n, s) => n + s, 0) / scores.length) : null;

    return {
      student: {
        id: p.id,
        name: p.full_name ?? "طالب",
        email: p.email ?? "",
        phone: p.phone ?? "",
        studentCode: p.student_code ?? "",
        grade: p.grade ?? "",
        bio: p.bio ?? "",
        joined: p.created_at,
      },
      avgScore: avg,
      courses: (enrollments ?? []).map((e) => {
        const c = (courses ?? []).find((x: any) => x.id === e.course_id);
        return {
          id: e.course_id,
          title: c?.title ?? "دورة",
          gradeLevel: c?.grade_level ?? "",
          source: e.source,
          at: e.created_at,
        };
      }),
      attempts: (attempts ?? []).map((a) => {
        const ex = (exams ?? []).find((x: any) => x.id === a.exam_id);
        return {
          id: a.id,
          examId: a.exam_id,
          examTitle: ex?.title ?? "اختبار",
          scorePct: a.score_pct ?? 0,
          earned: a.earned ?? 0,
          total: a.total ?? 0,
          timeSec: a.time_sec ?? 0,
          passed: (a.score_pct ?? 0) >= (ex?.passing_pct ?? 60),
          submittedAt: a.submitted_at,
        };
      }),
    };
  });

// ==================== نظرة عامة للمعلّم ====================

export const teacherOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: courses }, { data: roles }, { data: attempts }, { data: enrollments }] =
      await Promise.all([
        context.supabase.from("courses").select("id, title, grade_level, is_published, created_at"),
        context.supabase.from("user_roles").select("user_id").eq("role", "student"),
        context.supabase.from("exam_attempts").select("id, exam_id, student_id, score_pct, submitted_at"),
        context.supabase.from("enrollments").select("id, course_id, student_id, created_at"),
      ]);

    const studentIds = (roles ?? []).map((r) => r.user_id);
    const { data: profiles } = studentIds.length
      ? await context.supabase.from("profiles").select("id, full_name, grade").in("id", studentIds)
      : { data: [] as any[] };

    const courseIds = (courses ?? []).map((c) => c.id);
    const { data: units } = courseIds.length
      ? await context.supabase.from("units").select("id, course_id").in("course_id", courseIds)
      : { data: [] as any[] };
    const unitIds = (units ?? []).map((u: any) => u.id);
    const { data: lessons } = unitIds.length
      ? await context.supabase.from("lessons").select("id, unit_id").in("unit_id", unitIds)
      : { data: [] as any[] };
    const lessonIds = (lessons ?? []).map((l: any) => l.id);
    const [{ data: videos }, { data: exams }] = await Promise.all([
      lessonIds.length
        ? context.supabase.from("videos").select("id, lesson_id").in("lesson_id", lessonIds)
        : Promise.resolve({ data: [] as any[] }),
      lessonIds.length
        ? context.supabase.from("exams").select("id, lesson_id, title").in("lesson_id", lessonIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const lessonOfExam = new Map<string, string>();
    for (const e of exams ?? []) lessonOfExam.set((e as any).id, (e as any).lesson_id);
    const unitOfLesson = new Map<string, string>();
    for (const l of lessons ?? []) unitOfLesson.set((l as any).id, (l as any).unit_id);
    const courseOfUnit = new Map<string, string>();
    for (const u of units ?? []) courseOfUnit.set((u as any).id, (u as any).course_id);
    const gradeOfCourse = new Map<string, string>();
    for (const c of courses ?? []) gradeOfCourse.set(c.id, c.grade_level ?? "");

    const studentsByGrade = new Map<string, number>();
    for (const p of profiles ?? []) {
      const g = (p as any).grade ?? "";
      studentsByGrade.set(g, (studentsByGrade.get(g) ?? 0) + 1);
    }

    const nameOf = new Map<string, string>();
    for (const p of profiles ?? []) nameOf.set((p as any).id, (p as any).full_name ?? "طالب");
    const titleOfCourse = new Map<string, string>();
    for (const c of courses ?? []) titleOfCourse.set(c.id, c.title);
    const titleOfExam = new Map<string, string>();
    for (const e of exams ?? []) titleOfExam.set((e as any).id, (e as any).title);

    const activity = [
      ...(attempts ?? []).map((a) => ({
        id: `at-${a.id}`,
        text: `${nameOf.get(a.student_id) ?? "طالب"} أنهى ${titleOfExam.get(a.exam_id) ?? "اختبارًا"} بنسبة ${a.score_pct ?? 0}%`,
        at: a.submitted_at,
      })),
      ...(enrollments ?? []).map((e) => ({
        id: `en-${e.id}`,
        text: `${nameOf.get(e.student_id) ?? "طالب"} اشترك في ${titleOfCourse.get(e.course_id) ?? "دورة"}`,
        at: e.created_at,
      })),
    ]
      .sort((a, b) => (a.at < b.at ? 1 : -1))
      .slice(0, 12);

    return {
      counts: {
        students: (profiles ?? []).length,
        courses: (courses ?? []).length,
        lessons: (lessons ?? []).length,
        videos: (videos ?? []).length,
        exams: (exams ?? []).length,
        attempts: (attempts ?? []).length,
      },
      studentsByGrade: [...studentsByGrade.entries()].map(([grade, n]) => ({ grade, n })),
      coursesByGrade: (courses ?? []).map((c) => ({
        id: c.id,
        title: c.title,
        grade: c.grade_level ?? "",
        isPublished: c.is_published,
      })),
      attemptsByGrade: (attempts ?? []).map((a) => ({
        scorePct: a.score_pct ?? 0,
        studentId: a.student_id,
        submittedAt: a.submitted_at,
        grade:
          gradeOfCourse.get(
            courseOfUnit.get(unitOfLesson.get(lessonOfExam.get(a.exam_id) ?? "") ?? "") ?? "",
          ) ?? "",
      })),
      students: (profiles ?? []).map((p) => ({
        id: (p as any).id,
        name: (p as any).full_name ?? "طالب",
        grade: (p as any).grade ?? "",
      })),
      activity,
    };
  });

// ==================== أكواد الاشتراك ====================

export const listCodes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: codes, error } = await context.supabase
      .from("subscription_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const courseIds = [...new Set((codes ?? []).map((c) => c.course_id))];
    const userIds = [...new Set((codes ?? []).map((c) => c.used_by).filter(Boolean))] as string[];
    const [{ data: courses }, { data: profiles }] = await Promise.all([
      courseIds.length
        ? context.supabase.from("courses").select("id, title, grade_level").in("id", courseIds)
        : Promise.resolve({ data: [] as any[] }),
      userIds.length
        ? context.supabase.from("profiles").select("id, full_name, email, student_code").in("id", userIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    return (codes ?? []).map((c) => {
      const course = (courses ?? []).find((x: any) => x.id === c.course_id);
      const user = (profiles ?? []).find((x: any) => x.id === c.used_by);
      return {
        id: c.id,
        code: c.code,
        courseId: c.course_id,
        courseTitle: course?.title ?? "—",
        courseGrade: course?.grade_level ?? "",
        durationDays: c.duration_days,
        expiresAt: c.expires_at,
        used: c.used,
        disabled: c.disabled,
        usedAt: c.used_at,
        student: user
          ? {
              id: user.id,
              name: user.full_name ?? "طالب",
              email: user.email ?? "",
              code: user.student_code ?? "",
            }
          : null,
      };
    });
  });

export const createCodes = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        courseId: z.string(),
        count: z.number().min(1).max(200).default(5),
        durationDays: z.number().min(1).max(3650).default(30),
      })
      .parse(data),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const randomCode = () => {
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let out = "";
      for (let i = 0; i < 10; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
      return `${out.slice(0, 5)}-${out.slice(5)}`;
    };
    const expires = new Date(Date.now() + data.durationDays * 86400000).toISOString();
    const rows = Array.from({ length: data.count }).map(() => ({
      code: randomCode(),
      course_id: data.courseId,
      teacher_id: context.userId,
      duration_days: data.durationDays,
      expires_at: expires,
    }));
    const { data: inserted, error } = await context.supabase
      .from("subscription_codes")
      .insert(rows)
      .select("id, code");
    if (error) throw error;
    return inserted ?? [];
  });

export const setCodeDisabled = createServerFn({ method: "POST" })
  .validator((data) => z.object({ codeId: z.string(), disabled: z.boolean() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("subscription_codes")
      .update({ disabled: data.disabled })
      .eq("id", data.codeId);
    if (error) throw error;
    return { ok: true };
  });

/** تفعيل اشتراك طالب مباشرة عن طريق الرقم التعريفي أو البريد. */
export const enrollStudentDirect = createServerFn({ method: "POST" })
  .validator((data) => z.object({ identifier: z.string().min(1), courseId: z.string() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const key = data.identifier.trim();
    const { data: matches, error } = await context.supabase
      .from("profiles")
      .select("id, full_name, email, student_code")
      .or(`student_code.eq.${key},email.eq.${key.toLowerCase()}`);
    if (error) throw error;
    const student = (matches ?? [])[0];
    if (!student) throw new Error("مفيش طالب بالرقم التعريفي أو البريد ده.");

    const { error: enrollError } = await context.supabase
      .from("enrollments")
      .insert({ course_id: data.courseId, student_id: student.id, source: "manual" });
    if (enrollError && !enrollError.message.includes("duplicate")) throw enrollError;

    await context.supabase.from("notifications").insert({
      user_id: student.id,
      title: "تم تفعيل اشتراكك",
      body: "المعلّم فعّل لك دورة جديدة — تقدر تدخلها من دوراتي.",
      link: `/student/courses/${data.courseId}`,
    });

    return {
      student: {
        id: student.id,
        name: student.full_name ?? "طالب",
        email: student.email ?? "",
        code: student.student_code ?? "",
      },
    };
  });

export const listCourseEnrollments = createServerFn({ method: "GET" })
  .validator((data) => z.object({ courseId: z.string() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("enrollments")
      .select("id, student_id, source, created_at")
      .eq("course_id", data.courseId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const ids = (rows ?? []).map((r) => r.student_id);
    const { data: profiles } = ids.length
      ? await context.supabase.from("profiles").select("id, full_name, email, student_code, grade").in("id", ids)
      : { data: [] as any[] };
    return (rows ?? []).map((r) => {
      const p = (profiles ?? []).find((x: any) => x.id === r.student_id);
      return {
        id: r.id,
        studentId: r.student_id,
        name: p?.full_name ?? "طالب",
        email: p?.email ?? "",
        code: p?.student_code ?? "",
        grade: p?.grade ?? "",
        source: r.source,
        at: r.created_at,
      };
    });
  });

export const removeEnrollment = createServerFn({ method: "POST" })
  .validator((data) => z.object({ enrollmentId: z.string() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("enrollments").delete().eq("id", data.enrollmentId);
    if (error) throw error;
    return { ok: true };
  });

// ==================== الطالب: الاشتراكات والأكواد ====================

export const myEnrollments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("enrollments")
      .select("course_id")
      .eq("student_id", context.userId);
    if (error) throw error;
    return (data ?? []).map((r) => r.course_id);
  });

export const redeemSubscriptionCode = createServerFn({ method: "POST" })
  .validator((data) => z.object({ code: z.string().min(3) }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { data: courseId, error } = await context.supabase.rpc("redeem_code", {
      _code: data.code.trim().toUpperCase(),
    });
    if (error) throw new Error(error.message);
    return { courseId: courseId as string };
  });

// ==================== الرسائل ====================

export const listMessageThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: msgs, error } = await context.supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const rows = (msgs ?? []).filter((m) => m.recipient_id !== null);
    const partners = new Map<string, { last: string; at: string; unread: number }>();
    for (const m of rows) {
      const other = m.sender_id === context.userId ? m.recipient_id! : m.sender_id;
      const prev = partners.get(other);
      const unreadInc = m.recipient_id === context.userId && !m.read_at ? 1 : 0;
      if (!prev) partners.set(other, { last: m.body, at: m.created_at, unread: unreadInc });
      else partners.set(other, { ...prev, unread: prev.unread + unreadInc });
    }

    const ids = [...partners.keys()];
    const { data: profiles } = ids.length
      ? await context.supabase.from("profiles").select("id, full_name, email, grade, student_code").in("id", ids)
      : { data: [] as any[] };

    return ids.map((id) => {
      const p = (profiles ?? []).find((x: any) => x.id === id);
      const info = partners.get(id)!;
      return {
        id,
        name: p?.full_name ?? "مستخدم",
        email: p?.email ?? "",
        grade: p?.grade ?? "",
        studentCode: p?.student_code ?? "",
        lastMessage: info.last,
        at: info.at,
        unread: info.unread,
      };
    });
  });

export const listConversation = createServerFn({ method: "GET" })
  .validator((data) => z.object({ withUserId: z.string() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { data: msgs, error } = await context.supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${context.userId},recipient_id.eq.${data.withUserId}),and(sender_id.eq.${data.withUserId},recipient_id.eq.${context.userId})`,
      )
      .order("created_at", { ascending: true });
    if (error) throw error;

    const unread = (msgs ?? []).filter((m) => m.recipient_id === context.userId && !m.read_at);
    if (unread.length) {
      await context.supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .in("id", unread.map((m) => m.id));
    }

    return (msgs ?? []).map((m) => ({
      id: m.id,
      mine: m.sender_id === context.userId,
      body: m.body,
      at: m.created_at,
    }));
  });

export const sendMessage = createServerFn({ method: "POST" })
  .validator((data) => z.object({ recipientId: z.string(), body: z.string().min(1) }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("messages").insert({
      sender_id: context.userId,
      recipient_id: data.recipientId,
      body: data.body,
    });
    if (error) throw error;
    await context.supabase.from("notifications").insert({
      user_id: data.recipientId,
      title: "رسالة جديدة",
      body: data.body.slice(0, 120),
      link: "/student/messages",
    });
    return { ok: true };
  });

/** الطالب يعرف مع مين يتكلّم (المعلّم الوحيد للمنصة). */
export const getPlatformTeacher = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("platform_teacher");
    if (error) throw error;
    const row = (data as { id: string; full_name: string }[] | null)?.[0];
    return row ? { id: row.id, name: row.full_name } : null;
  });

// ==================== الإعلانات ====================

export const listAnnouncements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body ?? "",
      grade: a.grade,
      kind: a.kind as "info" | "important",
      createdAt: a.created_at,
    }));
  });

export const createAnnouncement = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        title: z.string().min(1),
        body: z.string().default(""),
        grade: z.string().nullable().default(null),
        kind: z.enum(["info", "important"]).default("info"),
      })
      .parse(data),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("announcements")
      .insert({
        teacher_id: context.userId,
        title: data.title,
        body: data.body,
        grade: data.grade,
        kind: data.kind,
      })
      .select("id")
      .single();
    if (error) throw error;

    // إشعار لكل الطلاب المستهدفين
    const { data: roles } = await context.supabase.from("user_roles").select("user_id").eq("role", "student");
    const ids = (roles ?? []).map((r) => r.user_id);
    if (ids.length) {
      const { data: profiles } = await context.supabase.from("profiles").select("id, grade").in("id", ids);
      const targets = (profiles ?? []).filter((p) => !data.grade || (p as any).grade === data.grade);
      if (targets.length) {
        await context.supabase.from("notifications").insert(
          targets.map((p) => ({
            user_id: (p as any).id,
            title: data.title,
            body: data.body,
          })),
        );
      }
    }
    return { id: row.id };
  });

export const deleteAnnouncement = createServerFn({ method: "POST" })
  .validator((data) => z.object({ id: z.string() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("announcements").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ==================== المساعدون ====================

export const listAssistants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles, error } = await context.supabase
      .from("user_roles")
      .select("user_id, created_at")
      .eq("role", "assistant");
    if (error) throw error;
    const ids = (roles ?? []).map((r) => r.user_id);
    if (!ids.length) return [];
    const { data: profiles } = await context.supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ids);
    return (roles ?? []).map((r) => {
      const p = (profiles ?? []).find((x: any) => x.id === r.user_id);
      return {
        id: r.user_id,
        name: p?.full_name ?? "مساعد",
        email: p?.email ?? "",
        since: r.created_at,
      };
    });
  });

// ==================== الإشعارات والتفاعل ====================

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("notifications")
      .select("id, title, body, link, read, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data ?? [];
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .validator((data) => z.object({ id: z.string() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("notifications").update({ read: true }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const listVideoComments = createServerFn({ method: "GET" })
  .validator((data) => z.object({ videoId: z.string() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase.from("video_comments").select("*").eq("video_id", data.videoId).order("created_at", { ascending: false });
    if (error) throw error;
    const ids = [...new Set((rows ?? []).map((r) => r.author_id))];
    const { data: profiles } = ids.length ? await context.supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] as any[] };
    const { data: roles } = ids.length ? await context.supabase.from("user_roles").select("user_id, role").in("user_id", ids) : { data: [] as any[] };
    return (rows ?? []).map((r) => ({
      id: r.id,
      authorId: r.author_id,
      authorName: (profiles ?? []).find((p: any) => p.id === r.author_id)?.full_name ?? "مستخدم",
      authorRole: (roles ?? []).find((x: any) => x.user_id === r.author_id)?.role ?? "student",
      text: r.text,
      timestampSec: r.timestamp_sec,
      createdAt: r.created_at,
      mine: r.author_id === context.userId,
    }));
  });

export const addVideoComment = createServerFn({ method: "POST" })
  .validator((data) => z.object({ videoId: z.string(), text: z.string().min(1), timestampSec: z.number().nullable() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("video_comments").insert({ video_id: data.videoId, author_id: context.userId, text: data.text, timestamp_sec: data.timestampSec });
    if (error) throw error;
    return { ok: true };
  });

export const deleteVideoComment = createServerFn({ method: "POST" })
  .validator((data) => z.object({ id: z.string() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("video_comments").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const listReactions = createServerFn({ method: "GET" })
  .validator((data) => z.object({ targetId: z.string() }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase.from("reactions").select("user_id, type").eq("target_id", data.targetId);
    if (error) throw error;
    const ids = [...new Set((rows ?? []).map((r) => r.user_id))];
    const { data: profiles } = ids.length ? await context.supabase.from("profiles").select("id, full_name").in("id", ids) : { data: [] as any[] };
    return (rows ?? []).map((r) => ({ userId: r.user_id, userName: (profiles ?? []).find((p: any) => p.id === r.user_id)?.full_name ?? "مستخدم", type: r.type, mine: r.user_id === context.userId }));
  });

export const toggleReaction = createServerFn({ method: "POST" })
  .validator((data) => z.object({ targetId: z.string(), type: z.enum(["like", "love", "haha", "angry", "sad"]) }).parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { data: existing } = await context.supabase.from("reactions").select("id, type").eq("target_id", data.targetId).eq("user_id", context.userId).maybeSingle();
    if (existing?.type === data.type) {
      const { error } = await context.supabase.from("reactions").delete().eq("id", existing.id);
      if (error) throw error;
    } else if (existing) {
      const { error } = await context.supabase.from("reactions").update({ type: data.type }).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await context.supabase.from("reactions").insert({ target_id: data.targetId, user_id: context.userId, type: data.type });
      if (error) throw error;
    }
    return { ok: true };
  });
