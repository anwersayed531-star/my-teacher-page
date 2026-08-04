import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockCodes, mockCourses } from "@/lib/mock-data";
import { KeyRound, Ban, Copy, UserPlus, Check } from "lucide-react";

export const Route = createFileRoute("/dashboard/codes")({
  component: CodesPage,
});

function CodesPage() {
  const [codes, setCodes] = useState(mockCodes);
  const [count, setCount] = useState(5);
  const [course, setCourse] = useState("c1");
  const [duration, setDuration] = useState(30);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Direct enrollment
  const [studentName, setStudentName] = useState("");
  const [enrollCourse, setEnrollCourse] = useState("c1");
  const [enrolled, setEnrolled] = useState<{ name: string; course: string; at: string }[]>([]);

  const generate = () => {
    const news = Array.from({ length: count }).map((_, i) => ({
      id: `k${Date.now()}${i}`,
      code: `NEW-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      courseId: course,
      durationDays: duration,
      used: false, usedBy: null, disabled: false,
    }));
    // TODO: connect to Supabase — persist codes. Duration = expiry BEFORE redemption only.
    setCodes((p) => [...news, ...p]);
  };

  const copy = async (id: string, code: string) => {
    try { await navigator.clipboard.writeText(code); } catch { /* ignore */ }
    setCopiedId(id);
    setTimeout(() => setCopiedId((c) => c === id ? null : c), 1500);
  };

  const disable = (id: string) =>
    setCodes((p) => p.map((c) => c.id === id ? { ...c, disabled: !c.disabled } : c));

  const enrollDirect = () => {
    if (!studentName.trim()) return;
    // TODO: connect to Supabase — create/attach enrollment for student in course (lifetime).
    const name = studentName.trim();
    const cTitle = mockCourses.find((x) => x.id === enrollCourse)?.title ?? "";
    setEnrolled((p) => [{ name, course: cTitle, at: "الآن" }, ...p]);
    setStudentName("");
  };

  return (
    <>
      <TopBar title="أكواد الاشتراك" />
      <main className="flex-1 space-y-4 p-6">
        <Card>
          <CardHeader><CardTitle>توليد أكواد جديدة</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div><Label>عدد الأكواد</Label><Input type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} /></div>
            <div><Label>الدورة</Label>
              <Select value={course} onValueChange={setCourse}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {mockCourses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>صلاحية الكود قبل الاستخدام (أيام)</Label><Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></div>
            <div className="flex items-end"><Button onClick={generate} className="w-full rounded-full"><KeyRound className="ml-2 h-4 w-4" /> توليد</Button></div>
            <p className="md:col-span-4 text-xs text-muted-foreground">
              كل كود يُستخدم مرة واحدة فقط. المدة تُطبَّق قبل الاستخدام (تنتهي إذا لم يُستخدم). بعد التفعيل يصبح وصول الطالب للدورة <b>دائمًا مدى الحياة</b>.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>إضافة طالب مباشرة (بدون كود)</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label>اسم الطالب</Label>
              <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="مثال: أحمد محمود" />
            </div>
            <div>
              <Label>الدورة</Label>
              <Select value={enrollCourse} onValueChange={setEnrollCourse}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {mockCourses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={enrollDirect} className="w-full rounded-full">
                <UserPlus className="ml-2 h-4 w-4" /> تفعيل الاشتراك
              </Button>
            </div>
            {enrolled.length > 0 && (
              <div className="md:col-span-4 space-y-1 rounded-md border p-3 text-sm">
                <div className="mb-1 font-medium">آخر اشتراكات مضافة يدويًا</div>
                {enrolled.map((e, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span>{e.name} — {e.course}</span>
                    <span className="text-xs text-muted-foreground">{e.at}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>قائمة الأكواد</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الكود</TableHead>
                  <TableHead className="text-right">الدورة</TableHead>
                  <TableHead className="text-right">الصلاحية قبل الاستخدام</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الطالب</TableHead>
                  <TableHead className="text-right">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell dir="ltr" className="font-mono">{c.code}</TableCell>
                    <TableCell>{mockCourses.find((x) => x.id === c.courseId)?.title ?? "—"}</TableCell>
                    <TableCell>{c.durationDays} يوم</TableCell>
                    <TableCell>
                      {c.disabled ? <Badge variant="destructive">معطّل</Badge>
                        : c.used ? <Badge>مُستخدم (وصول دائم)</Badge>
                        : <Badge variant="secondary">متاح</Badge>}
                    </TableCell>
                    <TableCell>{c.usedBy ?? "—"}</TableCell>
                    <TableCell className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => copy(c.id, c.code)}>
                        {copiedId === c.id ? <Check className="ml-1 h-4 w-4 text-primary" /> : <Copy className="ml-1 h-4 w-4" />}
                        نسخ
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => disable(c.id)}>
                        <Ban className="ml-1 h-4 w-4" /> {c.disabled ? "تفعيل" : "تعطيل"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
