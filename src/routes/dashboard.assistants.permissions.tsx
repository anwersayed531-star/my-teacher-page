import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { mockAssistants } from "@/lib/mock-data";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/dashboard/assistants/permissions")({
  component: Permissions,
});

const PERM_LABELS: Record<string, string> = {
  replyMessages: "الرد على رسائل الطلاب",
  addLessons: "إضافة الدروس",
  editCourses: "تعديل الدورات",
  viewStats: "عرض الإحصائيات",
};

function Permissions() {
  const [list, setList] = useState(mockAssistants);

  return (
    <>
      <TopBar title="صلاحيات المساعدين" />
      <main className="flex-1 space-y-4 p-6">
        <div className="flex items-start gap-2 rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-sm text-amber-900">
          <ShieldAlert className="mt-0.5 h-4 w-4" />
          <div>
            بيانات الطلاب الشخصية (البريد، الهاتف، العنوان) لا تُعرض للمساعدين في أي واجهة — بغض النظر عن الصلاحيات أدناه.
          </div>
        </div>
        {list.map((a) => (
          <Card key={a.id}>
            <CardHeader><CardTitle dir="ltr" className="text-base">{a.email}</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {Object.entries(a.permissions).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between rounded-md border p-3">
                  <span className="text-sm">{PERM_LABELS[k] ?? k}</span>
                  <Switch checked={v} onCheckedChange={(nv) =>
                    setList((p) => p.map((x) => x.id === a.id ? { ...x, permissions: { ...x.permissions, [k]: nv } } : x))
                  } />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </main>
    </>
  );
}
