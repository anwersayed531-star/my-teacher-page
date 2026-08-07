import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { TopBar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { teacherOverview } from "@/lib/platform.functions";
import { useTeacherGrades } from "@/lib/teacher-grades";
import { Users, BookOpen, GraduationCap, Video, FileQuestion, Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({ component: DashboardHome });

function DashboardHome() {
  const [grade, setGrade] = useState("all");
  const { gradeNames } = useTeacherGrades();
  const { data, isLoading } = useQuery({ queryKey: ["teacher-overview"], queryFn: () => teacherOverview() });
  if (isLoading) return <><TopBar title="الرئيسية" /><main className="flex flex-1 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main></>;
  const students = (data?.students ?? []).filter((s) => grade === "all" || s.grade === grade);
  const courses = (data?.coursesByGrade ?? []).filter((c) => grade === "all" || c.grade === grade);
  const attempts = (data?.attemptsByGrade ?? []).filter((a) => grade === "all" || a.grade === grade);
  const stats = [
    { label: "الطلاب", value: students.length, icon: Users },
    { label: "الدورات", value: courses.length, icon: BookOpen },
    { label: "الدروس", value: grade === "all" ? data?.counts.lessons ?? 0 : "—", icon: GraduationCap },
    { label: "الفيديوهات", value: grade === "all" ? data?.counts.videos ?? 0 : "—", icon: Video },
    { label: "الاختبارات", value: grade === "all" ? data?.counts.exams ?? 0 : attempts.length, icon: FileQuestion },
  ];
  return <><TopBar title="الرئيسية" /><main className="flex-1 space-y-6 p-6">
    <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">بيانات المنصة الفعلية</p><Select value={grade} onValueChange={setGrade}><SelectTrigger className="w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل الصفوف</SelectItem>{gradeNames.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{stats.map(({ label, value, icon: Icon }) => <Card key={label}><CardContent className="flex items-center gap-4 pt-6"><Icon className="h-7 w-7 text-primary" /><div><div className="text-2xl font-bold">{value}</div><div className="text-sm text-muted-foreground">{label}</div></div></CardContent></Card>)}</div>
    <div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>آخر النشاطات</CardTitle></CardHeader><CardContent className="space-y-3">{(data?.activity ?? []).length === 0 ? <p className="text-sm text-muted-foreground">لا توجد نشاطات حتى الآن.</p> : data?.activity.map((a) => <div key={a.id} className="flex justify-between gap-3 border-b pb-2"><span className="text-sm">{a.text}</span><span className="text-xs text-muted-foreground">{new Date(a.at).toLocaleString("ar-EG")}</span></div>)}</CardContent></Card>
    <Card><CardHeader><CardTitle>الطلاب</CardTitle></CardHeader><CardContent className="space-y-2">{students.length === 0 ? <p className="text-sm text-muted-foreground">لا يوجد طلاب.</p> : students.slice(0, 8).map((s) => <Link key={s.id} to="/dashboard/students/$id" params={{ id: s.id }} className="flex justify-between rounded-md border p-3"><span>{s.name}</span><Badge variant="outline">{s.grade || "بدون صف"}</Badge></Link>)}</CardContent></Card></div>
    <Card><CardHeader><CardTitle>الدورات</CardTitle></CardHeader><CardContent className="space-y-2">{courses.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد دورات.</p> : courses.map((c) => <Link key={c.id} to="/dashboard/courses/$id" params={{ id: c.id }} className="flex justify-between rounded-md border p-3"><span>{c.title}</span><Badge variant={c.isPublished ? "default" : "secondary"}>{c.grade || "كل الصفوف"}</Badge></Link>)}</CardContent></Card>
  </main></>;
}