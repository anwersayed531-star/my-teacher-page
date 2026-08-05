import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { TopBar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { listTeacherCourses } from "@/lib/courses.functions";
import { GRADE_LEVELS } from "@/lib/grades";
import { useAppState } from "@/lib/app-state";
import { useTeacherGrades } from "@/lib/teacher-grades";
import { Plus, BookOpen, Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/courses/")({
  component: CoursesList,
});

function CoursesList() {
  const { selectedGrade, setSelectedGrade } = useAppState();
  const { gradeNames } = useTeacherGrades();
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["teacher-courses"],
    queryFn: () => listTeacherCourses(),
  });

  const filtered = selectedGrade === "all"
    ? courses
    : courses.filter((c) => c.gradeLevel === selectedGrade);

  return (
    <>
      <TopBar title="الدورات" />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground">إدارة كل دوراتك، وحداتها ودروسها.</p>
          <div className="flex items-center gap-2">
            <Select value={selectedGrade} onValueChange={(v) => setSelectedGrade(v as any)}>
              <SelectTrigger className="w-56"><SelectValue placeholder="الصف الدراسي" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الصفوف</SelectItem>
                {gradeNames.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button className="rounded-full" asChild>
              <Link to="/dashboard/courses/$id" params={{ id: "new" }}>
                <Plus className="ml-2 h-4 w-4" /> دورة جديدة
              </Link>
            </Button>
          </div>
        </div>
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="overflow-hidden transition hover:shadow-lg">
              {c.cover ? (
                <img src={c.cover} alt={c.title} className="h-32 w-full object-cover" />
              ) : (
                <div className="flex h-32 items-center justify-center bg-gradient-to-br from-primary/20 to-accent/30">
                  <BookOpen className="h-10 w-10 text-primary" />
                </div>
              )}

              <CardContent className="space-y-2 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold">{c.title}</h3>
                  <Badge variant={c.isPaid ? "default" : "secondary"}>
                    {c.isPaid ? `${c.price} ج.م` : "مجاني"}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{c.gradeLevel}</Badge>
                    <span className="text-xs text-muted-foreground">{c.studentsCount} طالب</span>
                  </div>
                  <Link to="/dashboard/courses/$id" params={{ id: c.id }} className="text-sm font-medium text-primary hover:underline">
                    إدارة ←
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
          {!isLoading && filtered.length === 0 && (
            <Card className="col-span-full"><CardContent className="py-10 text-center text-muted-foreground">لا توجد دورات لهذا الصف. اضغط "دورة جديدة" لإنشاء واحدة.</CardContent></Card>
          )}
        </div>
      </main>
    </>
  );
}

