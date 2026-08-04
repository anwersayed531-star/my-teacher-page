// TODO: connect to Supabase — persist exam questions/settings.
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { TopBar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ExamBuilder } from "@/components/exam-builder";
import {
  mockCourses, addExamToLesson, type ExamQuestion,
} from "@/lib/mock-data";
import { Eye } from "lucide-react";

export const Route = createFileRoute("/dashboard/exams/new")({
  component: NewExam,
});

function NewExam() {
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [courseId, setCourseId] = useState<string>("");
  const [unitId, setUnitId] = useState<string>("");
  const [lessonId, setLessonId] = useState<string>("");
  const [duration, setDuration] = useState(30);
  const [attempts, setAttempts] = useState(1);
  const [passing, setPassing] = useState(60);
  const [shuffleQs, setShuffleQs] = useState(false);
  const [shuffleAs, setShuffleAs] = useState(false);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);

  const course = useMemo(() => mockCourses.find((c) => c.id === courseId), [courseId]);
  const unit = useMemo(() => course?.units.find((u) => u.id === unitId), [course, unitId]);
  const lesson = useMemo(() => unit?.lessons.find((l) => l.id === lessonId), [unit, lessonId]);

  const canSave = !!title && !!courseId && !!unitId && !!lessonId && questions.length > 0;

  const buildExam = () => ({
    id: `e${Date.now()}`,
    title,
    questionsCount: questions.length,
    durationMin: duration,
    questions,
    shuffleQuestions: shuffleQs,
    shuffleAnswers: shuffleAs,
    passingPct: passing,
    attempts: [],
  });

  const save = (thenPreview = false) => {
    if (!canSave) return;
    const exam = buildExam();
    addExamToLesson(courseId, unitId, lessonId, exam);
    if (thenPreview) {
      nav({ to: "/student/exams/$id", params: { id: exam.id }, search: { preview: 1 } });
    } else {
      nav({ to: "/dashboard/courses/$id", params: { id: courseId } });
    }
  };

  return (
    <>
      <TopBar title="إنشاء اختبار" />
      <main className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader><CardTitle>معلومات الاختبار</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>عنوان الاختبار</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="اختبار الشهر الأول" />
            </div>
            <div>
              <Label>الدورة</Label>
              <Select value={courseId} onValueChange={(v) => { setCourseId(v); setUnitId(""); setLessonId(""); }}>
                <SelectTrigger><SelectValue placeholder="اختر الدورة" /></SelectTrigger>
                <SelectContent>
                  {mockCourses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الوحدة</Label>
              <Select value={unitId} onValueChange={(v) => { setUnitId(v); setLessonId(""); }}
                disabled={!course || course.units.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={course ? (course.units.length ? "اختر الوحدة" : "لا توجد وحدات في الدورة") : "اختر الدورة أولاً"} />
                </SelectTrigger>
                <SelectContent>
                  {course?.units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الدرس</Label>
              <Select value={lessonId} onValueChange={setLessonId}
                disabled={!unit || unit.lessons.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={unit ? (unit.lessons.length ? "اختر الدرس" : "لا توجد دروس في الوحدة") : "اختر الوحدة أولاً"} />
                </SelectTrigger>
                <SelectContent>
                  {unit?.lessons.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>وصف (اختياري)</Label>
              <Textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            {lesson && (
              <p className="md:col-span-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                سيتم إضافة الاختبار داخل: <b>{course?.title}</b> ← <b>{unit?.title}</b> ← <b>{lesson.title}</b>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>الإعدادات</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div><Label>مدة الاختبار (دقيقة)</Label>
              <Input type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></div>
            <div><Label>عدد المحاولات</Label>
              <Input type="number" min={1} value={attempts} onChange={(e) => setAttempts(Number(e.target.value))} /></div>
            <div><Label>درجة النجاح %</Label>
              <Input type="number" min={0} max={100} value={passing} onChange={(e) => setPassing(Number(e.target.value))} /></div>
            <div className="flex flex-col gap-3 md:col-span-3 md:flex-row">
              <div className="flex items-center gap-2">
                <Switch id="rq" checked={shuffleQs} onCheckedChange={setShuffleQs} />
                <Label htmlFor="rq">ترتيب الأسئلة عشوائيًا</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="ra" checked={shuffleAs} onCheckedChange={setShuffleAs} />
                <Label htmlFor="ra">ترتيب الإجابات عشوائيًا</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>الأسئلة</CardTitle></CardHeader>
          <CardContent>
            <ExamBuilder questions={questions} onChange={setQuestions} />
          </CardContent>
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" disabled={!canSave} onClick={() => save(true)}>
            <Eye className="ml-2 h-4 w-4" /> حفظ ومعاينة الاختبار
          </Button>
          <Button className="rounded-full" disabled={!canSave} onClick={() => save(false)}>
            نشر الاختبار
          </Button>
        </div>
        {attempts !== 1 && <input type="hidden" value={attempts} />}
        {desc && <input type="hidden" value={desc} />}
      </main>
    </>
  );
}