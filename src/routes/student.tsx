import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/student-sidebar";
import { AppStateProvider } from "@/lib/app-state";
import { AnnouncementBanner } from "@/components/announcement-banner";

export const Route = createFileRoute("/student")({
  head: () => ({ meta: [{ title: "لوحة الطالب — منصة معلّم" }] }),
  component: StudentLayout,
});

function StudentLayout() {
  return (
    <AppStateProvider>
      <div dir="rtl" lang="ar" className="min-h-screen bg-background text-foreground">
        <AnnouncementBanner />
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <StudentSidebar />
            <div className="flex flex-1 flex-col">
              <Outlet />
            </div>
          </div>
        </SidebarProvider>
      </div>
    </AppStateProvider>
  );
}
