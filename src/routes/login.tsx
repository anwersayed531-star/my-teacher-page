import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "تسجيل الدخول — منصة معلّم" }] }),
  component: Login,
});

function Login() {
  const [role, setRole] = useState<"teacher" | "student">("teacher");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  return (
    <div dir="rtl" lang="ar" className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <GraduationCap className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
          <p className="text-sm text-muted-foreground">أهلاً بعودتك إلى منصة معلّم</p>
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
              const { data, error } = await supabase.auth.signInWithPassword({ email, password });
              setLoading(false);
              if (error) {
                const code = (error as { code?: string }).code ?? "";
                setError(
                  code === "email_not_confirmed"
                    ? "لازم تفعّل الإيميل الأول، أو اطفي خيار Confirm email من إعدادات Supabase."
                    : code === "invalid_credentials"
                      ? "البريد الإلكتروني أو كلمة المرور غير صحيحة."
                      : error.message,
                );
                return;
              }
              const userRole = (data.user?.user_metadata?.role as string) ?? role;
              nav({ to: userRole === "teacher" ? "/dashboard" : "/student/dashboard" });
            }}
          >
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="pw">كلمة المرور</Label>
              <Input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full rounded-full">{loading ? "..." : "دخول"}</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            ليس لديك حساب؟{" "}
            <Link to="/signup" className="text-primary hover:underline">أنشئ حساباً</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
