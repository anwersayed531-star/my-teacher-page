import { X, Megaphone } from "lucide-react";
import { useAppState } from "@/lib/app-state";

export function AnnouncementBanner() {
  const { announcements, bannerDismissed, dismissBanner } = useAppState();
  const important = announcements.find((a) => a.kind === "important");
  if (!important || bannerDismissed) return null;
  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary">
      <div className="flex items-center gap-2">
        <Megaphone className="h-4 w-4" />
        <span className="font-medium">{important.text}</span>
      </div>
      <button
        onClick={dismissBanner}
        className="rounded-full p-1 transition hover:bg-primary/20"
        aria-label="إغلاق"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
