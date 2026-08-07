import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { TopBar } from "@/components/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getPlatformTeacher, listConversation, sendMessage } from "@/lib/platform.functions";
import { Send } from "lucide-react";
export const Route = createFileRoute("/student/messages")({ component: StudentMessages });
function StudentMessages() {
  const qc = useQueryClient(); const [draft, setDraft] = useState("");
  const { data: teacher } = useQuery({ queryKey: ["platform-teacher"], queryFn: () => getPlatformTeacher() });
  const { data: messages = [] } = useQuery({ queryKey: ["conversation", teacher?.id], queryFn: () => listConversation({ data: { withUserId: teacher?.id ?? "" } }), enabled: !!teacher });
  const send = async () => { if (!teacher || !draft.trim()) return; await sendMessage({ data: { recipientId: teacher.id, body: draft.trim() } }); setDraft(""); await qc.invalidateQueries({ queryKey: ["conversation", teacher.id] }); };
  return <><TopBar title="الرسائل" /><main className="flex-1 p-6"><Card className="h-[calc(100vh-8rem)]"><CardContent className="flex h-full flex-col p-0"><div className="border-b p-3 font-semibold">{teacher?.name ?? "المعلّم"}</div><div className="flex-1 space-y-2 overflow-y-auto p-4">{messages.length === 0 && <p className="text-center text-sm text-muted-foreground">لا توجد رسائل بعد.</p>}{messages.map((m) => <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${m.mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{m.body}<div className="mt-1 text-[10px] opacity-70">{new Date(m.at).toLocaleString("ar-EG")}</div></div></div>)}</div><div className="flex gap-2 border-t p-3"><Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void send()} placeholder="اكتب رسالة..." /><Button onClick={() => void send()} disabled={!teacher}><Send className="h-4 w-4" /></Button></div></CardContent></Card></main></>;
}