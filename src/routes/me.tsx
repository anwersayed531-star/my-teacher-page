import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { GRADES, gradeName, isGradeSlug } from "@/lib/grades";
import {
  emptyProfile, exportProfileFile, importProfileFile, readProfile, updateProfile, type LocalProfile,
} from "@/lib/local-profile";

export const Route = createFileRoute("/me")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "ملفي — مدرسة" },
      { name: "description", content: "اسمك وصفك وتقدّمك ونتائج اختباراتك، محفوظة على جهازك مع نسخة احتياطية تنزّلها وترفعها." },
      { property: "og:title", content: "ملفي — مدرسة" },
      { property: "og:description", content: "تقدّمك ونتائج اختباراتك محفوظة على جهازك، مع نسخة احتياطية." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MePage,
});

function MePage() {
  const [profile, setProfile] = useState<LocalProfile>(emptyProfile());
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfile(readProfile());
  }, []);

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-12">
        <div>
          <h1 className="font-display text-3xl font-bold">ملفي</h1>
          <p className="mt-2 text-muted-foreground">
            كل حاجة هنا محفوظة على جهازك أنت فقط — المنصة مش بتسجّل أي بيانات عن الطلاب.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div>
              <Label htmlFor="name">اسمك</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                onBlur={() => setProfile(updateProfile((p) => ({ ...p, name: profile.name.trim() })))}
              />
            </div>
            <div>
              <Label>صفك</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {GRADES.map((g) => (
                  <Button
                    key={g.slug}
                    size="sm"
                    variant={profile.grade === g.slug ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setProfile(updateProfile((p) => ({ ...p, grade: g.slug })))}
                  >
                    {g.short}
                  </Button>
                ))}
              </div>
              {isGradeSlug(profile.grade) && (
                <p className="mt-3 text-sm">
                  <Link to="/grades/$grade" params={{ grade: profile.grade }} className="text-primary hover:underline">
                    افتح مدرسي {gradeName(profile.grade)}
                  </Link>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-6">
            <h2 className="font-display text-xl font-semibold">تقدّمي</h2>
            <p className="text-sm text-muted-foreground">{profile.completed.length} درس مكتمل • {profile.favorites.length} كورس في المفضلة</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="font-display text-xl font-semibold">نتائج اختباراتي</h2>
            {profile.results.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد نتائج بعد.</p>
            ) : (
              <ul className="divide-y">
                {profile.results.map((r) => (
                  <li key={r.examId} className="flex items-center justify-between py-3 text-sm">
                    <span>
                      <span className="font-medium">{r.examTitle}</span>
                      {r.courseTitle && <span className="text-muted-foreground"> — {r.courseTitle}</span>}
                      <span className="block text-xs text-muted-foreground">{new Date(r.at).toLocaleString("ar-EG")}</span>
                    </span>
                    <span className="font-display font-bold">{r.scorePct}%</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="font-display text-xl font-semibold">النسخة الاحتياطية</h2>
            <p className="text-sm text-muted-foreground">
              نزّل ملف بياناتك واحتفظ به؛ لو فتحت المنصة من جهاز تاني ارفع نفس الملف وكل حاجة ترجع.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button className="rounded-full" onClick={() => exportProfileFile()}>
                <Download className="h-4 w-4" /> تحميل النسخة الاحتياطية
              </Button>
              <Button variant="outline" className="rounded-full" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" /> استعادة نسخة
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setProfile(await importProfileFile(file));
                    setMessage("تم استعادة نسختك بنجاح ✅");
                  } catch (err) {
                    setMessage(err instanceof Error ? err.message : "تعذّر قراءة الملف.");
                  }
                  e.target.value = "";
                }}
              />
            </div>
            {message && <p className="text-sm text-primary">{message}</p>}
            {profile.updatedAt && (
              <p className="text-xs text-muted-foreground">آخر تحديث: {new Date(profile.updatedAt).toLocaleString("ar-EG")}</p>
            )}
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
