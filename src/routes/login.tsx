import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — منصة معلّم" },
      { name: "description", content: "سجّل دخولك إلى منصة معلّم للوصول إلى دوراتك ودروسك واختباراتك." },
      { property: "og:title", content: "تسجيل الدخول — منصة معلّم" },
      { property: "og:description", content: "دخول الطلاب والمعلّم إلى منصة معلّم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
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
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setLoading(true);
              const { data, error } = await supabase.auth.signInWithPassword({ email, password });
              if (error) {
                setLoading(false);
                const code = (error as { code?: string }).code ?? "";
                setError(
                  code === "invalid_credentials"
                    ? "البريد الإلكتروني أو كلمة المرور غير صحيحة."
                    : error.message,
                );
                return;
              }
              const { data: roleRow } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", data.user!.id)
                .maybeSingle();
              setLoading(false);
              const isTeacher = roleRow?.role === "teacher" || roleRow?.role === "assistant";
              nav({ to: isTeacher ? "/dashboard" : "/student/dashboard" });
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
            طالب جديد؟{" "}
            <Link to="/signup" className="text-primary hover:underline">أنشئ حساب</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
