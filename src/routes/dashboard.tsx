import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TeacherSidebar } from "@/components/teacher-sidebar";
import { AppStateProvider } from "@/lib/app-state";
import { AnnouncementBanner } from "@/components/announcement-banner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "لوحة المعلّم — منصة معلّم" }] }),
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <AppStateProvider>
      <div dir="rtl" lang="ar" className="min-h-screen bg-background text-foreground">
        <AnnouncementBanner />
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <TeacherSidebar />
            <div className="flex flex-1 flex-col">
              <Outlet />
            </div>
          </div>
        </SidebarProvider>
      </div>
    </AppStateProvider>
  );
}
