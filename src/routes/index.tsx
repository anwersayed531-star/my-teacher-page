import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Download, Users, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { GRADES } from "@/lib/grades";
import { getSchoolSummary } from "@/lib/school.functions";
import { readProfile, updateProfile } from "@/lib/local-profile";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "مدرسة — منصة تعليمية مجانية للمرحلة الثانوية" },
      {
        name: "description",
        content: "اختر صفك الدراسي وتابع دروس مدرسينا بالفيديو والملفات والاختبارات — مجانًا وبدون تسجيل أو حساب.",
      },
      { property: "og:title", content: "مدرسة — منصة تعليمية مجانية للمرحلة الثانوية" },
      { property: "og:description", content: "دروس وشرح واختبارات لثلاث صفوف ثانوية، مفتوحة للجميع بدون حساب." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => getSchoolSummary(),
  errorComponent: () => (
    <main className="p-10 text-center text-muted-foreground">حدث خطأ في تحميل الصفحة. حدّث الصفحة من فضلك.</main>
  ),
  notFoundComponent: () => <main className="p-10 text-center">الصفحة غير موجودة.</main>,
  component: Home,
});

function Home() {
  const summary = Route.useLoaderData();
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(readProfile().name);
  }, []);

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
          <div className="mx-auto max-w-4xl px-4 py-16 text-center md:py-24">
            <h1 className="font-display text-3xl font-bold leading-tight md:text-5xl">
              مدرسة — تعلّم <span className="text-primary">مجانًا</span> بدون حساب ولا تسجيل
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-muted-foreground md:text-lg">
              اكتب اسمك، اختر صفك، وابدأ من دلوقتي. تقدّمك وملاحظاتك ونتائج اختباراتك محفوظة على جهازك أنت فقط — وتقدر
              تنزّل نسخة احتياطية وترفعها على أي جهاز تاني.
            </p>
            <div className="mx-auto mt-8 flex max-w-md items-center gap-2">
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSaved(false);
                }}
                placeholder="اكتب اسمك"
                aria-label="اسمك"
              />
              <Button
                className="rounded-full"
                onClick={() => {
                  updateProfile((p) => ({ ...p, name: name.trim() }));
                  setSaved(true);
                }}
              >
                حفظ
              </Button>
            </div>
            {saved && <p className="mt-2 text-sm text-primary">تم حفظ اسمك على جهازك ✅</p>}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center font-display text-2xl font-bold md:text-3xl">اختر صفك الدراسي</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {GRADES.map((g) => {
              const stats = summary[g.slug] ?? { teachers: 0, courses: 0 };
              return (
                <Link key={g.slug} to="/grades/$grade" params={{ grade: g.slug }} className="group">
                  <Card className="h-full transition group-hover:-translate-y-1 group-hover:border-primary/50">
                    <CardContent className="space-y-4 p-8 text-right">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <BookOpen className="h-6 w-6" />
                      </span>
                      <h3 className="font-display text-xl font-semibold">{g.name}</h3>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {stats.teachers} مدرس</span>
                        <span className="flex items-center gap-1"><Video className="h-4 w-4" /> {stats.courses} كورس</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                        ادخل الصف <ArrowLeft className="h-4 w-4" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 pb-20">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Download className="h-6 w-6" />
              </span>
              <h2 className="font-display text-xl font-semibold">نسختك الاحتياطية معاك</h2>
              <p className="max-w-xl text-muted-foreground">
                كل بياناتك على جهازك، مش على السيرفر. من صفحة «ملفي» تقدر تنزّل ملف نسخة احتياطية وترفعه على أي جهاز
                تاني لتكمّل من نفس المكان.
              </p>
              <Button asChild variant="outline" className="rounded-full"><Link to="/me">افتح ملفي</Link></Button>
            </CardContent>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
