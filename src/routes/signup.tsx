import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useTeacherGrades } from "@/lib/teacher-grades";
import { GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "إنشاء حساب طالب — منصة معلّم" },
      { name: "description", content: "سجّل كطالب في منصة معلّم واختر صفّك الدراسي للوصول إلى الدورات والاختبارات." },
      { property: "og:title", content: "إنشاء حساب طالب — منصة معلّم" },
      { property: "og:description", content: "إنشاء حساب طالب جديد على منصة معلّم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Signup,
});

function Signup() {
  const { gradeNames, loading: gradesLoading } = useTeacherGrades();
  const [grade, setGrade] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (!grade && gradeNames.length > 0) setGrade(gradeNames[0]!);
  }, [grade, gradeNames]);

  return (
    <div dir="rtl" lang="ar" className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <GraduationCap className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">إنشاء حساب طالب</CardTitle>
          <p className="text-sm text-muted-foreground">التسجيل متاح للطلاب فقط — حساب المعلّم ثابت.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              if (!grade) {
                setError("المعلّم لم يضِف صفوفًا بعد — تواصل معه.");
                return;
              }
              setLoading(true);
              const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: name, phone, grade } },
              });
              setLoading(false);
              if (error) {
                const code = (error as { code?: string }).code ?? "";
                setError(
                  code === "user_already_exists"
                    ? "فيه حساب بالبريد ده بالفعل — جرّب تسجيل الدخول."
                    : code === "email_address_invalid"
                      ? "البريد الإلكتروني غير مقبول، استخدم بريد حقيقي."
                      : error.message,
                );
                return;
              }
              if (!data.session) {
                const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
                if (signInError) {
                  setError(signInError.message);
                  return;
                }
              }
              nav({ to: "/student/dashboard" });
            }}
          >
            <div>
              <Label htmlFor="name">الاسم الكامل</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="phone">رقم الهاتف (اختياري)</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label>الصف الدراسي</Label>
              <Select value={grade} onValueChange={setGrade} disabled={gradesLoading || gradeNames.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={gradeNames.length === 0 ? "لا توجد صفوف متاحة حالياً" : "اختر صفك"} />
                </SelectTrigger>
                <SelectContent>
                  {gradeNames.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="pt-1 text-xs text-muted-foreground">الصفوف المتاحة هي التي يدرّسها المعلّم فقط.</p>
            </div>
            <div>
              <Label htmlFor="pw">كلمة المرور</Label>
              <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full rounded-full">{loading ? "..." : "إنشاء الحساب"}</Button>
          </form>
          <p className="text-center text-xs text-muted-foreground">
            احفظ بريدك وكلمة المرور في مكان آمن — لو ضاعت الحساب لازم تتواصل مع الدعم.
          </p>
          <p className="text-center text-sm text-muted-foreground">
            لديك حساب؟{" "}
            <Link to="/login" className="text-primary hover:underline">تسجيل الدخول</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
