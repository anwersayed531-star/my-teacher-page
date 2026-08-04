import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, BookOpen, Files, FileQuestion, Users,
  KeyRound, MessagesSquare, Megaphone, UserCog, UserRound,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "الرئيسية", url: "/dashboard", icon: LayoutDashboard },
  { title: "الدورات", url: "/dashboard/courses", icon: BookOpen },
  { title: "الملفات", url: "/dashboard/files", icon: Files },
  { title: "الاختبارات", url: "/dashboard/exams/new", icon: FileQuestion },
  { title: "الطلاب", url: "/dashboard/students", icon: Users },
  { title: "أكواد الاشتراك", url: "/dashboard/codes", icon: KeyRound },
  { title: "الرسائل", url: "/dashboard/messages", icon: MessagesSquare },
  { title: "الإعلانات", url: "/dashboard/announcements", icon: Megaphone },
  { title: "المساعدون", url: "/dashboard/assistants", icon: UserCog },
  { title: "صفحتي الشخصية", url: "/dashboard/profile", icon: UserRound },
];

export function TeacherSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader>
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-3">
          <BrandLogo className="h-8 w-8" wordmarkClassName="text-base" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>لوحة المعلّم</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => {
                const active = pathname === it.url || (it.url !== "/dashboard" && pathname.startsWith(it.url));
                return (
                  <SidebarMenuItem key={it.url}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link to={it.url} className="flex items-center gap-2">
                        <it.icon className="h-4 w-4" />
                        <span>{it.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
