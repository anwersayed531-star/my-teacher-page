import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { mockFiles } from "@/lib/mock-data";
import { Plus, Trash2, Pencil, FileText, Image as ImageIcon, BookOpen, StickyNote } from "lucide-react";

export const Route = createFileRoute("/dashboard/files")({
  component: FilesPage,
});

const icons: Record<string, typeof FileText> = {
  pdf: FileText, image: ImageIcon, book: BookOpen, note: StickyNote,
};

function FilesPage() {
  const [files, setFiles] = useState(mockFiles);
  return (
    <>
      <TopBar title="الملفات" />
      <main className="flex-1 space-y-4 p-6">
        <div className="flex justify-between">
          <p className="text-muted-foreground">مكتبة الملفات — PDF، صور، ملاحظات، كتب.</p>
          <Button className="rounded-full"
            onClick={() => {
              const name = window.prompt("اسم الملف", "ملف جديد.pdf");
              if (!name) return;
              setFiles((p) => [{ id: `f${Date.now()}`, name, kind: "pdf", access: "public", size: "—" }, ...p]);
            }}
          >
            <Plus className="ml-2 h-4 w-4" /> رفع ملف
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">الحجم</TableHead>
                  <TableHead className="text-right">الصلاحية</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((f) => {
                  const Icon = icons[f.kind] || FileText;
                  return (
                    <TableRow key={f.id}>
                      <TableCell className="flex items-center gap-2 font-medium">
                        <Icon className="h-4 w-4 text-primary" /> {f.name}
                      </TableCell>
                      <TableCell>{f.kind}</TableCell>
                      <TableCell>{f.size}</TableCell>
                      <TableCell>
                        <Select
                          value={f.access}
                          onValueChange={(v) =>
                            setFiles((p) => p.map((x) => x.id === f.id ? { ...x, access: v } : x))
                          }
                        >
                          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">عام</SelectItem>
                            <SelectItem value="subscribers">المشتركين فقط</SelectItem>
                            <SelectItem value="private">خاص</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="flex gap-1">
                        <Button size="sm" variant="ghost"
                          onClick={() => {
                            const name = window.prompt("اسم جديد", f.name);
                            if (!name) return;
                            setFiles((p) => p.map((x) => x.id === f.id ? { ...x, name } : x));
                          }}
                        ><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost"
                          onClick={() => setFiles((p) => p.filter((x) => x.id !== f.id))}
                        ><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
