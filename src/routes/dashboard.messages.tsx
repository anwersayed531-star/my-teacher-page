import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { mockMessages, mockStudents } from "@/lib/mock-data";
import { Send } from "lucide-react";

const gradeOf = (studentId: string) => mockStudents.find((s) => s.id === studentId)?.gradeLevel ?? "";


export const Route = createFileRoute("/dashboard/messages")({
  component: Messages,
});

function Messages() {
  const [selected, setSelected] = useState(mockMessages[0].id);
  const [threads, setThreads] = useState(mockMessages);
  const [draft, setDraft] = useState("");
  const active = threads.find((t) => t.id === selected)!;

  const send = () => {
    if (!draft.trim()) return;
    setThreads((p) => p.map((t) => t.id === selected
      ? { ...t, thread: [...t.thread, { from: "teacher", text: draft, time: "الآن" }], lastMessage: draft }
      : t));
    setDraft("");
    // TODO: connect to Supabase realtime channel.
  };

  return (
    <>
      <TopBar title="الرسائل" />
      <main className="flex-1 p-6">
        <Card className="h-[calc(100vh-8rem)] overflow-hidden">
          <CardContent className="grid h-full grid-cols-3 gap-0 p-0">
            <div className="col-span-1 overflow-y-auto border-l">
              {threads.map((t) => (
                <button key={t.id} onClick={() => setSelected(t.id)}
                  className={`flex w-full items-center gap-3 border-b p-3 text-right transition hover:bg-muted ${selected === t.id ? "bg-muted" : ""}`}>
                  <Avatar><AvatarFallback className="bg-primary/10 text-primary">{t.studentName[0]}</AvatarFallback></Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between">
                      <div className="flex flex-col">
                        <span className="font-medium">{t.studentName}</span>
                        <span className="text-[10px] text-muted-foreground">{gradeOf(t.studentId)}</span>
                      </div>
                      {t.unread > 0 && <Badge className="h-5 min-w-5 rounded-full">{t.unread}</Badge>}
                    </div>
                    <div className="truncate text-sm text-muted-foreground">{t.lastMessage}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="col-span-2 flex flex-col">
              <div className="border-b p-3 font-semibold">
                {active.studentName}
                <span className="mr-2 text-xs font-normal text-muted-foreground">— {gradeOf(active.studentId)}</span>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {active.thread.map((m, i) => (
                  <div key={i} className={`flex ${m.from === "teacher" ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${m.from === "teacher" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <div>{m.text}</div>
                      <div className="mt-1 text-[10px] opacity-70">{m.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t p-3">
                <Input value={draft} onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()} placeholder="اكتب رسالة..." />
                <Button onClick={send}><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
