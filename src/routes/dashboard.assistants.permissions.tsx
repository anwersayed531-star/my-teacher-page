import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/topbar";
import { Card, CardContent } from "@/components/ui/card";
export const Route = createFileRoute("/dashboard/assistants/permissions")({ component: Permissions });
function Permissions() { return <><TopBar title="صلاحيات المساعدين" /><main className="flex-1 p-6"><Card><CardContent className="py-10 text-center text-muted-foreground">لا توجد صلاحيات قابلة للتعديل حاليًا. حسابات المساعدين تُدار بواسطة إدارة المنصة فقط.</CardContent></Card></main></>; }