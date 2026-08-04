import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export const Route = createFileRoute("/student/messages")({
  component: StudentMessages,
});

interface Msg { from: "student" | "teacher"; text: string; time: string }

function StudentMessages() {
  const [thread, setThread] = useState<Msg[]>([
    { from: "teacher", text: "أهلاً بك! لو عندك أي سؤال اسأل مباشرة.", time: "أمس" },
    { from: "student", text: "شكراً يا أستاذ", time: "أمس" },
  ]);
  const [draft, setDraft] = useState("");
  const send = () => {
    if (!draft.trim()) return;
    // TODO: connect to Supabase realtime channel.
    setThread((p) => [...p, { from: "student", text: draft, time: "الآن" }]);
    setDraft("");
  };
  return (
    <>
      <TopBar title="الرسائل" />
      <main className="flex-1 p-6">
        <Card className="h-[calc(100vh-8rem)] overflow-hidden">
          <CardContent className="flex h-full flex-col p-0">
            <div className="border-b p-3 font-semibold">الأستاذ</div>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {thread.map((m, i) => (
                <div key={i} className={`flex ${m.from === "student" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${m.from === "student" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <div>{m.text}</div>
                    <div className="mt-1 text-[10px] opacity-70">{m.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t p-3">
              <Input value={draft} onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()} placeholder="اكتب رسالة للأستاذ..." />
              <Button onClick={send}><Send className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
