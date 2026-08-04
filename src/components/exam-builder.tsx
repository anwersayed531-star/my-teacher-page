import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import {
  type ExamQuestion, type ExamQType, type ExamMCQ, type ExamTF, type ExamMulti,
  type ExamOrder, type ExamMatch, type ExamImage, type ExamAudio,
  EXAM_TYPE_LABELS, EXAM_AUTO_GRADED, makeExamQuestion,
} from "@/lib/mock-data";

export function ExamBuilder({
  questions, onChange,
}: {
  questions: ExamQuestion[];
  onChange: (next: ExamQuestion[]) => void;
}) {
  const update = (id: string, fn: (q: ExamQuestion) => ExamQuestion) =>
    onChange(questions.map((q) => (q.id === id ? fn(q) : q)));
  const remove = (id: string) => onChange(questions.filter((q) => q.id !== id));
  const add = (t: ExamQType) => onChange([...questions, makeExamQuestion(t)]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(EXAM_TYPE_LABELS) as ExamQType[]).map((t) => (
          <Button key={t} size="sm" variant="outline" type="button" onClick={() => add(t)}>
            <Plus className="ml-1 h-3 w-3" /> {EXAM_TYPE_LABELS[t]}
          </Button>
        ))}
      </div>

      {questions.length === 0 && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          لم تُضِف أي سؤال بعد. اختر نوع السؤال من الأعلى.
        </p>
      )}

      {questions.map((q, i) => (
        <div key={q.id} className="rounded-lg border p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge>{i + 1}</Badge>
            <Badge variant="secondary">{EXAM_TYPE_LABELS[q.type]}</Badge>
            <Badge variant={EXAM_AUTO_GRADED[q.type] ? "default" : "outline"}>
              {EXAM_AUTO_GRADED[q.type] ? "تصحيح تلقائي" : "تصحيح يدوي"}
            </Badge>
            <div className="flex items-center gap-1 text-xs">
              <span>الدرجة:</span>
              <Input type="number" className="h-7 w-16" value={q.points}
                onChange={(e) => update(q.id, (x) => ({ ...x, points: Number(e.target.value) }))} />
            </div>
            <Button size="sm" variant="ghost" type="button" className="mr-auto" onClick={() => remove(q.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <Textarea placeholder="نص السؤال..." rows={2} value={q.text}
            onChange={(e) => update(q.id, (x) => ({ ...x, text: e.target.value }))} />
          <div className="mt-3"><Editor q={q} update={(fn) => update(q.id, fn)} /></div>
        </div>
      ))}
    </div>
  );
}

function Editor({ q, update }: { q: ExamQuestion; update: (fn: (q: ExamQuestion) => ExamQuestion) => void }) {
  if (q.type === "mcq" || q.type === "image" || q.type === "audio") {
    return (
      <div className="space-y-2">
        {q.type === "image" && (
          <div>
            <Label>رابط الصورة</Label>
            <Input dir="ltr" value={q.imageUrl}
              onChange={(e) => update((x) => ({ ...(x as ExamImage), imageUrl: e.target.value }))} />
          </div>
        )}
        {q.type === "audio" && (
          <div>
            <Label>رابط الصوت</Label>
            <Input dir="ltr" value={q.audioUrl}
              onChange={(e) => update((x) => ({ ...(x as ExamAudio), audioUrl: e.target.value }))} />
          </div>
        )}
        <Label>الخيارات — اختر الإجابة الصحيحة</Label>
        {q.options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input type="radio" checked={q.correct === idx}
              onChange={() => update((x) => ({ ...(x as ExamMCQ), correct: idx }))} />
            <Input value={opt} placeholder={`الخيار ${idx + 1}`}
              onChange={(e) => update((x) => {
                const opts = [...(x as ExamMCQ).options]; opts[idx] = e.target.value;
                return { ...(x as ExamMCQ), options: opts };
              })} />
          </div>
        ))}
        <Button size="sm" variant="outline" type="button"
          onClick={() => update((x) => ({ ...(x as ExamMCQ), options: [...(x as ExamMCQ).options, ""] }))}>
          <Plus className="ml-1 h-3 w-3" /> خيار
        </Button>
      </div>
    );
  }
  if (q.type === "tf") {
    return (
      <div className="flex gap-2">
        {[true, false].map((v) => (
          <Button key={String(v)} size="sm" type="button"
            variant={q.correct === v ? "default" : "outline"}
            onClick={() => update((x) => ({ ...(x as ExamTF), correct: v }))}>
            {v ? "صح" : "خطأ"}
          </Button>
        ))}
      </div>
    );
  }
  if (q.type === "multi") {
    return (
      <div className="space-y-2">
        <Label>اختر كل الإجابات الصحيحة</Label>
        {q.options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input type="checkbox" checked={q.correct.includes(idx)}
              onChange={(e) => update((x) => {
                const m = x as ExamMulti;
                const next = e.target.checked ? [...m.correct, idx] : m.correct.filter((n) => n !== idx);
                return { ...m, correct: next };
              })} />
            <Input value={opt} placeholder={`الخيار ${idx + 1}`}
              onChange={(e) => update((x) => {
                const opts = [...(x as ExamMulti).options]; opts[idx] = e.target.value;
                return { ...(x as ExamMulti), options: opts };
              })} />
          </div>
        ))}
      </div>
    );
  }
  if (q.type === "order") {
    return (
      <div className="space-y-2">
        <Label>العناصر بالترتيب الصحيح</Label>
        {q.items.map((it, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Badge>{idx + 1}</Badge>
            <Input value={it} onChange={(e) => update((x) => {
              const items = [...(x as ExamOrder).items]; items[idx] = e.target.value;
              return { ...(x as ExamOrder), items };
            })} />
          </div>
        ))}
        <Button size="sm" variant="outline" type="button"
          onClick={() => update((x) => ({ ...(x as ExamOrder), items: [...(x as ExamOrder).items, ""] }))}>
          <Plus className="ml-1 h-3 w-3" /> عنصر
        </Button>
      </div>
    );
  }
  if (q.type === "match") {
    return (
      <div className="space-y-2">
        <Label>أزواج المطابقة</Label>
        {q.pairs.map((p, idx) => (
          <div key={idx} className="grid grid-cols-2 gap-2">
            <Input value={p.left} placeholder="العمود الأيمن"
              onChange={(e) => update((x) => {
                const pairs = [...(x as ExamMatch).pairs]; pairs[idx] = { ...pairs[idx], left: e.target.value };
                return { ...(x as ExamMatch), pairs };
              })} />
            <Input value={p.right} placeholder="العمود الأيسر"
              onChange={(e) => update((x) => {
                const pairs = [...(x as ExamMatch).pairs]; pairs[idx] = { ...pairs[idx], right: e.target.value };
                return { ...(x as ExamMatch), pairs };
              })} />
          </div>
        ))}
        <Button size="sm" variant="outline" type="button"
          onClick={() => update((x) => ({ ...(x as ExamMatch), pairs: [...(x as ExamMatch).pairs, { left: "", right: "" }] }))}>
          <Plus className="ml-1 h-3 w-3" /> زوج
        </Button>
      </div>
    );
  }
  if (q.type === "essay") {
    return <p className="text-xs text-muted-foreground">سؤال مقالي — يُصحّح يدوياً بواسطة المعلّم بعد التسليم.</p>;
  }
  return null;
}