import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, Check, FileText, Heart, ListChecks, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { VideoPlayer } from "@/components/video-player";
import { parseYouTubeId } from "@/lib/content-types";
import { gradeName, isGradeSlug } from "@/lib/grades";
import { getCoursePage } from "@/lib/school.functions";
import { readProfile, toggleInList, updateProfile } from "@/lib/local-profile";

export const Route = createFileRoute("/courses/$courseId")({
  loader: async ({ params }) => {
    const data = await getCoursePage({ data: { courseId: params.courseId } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "الكورس غير موجود — مدرسة" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.course.title} — مدرسة`;
    const description = loaderData.course.description || `دروس وفيديوهات وملفات واختبارات كورس ${loaderData.course.title} مجانًا.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => <main className="p-10 text-center text-muted-foreground">حدث خطأ في تحميل الكورس.</main>,
  notFoundComponent: () => <main className="p-10 text-center">الكورس غير موجود.</main>,
  component: CoursePage,
});

function CoursePage() {
  const { course, teacher, units } = Route.useLoaderData();
  const [favorite, setFavorite] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const p = readProfile();
    setFavorite(p.favorites.includes(course.id));
    setCompleted(p.completed);
    setNotes(p.notes);
  }, [course.id]);

  const gradeLabel = isGradeSlug(course.grade) ? gradeName(course.grade) : course.grade;
  const lessons = units.flatMap((u) => u.lessons);
  const doneCount = lessons.filter((l) => completed.includes(l.id)).length;

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">الرئيسية</Link>
          {isGradeSlug(course.grade) && (
            <>
              {" / "}
              <Link to="/grades/$grade" params={{ grade: course.grade }} className="hover:text-foreground">{gradeLabel}</Link>
            </>
          )}
          {teacher && isGradeSlug(course.grade) && (
            <>
              {" / "}
              <Link
                to="/grades/$grade/teachers/$teacherId"
                params={{ grade: course.grade, teacherId: teacher.id }}
                className="hover:text-foreground"
              >
                {teacher.name}
              </Link>
            </>
          )}
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-[240px_1fr]">
          {course.cover ? (
            <img src={course.cover} alt={course.title} className="h-40 w-full rounded-2xl object-cover md:h-full" />
          ) : (
            <div className="flex h-40 items-center justify-center rounded-2xl bg-primary/5 text-primary">
              <BookOpen className="h-10 w-10" />
            </div>
          )}
          <div>
            <h1 className="font-display text-3xl font-bold">{course.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{gradeLabel}{teacher ? ` • ${teacher.name}` : ""}</p>
            {course.description && <p className="mt-3 text-muted-foreground">{course.description}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted-foreground">{doneCount} / {lessons.length} درس مكتمل</span>
              <Button
                variant={favorite ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => {
                  const next = updateProfile((p) => ({ ...p, favorites: toggleInList(p.favorites, course.id) }));
                  setFavorite(next.favorites.includes(course.id));
                }}
              >
                <Heart className="h-4 w-4" /> {favorite ? "في المفضلة" : "أضف للمفضلة"}
              </Button>
            </div>
          </div>
        </div>

        <h2 className="mt-12 font-display text-2xl font-bold">محتوى الكورس</h2>
        {lessons.length === 0 ? (
          <Card className="mt-6"><CardContent className="p-12 text-center text-muted-foreground">لا توجد دروس مضافة لهذا الكورس حتى الآن.</CardContent></Card>
        ) : (
          <div className="mt-6 space-y-8">
            {units.map((unit) => (
              <section key={unit.id}>
                <h3 className="font-display text-lg font-semibold text-primary">{unit.title}</h3>
                <Accordion type="multiple" className="mt-3">
                  {unit.lessons.map((lesson) => {
                    const isDone = completed.includes(lesson.id);
                    return (
                      <AccordionItem key={lesson.id} value={lesson.id}>
                        <AccordionTrigger className="text-right">
                          <span className="flex items-center gap-2">
                            {isDone && <Check className="h-4 w-4 text-primary" />}
                            {lesson.title}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-6">
                          {lesson.videos.length === 0 && lesson.files.length === 0 && lesson.exams.length === 0 && (
                            <p className="text-sm text-muted-foreground">لا يوجد محتوى في هذا الدرس بعد.</p>
                          )}

                          {lesson.videos.map((v) => {
                            const yt = parseYouTubeId(v.url);
                            return (
                              <div key={v.id} className="space-y-2">
                                <p className="flex items-center gap-2 text-sm font-medium"><Video className="h-4 w-4" /> {v.title}</p>
                                {yt ? (
                                  <VideoPlayer src={v.url} title={v.title} storageKey={`school:video:${v.id}`} />
                                ) : (
                                  <video controls src={v.url} className="w-full rounded-xl" />
                                )}
                              </div>
                            );
                          })}

                          {lesson.files.length > 0 && (
                            <div className="space-y-2">
                              <p className="flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4" /> ملفات الدرس</p>
                              <ul className="space-y-1">
                                {lesson.files.map((f) => (
                                  <li key={f.id}>
                                    <a href={f.url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                                      {f.name}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {lesson.exams.length > 0 && (
                            <div className="space-y-2">
                              <p className="flex items-center gap-2 text-sm font-medium"><ListChecks className="h-4 w-4" /> اختبارات</p>
                              {lesson.exams.map((e) => (
                                <Button key={e.id} asChild variant="outline" size="sm" className="rounded-full">
                                  <Link to="/exams/$examId" params={{ examId: e.id }}>
                                    {e.title} — {e.questionsCount} سؤال / {e.durationMin} دقيقة
                                  </Link>
                                </Button>
                              ))}
                            </div>
                          )}

                          <div className="space-y-2">
                            <p className="text-sm font-medium">ملاحظاتي على الدرس (محفوظة على جهازك)</p>
                            <Textarea
                              value={notes[lesson.id] ?? ""}
                              placeholder="اكتب ملاحظاتك…"
                              onChange={(e) => {
                                const value = e.target.value;
                                setNotes((prev) => ({ ...prev, [lesson.id]: value }));
                              }}
                              onBlur={() => updateProfile((p) => ({ ...p, notes: { ...p.notes, [lesson.id]: notes[lesson.id] ?? "" } }))}
                            />
                          </div>

                          <Button
                            size="sm"
                            variant={isDone ? "default" : "outline"}
                            className="rounded-full"
                            onClick={() => {
                              const next = updateProfile((p) => ({ ...p, completed: toggleInList(p.completed, lesson.id) }));
                              setCompleted(next.completed);
                            }}
                          >
                            <Check className="h-4 w-4" /> {isDone ? "تم إنهاء الدرس" : "علّم كمكتمل"}
                          </Button>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </section>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
