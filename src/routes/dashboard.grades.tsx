import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { GRADE_LEVELS } from "@/lib/grades";
import { useTeacherGrades } from "@/lib/teacher-grades";
import { Layers, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/grades")({
  head: () => ({
    meta: [
      { title: "الصفوف الدراسية — لوحة المعلّم" },
      { name: "description", content: "أضف الصفوف الدراسية التي تدرّسها لتظهر للطلاب في التسجيل وفي فلاتر الدورات." },
      { property: "og:title", content: "إدارة الصفوف الدراسية — منصة معلّم" },
      { property: "og:description", content: "تحكّم في الصفوف التي تدرّسها على منصة معلّم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GradesPage,
});

function GradesPage() {
  const { grades, loading, addGrade, removeGrade } = useTeacherGrades();
  const [pick, setPick] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const available = GRADE_LEVELS.filter((g) => !grades.some((x) => x.grade === g));

  return (
    <>
      <TopBar title="الصفوف الدراسية" />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4" /> إضافة صف تدرّسه
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Select value={pick} onValueChange={setPick} disabled={available.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={available.length === 0 ? "أضفت كل الصفوف" : "اختر صفًا"} />
                </SelectTrigger>
                <SelectContent>
                  {available.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="rounded-full"
              disabled={!pick || busy}
              onClick={async () => {
                setBusy(true);
                const { error } = await addGrade(pick);
                setBusy(false);
                setMsg(error ?? "تمت إضافة الصف.");
                if (!error) setPick("");
              }}
            >
              <Plus className="ml-1 h-4 w-4" /> إضافة
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">الصفوف الحالية</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {loading && <p className="text-sm text-muted-foreground">جارٍ التحميل…</p>}
            {!loading && grades.length === 0 && (
              <p className="text-sm text-muted-foreground">
                لم تُضف أي صف بعد. الطلاب لن يستطيعوا التسجيل حتى تضيف صفًا واحدًا على الأقل.
              </p>
            )}
            {grades.map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-lg border p-3">
                <Badge variant="secondary">{g.grade}</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    const { error } = await removeGrade(g.id);
                    setMsg(error ?? "تم حذف الصف.");
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
