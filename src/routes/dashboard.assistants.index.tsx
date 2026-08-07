import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAssistants } from "@/lib/platform.functions";
export const Route = createFileRoute("/dashboard/assistants/")({ component: Assistants });
function Assistants() { const { data: assistants = [] } = useQuery({ queryKey: ["assistants"], queryFn: () => listAssistants() }); return <><TopBar title="المساعدون" /><main className="flex-1 p-6"><Card><CardHeader><CardTitle>حسابات المساعدين</CardTitle></CardHeader><CardContent className="space-y-2">{assistants.length === 0 && <p className="text-sm text-muted-foreground">لا يوجد مساعدون. إنشاء الحسابات يتم فقط بواسطة إدارة المنصة.</p>}{assistants.map((a) => <div key={a.id} className="rounded-md border p-3"><div className="font-medium">{a.name}</div><div dir="ltr" className="text-sm text-muted-foreground">{a.email}</div></div>)}</CardContent></Card></main></>; }