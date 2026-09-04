import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TeacherSidebar } from "@/components/teacher-sidebar";
import { useAdmin } from "@/lib/auth";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({ meta: [{ title: "لوحة الإدارة — مدرسة" }, { name: "robots", content: "noindex" }] }),
  component: DashboardLayout,
});

function DashboardLayout() {
  const { isAdmin, loading } = useAdmin();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) void nav({ to: "/login" });
  }, [loading, isAdmin, nav]);

  if (loading) return <main className="p-10 text-center text-muted-foreground">جارٍ التحميل…</main>;
  if (!isAdmin) return null;

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-background text-foreground">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <TeacherSidebar />
          <div className="flex flex-1 flex-col">
            <header className="flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
              <SidebarTrigger />
              <h1 className="font-display text-lg font-bold">لوحة الإدارة</h1>
            </header>
            <Outlet />
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
