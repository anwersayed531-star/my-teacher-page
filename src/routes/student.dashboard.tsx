import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { listStudentCourses } from "@/lib/courses.functions";
import { myEnrollments } from "@/lib/platform.functions";
import { useAuth } from "@/lib/auth";
import { BookOpen, Loader2 } from "lucide-react";

export const Route = createFileRoute("/student/dashboard")({
  component: StudentDashboard,
});

function StudentDashboard() {
  const { profile } = useAuth();
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["student-courses"],
    queryFn: () => listStudentCourses(),
  });
  const { data: enrolledIds = [] } = useQuery({ queryKey: ["my-enrollments"], queryFn: () => myEnrollments() });
  const studentGrade = profile?.grade ?? "";
  const gradeCourses = courses.filter((c) => c.gradeLevel === studentGrade);
  const subscribed = gradeCourses.filter((c) => !c.isPaid || enrolledIds.includes(c.id));
  const browsable = gradeCourses.filter((c) => c.isPaid && !enrolledIds.includes(c.id));

  return (
    <>
      <TopBar title="دوراتي" />
      <main className="flex-1 space-y-6 p-6">
        {isLoading && (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        )}
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <div>
              <div className="text-sm text-muted-foreground">صفك الدراسي</div>
              <div className="font-semibold">{studentGrade}</div>
            </div>
          </CardContent>
        </Card>

        <section>
          <h2 className="mb-3 font-display text-xl font-bold">دورات مجانية متاحة</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subscribed.length === 0 && (
              <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="py-8 text-center text-muted-foreground">لا توجد دورات مجانية لهذا الصف.</CardContent>
              </Card>
            )}
            {subscribed.map((c) => (
              <Card key={c.id} className="overflow-hidden">
                {c.cover ? <img src={c.cover} alt={c.title} className="h-28 w-full object-cover" /> : <div className="flex h-28 items-center justify-center bg-muted"><BookOpen className="h-10 w-10 text-primary" /></div>}
                <CardContent className="space-y-2 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">{c.title}</h3>
                    <Badge>متاح</Badge>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                  <Button asChild size="sm" className="mt-2 w-full rounded-full">
                    <Link to="/student/courses/$id" params={{ id: c.id }}>متابعة</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">دورات مدفوعة لصفك</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {browsable.length === 0 && (
              <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="py-8 text-center text-muted-foreground">لا توجد دورات أخرى لهذا الصف حالياً.</CardContent>
              </Card>
            )}
            {browsable.map((c) => (
              <Card key={c.id} className="overflow-hidden">
                {c.cover ? <img src={c.cover} alt={c.title} className="h-28 w-full object-cover" /> : <div className="flex h-28 items-center justify-center bg-muted"><BookOpen className="h-10 w-10 text-muted-foreground" /></div>}
                <CardContent className="space-y-2 pt-4">
                  <div className="flex items-center justify-between"><h3 className="font-bold">{c.title}</h3>
                    <Badge variant="secondary">{c.isPaid ? `${c.price} ج.م` : "مجاني"}</Badge>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link to="/student/courses/$id" params={{ id: c.id }}>عرض التفاصيل</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
