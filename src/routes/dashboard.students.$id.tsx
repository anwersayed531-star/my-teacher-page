import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { mockStudents, mockCourses } from "@/lib/mock-data";
import { metricsForStudent, isAtRisk, exportRowsToCsv } from "@/lib/analytics";
import {
  AlertTriangle, BarChart3, LineChart as LineIcon, Table as TableIcon,
  FileDown, CalendarCheck, Video, Trophy,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/students/$id")({
  component: StudentProfile,
});

// TODO: connect to Supabase — per-exam scores per student from exam_attempts.
const perExamScores = [
  { name: "اختبار الشهر ١", g: 92, p: true },
  { name: "اختبار سريع", g: 78, p: true },
  { name: "اختبار الوحدة ٢", g: 55, p: false },
  { name: "اختبار المراجعة", g: 84, p: true },
  { name: "اختبار التكامل", g: 71, p: true },
];

function StudentProfile() {
  const { id } = useParams({ from: "/dashboard/students/$id" });
  const s = mockStudents.find((x) => x.id === id) ?? mockStudents[0];
  const m = metricsForStudent(s.id);
  const atRisk = isAtRisk(m);
  const [view, setView] = useState<"bar" | "line" | "table">("bar");
  const chartMax = Math.max(...perExamScores.map((g) => g.g));

  return (
    <>
      <TopBar title={`ملف الطالب: ${s.name}`} />
      <main className="flex-1 space-y-6 p-6">
        {atRisk && (
          <div className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <div className="flex-1 text-sm font-medium">
              هذا الطالب في خطر — المعدل {m.avgGrade}% والحضور {m.attendancePct}%. يُنصح بالتواصل معه.
            </div>
            <Badge variant="destructive">في خطر</Badge>
          </div>
        )}

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <Avatar className="h-16 w-16"><AvatarFallback className="bg-primary/10 text-lg text-primary">{s.name[0]}</AvatarFallback></Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xl font-bold">
                {s.name}
                {atRisk && <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> في خطر</Badge>}
              </div>
              <div dir="ltr" className="text-sm text-muted-foreground">{s.email} · {s.phone}</div>
              <Badge variant="outline" className="mt-2">{s.gradeLevel}</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportRowsToCsv(
                  `student-${s.id}-stats.csv`,
                  ["المؤشر", "القيمة"],
                  [
                    ["الاسم", s.name],
                    ["الصف", s.gradeLevel],
                    ["معدل الدرجات", `${m.avgGrade}%`],
                    ["نسبة الحضور", `${m.attendancePct}%`],
                    ["فيديوهات مشاهدة", m.videosWatched],
                    ["التفاعل", m.engagementScore],
                    ["آخر دخول (أيام)", m.lastLoginDays],
                    ...perExamScores.map((g) => [g.name, `${g.g}%`]),
                  ],
                )
              }
            >
              <FileDown className="ml-1 h-4 w-4" /> تصدير Excel
            </Button>
          </CardContent>
        </Card>

        {/* Quick stat cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><CalendarCheck className="h-5 w-5" /></div>
              <div>
                <div className="text-2xl font-bold">{m.attendancePct}%</div>
                <div className="text-xs text-muted-foreground">نسبة الحضور</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Video className="h-5 w-5" /></div>
              <div>
                <div className="text-2xl font-bold">{m.videosWatched}</div>
                <div className="text-xs text-muted-foreground">فيديوهات مشاهدة</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Trophy className="h-5 w-5" /></div>
              <div>
                <div className="text-2xl font-bold">{m.avgGrade}%</div>
                <div className="text-xs text-muted-foreground">متوسط الاختبارات</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><BarChart3 className="h-5 w-5" /></div>
              <div>
                <div className="text-2xl font-bold">{m.engagementScore}</div>
                <div className="text-xs text-muted-foreground">درجة التفاعل</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart toggle */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>تطور درجات الاختبارات</CardTitle>
            <div className="flex rounded-lg bg-muted p-1">
              {[
                { k: "bar" as const, I: BarChart3 },
                { k: "line" as const, I: LineIcon },
                { k: "table" as const, I: TableIcon },
              ].map(({ k, I }) => (
                <button
                  key={k}
                  onClick={() => setView(k)}
                  className={`rounded-md px-3 py-1.5 text-sm ${view === k ? "bg-background shadow" : "text-muted-foreground"}`}
                >
                  <I className="h-4 w-4" />
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {view === "bar" && (
              <div className="flex h-56 items-end gap-3">
                {perExamScores.map((g) => (
                  <div key={g.name} className="flex flex-1 flex-col items-center gap-2">
                    <div className="w-full rounded-t-md bg-primary/70" style={{ height: `${(g.g / chartMax) * 100}%` }} />
                    <span className="line-clamp-1 text-[10px] text-muted-foreground">{g.name}</span>
                  </div>
                ))}
              </div>
            )}
            {view === "line" && (
              <svg viewBox="0 0 400 200" className="h-56 w-full">
                <polyline
                  fill="none"
                  stroke="currentColor"
                  className="text-primary"
                  strokeWidth="3"
                  points={perExamScores
                    .map((g, i) => `${(i / (perExamScores.length - 1)) * 380 + 10},${190 - (g.g / 100) * 180}`)
                    .join(" ")}
                />
                {perExamScores.map((g, i) => (
                  <circle
                    key={i}
                    cx={(i / (perExamScores.length - 1)) * 380 + 10}
                    cy={190 - (g.g / 100) * 180}
                    r="4"
                    className="fill-primary"
                  />
                ))}
              </svg>
            )}
            {view === "table" && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الاختبار</TableHead>
                    <TableHead className="text-right">الدرجة</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perExamScores.map((g) => (
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

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>الدورات المسجّل بها</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {mockCourses.slice(0, s.courses).map((c) => (
                <div key={c.id} className="space-y-1">
                  <div className="flex justify-between"><span className="text-sm">{c.title}</span><span className="text-xs text-muted-foreground">65%</span></div>
                  <Progress value={65} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>سجل النشاط</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between border-b pb-2">شاهد درس "التفاضل"<span className="text-xs text-muted-foreground">قبل ساعة</span></div>
              <div className="flex justify-between border-b pb-2">أنهى اختبار الشهر الأول<span className="text-xs text-muted-foreground">أمس</span></div>
              <div className="flex justify-between">اشترك في دورة الرياضيات<span className="text-xs text-muted-foreground">قبل أسبوع</span></div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
