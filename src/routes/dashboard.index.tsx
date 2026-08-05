import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  mockStats, mockActivity, mockChart, mockCourses, mockStudents,
} from "@/lib/mock-data";
import { GRADE_LEVELS } from "@/lib/grades";
import { useAppState } from "@/lib/app-state";
import { useTeacherGrades } from "@/lib/teacher-grades";
import {
  studentMetrics, isAtRisk, mostMissedQuestions, sendReminder, exportRowsToCsv,
} from "@/lib/analytics";
import {
  Users, BookOpen, GraduationCap, Video, FileQuestion, AlertTriangle,
  Bell, FileDown, TrendingDown, Zap, ChevronLeft, HelpCircle, Layers,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { selectedGrade, setSelectedGrade } = useAppState();
  const { gradeNames } = useTeacherGrades();

  // TODO: connect to Supabase — replace mock filters with grade-scoped DB queries.
  const courses = selectedGrade === "all" ? mockCourses : mockCourses.filter((c) => c.gradeLevel === selectedGrade);
  const students = selectedGrade === "all" ? mockStudents : mockStudents.filter((s) => s.gradeLevel === selectedGrade);
  const metrics = studentMetrics.filter((m) => selectedGrade === "all" || m.gradeLevel === selectedGrade);

  const totalLessons = courses.reduce((n, c) => n + c.units.reduce((m, u) => m + u.lessons.length, 0), 0);
  const totalVideos = courses.reduce((n, c) => n + c.units.reduce((m, u) => m + u.lessons.reduce((k, l) => k + l.videos.length, 0), 0), 0);
  const totalExams = courses.reduce((n, c) => n + c.units.reduce((m, u) => m + u.lessons.reduce((k, l) => k + l.exams.length, 0), 0), 0);

  const stats = [
    { label: "الطلاب", val: selectedGrade === "all" ? mockStats.students : students.length, icon: Users },
    { label: "الدورات", val: courses.length, icon: BookOpen },
    { label: "الدروس", val: totalLessons || mockStats.lessons, icon: GraduationCap },
    { label: "الفيديوهات", val: totalVideos || mockStats.videos, icon: Video },
    { label: "الاختبارات", val: totalExams || mockStats.exams, icon: FileQuestion },
  ];
  const max = Math.max(...mockChart.map((c) => c.v));

  // Derived lists
  const engaged = [...metrics].sort((a, b) => b.engagementScore - a.engagementScore);
  const weakest = [...metrics].sort((a, b) => a.avgGrade - b.avgGrade);
  const inactive = metrics.filter((m) => m.lastLoginDays >= 7).sort((a, b) => b.lastLoginDays - a.lastLoginDays);
  const missed = [...mostMissedQuestions].sort((a, b) => b.errorPct - a.errorPct);

  // Distribution by grade
  const distribution = GRADE_LEVELS.map((g) => ({
    g,
    n: mockStudents.filter((s) => s.gradeLevel === g).length,
  }));
  const distMax = Math.max(1, ...distribution.map((d) => d.n));

  return (
    <>
      <TopBar title="الرئيسية" />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">نظرة عامة على منصتك</p>
          <Select value={selectedGrade} onValueChange={(v) => setSelectedGrade(v as any)}>
            <SelectTrigger className="w-56"><SelectValue placeholder="الصف الدراسي" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الصفوف</SelectItem>
              {gradeNames.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{s.val}</div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>أداء الطلاب — آخر ٦ أشهر</CardTitle></CardHeader>
            <CardContent>
              <div className="flex h-56 items-end gap-3">
                {mockChart.map((c) => (
                  <div key={c.m} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-md bg-primary/70 transition hover:bg-primary"
                      style={{ height: `${(c.v / max) * 100}%` }}
                      title={`${c.v}`}
                    />
                    <span className="text-xs text-muted-foreground">{c.m}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>آخر النشاطات</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {mockActivity.map((a) => (
                <div key={a.id} className="flex justify-between gap-3 border-b pb-2 last:border-0">
                  <span className="text-sm">{a.text}</span>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">{a.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Grade distribution */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5 text-primary" /> توزيع الطلاب حسب الصف</CardTitle></CardHeader>
          <CardContent>
            <div className="flex h-40 items-end gap-3">
              {distribution.map((d) => (
                <div key={d.g} className="flex flex-1 flex-col items-center gap-2">
                  <div className="text-xs font-semibold">{d.n}</div>
                  <div className="w-full rounded-t-md bg-primary/70" style={{ height: `${(d.n / distMax) * 100}%` }} />
                  <span className="line-clamp-2 text-center text-[10px] text-muted-foreground">{d.g}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expandable sections */}
        <div className="grid gap-4 md:grid-cols-2">
          <ExpandableCard
            icon={<HelpCircle className="h-5 w-5 text-primary" />}
            title="الأسئلة الأكثر خطأً"
            emptyLabel="لا توجد بيانات."
            preview={missed.slice(0, 3).map((q) => (
              <div key={q.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                <span className="line-clamp-1">{q.text}</span>
                <Badge variant="destructive">{q.errorPct}% خطأ</Badge>
              </div>
            ))}
            detail={
              <>
                <ExportButton
                  onClick={() =>
                    exportRowsToCsv(
                      "most-missed-questions.csv",
                      ["الاختبار", "السؤال", "نسبة الخطأ", "الإجابة الصحيحة"],
                      missed.map((q) => [q.exam, q.text, `${q.errorPct}%`, q.correctAnswer]),
                    )
                  }
                />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">السؤال</TableHead>
                      <TableHead className="text-right">الاختبار</TableHead>
                      <TableHead className="text-right">نسبة الخطأ</TableHead>
                      <TableHead className="text-right">الإجابة الصحيحة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {missed.map((q) => (
                      <TableRow key={q.id}>
                        <TableCell className="max-w-xs">{q.text}</TableCell>
                        <TableCell className="text-muted-foreground">{q.exam}</TableCell>
                        <TableCell><Badge variant="destructive">{q.errorPct}%</Badge></TableCell>
                        <TableCell className="font-medium text-primary">{q.correctAnswer}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            }
          />

          <ExpandableCard
            icon={<Zap className="h-5 w-5 text-primary" />}
            title="الطلاب الأكثر تفاعلاً"
            emptyLabel="لا يوجد طلاب."
            preview={engaged.slice(0, 3).map((m, i) => (
              <StudentRow key={m.id} rank={i + 1} id={m.id} name={m.name} right={<Badge>{m.engagementScore}</Badge>} />
            ))}
            detail={
              <>
                <ExportButton
                  onClick={() =>
                    exportRowsToCsv(
                      "most-engaged-students.csv",
                      ["الترتيب", "الاسم", "الصف", "التفاعل", "تعليقات", "تفاعلات"],
                      engaged.map((m, i) => [i + 1, m.name, m.gradeLevel, m.engagementScore, m.commentsCount, m.reactionsCount]),
                    )
                  }
                />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">الاسم</TableHead>
                      <TableHead className="text-right">الصف</TableHead>
                      <TableHead className="text-right">التفاعل</TableHead>
                      <TableHead className="text-right">تعليقات</TableHead>
                      <TableHead className="text-right">تفاعلات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {engaged.map((m, i) => (
                      <TableRow key={m.id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>
                          <Link to="/dashboard/students/$id" params={{ id: m.id }} className="text-primary hover:underline">{m.name}</Link>
                        </TableCell>
                        <TableCell><Badge variant="outline">{m.gradeLevel}</Badge></TableCell>
                        <TableCell>{m.engagementScore}</TableCell>
                        <TableCell>{m.commentsCount}</TableCell>
                        <TableCell>{m.reactionsCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            }
          />

          <ExpandableCard
            icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
            title="طلاب غير نشطين (٧ أيام+)"
            emptyLabel="جميع الطلاب نشطون."
            preview={inactive.slice(0, 3).map((m) => (
              <InactiveRow key={m.id} m={m} />
            ))}
            detail={
              <>
                <ExportButton
                  onClick={() =>
                    exportRowsToCsv(
                      "inactive-students.csv",
                      ["الاسم", "الصف", "آخر دخول (أيام)"],
                      inactive.map((m) => [m.name, m.gradeLevel, m.lastLoginDays]),
                    )
                  }
                />
                <div className="space-y-2">
                  {inactive.map((m) => <InactiveRow key={m.id} m={m} />)}
                </div>
              </>
            }
          />

          <ExpandableCard
            icon={<TrendingDown className="h-5 w-5 text-destructive" />}
            title="الأضعف في الاختبارات"
            emptyLabel="لا يوجد بيانات."
            preview={weakest.slice(0, 3).map((m) => (
              <StudentRow
                key={m.id}
                id={m.id}
                name={m.name}
                right={
                  <div className="flex items-center gap-2">
                    {isAtRisk(m) && <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> خطر</Badge>}
                    <Badge variant="outline">{m.avgGrade}%</Badge>
                  </div>
                }
              />
            ))}
            detail={
              <>
                <ExportButton
                  onClick={() =>
                    exportRowsToCsv(
                      "weakest-students.csv",
                      ["الاسم", "الصف", "المعدل", "الحضور"],
                      weakest.map((m) => [m.name, m.gradeLevel, `${m.avgGrade}%`, `${m.attendancePct}%`]),
                    )
                  }
                />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الاسم</TableHead>
                      <TableHead className="text-right">الصف</TableHead>
                      <TableHead className="text-right">المعدل</TableHead>
                      <TableHead className="text-right">الحضور</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weakest.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>
                          <Link to="/dashboard/students/$id" params={{ id: m.id }} className="text-primary hover:underline">{m.name}</Link>
                        </TableCell>
                        <TableCell><Badge variant="outline">{m.gradeLevel}</Badge></TableCell>
                        <TableCell>{m.avgGrade}%</TableCell>
                        <TableCell>{m.attendancePct}%</TableCell>
                        <TableCell>{isAtRisk(m) ? <Badge variant="destructive">في خطر</Badge> : <Badge>مستقر</Badge>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            }
          />
        </div>

        <Card>
          <CardHeader><CardTitle>الدورات الأخيرة</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {courses.map((c) => (
              <Link
                key={c.id}
                to="/dashboard/courses/$id"
                params={{ id: c.id }}
                className="flex items-center justify-between rounded-lg border p-3 transition hover:bg-muted"
              >
                <div>
                  <div className="font-medium">{c.title}</div>
                  <div className="text-xs text-muted-foreground">{c.studentsCount} طالب</div>
                </div>
                <span className="text-sm text-primary">إدارة ←</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </main>
    </>
  );
}

function ExpandableCard({
  icon, title, preview, detail, emptyLabel,
}: {
  icon: React.ReactNode;
  title: string;
  preview: React.ReactNode;
  detail: React.ReactNode;
  emptyLabel: string;
}) {
  const isEmpty = Array.isArray(preview) && preview.length === 0;
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">{icon} {title}</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 text-primary">
              عرض الكل <ChevronLeft className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
            <DialogHeader><DialogTitle className="flex items-center gap-2">{icon} {title}</DialogTitle></DialogHeader>
            <div className="space-y-3">{detail}</div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-2">
        {isEmpty ? <p className="text-sm text-muted-foreground">{emptyLabel}</p> : preview}
      </CardContent>
    </Card>
  );
}

function StudentRow({ id, name, right, rank }: { id: string; name: string; right: React.ReactNode; rank?: number }) {
  return (
    <div className="flex items-center gap-3 rounded-md border p-2 text-sm">
      {rank !== undefined && (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{rank}</div>
      )}
      <Link to="/dashboard/students/$id" params={{ id }} className="flex-1 font-medium text-primary hover:underline">{name}</Link>
      {right}
    </div>
  );
}

function InactiveRow({ m }: { m: { id: string; name: string; lastLoginDays: number } }) {
  return (
    <div className="flex items-center justify-between rounded-md border p-2 text-sm">
      <Link to="/dashboard/students/$id" params={{ id: m.id }} className="text-primary hover:underline">
        {m.name} <span className="text-xs text-muted-foreground">— منذ {m.lastLoginDays} يوم</span>
      </Link>
      <Button size="sm" variant="outline" onClick={() => sendReminder(m.id)}>
        <Bell className="ml-1 h-3.5 w-3.5" /> تذكير
      </Button>
    </div>
  );
}

function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-end">
      <Button variant="outline" size="sm" onClick={onClick}>
        <FileDown className="ml-1 h-4 w-4" /> تصدير Excel
      </Button>
    </div>
  );
}
