import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { EXAM_AUTO_GRADED } from "@/lib/content-types";
import { getExamPage } from "@/lib/school.functions";
import { updateProfile } from "@/lib/local-profile";

export const Route = createFileRoute("/exams/$examId")({
  loader: async ({ params }) => {
    const data = await getExamPage({ data: { examId: params.examId } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "الاختبار غير موجود — مدرسة" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.exam.title} — اختبار | مدرسة`;
    const description = `اختبار ${loaderData.exam.title}: ${loaderData.exam.questions.length} سؤال في ${loaderData.exam.durationMin} دقيقة، تصحيح فوري على جهازك.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  errorComponent: () => <main className="p-10 text-center text-muted-foreground">حدث خطأ في تحميل الاختبار.</main>,
  notFoundComponent: () => <main className="p-10 text-center">الاختبار غير موجود.</main>,
  component: ExamPage,
});

type Answer = number | number[] | boolean | string | undefined;

function ExamPage() {
  const { exam, course, lessonTitle } = Route.useLoaderData();
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [result, setResult] = useState<{ earned: number; total: number; pct: number } | null>(null);

  const questions = useMemo(() => exam.questions, [exam.questions]);

  function submit() {
    let earned = 0;
    let total = 0;
    for (const q of questions) {
      if (!EXAM_AUTO_GRADED[q.type]) continue;
      total += q.points;
      const a = answers[q.id];
      if (q.type === "mcq" && a === q.correct) earned += q.points;
      if (q.type === "tf" && a === q.correct) earned += q.points;
      if (q.type === "multi" && Array.isArray(a)) {
        const picked = [...a].sort().join(",");
        const correct = [...q.correct].sort().join(",");
        if (picked === correct && picked !== "") earned += q.points;
      }
    }
    const pct = total > 0 ? Math.round((earned / total) * 100) : 0;
    setResult({ earned, total, pct });
    updateProfile((p) => ({
      ...p,
      results: [
        {
          examId: exam.id,
          examTitle: exam.title,
          courseTitle: course?.title ?? "",
          scorePct: pct,
          earned,
          total,
          at: new Date().toISOString(),
        },
        ...p.results.filter((r) => r.examId !== exam.id),
      ],
    }));
  }

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">الرئيسية</Link>
          {course && (
            <>
              {" / "}
              <Link to="/courses/$courseId" params={{ courseId: course.id }} className="hover:text-foreground">{course.title}</Link>
            </>
          )}
          {lessonTitle && ` / ${lessonTitle}`}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold">{exam.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {questions.length} سؤال • {exam.durationMin} دقيقة • نسبة النجاح {exam.passingPct}%
        </p>

        {questions.length === 0 ? (
          <Card className="mt-8"><CardContent className="p-12 text-center text-muted-foreground">لا توجد أسئلة في هذا الاختبار بعد.</CardContent></Card>
        ) : (
          <div className="mt-8 space-y-6">
            {questions.map((q, i) => (
              <Card key={q.id}>
                <CardContent className="space-y-4 p-6">
                  <p className="font-medium">{i + 1}. {q.text} <span className="text-xs text-muted-foreground">({q.points} درجة)</span></p>

                  {q.type === "mcq" && (
                    <RadioGroup
                      value={typeof answers[q.id] === "number" ? String(answers[q.id]) : ""}
                      onValueChange={(v) => setAnswers((p) => ({ ...p, [q.id]: Number(v) }))}
                    >
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <RadioGroupItem value={String(oi)} id={`${q.id}-${oi}`} />
                          <Label htmlFor={`${q.id}-${oi}`}>{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {q.type === "tf" && (
                    <RadioGroup
                      value={answers[q.id] === undefined ? "" : String(answers[q.id])}
                      onValueChange={(v) => setAnswers((p) => ({ ...p, [q.id]: v === "true" }))}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="true" id={`${q.id}-t`} />
                        <Label htmlFor={`${q.id}-t`}>صح</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="false" id={`${q.id}-f`} />
                        <Label htmlFor={`${q.id}-f`}>خطأ</Label>
                      </div>
                    </RadioGroup>
                  )}

                  {q.type === "multi" && (
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => {
                        const list = Array.isArray(answers[q.id]) ? (answers[q.id] as number[]) : [];
                        return (
                          <div key={oi} className="flex items-center gap-2">
                            <Checkbox
                              id={`${q.id}-${oi}`}
                              checked={list.includes(oi)}
                              onCheckedChange={(checked) =>
                                setAnswers((p) => ({
                                  ...p,
                                  [q.id]: checked ? [...list, oi] : list.filter((x) => x !== oi),
                                }))
                              }
                            />
                            <Label htmlFor={`${q.id}-${oi}`}>{opt}</Label>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.type === "essay" && (
                    <>
                      <Textarea
                        value={typeof answers[q.id] === "string" ? (answers[q.id] as string) : ""}
                        onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                        placeholder="اكتب إجابتك…"
                      />
                      <p className="text-xs text-muted-foreground">السؤال المقالي لا يُصحَّح تلقائيًا.</p>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}

            <Button className="w-full rounded-full" onClick={submit}>تصحيح الاختبار</Button>

            {result && (
              <Card className="border-primary/50">
                <CardContent className="space-y-2 p-6 text-center">
                  <p className="font-display text-2xl font-bold">{result.pct}%</p>
                  <p className="text-sm text-muted-foreground">{result.earned} من {result.total} درجة (الأسئلة التلقائية فقط)</p>
                  <p className={result.pct >= exam.passingPct ? "text-primary" : "text-destructive"}>
                    {result.pct >= exam.passingPct ? "مبروك، ناجح ✅" : "محتاج مراجعة تانية"}
                  </p>
                  <p className="text-xs text-muted-foreground">النتيجة محفوظة على جهازك في صفحة «ملفي».</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
