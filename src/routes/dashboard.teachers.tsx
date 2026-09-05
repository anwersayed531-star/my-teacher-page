import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Plus, Trash2, Upload, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { GRADES } from "@/lib/grades";
import { resolveMedia, uploadStorageFile } from "@/lib/storage";

export const Route = createFileRoute("/dashboard/teachers")({
  component: TeachersAdmin,
});

interface TeacherRow {
  id: string;
  name: string;
  subject: string;
  bio: string;
  photo_url: string;
  is_published: boolean;
  grades: string[];
}

function TeachersAdmin() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [bio, setBio] = useState("");
  const [grades, setGrades] = useState<string[]>([]);
  const [photoRef, setPhotoRef] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ["admin", "teachers"],
    queryFn: async (): Promise<TeacherRow[]> => {
      const [{ data: rows, error }, { data: links }] = await Promise.all([
        supabase.from("teachers").select("id, name, subject, bio, photo_url, is_published, sort_order").order("sort_order"),
        supabase.from("teacher_grades").select("teacher_id, grade"),
      ]);
      if (error) throw error;
      return (rows ?? []).map((r) => ({
        ...r,
        grades: (links ?? []).filter((l) => l.teacher_id === r.id).map((l) => l.grade),
      }));
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("teachers")
        .insert({ name: name.trim(), subject: subject.trim(), bio: bio.trim(), photo_url: photoRef })
        .select("id")
        .single();
      if (error) throw error;
      if (grades.length) {
        const { error: gErr } = await supabase
          .from("teacher_grades")
          .insert(grades.map((g) => ({ teacher_id: data.id, grade: g })));
        if (gErr) throw gErr;
      }
    },
    onSuccess: () => {
      setName(""); setSubject(""); setBio(""); setGrades([]); setPhotoRef("");
      toast.success("تم إضافة المدرس");
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleGradeFor = useMutation({
    mutationFn: async ({ teacherId, grade, on }: { teacherId: string; grade: string; on: boolean }) => {
      if (on) {
        const { error } = await supabase.from("teacher_grades").insert({ teacher_id: teacherId, grade });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("teacher_grades").delete().eq("teacher_id", teacherId).eq("grade", grade);
        if (error) throw error;
      }
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const setPublished = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("teachers").update({ is_published: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teachers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حذف المدرس");
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error("تعذّر الحذف — تأكد من حذف كورسات المدرس أولاً."),
  });

  return (
    <main className="flex-1 space-y-8 p-6">
      <div>
        <h2 className="font-display text-2xl font-bold">المدرسون</h2>
        <p className="mt-1 text-muted-foreground">أضف المدرسين واختر الصفوف اللي يظهر فيها كل واحد.</p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h3 className="font-display text-lg font-semibold">إضافة مدرس</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="t-name">الاسم</Label>
              <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="t-subject">المادة</Label>
              <Input id="t-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="t-bio">نبذة</Label>
            <Textarea id="t-bio" value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div>
            <Label>الصفوف</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {GRADES.map((g) => (
                <Button
                  key={g.slug}
                  type="button"
                  size="sm"
                  variant={grades.includes(g.slug) ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setGrades((prev) => (prev.includes(g.slug) ? prev.filter((x) => x !== g.slug) : [...prev, g.slug]))}
                >
                  {g.short}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Label htmlFor="t-photo" className="cursor-pointer">
              <span className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm">
                <Upload className="h-4 w-4" /> {uploading ? "جارٍ الرفع…" : photoRef ? "تم اختيار الصورة" : "صورة المدرس"}
              </span>
            </Label>
            <input
              id="t-photo"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  setPhotoRef(await uploadStorageFile("teacher-photos", file));
                  toast.success("تم رفع الصورة");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "تعذّر رفع الصورة");
                } finally {
                  setUploading(false);
                  e.target.value = "";
                }
              }}
            />
            <Button
              className="rounded-full"
              disabled={!name.trim() || create.isPending}
              onClick={() => create.mutate()}
            >
              <Plus className="h-4 w-4" /> إضافة
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">جارٍ التحميل…</p>
      ) : teachers.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">لا يوجد مدرسون بعد.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {teachers.map((t) => (
            <Card key={t.id}>
              <CardContent className="space-y-3 p-6">
                <div className="flex items-start gap-4">
                  <TeacherPhoto value={t.photo_url} name={t.name} />
                  <div className="flex-1">
                    <h3 className="font-display text-lg font-semibold">{t.name}</h3>
                    {t.subject && <p className="text-sm text-primary">{t.subject}</p>}
                    {t.bio && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.bio}</p>}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove.mutate(t.id)} aria-label="حذف المدرس">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {GRADES.map((g) => (
                    <Button
                      key={g.slug}
                      size="sm"
                      variant={t.grades.includes(g.slug) ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => toggleGradeFor.mutate({ teacherId: t.id, grade: g.slug, on: !t.grades.includes(g.slug) })}
                    >
                      {g.short}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={t.is_published} onCheckedChange={(v) => setPublished.mutate({ id: t.id, value: v })} />
                  <span className="text-sm text-muted-foreground">{t.is_published ? "ظاهر للطلاب" : "مخفي"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

function TeacherPhoto({ value, name }: { value: string; name: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let active = true;
    void resolveMedia(value).then((u) => { if (active) setUrl(u); });
    return () => { active = false; };
  }, [value]);
  if (!url) {
    return (
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Users className="h-6 w-6" />
      </span>
    );
  }
  return <img src={url} alt={`صورة ${name}`} className="h-16 w-16 rounded-xl object-cover" />;
}
