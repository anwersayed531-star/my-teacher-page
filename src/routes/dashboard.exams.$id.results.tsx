import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { getExamResults } from "@/lib/courses.functions";

export const Route = createFileRoute("/dashboard/exams/$id/results")({
  component: ExamResults,
});

function ExamResults() {
  const { id } = useParams({ from: "/dashboard/exams/$id/results" });
  const { data, isLoading } = useQuery({
    queryKey: ["exam-results", id],
    queryFn: () => getExamResults({ data: { examId: id } }),
  });
  const exam = data?.exam;
  const attempts = data?.attempts ?? [];
  const [open, setOpen] = useState<string | null>(null);
  const questions = exam?.questions ?? [];
  const passing = exam?.passingPct ?? 60;

  return (
    <>
      <TopBar title={exam ? `نتائج: ${exam.title}` : "نتائج الاختبار"} />
      <main className="flex-1 space-y-4 p-6">
        <div className="flex justify-between">
          <p className="text-muted-foreground">اختبار #{id}</p>
          <Button asChild variant="outline">
            <Link to="/dashboard/exams/$id/stats" params={{ id }}>عرض الإحصائيات</Link>
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle>محاولات الطلاب ({attempts.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {isLoading && (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            )}
            {!isLoading && attempts.length === 0 && (
              <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                لا توجد محاولات مسجّلة بعد. عندما يبدأ الطلاب في الحل ستظهر هنا مع تفاصيل الإجابات.
              </p>
            )}
            {attempts.map((a) => {
              const passed = a.scorePct >= passing;
              return (
                <Collapsible key={a.id} open={open === a.id}
                  onOpenChange={(o) => setOpen(o ? a.id : null)}
                  className="rounded-lg border">
                  <CollapsibleTrigger className="flex w-full items-center gap-3 p-3 text-right">
                    <ChevronDown className="h-4 w-4 transition data-[state=closed]:-rotate-90" />
                    <span className="flex-1 font-medium">{a.studentName}</span>
                    <Badge variant={passed ? "default" : "destructive"}>
                      {a.scorePct}% — {passed ? "ناجح" : "راسب"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {a.earned}/{a.total} • {Math.floor(a.timeSec / 60)}:{String(a.timeSec % 60).padStart(2, "0")}
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 border-t p-3">
                    {a.answers.map((ans, idx) => {
                      const q = questions.find((x) => x.id === ans.questionId);
                      return (
                        <div key={ans.questionId} className="rounded-md border bg-muted/30 p-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{idx + 1}</Badge>
                            <span className="flex-1">{q?.text || "(بدون نص)"}</span>
                            {ans.correct
                              ? <CheckCircle2 className="h-4 w-4 text-primary" />
                              : <XCircle className="h-4 w-4 text-destructive" />}
                            <span className="text-xs">{ans.earned}/{ans.points}</span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            إجابة الطالب: {JSON.stringify(ans.raw) || "—"}
                          </div>
                        </div>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
