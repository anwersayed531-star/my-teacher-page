import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { TopBar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { VideoPlayer } from "@/components/video-player";
import { Reactions } from "@/components/reactions";
import { VideoComments } from "@/components/comments";
import { ExamBuilder } from "@/components/exam-builder";
import { parseYouTubeId, type Unit, type Lesson, type LessonFile, type ExamQuestion } from "@/lib/content-types";
import { GRADE_LEVELS, type GradeLevel } from "@/lib/grades";
import { getCourse, saveCourse } from "@/lib/courses.functions";
import { uploadStorageFile } from "@/lib/storage";
import {
  Plus, Trash2, GripVertical, ChevronDown, Video, FileText, FileQuestion, Play, Pencil, ImageIcon, Upload, Eye, BarChart3, Loader2,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/courses/$id")({
  component: CourseEditor,
});

const EMPTY_COURSE = {
  id: "",
  title: "",
  description: "",
  cover: "",
  isPaid: false,
  price: undefined,
  studentsCount: 0,
  gradeLevel: "الصف الأول الثانوي" as GradeLevel,
  units: [] as Unit[],
};

function CourseEditor() {
  const { id } = useParams({ from: "/dashboard/courses/$id" });
  const isNew = id === "new";

  const [title, setTitle] = useState(EMPTY_COURSE.title);
  const [desc, setDesc] = useState(EMPTY_COURSE.description);
  const [isPaid, setIsPaid] = useState(EMPTY_COURSE.isPaid);
  const [cover, setCover] = useState<string>(EMPTY_COURSE.cover);
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(EMPTY_COURSE.gradeLevel);
  const [units, setUnits] = useState<Unit[]>(EMPTY_COURSE.units);
  const [playing, setPlaying] = useState<{ id: string; title: string; url: string } | null>(null);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const getTimeRef = useRef<() => number>(() => 0);

  useEffect(() => {
    if (isNew) return;
    setIsLoading(true);
    getCourse({ data: { courseId: id } })
      .then((course) => {
        setTitle(course.title);
        setDesc(course.description);
        setIsPaid(course.isPaid);
        setCover(course.cover);
        setGradeLevel(course.gradeLevel as GradeLevel);
        setUnits(course.units);
        setNotFound(false);
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [id, isNew]);

  const onCoverChange = async (file: File | undefined) => {
    if (!file) return;
    try {
      const url = await uploadStorageFile("course-covers", file);
      setCover(url);
    } catch (e) {
      alert("فشل رفع صورة الغلاف.");
    }
  };

  const [dragUnit, setDragUnit] = useState<string | null>(null);
  const [dragLesson, setDragLesson] = useState<{ unitId: string; lessonId: string } | null>(null);

  const moveUnit = (from: string, to: string) => {
    if (from === to) return;
    const arr = [...units];
    const fi = arr.findIndex((u) => u.id === from);
    const ti = arr.findIndex((u) => u.id === to);
    const [it] = arr.splice(fi, 1);
    arr.splice(ti, 0, it);
    setUnits(arr);
  };
  const moveLesson = (unitId: string, from: string, to: string) => {
    setUnits((prev) => prev.map((u) => {
      if (u.id !== unitId) return u;
      const arr = [...u.lessons];
      const fi = arr.findIndex((l) => l.id === from);
      const ti = arr.findIndex((l) => l.id === to);
      const [it] = arr.splice(fi, 1);
      arr.splice(ti, 0, it);
      return { ...u, lessons: arr };
    }));
  };

  const addUnit = () => {
    const name = window.prompt("اسم الوحدة الجديدة", "وحدة جديدة");
    if (!name) return;
    setUnits((p) => [...p, { id: `u${Date.now()}`, title: name, sortOrder: p.length, lessons: [] }]);
  };
  const delUnit = (uid: string) => setUnits((p) => p.filter((u) => u.id !== uid));
  const renameUnit = (uid: string) => {
    const cur = units.find((u) => u.id === uid);
    const name = window.prompt("اسم الوحدة", cur?.title || "");
    if (!name) return;
    setUnits((p) => p.map((u) => (u.id === uid ? { ...u, title: name } : u)));
  };

  const addLesson = (uid: string) => {
    const name = window.prompt("عنوان الدرس", "درس جديد");
    if (!name) return;
    setUnits((p) => p.map((u) => u.id === uid ? {
      ...u, lessons: [...u.lessons, { id: `l${Date.now()}`, title: name, sortOrder: u.lessons.length, videos: [], files: [], exams: [] }]
    } : u));
  };
  const delLesson = (uid: string, lid: string) =>
    setUnits((p) => p.map((u) => u.id === uid ? { ...u, lessons: u.lessons.filter((l) => l.id !== lid) } : u));

  const updateLesson = (uid: string, lid: string, fn: (l: Lesson) => Lesson) =>
    setUnits((p) => p.map((u) => u.id === uid ? { ...u, lessons: u.lessons.map((l) => l.id === lid ? fn(l) : l) } : u));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const unitsPayload = units.map((u, ui) => ({
        id: u.id.startsWith("u") ? undefined : u.id,
        title: u.title,
        sortOrder: ui,
        lessons: u.lessons.map((l, li) => ({
          id: l.id.startsWith("l") ? undefined : l.id,
          title: l.title,
          sortOrder: li,
          videos: l.videos.map((v, vi) => ({
            id: v.id.startsWith("v") ? undefined : v.id,
            title: v.title,
            url: v.url,
            durationSec: v.durationSec,
            sortOrder: vi,
          })),
          files: l.files.map((f) => ({
            id: f.id.startsWith("f") ? undefined : f.id,
            name: f.name,
            kind: f.kind,
            url: f.url,
            size: f.size,
          })),
          exams: l.exams.map((e) => ({
            id: e.id.startsWith("e") ? undefined : e.id,
            title: e.title,
            durationMin: e.durationMin ?? 30,
            passingPct: e.passingPct ?? 60,
            shuffleQuestions: e.shuffleQuestions ?? false,
            shuffleAnswers: e.shuffleAnswers ?? false,
            questions: e.questions ?? [],
          })),
        })),
      }));
      const { courseId } = await saveCourse({
        data: {
          course: {
            id: isNew ? undefined : id,
            title,
            description: desc,
            cover,
            isPaid,
            price: isPaid ? Number(price) || 0 : undefined,
            gradeLevel,
            studentsCount: 0,
          },
          units: unitsPayload,
        },
      });
      window.location.href = `/dashboard/courses/${courseId}`;
    } catch (e) {
      console.error(e);
      alert("فشل حفظ الدورة.");
    } finally {
      setIsSaving(false);
    }
  };

  const [price, setPrice] = useState<string>("");
  useEffect(() => {
    if (isPaid) setPrice(String(EMPTY_COURSE.price ?? 0));
  }, [isPaid]);

  if (isLoading) {
    return (
      <>
        <TopBar title="إدارة الدورة" />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </>
    );
  }

  if (notFound) {
    return (
      <>
        <TopBar title="إدارة الدورة" />
        <main className="flex-1 p-6">
          <Card><CardContent className="py-10 text-center text-muted-foreground">الدورة غير موجودة.</CardContent></Card>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar title={`إدارة الدورة: ${title}`} />
      <main className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader><CardTitle>معلومات الدورة</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>عنوان الدورة</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="cover">صورة الغلاف</Label>
              <div className="flex items-center gap-3">
                {cover ? (
                  <img src={cover} alt="الغلاف" className="h-16 w-24 rounded-md object-cover" />
                ) : (
                  <div className="flex h-16 w-24 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}
                <Input id="cover" type="file" accept="image/*"
                  onChange={(e) => onCoverChange(e.target.files?.[0])} />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>الوصف</Label>
              <Textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            <div>
              <Label>الصف الدراسي</Label>
              <Select value={gradeLevel} onValueChange={(v) => setGradeLevel(v as GradeLevel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GRADE_LEVELS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Switch checked={isPaid} onCheckedChange={setIsPaid} id="paid" />
                <Label htmlFor="paid">دورة مدفوعة</Label>
              </div>
              {isPaid && (
                <div>
                  <Label>السعر (ج.م)</Label>
                  <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
              )}
            </div>
            <div className="flex items-center justify-end md:col-span-2">
              <Button className="rounded-full" onClick={handleSave} disabled={isSaving || !title}>
                {isSaving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                حفظ التغييرات
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">وحدات الدورة</h2>
          <Button onClick={addUnit} className="rounded-full"><Plus className="ml-2 h-4 w-4" /> إضافة وحدة</Button>
        </div>

        <div className="space-y-3">
          {units.map((u) => (
            <div
              key={u.id}
              draggable
              onDragStart={() => setDragUnit(u.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dragUnit && moveUnit(dragUnit, u.id)}
              className="rounded-xl border bg-card"
            >
              <Collapsible defaultOpen>
                <div className="flex items-center gap-2 p-3">
                  <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                  <CollapsibleTrigger className="flex flex-1 items-center gap-2 text-right">
                    <ChevronDown className="h-4 w-4 transition data-[state=closed]:-rotate-90" />
                    <span className="font-semibold">{u.title}</span>
                    <Badge variant="secondary">{u.lessons.length} درس</Badge>
                  </CollapsibleTrigger>
                  <Button size="sm" variant="ghost" onClick={() => renameUnit(u.id)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => delUnit(u.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                <CollapsibleContent className="space-y-2 border-t p-3">
                  {u.lessons.map((l) => (
                    <LessonBlock
                      key={l.id}
                      unitId={u.id}
                      lesson={l}
                      onDragStart={() => setDragLesson({ unitId: u.id, lessonId: l.id })}
                      onDropOn={() => {
                        if (dragLesson && dragLesson.unitId === u.id)
                          moveLesson(u.id, dragLesson.lessonId, l.id);
                      }}
                      onDelete={() => delLesson(u.id, l.id)}
                      onUpdate={(fn) => updateLesson(u.id, l.id, fn)}
                      onPlay={(v) => setPlaying(v)}
                    />
                  ))}
                  <Button variant="outline" onClick={() => addLesson(u.id)} className="w-full">
                    <Plus className="ml-2 h-4 w-4" /> إضافة درس
                  </Button>
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))}
        </div>

        <Dialog open={!!playing} onOpenChange={(o) => !o && setPlaying(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>{playing?.title}</DialogTitle></DialogHeader>
            {playing && (
              <div className="space-y-4">
                <VideoPlayer
                  src={playing.url}
                  title={playing.title}
                  storageKey={playing.id}
                  onReady={(get) => { getTimeRef.current = get; }}
                />
                <div className="flex items-center justify-between rounded-lg border bg-card p-2">
                  <span className="text-sm font-medium">التفاعل</span>
                  <Reactions targetId={`video:${playing.id}`} />
                </div>
                <div>
                  <h4 className="mb-2 font-semibold">التعليقات</h4>
                  <VideoComments
                    videoId={playing.id}
                    canParticipate
                    isTeacher
                    getCurrentTime={() => getTimeRef.current()}
                  />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}

function LessonBlock({
  unitId, lesson, onDragStart, onDropOn, onDelete, onUpdate, onPlay,
}: {
  unitId: string;
  lesson: Lesson;
  onDragStart: () => void;
  onDropOn: () => void;
  onDelete: () => void;
  onUpdate: (fn: (l: Lesson) => Lesson) => void;
  onPlay: (v: { id: string; title: string; url: string }) => void;
}) {
  const [addVideoOpen, setAddVideoOpen] = useState(false);
  const [vTitle, setVTitle] = useState("");
  const [vUrl, setVUrl] = useState("");

  const [addFileOpen, setAddFileOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [addExamOpen, setAddExamOpen] = useState(false);
  const [eTitle, setETitle] = useState("");
  const [eDuration, setEDuration] = useState(30);
  const [ePassing, setEPassing] = useState(60);
  const [eShuffleQuestions, setEShuffleQuestions] = useState(false);
  const [eShuffleAnswers, setEShuffleAnswers] = useState(false);
  const [eQuestions, setEQuestions] = useState<ExamQuestion[]>([]);

  const resetExamForm = () => {
    setETitle(""); setEDuration(30); setEPassing(60);
    setEShuffleQuestions(false); setEShuffleAnswers(false); setEQuestions([]);
  };

  const formatSize = (bytes?: number) => {
    if (!bytes && bytes !== 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const handleUploadFile = async () => {
    if (!pendingFile) return;
    setIsUploading(true);
    try {
      const url = await uploadStorageFile("lesson-files", pendingFile);
      const ext = pendingFile.name.split(".").pop()?.toLowerCase() || "";
      const kind: LessonFile["kind"] =
        pendingFile.type.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp"].includes(ext) ? "image"
        : ext === "pdf" ? "pdf"
        : ["doc", "docx", "txt", "md", "rtf"].includes(ext) ? "note"
        : "book";
      onUpdate((l) => ({
        ...l,
        files: [...l.files, {
          id: `f${Date.now()}`,
          name: pendingFile.name,
          kind,
          url,
          size: pendingFile.size,
        }],
      }));
      setPendingFile(null);
      setAddFileOpen(false);
    } catch (e) {
      alert("فشل رفع الملف.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDropOn}
      className="rounded-lg border bg-background p-3"
    >
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
        <span className="flex-1 font-medium">{lesson.title}</span>
        <Button size="sm" variant="ghost" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="mt-3 space-y-2">
        {lesson.videos.map((v) => (
          <div key={v.id} className="flex items-center gap-2 rounded-md bg-muted/50 p-2 text-sm">
            <Video className="h-4 w-4 text-primary" />
            <span className="flex-1">{v.title}</span>
            <Button size="sm" variant="ghost" onClick={() => onPlay({ id: v.id, title: v.title, url: v.url })}>
              <Play className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onUpdate((l) => ({ ...l, videos: l.videos.filter((x) => x.id !== v.id) }))}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        {lesson.files.map((f) => (
          <div key={f.id} className="flex items-center gap-2 rounded-md bg-muted/50 p-2 text-sm">
            <FileText className="h-4 w-4 text-primary" />
            <span className="flex-1">{f.name}</span>
            <Badge variant="outline">{f.kind}</Badge>
            {f.size !== undefined && <span className="text-xs text-muted-foreground">{formatSize(f.size)}</span>}
            <Button size="sm" variant="ghost" onClick={() => onUpdate((l) => ({ ...l, files: l.files.filter((x) => x.id !== f.id) }))}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        {lesson.exams.map((e) => (
          <div key={e.id} className="flex items-center gap-2 rounded-md bg-muted/50 p-2 text-sm">
            <FileQuestion className="h-4 w-4 text-primary" />
            <span className="flex-1">{e.title}</span>
            <Badge variant="outline">{e.questionsCount} سؤال</Badge>
            {e.durationMin !== undefined && <Badge variant="outline">{e.durationMin} د</Badge>}
            <Button asChild size="sm" variant="ghost" title="معاينة">
              <Link to="/student/exams/$id" params={{ id: e.id }} search={{ preview: 1 }}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost" title="النتائج">
              <Link to="/dashboard/exams/$id/results" params={{ id: e.id }}>
                <BarChart3 className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onUpdate((l) => ({ ...l, exams: l.exams.filter((x) => x.id !== e.id) }))}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Dialog open={addVideoOpen} onOpenChange={setAddVideoOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="ml-1 h-3 w-3" /> إضافة فيديو</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>إضافة فيديو</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>عنوان الفيديو</Label>
                <Input value={vTitle} onChange={(e) => setVTitle(e.target.value)} placeholder="مثال: الشرح النظري" />
              </div>
              <div>
                <Label>رابط فيديو YouTube (رفع الفيديو كـ "غير مدرج" ثم ألصق الرابط)</Label>
                <Input dir="ltr" value={vUrl} onChange={(e) => setVUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..." />
                {vUrl && !parseYouTubeId(vUrl) && (
                  <p className="mt-1 text-xs text-destructive">تعذّر استخراج معرّف YouTube من الرابط.</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  if (!vTitle || !vUrl || !parseYouTubeId(vUrl)) return;
                  onUpdate((l) => ({ ...l, videos: [...l.videos, { id: `v${Date.now()}`, title: vTitle, url: vUrl }] }));
                  setVTitle(""); setVUrl(""); setAddVideoOpen(false);
                }}
              >
                إضافة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={addFileOpen} onOpenChange={(o) => { setAddFileOpen(o); if (!o) setPendingFile(null); }}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline"><Upload className="ml-1 h-3 w-3" /> رفع ملف</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>رفع ملف للدرس</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>اختر الملف من جهازك</Label>
                <Input type="file" onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)} />
              </div>
              {pendingFile && (
                <div className="rounded-md border bg-muted/40 p-3 text-sm">
                  <div className="font-medium">{pendingFile.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatSize(pendingFile.size)}
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                سيتم حفظ الملف في Supabase Storage ويستطيع الطلاب تحميله.
              </p>
            </div>
            <DialogFooter>
              <Button
                disabled={!pendingFile || isUploading}
                onClick={handleUploadFile}
              >
                {isUploading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                رفع الملف
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={addExamOpen} onOpenChange={(o) => { setAddExamOpen(o); if (!o) resetExamForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="ml-1 h-3 w-3" /> إضافة اختبار</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader><DialogTitle>إنشاء اختبار للدرس</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>عنوان الاختبار</Label>
                  <Input value={eTitle} onChange={(e) => setETitle(e.target.value)} placeholder="اختبار الوحدة الأولى" />
                </div>
                <div>
                  <Label>مدة الاختبار (دقيقة)</Label>
                  <Input type="number" min={1} value={eDuration}
                    onChange={(e) => setEDuration(Number(e.target.value))} />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>نسبة النجاح (%)</Label>
                  <Input type="number" min={0} max={100} value={ePassing}
                    onChange={(e) => setEPassing(Number(e.target.value))} />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Switch id="shuffleQ" checked={eShuffleQuestions} onCheckedChange={setEShuffleQuestions} />
                    <Label htmlFor="shuffleQ">ترتيب الأسئلة عشوائي</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="shuffleA" checked={eShuffleAnswers} onCheckedChange={setEShuffleAnswers} />
                    <Label htmlFor="shuffleA">ترتيب الإجابات عشوائي</Label>
                  </div>
                </div>
              </div>
              <div>
                <Label>الأسئلة</Label>
                <div className="mt-2">
                  <ExamBuilder questions={eQuestions} onChange={setEQuestions} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={!eTitle || eQuestions.length === 0}
                onClick={() => {
                  onUpdate((l) => ({
                    ...l,
                    exams: [...l.exams, {
                      id: `e${Date.now()}`,
                      title: eTitle,
                      questionsCount: eQuestions.length,
                      durationMin: eDuration,
                      passingPct: ePassing,
                      shuffleQuestions: eShuffleQuestions,
                      shuffleAnswers: eShuffleAnswers,
                      questions: eQuestions,
                    }],
                  }));
                  resetExamForm();
                  setAddExamOpen(false);
                }}
              >
                حفظ الاختبار
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="sr-only">{unitId}</div>
    </div>
  );
}
