import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, BarChart3, MessagesSquare, UserRound } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "كورساتي", url: "/student/dashboard", icon: BookOpen },
  { title: "الرسائل", url: "/student/messages", icon: MessagesSquare },
  { title: "الإحصائيات", url: "/student/stats", icon: BarChart3 },
  { title: "صفحتي الشخصية", url: "/student/profile", icon: UserRound },
];


export function StudentSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader>
        <Link to="/student/dashboard" className="flex items-center gap-2 px-2 py-3">
          <BrandLogo className="h-8 w-8" wordmarkClassName="text-base" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>لوحة الطالب</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => (
                <SidebarMenuItem key={it.title}>
                  <SidebarMenuButton asChild isActive={pathname === it.url}>
                    <Link to={it.url} className="flex items-center gap-2">
                      <it.icon className="h-4 w-4" />
                      <span>{it.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
