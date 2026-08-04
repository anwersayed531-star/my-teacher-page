import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAppState } from "@/lib/app-state";
import { GRADE_LEVELS, type GradeLevel } from "@/lib/grades";
import { Megaphone, Bell } from "lucide-react";

export const Route = createFileRoute("/dashboard/announcements")({
  component: Announcements,
});

function Announcements() {
  const { announcements, addAnnouncement } = useAppState();
  const [text, setText] = useState("");
  const [kind, setKind] = useState<"normal" | "important">("normal");
  const [target, setTarget] = useState<GradeLevel | "all">("all");
  const [showPreview, setShowPreview] = useState(false);

  const publish = () => {
    if (!text.trim()) return;
    // TODO: connect to Supabase — persist announcement with target grade filter.
    addAnnouncement({ text: target === "all" ? text : `[${target}] ${text}`, kind });
    setText(""); setShowPreview(false);
  };


  return (
    <>
      <TopBar title="الإعلانات" />
      <main className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader><CardTitle>إعلان جديد</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="نص الإعلان..." />
            <div>
              <div className="mb-2 text-sm font-medium">نوع الإعلان</div>
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1 md:w-96">
                {(["normal", "important"] as const).map((k) => (
                  <button key={k} onClick={() => setKind(k)}
                    className={`rounded-md py-2 text-sm font-medium transition ${kind === k ? "bg-background shadow" : "text-muted-foreground"}`}>
                    {k === "normal" ? "عادي" : "مهم"}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {kind === "normal"
                  ? "سيظهر في: الجرس (قائمة الإشعارات) فقط."
                  : "سيظهر في: الجرس + الشريط العلوي عبر كل الصفحات."}
              </p>
            </div>
            <div>
              <Label>الصف المستهدف</Label>
              <Select value={target} onValueChange={(v) => setTarget(v as GradeLevel | "all")}>
                <SelectTrigger className="md:w-96"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الصفوف</SelectItem>
                  {GRADE_LEVELS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPreview(true)} disabled={!text.trim()}>معاينة</Button>
              <Button onClick={publish} disabled={!text.trim()} className="rounded-full">نشر</Button>
            </div>
          </CardContent>
        </Card>

        {showPreview && (
          <Card className="border-primary/40">
            <CardHeader><CardTitle>معاينة الإعلان</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Badge variant="secondary">سيظهر في: {kind === "normal" ? "الجرس فقط" : "الجرس + الشريط العلوي"}</Badge>
              {kind === "important" && (
                <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 p-3 text-primary">
                  <Megaphone className="h-4 w-4" /><span className="font-medium">{text}</span>
                </div>
              )}
              <div className="flex items-start gap-2 rounded-md border p-3">
                <Bell className="mt-1 h-4 w-4 text-primary" />
                <div><div className="text-sm">{text}</div><div className="text-xs text-muted-foreground">الآن</div></div>
              </div>
              <div className="flex gap-2">
                <Button onClick={publish} className="rounded-full">نشر</Button>
                <Button variant="outline" onClick={() => setShowPreview(false)}>تعديل</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>الإعلانات السابقة</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {announcements.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                <div>
                  <div className="text-sm">{a.text}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{a.createdAt}</div>
                </div>
                <Badge variant={a.kind === "important" ? "default" : "secondary"}>{a.kind === "important" ? "مهم" : "عادي"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
