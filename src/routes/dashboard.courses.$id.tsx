import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FileText, ListChecks, Plus, Trash2, Upload, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { gradeName, isGradeSlug } from "@/lib/grades";
import { uploadStorageFile } from "@/lib/storage";
import {
  EXAM_TYPE_LABELS, makeExamQuestion, type ExamQType, type ExamQuestion,
} from "@/lib/content-types";

export const Route = createFileRoute("/dashboard/courses/$id")({
  component: CourseEditor,
});

function CourseEditor() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [unitTitle, setUnitTitle] = useState("");
  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin", "course", id] });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "course", id],
    queryFn: async () => {
      const { data: course, error } = await supabase
        .from("courses")
        .select("id, title, grade, teacher_id, is_published")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      const { data: units } = await supabase.from("units").select("id, title, sort_order").eq("course_id", id).order("sort_order");
      const unitIds = (units ?? []).map((u) => u.id);
      const { data: lessons } = unitIds.length
        ? await supabase.from("lessons").select("id, unit_id, title, sort_order").in("unit_id", unitIds).order("sort_order")
        : { data: [] };
      const lessonIds = (lessons ?? []).map((l) => l.id);
      const [videos, files, exams] = lessonIds.length
        ? await Promise.all([
            supabase.from("videos").select("id, lesson_id, title, url").in("lesson_id", lessonIds),
            supabase.from("lesson_files").select("id, lesson_id, name, url").in("lesson_id", lessonIds),
            supabase.from("exams").select("id, lesson_id, title, duration_min, passing_pct, questions, is_published").in("lesson_id", lessonIds),
          ])
        : [{ data: [] }, { data: [] }, { data: [] }];
      return {
        course,
        units: units ?? [],
        lessons: lessons ?? [],
        videos: videos.data ?? [],
        files: files.data ?? [],
        exams: exams.data ?? [],
      };
    },
  });

  const addUnit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("units").insert({
        course_id: id,
        title: unitTitle.trim(),
        sort_order: data?.units.length ?? 0,
      });
      if (error) throw error;
    },
    onSuccess: () => { setUnitTitle(""); toast.success("تمت إضافة الوحدة"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <main className="flex-1 p-6 text-muted-foreground">جارٍ التحميل…</main>;
  if (!data?.course) return <main className="flex-1 p-6">الكورس غير موجود.</main>;

  const { course, units, lessons, videos, files, exams } = data;

  return (
    <main className="flex-1 space-y-8 p-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link to="/dashboard/courses" className="hover:text-foreground">الكورسات</Link> /{" "}
          {isGradeSlug(course.grade) ? gradeName(course.grade) : course.grade}
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold">{course.title}</h2>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-6">
          <div className="flex-1 min-w-48">
            <Label htmlFor="u-title">وحدة جديدة</Label>
            <Input id="u-title" value={unitTitle} onChange={(e) => setUnitTitle(e.target.value)} placeholder="مثال: الوحدة الأولى" />
          </div>
          <Button className="rounded-full" disabled={!unitTitle.trim() || addUnit.isPending} onClick={() => addUnit.mutate()}>
            <Plus className="h-4 w-4" /> إضافة وحدة
          </Button>
        </CardContent>
      </Card>

      {units.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">لا توجد وحدات بعد.</CardContent></Card>
      ) : (
        units.map((unit) => (
          <UnitBlock
            key={unit.id}
            unit={unit}
            lessons={lessons.filter((l) => l.unit_id === unit.id)}
            videos={videos}
            files={files}
            exams={exams}
            onChange={invalidate}
          />
        ))
      )}
    </main>
  );
}

type Row = { id: string; lesson_id: string };

function UnitBlock({
  unit, lessons, videos, files, exams, onChange,
}: {
  unit: { id: string; title: string };
  lessons: { id: string; title: string }[];
  videos: (Row & { title: string; url: string })[];
  files: (Row & { name: string; url: string })[];
  exams: (Row & { title: string; duration_min: number; passing_pct: number; questions: unknown; is_published: boolean })[];
  onChange: () => void;
}) {
  const [lessonTitle, setLessonTitle] = useState("");

  const addLesson = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("lessons").insert({
        unit_id: unit.id,
        title: lessonTitle.trim(),
        sort_order: lessons.length,
      });
      if (error) throw error;
    },
    onSuccess: () => { setLessonTitle(""); toast.success("تم إضافة الدرس"); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeUnit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("units").delete().eq("id", unit.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم حذف الوحدة"); onChange(); },
    onError: () => toast.error("احذف دروس الوحدة أولاً."),
  });

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">{unit.title}</h3>
          <Button size="icon" variant="ghost" onClick={() => removeUnit.mutate()} aria-label="حذف الوحدة">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <Input value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="عنوان درس جديد" />
          </div>
          <Button size="sm" className="rounded-full" disabled={!lessonTitle.trim() || addLesson.isPending} onClick={() => addLesson.mutate()}>
            <Plus className="h-4 w-4" /> إضافة درس
          </Button>
        </div>

        {lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد دروس في هذه الوحدة.</p>
        ) : (
          <Accordion type="multiple">
            {lessons.map((lesson) => (
              <AccordionItem key={lesson.id} value={lesson.id}>
                <AccordionTrigger className="text-right">{lesson.title}</AccordionTrigger>
                <AccordionContent className="space-y-6">
                  <LessonEditor
                    lesson={lesson}
                    videos={videos.filter((v) => v.lesson_id === lesson.id)}
                    files={files.filter((f) => f.lesson_id === lesson.id)}
                    exams={exams.filter((e) => e.lesson_id === lesson.id)}
                    onChange={onChange}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

function LessonEditor({
  lesson, videos, files, exams, onChange,
}: {
  lesson: { id: string; title: string };
  videos: { id: string; title: string; url: string }[];
  files: { id: string; name: string; url: string }[];
  exams: { id: string; title: string; duration_min: number; passing_pct: number; questions: unknown; is_published: boolean }[];
  onChange: () => void;
}) {
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [examTitle, setExamTitle] = useState("");

  const addVideo = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("videos").insert({
        lesson_id: lesson.id, title: videoTitle.trim(), url: videoUrl.trim(), sort_order: videos.length,
      });
      if (error) throw error;
    },
    onSuccess: () => { setVideoTitle(""); setVideoUrl(""); toast.success("تم إضافة الفيديو"); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const addFile = useMutation({
    mutationFn: async (payload: { name: string; url: string }) => {
      const { error } = await supabase.from("lesson_files").insert({
        lesson_id: lesson.id, name: payload.name, url: payload.url, sort_order: files.length,
      });
      if (error) throw error;
    },
    onSuccess: () => { setFileName(""); setFileUrl(""); toast.success("تم إضافة الملف"); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const addExam = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("exams").insert({
        lesson_id: lesson.id, title: examTitle.trim(), questions: [], sort_order: exams.length,
      });
      if (error) throw error;
    },
    onSuccess: () => { setExamTitle(""); toast.success("تم إنشاء الاختبار"); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeRow = useMutation({
    mutationFn: async ({ table, id }: { table: "videos" | "lesson_files" | "exams" | "lessons"; id: string }) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم الحذف"); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="flex items-center gap-2 text-sm font-medium"><Video className="h-4 w-4" /> الفيديوهات</p>
        {videos.map((v) => (
          <div key={v.id} className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm">
            <span className="truncate">{v.title} — <span className="text-muted-foreground">{v.url}</span></span>
            <Button size="icon" variant="ghost" onClick={() => removeRow.mutate({ table: "videos", id: v.id })} aria-label="حذف الفيديو">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Input value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="عنوان الفيديو" />
          <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="رابط الفيديو (يوتيوب أو رابط مباشر)" />
          <Button size="sm" className="rounded-full" disabled={!videoTitle.trim() || !videoUrl.trim()} onClick={() => addVideo.mutate()}>
            <Plus className="h-4 w-4" /> إضافة
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <p className="flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4" /> الملفات</p>
        {files.map((f) => (
          <div key={f.id} className="flex items-center justify-between gap-2 rounded-lg border p-3 text-sm">
            <span className="truncate">{f.name}</span>
            <Button size="icon" variant="ghost" onClick={() => removeRow.mutate({ table: "lesson_files", id: f.id })} aria-label="حذف الملف">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="اسم الملف" />
          <Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="رابط الملف (اختياري لو هترفع)" />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={!fileName.trim() || !fileUrl.trim()}
              onClick={() => addFile.mutate({ name: fileName.trim(), url: fileUrl.trim() })}
            >
              <Plus className="h-4 w-4" /> رابط
            </Button>
            <Label htmlFor={`file-${lesson.id}`} className="cursor-pointer">
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm">
                <Upload className="h-4 w-4" /> {uploading ? "…" : "رفع"}
              </span>
            </Label>
            <input
              id={`file-${lesson.id}`}
              type="file"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  const ref = await uploadStorageFile("lesson-files", file, lesson.id);
                  addFile.mutate({ name: fileName.trim() || file.name, url: ref });
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "تعذّر رفع الملف");
                } finally {
                  setUploading(false);
                  e.target.value = "";
                }
              }}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="flex items-center gap-2 text-sm font-medium"><ListChecks className="h-4 w-4" /> الاختبارات</p>
        {exams.map((e) => (
          <ExamEditor key={e.id} exam={e} onChange={onChange} onDelete={() => removeRow.mutate({ table: "exams", id: e.id })} />
        ))}
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <Input value={examTitle} onChange={(ev) => setExamTitle(ev.target.value)} placeholder="عنوان اختبار جديد" />
          <Button size="sm" className="rounded-full" disabled={!examTitle.trim()} onClick={() => addExam.mutate()}>
            <Plus className="h-4 w-4" /> إضافة اختبار
          </Button>
        </div>
      </section>

      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeRow.mutate({ table: "lessons", id: lesson.id })}>
        <Trash2 className="h-4 w-4" /> حذف الدرس
      </Button>
    </div>
  );
}

function ExamEditor({
  exam, onChange, onDelete,
}: {
  exam: { id: string; title: string; duration_min: number; passing_pct: number; questions: unknown; is_published: boolean };
  onChange: () => void;
  onDelete: () => void;
}) {
  const [questions, setQuestions] = useState<ExamQuestion[]>(
    Array.isArray(exam.questions) ? (exam.questions as ExamQuestion[]) : [],
  );
  const [duration, setDuration] = useState(exam.duration_min);
  const [passing, setPassing] = useState(exam.passing_pct);
  const [newType, setNewType] = useState<ExamQType>("mcq");

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("exams")
        .update({ questions: questions as unknown as never, duration_min: duration, passing_pct: passing })
        .eq("id", exam.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم حفظ الاختبار"); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const setPublished = useMutation({
    mutationFn: async (value: boolean) => {
      const { error } = await supabase.from("exams").update({ is_published: value }).eq("id", exam.id);
      if (error) throw error;
    },
    onSuccess: onChange,
    onError: (e: Error) => toast.error(e.message),
  });

  function patch(index: number, next: ExamQuestion) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? next : q)));
  }

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-medium">{exam.title}</p>
        <div className="flex items-center gap-3">
          <Switch checked={exam.is_published} onCheckedChange={(v) => setPublished.mutate(v)} />
          <span className="text-sm text-muted-foreground">{exam.is_published ? "منشور" : "مخفي"}</span>
          <Button size="icon" variant="ghost" onClick={onDelete} aria-label="حذف الاختبار">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>المدة (دقيقة)</Label>
          <Input type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
        </div>
        <div>
          <Label>نسبة النجاح %</Label>
          <Input type="number" min={0} max={100} value={passing} onChange={(e) => setPassing(Number(e.target.value))} />
        </div>
      </div>

      {questions.map((q, i) => (
        <div key={q.id} className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{i + 1}. {EXAM_TYPE_LABELS[q.type]}</span>
            <Button size="icon" variant="ghost" onClick={() => setQuestions((prev) => prev.filter((_, x) => x !== i))} aria-label="حذف السؤال">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <Textarea value={q.text} placeholder="نص السؤال" onChange={(e) => patch(i, { ...q, text: e.target.value })} />
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label>الدرجة</Label>
              <Input type="number" min={1} value={q.points} onChange={(e) => patch(i, { ...q, points: Number(e.target.value) })} />
            </div>
            {q.type === "tf" && (
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={q.correct} onCheckedChange={(v) => patch(i, { ...q, correct: v })} />
                <span className="text-sm text-muted-foreground">الإجابة الصحيحة: {q.correct ? "صح" : "خطأ"}</span>
              </div>
            )}
          </div>

          {(q.type === "mcq" || q.type === "multi") && (
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <Input
                    value={opt}
                    placeholder={`الخيار ${oi + 1}`}
                    onChange={(e) => patch(i, { ...q, options: q.options.map((o, x) => (x === oi ? e.target.value : o)) })}
                  />
                  {q.type === "mcq" ? (
                    <Button
                      size="sm"
                      variant={q.correct === oi ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => patch(i, { ...q, correct: oi })}
                    >
                      صحيح
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant={q.correct.includes(oi) ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() =>
                        patch(i, {
                          ...q,
                          correct: q.correct.includes(oi) ? q.correct.filter((x) => x !== oi) : [...q.correct, oi],
                        })
                      }
                    >
                      صحيح
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <Select value={newType} onValueChange={(v) => setNewType(v as ExamQType)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(EXAM_TYPE_LABELS) as ExamQType[]).map((t) => (
              <SelectItem key={t} value={t}>{EXAM_TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="rounded-full" onClick={() => setQuestions((prev) => [...prev, makeExamQuestion(newType)])}>
          <Plus className="h-4 w-4" /> سؤال
        </Button>
        <Button size="sm" className="rounded-full" disabled={save.isPending} onClick={() => save.mutate()}>حفظ الاختبار</Button>
      </div>
    </div>
  );
}
