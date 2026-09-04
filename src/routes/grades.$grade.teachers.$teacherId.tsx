import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { BookOpen, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { gradeName, isGradeSlug } from "@/lib/grades";
import { getTeacherPage } from "@/lib/school.functions";

export const Route = createFileRoute("/grades/$grade/teachers/$teacherId")({
  loader: async ({ params }) => {
    if (!isGradeSlug(params.grade)) throw notFound();
    const data = await getTeacherPage({ data: { teacherId: params.teacherId, grade: params.grade } });
    if (!data) throw notFound();
    return { ...data, grade: params.grade, gradeLabel: gradeName(params.grade) };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "المدرس غير موجود — مدرسة" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.teacher.name} — ${loaderData.gradeLabel} | مدرسة`;
    const description = loaderData.teacher.bio || `كورسات ${loaderData.teacher.name} في ${loaderData.gradeLabel} — دروس وملفات واختبارات مجانية.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => <main className="p-10 text-center text-muted-foreground">حدث خطأ في تحميل صفحة المدرس.</main>,
  notFoundComponent: () => <main className="p-10 text-center">المدرس غير موجود.</main>,
  component: TeacherPage,
});

function TeacherPage() {
  const { teacher, courses, grade, gradeLabel } = Route.useLoaderData();
  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">الرئيسية</Link> /{" "}
          <Link to="/grades/$grade" params={{ grade }} className="hover:text-foreground">{gradeLabel}</Link> / {teacher.name}
        </p>

        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
          {teacher.photo ? (
            <img src={teacher.photo} alt={`صورة ${teacher.name}`} className="h-28 w-28 rounded-2xl object-cover" />
          ) : (
            <span className="inline-flex h-28 w-28 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="h-10 w-10" />
            </span>
          )}
          <div>
            <h1 className="font-display text-3xl font-bold">{teacher.name}</h1>
            {teacher.subject && <p className="mt-1 text-primary">{teacher.subject}</p>}
            {teacher.bio && <p className="mt-2 max-w-2xl text-muted-foreground">{teacher.bio}</p>}
          </div>
        </div>

        <h2 className="mt-12 font-display text-2xl font-bold">كورسات {gradeLabel}</h2>
        {courses.length === 0 ? (
          <Card className="mt-6">
            <CardContent className="p-12 text-center text-muted-foreground">لا توجد كورسات منشورة لهذا الصف حتى الآن.</CardContent>
          </Card>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <Link key={c.id} to="/courses/$courseId" params={{ courseId: c.id }} className="group">
                <Card className="h-full overflow-hidden transition group-hover:-translate-y-1 group-hover:border-primary/50">
                  {c.cover ? (
                    <img src={c.cover} alt={c.title} loading="lazy" className="h-40 w-full object-cover" />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-primary/5 text-primary">
                      <BookOpen className="h-8 w-8" />
                    </div>
                  )}
                  <CardContent className="space-y-2 p-6">
                    <h3 className="font-display text-lg font-semibold">{c.title}</h3>
                    {c.description && <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>}
                    <p className="text-sm text-muted-foreground">{c.lessonsCount} درس</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
