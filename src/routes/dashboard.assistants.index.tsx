import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { mockAssistants } from "@/lib/mock-data";
import { Plus, Trash2, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/dashboard/assistants/")({
  component: Assistants,
});

function Assistants() {
  const [list, setList] = useState(mockAssistants);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [open, setOpen] = useState(false);

  const add = () => {
    if (!email || !pw) return;
    setList((p) => [
      ...p,
      { id: `as${Date.now()}`, email, permissions: { replyMessages: true, addLessons: false, editCourses: false, viewStats: false } },
    ]);
    // TODO: connect to Supabase — create assistant account.
    setEmail(""); setPw(""); setOpen(false);
  };

  return (
    <>
      <TopBar title="المساعدون" />
      <main className="flex-1 space-y-4 p-6">
        <div className="flex items-start gap-2 rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-sm text-amber-900">
          <ShieldAlert className="mt-0.5 h-4 w-4" />
          <div>
            المساعدون لا يمكنهم أبدًا الاطلاع على البيانات الشخصية للطلاب (البريد، الهاتف، أي معلومات شخصية) — حتى مع تفعيل كل الصلاحيات.
          </div>
        </div>

        <div className="flex justify-between">
          <p className="text-muted-foreground">إنشاء حسابات المساعدين يدويًا فقط — لا يوجد تسجيل ذاتي.</p>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/dashboard/assistants/permissions">صلاحيات المساعدين</Link>
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button className="rounded-full"><Plus className="ml-2 h-4 w-4" /> إضافة مساعد</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>إضافة مساعد</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>البريد الإلكتروني</Label><Input dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                  <div><Label>كلمة المرور</Label><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
                </div>
                <DialogFooter><Button onClick={add}>إنشاء</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>قائمة المساعدين</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">البريد</TableHead>
                  <TableHead className="text-right">الصلاحيات المفعّلة</TableHead>
                  <TableHead className="text-right">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((a) => {
                  const active = Object.entries(a.permissions).filter(([, v]) => v).length;
                  return (
                    <TableRow key={a.id}>
                      <TableCell dir="ltr">{a.email}</TableCell>
                      <TableCell>{active} صلاحية</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => setList((p) => p.filter((x) => x.id !== a.id))}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
