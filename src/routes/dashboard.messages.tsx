import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { TopBar } from "@/components/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listConversation, listMessageThreads, sendMessage } from "@/lib/platform.functions";
import { Send } from "lucide-react";

export const Route = createFileRoute("/dashboard/messages")({ component: Messages });
function Messages() {
  const qc = useQueryClient(); const [selected, setSelected] = useState<string | null>(null); const [draft, setDraft] = useState("");
  const { data: threads = [] } = useQuery({ queryKey: ["message-threads"], queryFn: () => listMessageThreads() });
  const active = threads.find((t) => t.id === selected) ?? null;
  const { data: conversation = [] } = useQuery({ queryKey: ["conversation", selected], queryFn: () => listConversation({ data: { withUserId: selected ?? "" } }), enabled: !!selected });
  const send = async () => { if (!selected || !draft.trim()) return; await sendMessage({ data: { recipientId: selected, body: draft.trim() } }); setDraft(""); await Promise.all([qc.invalidateQueries({ queryKey: ["conversation", selected] }), qc.invalidateQueries({ queryKey: ["message-threads"] })]); };
  return <><TopBar title="الرسائل" /><main className="flex-1 p-6"><Card className="h-[calc(100vh-8rem)] overflow-hidden"><CardContent className="grid h-full grid-cols-3 p-0"><div className="overflow-y-auto border-l">{threads.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">لا توجد رسائل.</p>}{threads.map((t) => <Button key={t.id} variant="ghost" className="h-auto w-full justify-start rounded-none border-b p-3 text-right" onClick={() => setSelected(t.id)}><span className="w-full"><span className="block font-medium">{t.name}</span><span className="block text-xs text-muted-foreground">{t.grade} · {t.lastMessage}</span></span></Button>)}</div><div className="col-span-2 flex flex-col">{active ? <><div className="border-b p-3 font-semibold">{active.name} — {active.studentCode || active.email}</div><div className="flex-1 space-y-2 overflow-y-auto p-4">{conversation.length === 0 && <p className="text-center text-sm text-muted-foreground">لا توجد رسائل في هذه المحادثة.</p>}{conversation.map((m) => <div key={m.id} className={`flex ${m.mine ? "justify-start" : "justify-end"}`}><div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${m.mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{m.body}<div className="mt-1 text-[10px] opacity-70">{new Date(m.at).toLocaleString("ar-EG")}</div></div></div>)}</div><div className="flex gap-2 border-t p-3"><Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void send()} /><Button onClick={() => void send()}><Send className="h-4 w-4" /></Button></div></> : <div className="flex flex-1 items-center justify-center text-muted-foreground">اختر محادثة.</div>}</div></CardContent></Card></main></>;
}