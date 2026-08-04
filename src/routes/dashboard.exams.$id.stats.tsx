import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { mockExamResults } from "@/lib/mock-data";
import { BarChart3, LineChart as LineIcon, Table as TableIcon, FileDown, AlertTriangle, Bell } from "lucide-react";

export const Route = createFileRoute("/dashboard/exams/$id/stats")({
  component: ExamStats,
});

function exportCsv(rows: typeof mockExamResults) {
  const header = "الطالب,الدرجة,الحالة,الوقت (ثواني),المحاولات\n";
  const body = rows.map((r) => `${r.student},${r.score}%,${r.passed ? "ناجح" : "راسب"},${r.timeSec},${r.attempts}`).join("\n");
  const blob = new Blob(["\uFEFF" + header + body], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "exam-stats.csv";
  a.click();
}

function ExamStats() {
  const { id } = useParams({ from: "/dashboard/exams/$id/stats" });
  const [view, setView] = useState<"bar" | "line" | "table">("bar");
  const scores = mockExamResults.map((r) => r.score);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const passRate = Math.round((mockExamResults.filter((r) => r.passed).length / mockExamResults.length) * 100);
  const ranking = [...mockExamResults].sort((a, b) => b.score - a.score);
  const atRisk = mockExamResults.filter((r) => r.score < 60);
  const inactive = [{ name: "خالد إبراهيم", days: 12 }, { name: "سارة سعيد", days: 8 }];
  const missedQuestions = [
    { q: "السؤال ٥ — قاعدة السلسلة", correctPct: 32 },
    { q: "السؤال ٨ — التكامل بالتجزئة", correctPct: 41 },
    { q: "السؤال ٢ — النهايات", correctPct: 55 },
  ];

  return (
    <>
      <TopBar title="إحصائيات الاختبار" />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">اختبار #{id}</p>
          <Button variant="outline" size="sm" onClick={() => exportCsv(mockExamResults)}>
            <FileDown className="ml-1 h-4 w-4" /> تصدير Excel
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { l: "المتوسط", v: `${avg}%` }, { l: "الأعلى", v: `${max}%` },
            { l: "الأدنى", v: `${min}%` }, { l: "نسبة النجاح", v: `${passRate}%` },
          ].map((s) => (
            <Card key={s.l}><CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary">{s.v}</div>
              <div className="text-sm text-muted-foreground">{s.l}</div>
            </CardContent></Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-4 w-4" /> طلاب في خطر</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {atRisk.length === 0 && <p className="text-sm text-muted-foreground">لا يوجد.</p>}
              {atRisk.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-md border p-2">
                  <span className="font-medium">{r.student}</span>
                  <Badge variant="destructive">{r.score}%</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>طلاب غير نشطين</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {inactive.map((s) => (
                <div key={s.name} className="flex items-center justify-between rounded-md border p-2">
                  <span>{s.name} <span className="text-xs text-muted-foreground">— منذ {s.days} يوم</span></span>
                  <Button size="sm" variant="outline"><Bell className="ml-1 h-3.5 w-3.5" /> تذكير</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>توزيع الدرجات</CardTitle>
            <div className="flex rounded-lg bg-muted p-1">
              {[{ k: "bar" as const, I: BarChart3 }, { k: "line" as const, I: LineIcon }, { k: "table" as const, I: TableIcon }].map(({ k, I }) => (
                <button key={k} onClick={() => setView(k)}
                  className={`rounded-md px-3 py-1.5 text-sm ${view === k ? "bg-background shadow" : "text-muted-foreground"}`}>
                  <I className="h-4 w-4" />
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {view === "bar" && (
              <div className="flex h-48 items-end gap-3">
                {ranking.map((r) => (
                  <div key={r.id} className="flex flex-1 flex-col items-center gap-2">
                    <div className="w-full rounded-t bg-primary/70" style={{ height: `${r.score}%` }} />
                    <span className="line-clamp-1 text-[10px]">{r.student}</span>
                  </div>
                ))}
              </div>
            )}
            {view === "line" && (
              <svg viewBox="0 0 400 200" className="h-48 w-full">
                <polyline fill="none" stroke="currentColor" className="text-primary" strokeWidth="3"
                  points={ranking.map((r, i) => `${(i / (ranking.length - 1)) * 380 + 10},${190 - (r.score / 100) * 180}`).join(" ")} />
              </svg>
            )}
            {view === "table" && (
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-right">الطالب</TableHead>
                  <TableHead className="text-right">الدرجة</TableHead>
                  <TableHead className="text-right">المحاولات</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {ranking.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.student}</TableCell>
                      <TableCell>{r.score}%</TableCell>
                      <TableCell>{r.attempts}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>ترتيب الطلاب</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {ranking.map((r, i) => (
                <div key={r.id} className="flex items-center gap-3 rounded-md border p-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{i + 1}</div>
                  <div className="flex-1">{r.student}</div>
                  <div className="font-semibold">{r.score}%</div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>الأسئلة الأصعب</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {missedQuestions.map((m) => (
                <div key={m.q} className="flex items-center justify-between rounded-md border p-2">
                  <span className="text-sm">{m.q}</span>
                  <Badge variant="destructive">{m.correctPct}% صحيحة</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
