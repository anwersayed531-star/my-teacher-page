import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BookOpen, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { GRADES, type GradeSlug } from "@/lib/grades";
import { resolveMedia, uploadStorageFile } from "@/lib/storage";

export const Route = createFileRoute("/dashboard/courses/")({
  component: CoursesAdmin,
});

function CoursesAdmin() {
  const qc = useQueryClient();
  const [grade, setGrade] = useState<GradeSlug>("sec1");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [coverRef, setCoverRef] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: teachers = [] } = useQuery({
    queryKey: ["admin", "teachers", "for-grade", grade],
    queryFn: async () => {
      const { data: links } = await supabase.from("teacher_grades").select("teacher_id").eq("grade", grade);
      const ids = (links ?? []).map((l) => l.teacher_id);
      if (!ids.length) return [];
      const { data } = await supabase.from("teachers").select("id, name").in("id", ids).order("name");
      return data ?? [];
    },
  });

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["admin", "courses", grade],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, description, cover_url, is_published, teacher_id, sort_order")
        .eq("grade", grade)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("courses").insert({
        title: title.trim(),
        description: description.trim(),
        cover_url: coverRef,
        grade,
        teacher_id: teacherId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle(""); setDescription(""); setCoverRef("");
      toast.success("تم إنشاء الكورس");
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setPublished = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("courses").update({ is_published: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const setCover = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const ref = await uploadStorageFile("course-covers", file);
      const { error } = await supabase.from("courses").update({ cover_url: ref }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تحديث صورة الكورس");
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حذف الكورس");
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => toast.error("تعذّر الحذف — احذف وحدات الكورس أولاً."),
  });

  return (
    <main className="flex-1 space-y-8 p-6">
      <div>
        <h2 className="font-display text-2xl font-bold">الكورسات</h2>
        <p className="mt-1 text-muted-foreground">كل صف مستقل بكورساته ومدرسيه.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {GRADES.map((g) => (
          <Button
            key={g.slug}
            size="sm"
            variant={grade === g.slug ? "default" : "outline"}
            className="rounded-full"
            onClick={() => { setGrade(g.slug); setTeacherId(""); }}
          >
            {g.name}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h3 className="font-display text-lg font-semibold">كورس جديد</h3>
          {teachers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              مفيش مدرسين في هذا الصف — أضف مدرسًا واختر له الصف أولاً من صفحة المدرسين.
            </p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="c-title">اسم الكورس</Label>
                  <Input id="c-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <Label>المدرس</Label>
                  <Select value={teacherId} onValueChange={setTeacherId}>
                    <SelectTrigger><SelectValue placeholder="اختر المدرس" /></SelectTrigger>
                    <SelectContent>
                      {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="c-desc">الوصف</Label>
                <Textarea id="c-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Label htmlFor="c-cover" className="cursor-pointer">
                  <span className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm">
                    <Upload className="h-4 w-4" /> {uploading ? "جارٍ الرفع…" : coverRef ? "تم اختيار الصورة" : "صورة الكورس"}
                  </span>
                </Label>
                <input
                  id="c-cover"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    try {
                      setCoverRef(await uploadStorageFile("course-covers", file));
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
                  disabled={!title.trim() || !teacherId || create.isPending}
                  onClick={() => create.mutate()}
                >
                  <Plus className="h-4 w-4" /> إنشاء
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">جارٍ التحميل…</p>
      ) : courses.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">لا توجد كورسات في هذا الصف.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((c) => (
            <Card key={c.id}>
              <CardContent className="space-y-3 p-6">
                <div className="flex items-start gap-4">
                  <CoverThumb value={c.cover_url} title={c.title} />
                  <div className="flex-1">
                    <h3 className="font-display text-lg font-semibold">{c.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {teachers.find((t) => t.id === c.teacher_id)?.name ?? "—"}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove.mutate(c.id)} aria-label="حذف الكورس">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={c.is_published} onCheckedChange={(v) => setPublished.mutate({ id: c.id, value: v })} />
                    <span className="text-sm text-muted-foreground">{c.is_published ? "منشور" : "مخفي"}</span>
                  </div>
                  <Button asChild size="sm" variant="outline" className="rounded-full">
                    <Link to="/dashboard/courses/$id" params={{ id: c.id }}>
                      <Pencil className="h-4 w-4" /> المحتوى
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

function CoverThumb({ value, title }: { value: string; title: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let active = true;
    void resolveMedia(value).then((u) => { if (active) setUrl(u); });
    return () => { active = false; };
  }, [value]);
  if (!url) {
    return (
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <BookOpen className="h-6 w-6" />
      </span>
    );
  }
  return <img src={url} alt={title} className="h-16 w-16 rounded-xl object-cover" />;
}
