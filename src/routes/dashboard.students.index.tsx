import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { TopBar } from "@/components/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listStudents } from "@/lib/platform.functions";
import { useTeacherGrades } from "@/lib/teacher-grades";
import { Search, Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/students/")({ component: StudentsList });
function StudentsList() {
  const [grade, setGrade] = useState("all"); const [q, setQ] = useState("");
  const { gradeNames } = useTeacherGrades();
  const { data: students = [], isLoading } = useQuery({ queryKey: ["students"], queryFn: () => listStudents() });
  const filtered = students.filter((s) => (s.name.includes(q) || s.email.includes(q) || s.studentCode.includes(q)) && (grade === "all" || s.grade === grade));
  return <><TopBar title="الطلاب" /><main className="flex-1 space-y-4 p-6"><div className="flex gap-3"><div className="relative flex-1"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pr-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="الاسم أو البريد أو الرقم التعريفي" /></div><Select value={grade} onValueChange={setGrade}><SelectTrigger className="w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل الصفوف</SelectItem>{gradeNames.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div><Card><CardContent className="p-0">{isLoading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div> : <Table><TableHeader><TableRow><TableHead className="text-right">الطالب</TableHead><TableHead className="text-right">الرقم</TableHead><TableHead className="text-right">الصف</TableHead><TableHead className="text-right">الدورات</TableHead><TableHead className="text-right">المعدل</TableHead></TableRow></TableHeader><TableBody>{filtered.map((s) => <TableRow key={s.id}><TableCell><Link to="/dashboard/students/$id" params={{ id: s.id }} className="font-medium text-primary">{s.name}<span dir="ltr" className="block text-xs text-muted-foreground">{s.email}</span></Link></TableCell><TableCell dir="ltr">{s.studentCode || "—"}</TableCell><TableCell><Badge variant="outline">{s.grade || "—"}</Badge></TableCell><TableCell>{s.coursesCount}</TableCell><TableCell>{s.avgScore === null ? "لا توجد محاولات" : `${s.avgScore}%`}</TableCell></TableRow>)}{filtered.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">لا يوجد طلاب.</TableCell></TableRow>}</TableBody></Table>}</CardContent></Card></main></>;
}