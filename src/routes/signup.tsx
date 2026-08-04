import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { GRADE_LEVELS, type GradeLevel } from "@/lib/grades";
import { useAppState } from "@/lib/app-state";
import { GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "إنشاء حساب — منصة معلّم" }] }),
  component: Signup,
});

function Signup() {
  const [role, setRole] = useState<"teacher" | "student">("student");
  const { studentGrade, setStudentGrade } = useAppState();
  const [grade, setGrade] = useState<GradeLevel>(studentGrade);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  return (
    <div dir="rtl" lang="ar" className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <GraduationCap className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">إنشاء حساب</CardTitle>
          <p className="text-sm text-muted-foreground">ابدأ رحلتك مع منصة معلّم</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
            {(["teacher", "student"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`rounded-md py-2 text-sm font-medium transition ${
                  role === r ? "bg-background text-foreground shadow" : "text-muted-foreground"
                }`}
              >
                {r === "teacher" ? "معلّم" : "طالب"}
              </button>
            ))}
          </div>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setLoading(true);
              const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                  emailRedirectTo: window.location.origin,
                  data: { full_name: name, phone, role, grade: role === "student" ? grade : null },
                },
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
                setError(
                  "تم إنشاء الحساب، لكن الدخول محتاج تفعيل البريد. اطفي خيار Confirm email من Supabase → Authentication → Providers → Email، وبعدها سجّل دخول عادي.",
                );
                return;
              }
              if (role === "student") setStudentGrade(grade);
              nav({ to: role === "teacher" ? "/dashboard" : "/student/dashboard" });
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
            {role === "student" && (
              <div>
                <Label>الصف الدراسي</Label>
                <Select value={grade} onValueChange={(v) => setGrade(v as GradeLevel)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GRADE_LEVELS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="pw">كلمة المرور</Label>
              <Input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full rounded-full">{loading ? "..." : "إنشاء الحساب"}</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            لديك حساب؟{" "}
            <Link to="/login" className="text-primary hover:underline">تسجيل الدخول</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
