import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { BarChart3, LineChart as LineIcon, Table as TableIcon, FileDown } from "lucide-react";

export const Route = createFileRoute("/student/stats")({
  component: StudentStats,
});

const grades = [
  { name: "اختبار الشهر ١ — الرياضيات", g: 92, p: true },
  { name: "اختبار سريع — التفاضل", g: 78, p: true },
  { name: "اختبار الوحدة ٢", g: 55, p: false },
  { name: "اختبار المراجعة", g: 88, p: true },
  { name: "اختبار التكامل", g: 74, p: true },
];

function exportCsv(rows: { name: string; g: number; p: boolean }[]) {
  const header = "الاختبار,الدرجة,الحالة\n";
  const body = rows.map((r) => `${r.name},${r.g}%,${r.p ? "ناجح" : "راسب"}`).join("\n");
  const blob = new Blob(["\uFEFF" + header + body], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "my-grades.csv";
  a.click();
}

function StudentStats() {
  const [view, setView] = useState<"bar" | "line" | "table">("bar");
  const avg = Math.round(grades.reduce((a, b) => a + b.g, 0) / grades.length);
  const max = Math.max(...grades.map((g) => g.g));
  const min = Math.min(...grades.map((g) => g.g));
  const passRate = Math.round((grades.filter((g) => g.p).length / grades.length) * 100);
  const chartMax = Math.max(...grades.map((g) => g.g));

  return (
    <>
      <TopBar title="الإحصائيات" />
      <main className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { l: "المعدل", v: `${avg}%` },
            { l: "الأعلى", v: `${max}%` },
            { l: "الأدنى", v: `${min}%` },
            { l: "نسبة النجاح", v: `${passRate}%` },
          ].map((s) => (
            <Card key={s.l}><CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary">{s.v}</div>
              <div className="text-sm text-muted-foreground">{s.l}</div>
            </CardContent></Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>تطور درجاتك</CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg bg-muted p-1">
                {[
                  { k: "bar" as const, icon: BarChart3 },
                  { k: "line" as const, icon: LineIcon },
                  { k: "table" as const, icon: TableIcon },
                ].map(({ k, icon: I }) => (
                  <button key={k} onClick={() => setView(k)}
                    className={`rounded-md px-3 py-1.5 text-sm ${view === k ? "bg-background shadow" : "text-muted-foreground"}`}>
                    <I className="h-4 w-4" />
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => exportCsv(grades)}>
                <FileDown className="ml-1 h-4 w-4" /> Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {view === "bar" && (
              <div className="flex h-56 items-end gap-3">
                {grades.map((g) => (
                  <div key={g.name} className="flex flex-1 flex-col items-center gap-2">
                    <div className="w-full rounded-t-md bg-primary/70" style={{ height: `${(g.g / chartMax) * 100}%` }} />
                    <span className="line-clamp-1 text-[10px] text-muted-foreground">{g.name}</span>
                  </div>
                ))}
              </div>
            )}
            {view === "line" && (
              <svg viewBox="0 0 400 200" className="h-56 w-full">
                <polyline fill="none" stroke="currentColor" className="text-primary" strokeWidth="3"
                  points={grades.map((g, i) => `${(i / (grades.length - 1)) * 380 + 10},${190 - (g.g / 100) * 180}`).join(" ")} />
                {grades.map((g, i) => (
                  <circle key={i} cx={(i / (grades.length - 1)) * 380 + 10} cy={190 - (g.g / 100) * 180} r="4" className="fill-primary" />
                ))}
              </svg>
            )}
            {view === "table" && (
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-right">الاختبار</TableHead>
                  <TableHead className="text-right">الدرجة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {grades.map((g) => (
                    <TableRow key={g.name}>
                      <TableCell>{g.name}</TableCell>
                      <TableCell>{g.g}%</TableCell>
                      <TableCell><Badge variant={g.p ? "default" : "destructive"}>{g.p ? "ناجح" : "راسب"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>تقدم الدورات</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[{ n: "الرياضيات", p: 72 }, { n: "الفيزياء", p: 40 }].map((c) => (
              <div key={c.n}>
                <div className="mb-1 flex justify-between text-sm"><span>{c.n}</span><span>{c.p}%</span></div>
                <Progress value={c.p} />
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
