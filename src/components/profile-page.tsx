import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { TopBar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { GRADE_LEVELS } from "@/lib/grades";
import { useAuth } from "@/lib/auth";
import { LogOut, Mail, Phone, ShieldCheck, User as UserIcon } from "lucide-react";

const ROLE_LABEL: Record<string, string> = {
  teacher: "معلّم",
  student: "طالب",
  assistant: "مساعد",
};

export function ProfilePage({ variant }: { variant: "teacher" | "student" }) {
  const { user, profile, role, loading, saveProfile, signOut } = useAuth();
  const { gradeNames } = useTeacherGrades();
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [grade, setGrade] = useState<string>("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setPhone(profile.phone ?? "");
    setGrade(profile.grade ?? GRADE_LEVELS[0]);
    setBio(profile.bio ?? "");
  }, [profile]);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  const initials = (fullName || user?.email || "?").trim().charAt(0).toUpperCase();

  return (
    <>
      <TopBar title="الصفحة الشخصية" />
      <main className="flex-1 space-y-6 p-4 md:p-6">
        {!tablesReady && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            جداول <code>profiles</code> / <code>user_roles</code> لسه مش متعملة في Supabase — شغّل ملف{" "}
            <code>supabase/sql/001_profiles.sql</code> من SQL Editor علشان البيانات تتخزّن بشكل دائم.
          </div>
        )}

        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-right">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {initials}
            </div>
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold">{fullName || "بدون اسم"}</h2>
              <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground sm:justify-start">
                <Mail className="h-4 w-4" /> {user?.email ?? "—"}
              </p>
              {phone && (
                <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground sm:justify-start">
                  <Phone className="h-4 w-4" /> {phone}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 sm:justify-start">
                <Badge className="gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  {ROLE_LABEL[role ?? variant] ?? variant}
                </Badge>
                {variant === "student" && grade && <Badge variant="secondary">{grade}</Badge>}
              </div>
            </div>
            <Button variant="outline" className="sm:mr-auto" onClick={async () => { await signOut(); nav({ to: "/login" }); }}>
              <LogOut className="ml-1 h-4 w-4" /> تسجيل الخروج
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserIcon className="h-4 w-4" /> تعديل البيانات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={async (e) => {
                e.preventDefault();
                setSaving(true);
                setMsg(null);
                const { error } = await saveProfile({
                  full_name: fullName,
                  phone,
                  bio,
                  grade: variant === "student" ? grade : null,
                });
                setSaving(false);
                setMsg(error ? { text: error, ok: false } : { text: "تم حفظ البيانات بنجاح.", ok: true });
              }}
            >
              <div>
                <Label htmlFor="full_name">الاسم الكامل</Label>
                <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              {variant === "student" && (
                <div>
                  <Label>الصف الدراسي</Label>
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger><SelectValue placeholder="اختر الصف" /></SelectTrigger>
                    <SelectContent>
                      {GRADE_LEVELS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="sm:col-span-2">
                <Label htmlFor="bio">نبذة</Label>
                <Textarea id="bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder={variant === "teacher" ? "المادة، سنين الخبرة…" : "اكتب نبذة قصيرة عنك"} />
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <Button type="submit" disabled={saving} className="rounded-full">
                  {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
                </Button>
                {msg && (
                  <span className={`text-sm ${msg.ok ? "text-primary" : "text-destructive"}`}>{msg.text}</span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
