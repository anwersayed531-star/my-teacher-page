import { useState } from "react";
import { Send, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Reactions } from "@/components/reactions";
import { useAppState } from "@/lib/app-state";

// TODO: connect to Supabase — comments are per-video and enrolled-only.

interface Props {
  videoId: string;
  /** Whether the viewer can post/see comments (enrolled or teacher). */
  canParticipate: boolean;
  /** Teacher can delete any comment. */
  isTeacher: boolean;
  /** Getter for current video time (from VideoPlayer.onReady). */
  getCurrentTime?: () => number;
}

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export function VideoComments({ videoId, canParticipate, isTeacher, getCurrentTime }: Props) {
  const { comments, addComment, deleteComment, me } = useAppState();
  const list = comments[videoId] || [];
  const [text, setText] = useState("");

  if (!canParticipate) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          التعليقات متاحة للطلاب المشتركين في الدورة فقط.
        </CardContent>
      </Card>
    );
  }

  const post = (withTimestamp: boolean) => {
    if (!text.trim()) return;
    const ts = withTimestamp && getCurrentTime ? Math.floor(getCurrentTime()) : null;
    addComment({
      videoId,
      authorId: me.id,
      authorName: isTeacher ? "الأستاذ" : me.name,
      authorRole: isTeacher ? "teacher" : "student",
      text: text.trim(),
      timestampSec: ts,
    });
    setText("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="اكتب تعليقاً..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); post(false); } }}
        />
        <Button onClick={() => post(false)} size="sm" className="rounded-full">
          <Send className="ml-1 h-3.5 w-3.5" /> إرسال
        </Button>
        {getCurrentTime && (
          <Button onClick={() => post(true)} size="sm" variant="outline" className="rounded-full">
            <Clock className="ml-1 h-3.5 w-3.5" /> تعليق عند هذه اللحظة
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {list.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">لا توجد تعليقات بعد.</p>
        )}
        {list.map((c) => (
          <div key={c.id} className="rounded-lg border bg-card p-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">{c.authorName}</span>
              {c.authorRole === "teacher" && <Badge variant="secondary">الأستاذ</Badge>}
              {c.timestampSec !== null && (
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  <span dir="ltr">{fmt(c.timestampSec)}</span>
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">{c.createdAt}</span>
              {isTeacher && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="ms-auto h-7 w-7"
                  onClick={() => deleteComment(videoId, c.id)}
                  aria-label="حذف"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              )}
            </div>
            <p className="mt-1 text-sm">{c.text}</p>
            <div className="mt-2">
              <Reactions targetId={`comment:${c.id}`} size="sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
