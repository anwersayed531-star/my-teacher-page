import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { mockStudents } from "@/lib/mock-data";
import { GRADE_LEVELS } from "@/lib/grades";
import { useAppState } from "@/lib/app-state";
import { useTeacherGrades } from "@/lib/teacher-grades";
import { metricsForStudent, isAtRisk } from "@/lib/analytics";
import { Search, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/dashboard/students/")({
  component: StudentsList,
});

function StudentsList() {
  const { selectedGrade, setSelectedGrade } = useAppState();
  const { gradeNames } = useTeacherGrades();
  const [q, setQ] = useState("");
  const filtered = mockStudents.filter((s) =>
    (s.name.includes(q) || s.email.includes(q)) &&
    (selectedGrade === "all" || s.gradeLevel === selectedGrade),
  );
  return (
    <>
      <TopBar title="الطلاب" />
      <main className="flex-1 space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="بحث بالاسم أو البريد..." value={q} onChange={(e) => setQ(e.target.value)} className="pr-9" />
          </div>
          <Select value={selectedGrade} onValueChange={(v) => setSelectedGrade(v as any)}>
            <SelectTrigger className="w-56"><SelectValue placeholder="الصف الدراسي" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الصفوف</SelectItem>
              {gradeNames.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">البريد</TableHead>
                  <TableHead className="text-right">الصف</TableHead>
                  <TableHead className="text-right">الدورات</TableHead>
                  <TableHead className="text-right">المعدل</TableHead>
                  <TableHead className="text-right">انضم</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => {
                  const risk = isAtRisk(metricsForStudent(s.id));
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link to="/dashboard/students/$id" params={{ id: s.id }} className="font-medium text-primary hover:underline">
                            {s.name}
                          </Link>
                          {risk && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" /> في خطر
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell dir="ltr">{s.email}</TableCell>
                      <TableCell><Badge variant="outline">{s.gradeLevel}</Badge></TableCell>
                      <TableCell>{s.courses}</TableCell>
                      <TableCell>{s.avgGrade}%</TableCell>
                      <TableCell dir="ltr">{s.joined}</TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">لا يوجد طلاب مطابقون.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
