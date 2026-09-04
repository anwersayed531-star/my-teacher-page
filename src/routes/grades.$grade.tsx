import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { gradeName, isGradeSlug } from "@/lib/grades";
import { listGradeTeachers } from "@/lib/school.functions";

export const Route = createFileRoute("/grades/$grade")({
  loader: async ({ params }) => {
    if (!isGradeSlug(params.grade)) throw notFound();
    const teachers = await listGradeTeachers({ data: { grade: params.grade } });
    return { grade: params.grade, name: gradeName(params.grade), teachers };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "الصف غير موجود — مدرسة" }, { name: "robots", content: "noindex" }] };
    }
    const title = `مدرسو ${loaderData.name} — مدرسة`;
    const description = `اختر مدرسك في ${loaderData.name} وتابع كورساته ودروسه وملفاته واختباراته مجانًا.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => <main className="p-10 text-center text-muted-foreground">حدث خطأ في تحميل مدرسي الصف.</main>,
  notFoundComponent: () => <main className="p-10 text-center">الصف غير موجود.</main>,
  component: GradePage,
});

function GradePage() {
  const { grade, name, teachers } = Route.useLoaderData();
  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">الرئيسية</Link> / {name}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">مدرسو {name}</h1>

        {teachers.length === 0 ? (
          <Card className="mt-10">
            <CardContent className="p-12 text-center text-muted-foreground">
              لا يوجد مدرسون مضافون لهذا الصف حتى الآن.
            </CardContent>
          </Card>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {teachers.map((t) => (
              <Link key={t.id} to="/grades/$grade/teachers/$teacherId" params={{ grade, teacherId: t.id }} className="group">
                <Card className="h-full transition group-hover:-translate-y-1 group-hover:border-primary/50">
                  <CardContent className="space-y-3 p-6">
                    {t.photo ? (
                      <img src={t.photo} alt={`صورة ${t.name}`} loading="lazy" className="h-24 w-24 rounded-2xl object-cover" />
                    ) : (
                      <span className="inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Users className="h-8 w-8" />
                      </span>
                    )}
                    <h2 className="font-display text-lg font-semibold">{t.name}</h2>
                    {t.subject && <p className="text-sm text-primary">{t.subject}</p>}
                    {t.bio && <p className="line-clamp-3 text-sm text-muted-foreground">{t.bio}</p>}
                    <p className="text-sm text-muted-foreground">{t.coursesCount} كورس في هذا الصف</p>
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
