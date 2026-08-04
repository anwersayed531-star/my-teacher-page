import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EXAM_AUTO_GRADED, type ExamQuestion } from "@/lib/mock-data";
import { getExam, recordAttempt } from "@/lib/courses.functions";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/student/exams/$id")({
  validateSearch: (s: Record<string, unknown>) => ({
    preview: s.preview === 1 || s.preview === "1" ? 1 : undefined,
  }),
  component: TakeExam,
});

type Answer =
  | { type: "mcq" | "image" | "audio"; value: number }
  | { type: "tf"; value: boolean }
  | { type: "multi"; value: number[] }
  | { type: "order"; value: string[] }
  | { type: "match"; value: Record<number, string> }
  | { type: "essay"; value: string };

function isCorrect(q: ExamQuestion, a: Answer | undefined): boolean {
  if (!a) return false;
  switch (q.type) {
    case "mcq":
    case "image":
    case "audio":
      return a.type === q.type && a.value === q.correct;
    case "tf":
      return a.type === "tf" && a.value === q.correct;
    case "multi": {
      if (a.type !== "multi") return false;
      const A = [...a.value].sort().join(",");
      const B = [...q.correct].sort().join(",");
      return A === B;
    }
    case "order":
      return a.type === "order" && a.value.join("||") === q.items.join("||");
    case "match": {
      if (a.type !== "match") return false;
      return q.pairs.every((p, i) => (a.value[i] ?? "") === p.right);
    }
    case "essay":
      return false; // manual
  }
}

function TakeExam() {
  const { id } = useParams({ from: "/student/exams/$id" });
  const { preview } = Route.useSearch();
  const nav = useNavigate();
  const { data: exam, isLoading } = useQuery({
    queryKey: ["exam", id],
    queryFn: () => getExam({ data: { examId: id } }),
  });
  const rawQuestions = exam?.questions ?? [];
  const questions = useMemo(() => {
    let qs = [...rawQuestions];
    if (exam?.shuffleQuestions) qs = qs.sort(() => Math.random() - 0.5);
    if (exam?.shuffleAnswers) {
      qs = qs.map((q) => {
        if (q.type === "mcq" || q.type === "image" || q.type === "audio") {
          const idx = q.options.map((_, i) => i).sort(() => Math.random() - 0.5);
          const options = idx.map((i) => q.options[i]);
          const correct = idx.indexOf(q.correct);
          return { ...q, options, correct };
        }
        if (q.type === "multi") {
          const idx = q.options.map((_, i) => i).sort(() => Math.random() - 0.5);
          const options = idx.map((i) => q.options[i]);
          const correct = q.correct.map((c) => idx.indexOf(c));
          return { ...q, options, correct };
        }
        return q;
      });
    }
    return qs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam]);
  const durationSec = (exam?.durationMin ?? 30) * 60;

  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [done, setDone] = useState(false);
  const [remaining, setRemaining] = useState(durationSec);
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    if (done || questions.length === 0) return;
    if (remaining <= 0) { setDone(true); return; }
    const t = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(t);
  }, [done, remaining, questions.length]);

  useEffect(() => {
    setRemaining(durationSec);
  }, [durationSec]);

  useEffect(() => {
    if (!done || !exam || preview === 1) return;
    void recordAttempt({
      data: {
        examId: exam.id,
        answers: questions.map((qq) => ({
          questionId: qq.id,
          value: answers[qq.id]?.value ?? null,
        })),
        timeSec: Math.round((Date.now() - startedAt) / 1000),
      },
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  if (isLoading) {
    return (
      <>
        <TopBar title="الاختبار" />
        <main className="flex flex-1 items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <>
        <TopBar title={`اختبار #${id}`} />
        <main className="mx-auto w-full max-w-2xl flex-1 p-6">
          <Card><CardContent className="py-10 text-center text-muted-foreground">
            هذا الاختبار لا يحتوي على أسئلة بعد.
          </CardContent></Card>
        </main>
      </>
    );
  }

  const q = questions[i];
  const progress = ((i + 1) / questions.length) * 100;
  const setAns = (val: Answer) => setAnswers((p) => ({ ...p, [q.id]: val }));
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  const autoQs = questions.filter((x) => EXAM_AUTO_GRADED[x.type]);
  const earned = autoQs.filter((x) => isCorrect(x, answers[x.id])).reduce((s, x) => s + x.points, 0);
  const total = autoQs.reduce((s, x) => s + x.points, 0) || 1;
  const scorePct = Math.round((earned / total) * 100);
  const manualCount = questions.length - autoQs.length;

  return (
    <>
      <TopBar title={preview === 1 ? `معاينة: ${exam.title}` : exam.title} />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 p-6">
        {preview === 1 && (
          <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">
            وضع المعاينة للمعلّم — لن يتم تسجيل هذه المحاولة في سجل النتائج.
          </div>
        )}
        {!done ? (
          <Card>
            <CardHeader>
              <div className="mb-2 flex justify-between text-sm text-muted-foreground">
                <span>السؤال {i + 1} من {questions.length}</span>
                <span>الوقت المتبقي: {mm}:{ss}</span>
              </div>
              <Progress value={progress} />
              <CardTitle className="mt-4">{q.text || "(بدون نص)"}</CardTitle>
              <div className="mt-1 flex gap-2">
                <Badge variant="outline">{q.points} درجة</Badge>
                {!EXAM_AUTO_GRADED[q.type] && <Badge variant="outline">تصحيح يدوي</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <QuestionInput q={q} answer={answers[q.id]} onChange={setAns} />
              <div className="flex justify-between">
                <Button variant="outline" disabled={i === 0} onClick={() => setI(i - 1)}>السابق</Button>
                {i < questions.length - 1 ? (
                  <Button onClick={() => setI(i + 1)}>التالي</Button>
                ) : (
                  <Button onClick={() => setDone(true)}>إنهاء</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader><CardTitle>نتيجتك</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="text-5xl font-bold text-primary">{scorePct}%</div>
              <p>حصلت على {earned} من {total} درجة (الأسئلة ذات التصحيح التلقائي).</p>
              {manualCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  يوجد {manualCount} سؤال مقالي بانتظار تصحيح المعلّم.
                </p>
              )}
              {preview === 1 ? (
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" onClick={() => nav({ to: "/dashboard/exams/$id/results", params: { id: exam.id } })}>عرض سجل النتائج</Button>
                  <Button className="rounded-full" onClick={() => window.history.back()}>عودة للتحرير</Button>
                </div>
              ) : (
                <Button onClick={() => nav({ to: "/student/dashboard" })} className="rounded-full">العودة للدورات</Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}

function QuestionInput({
  q, answer, onChange,
}: { q: ExamQuestion; answer: Answer | undefined; onChange: (a: Answer) => void }) {
  if (q.type === "mcq" || q.type === "image" || q.type === "audio") {
    const cur = answer?.type === q.type ? String(answer.value) : "";
    return (
      <div className="space-y-3">
        {q.type === "image" && q.imageUrl && (
          <img src={q.imageUrl} alt="" className="max-h-64 rounded-md object-contain" />
        )}
        {q.type === "audio" && q.audioUrl && (
          <audio controls src={q.audioUrl} className="w-full" />
        )}
        <RadioGroup value={cur} onValueChange={(v) => onChange({ type: q.type, value: Number(v) } as Answer)}>
          {q.options.map((o, idx) => (
            <div key={idx} className="flex items-center gap-2 rounded-md border p-3">
              <RadioGroupItem value={String(idx)} id={`${q.id}-${idx}`} />
              <Label htmlFor={`${q.id}-${idx}`} className="flex-1 cursor-pointer">{o || `الخيار ${idx + 1}`}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  }
  if (q.type === "tf") {
    const cur = answer?.type === "tf" ? answer.value : undefined;
    return (
      <div className="flex gap-2">
        {[true, false].map((v) => (
          <Button key={String(v)} variant={cur === v ? "default" : "outline"}
            onClick={() => onChange({ type: "tf", value: v })}>
            {v ? "صح" : "خطأ"}
          </Button>
        ))}
      </div>
    );
  }
  if (q.type === "multi") {
    const cur = answer?.type === "multi" ? answer.value : [];
    return (
      <div className="space-y-2">
        {q.options.map((o, idx) => {
          const checked = cur.includes(idx);
          return (
            <label key={idx} className="flex cursor-pointer items-center gap-2 rounded-md border p-3">
              <input type="checkbox" checked={checked}
                onChange={(e) => onChange({
                  type: "multi",
                  value: e.target.checked ? [...cur, idx] : cur.filter((n) => n !== idx),
                })} />
              <span className="flex-1">{o || `الخيار ${idx + 1}`}</span>
            </label>
          );
        })}
      </div>
    );
  }
  if (q.type === "order") {
    const cur = answer?.type === "order" ? answer.value : q.items.map(() => "");
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">اكتب كل عنصر في مكانه بالترتيب الصحيح.</p>
        {q.items.map((_, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Badge>{idx + 1}</Badge>
            <Input value={cur[idx] ?? ""}
              onChange={(e) => {
                const next = [...cur]; next[idx] = e.target.value;
                onChange({ type: "order", value: next });
              }} />
          </div>
        ))}
        <details className="text-xs text-muted-foreground">
          <summary>العناصر المتاحة</summary>
          <ul className="mt-1 list-disc pr-5">
            {q.items.map((it, i) => <li key={i}>{it}</li>)}
          </ul>
        </details>
      </div>
    );
  }
  if (q.type === "match") {
    const cur = answer?.type === "match" ? answer.value : {};
    return (
      <div className="space-y-2">
        {q.pairs.map((p, idx) => (
          <div key={idx} className="grid grid-cols-2 items-center gap-2">
            <div className="rounded-md bg-muted/50 p-2 text-sm">{p.left}</div>
            <Input placeholder="الإجابة المطابقة" value={cur[idx] ?? ""}
              onChange={(e) => onChange({ type: "match", value: { ...cur, [idx]: e.target.value } })} />
          </div>
        ))}
      </div>
    );
  }
  if (q.type === "essay") {
    const cur = answer?.type === "essay" ? answer.value : "";
    return (
      <Textarea rows={6} placeholder="اكتب إجابتك هنا..." value={cur}
        onChange={(e) => onChange({ type: "essay", value: e.target.value })} />
    );
  }
  return null;
}
