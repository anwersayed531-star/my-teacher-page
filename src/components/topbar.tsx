import { Bell } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mockNotifications } from "@/lib/mock-data";
import { useAppState } from "@/lib/app-state";
import { Badge } from "@/components/ui/badge";

export function TopBar({ title }: { title: string }) {
  const { announcements } = useAppState();
  const items = [
    ...mockNotifications,
    ...announcements.map((a) => ({ id: a.id, text: a.text, time: a.createdAt, read: false })),
  ];
  const unread = items.filter((n) => !n.read).length;

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <h1 className="font-display text-lg font-bold">{title}</h1>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <Badge className="absolute -top-1 -left-1 h-5 min-w-5 rounded-full px-1 text-xs">{unread}</Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>الإشعارات</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {items.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">لا توجد إشعارات</div>
          )}
          {items.map((n) => (
            <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5">
              <div className="text-sm">{n.text}</div>
              <div className="text-xs text-muted-foreground">{n.time}</div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
