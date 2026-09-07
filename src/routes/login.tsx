import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "دخول الإدارة — مدرسة" },
      { name: "description", content: "صفحة دخول إدارة منصة مدرسة لإضافة المدرسين والكورسات والدروس." },
      { name: "robots", content: "noindex" },
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
          <CardTitle className="text-2xl">دخول الإدارة</CardTitle>
          <p className="text-sm text-muted-foreground">هذه الصفحة مخصّصة لإدارة المنصة فقط — الطلاب لا يحتاجون حسابًا.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setLoading(true);
              const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
              if (signInError || !data.user) {
                setLoading(false);
                const code = (signInError as { code?: string } | null)?.code ?? "";
                setError(code === "invalid_credentials" ? "البريد الإلكتروني أو كلمة المرور غير صحيحة." : signInError?.message ?? "تعذّر الدخول.");
                return;
              }
              const { data: isAdmin, error: roleError } = await supabase.rpc("is_admin");
              if (roleError || !isAdmin) {
                await supabase.auth.signOut();
                setLoading(false);
                setError("هذا الحساب ليس لديه صلاحية إدارة المنصة.");
                return;
              }
              setLoading(false);
              void nav({ to: "/dashboard" });
            }}
          >
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="pw">كلمة المرور</Label>
              <Input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full rounded-full">{loading ? "..." : "دخول"}</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/" className="text-primary hover:underline">الرجوع إلى المنصة</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
