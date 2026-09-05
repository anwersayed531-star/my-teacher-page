import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { GRADES } from "@/lib/grades";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: async () => {
      const [teachers, links, courses, lessons] = await Promise.all([
        supabase.from("teachers").select("id"),
        supabase.from("teacher_grades").select("grade"),
        supabase.from("courses").select("id, grade, is_published"),
        supabase.from("lessons").select("id"),
      ]);
      return {
        teachers: teachers.data?.length ?? 0,
        lessons: lessons.data?.length ?? 0,
        courses: courses.data ?? [],
        links: links.data ?? [],
      };
    },
  });

  return (
    <main className="flex-1 space-y-8 p-6">
      <div>
        <h2 className="font-display text-2xl font-bold">نظرة عامة</h2>
        <p className="mt-1 text-muted-foreground">المحتوى المنشور على المنصة — كل الأرقام حقيقية من قاعدة البيانات.</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">جارٍ التحميل…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">المدرسون</p><p className="font-display text-3xl font-bold">{data?.teachers ?? 0}</p></CardContent></Card>
            <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">الكورسات</p><p className="font-display text-3xl font-bold">{data?.courses.length ?? 0}</p></CardContent></Card>
            <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">الدروس</p><p className="font-display text-3xl font-bold">{data?.lessons ?? 0}</p></CardContent></Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {GRADES.map((g) => (
              <Card key={g.slug}>
                <CardContent className="space-y-2 p-6">
                  <h3 className="font-display text-lg font-semibold">{g.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {(data?.links ?? []).filter((l) => l.grade === g.slug).length} مدرس •{" "}
                    {(data?.courses ?? []).filter((c) => c.grade === g.slug).length} كورس
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full"><Link to="/dashboard/teachers"><Users className="h-4 w-4" /> إدارة المدرسين</Link></Button>
            <Button asChild variant="outline" className="rounded-full"><Link to="/dashboard/courses"><BookOpen className="h-4 w-4" /> إدارة الكورسات</Link></Button>
          </div>
        </>
      )}
    </main>
  );
}
