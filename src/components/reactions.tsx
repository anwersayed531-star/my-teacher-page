import { useRef, useState } from "react";
import { ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useAppState, type ReactionType } from "@/lib/app-state";

// Facebook-style reactions — single like button, long-press/hover opens picker.
// TODO: connect to Supabase — reactions are user-scoped and realtime.

export const REACTIONS: { type: ReactionType; label: string; emoji: string; color: string }[] = [
  { type: "like", label: "أعجبني", emoji: "👍", color: "text-blue-600" },
  { type: "love", label: "أحببته", emoji: "❤️", color: "text-red-500" },
  { type: "haha", label: "هاها", emoji: "😂", color: "text-amber-500" },
  { type: "angry", label: "غاضب", emoji: "😡", color: "text-orange-600" },
  { type: "sad", label: "حزين", emoji: "😢", color: "text-sky-600" },
];

const meta = (t: ReactionType) => REACTIONS.find((r) => r.type === t)!;

interface Props {
  targetId: string; // e.g. "video:v1" or "comment:cm1"
  size?: "sm" | "md";
}

export function Reactions({ targetId, size = "md" }: Props) {
  const { reactions, toggleReaction, me } = useAppState();
  const list = reactions[targetId] || [];
  const mine = list.find((r) => r.userId === me.id);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startPress = () => {
    pressTimer.current = setTimeout(() => setPickerOpen(true), 400);
  };
  const cancelPress = () => {
    if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; }
  };

  const quickClick = () => {
    cancelPress();
    if (pickerOpen) return; // picker took over
    toggleReaction(targetId, mine ? mine.type : "like");
  };

  const pick = (t: ReactionType) => {
    toggleReaction(targetId, t);
    setPickerOpen(false);
  };

  // Summary of reaction counts by type
  const counts = list.reduce<Record<ReactionType, number>>((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, { like: 0, love: 0, haha: 0, angry: 0, sad: 0 });
  const topTypes = REACTIONS.filter((r) => counts[r.type] > 0).slice(0, 3);

  const btnSize = size === "sm" ? "sm" : "sm";
  const iconSz = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className="flex items-center gap-2">
      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          <Button
            size={btnSize}
            variant="ghost"
            className={`gap-1 ${mine ? meta(mine.type).color : ""}`}
            onMouseEnter={startPress}
            onMouseLeave={cancelPress}
            onTouchStart={startPress}
            onTouchEnd={cancelPress}
            onClick={quickClick}
          >
            {mine ? (
              <span className="text-base leading-none">{meta(mine.type).emoji}</span>
            ) : (
              <ThumbsUp className={iconSz} />
            )}
            <span>{mine ? meta(mine.type).label : "أعجبني"}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1" side="top" align="start">
          <div className="flex items-center gap-1">
            {REACTIONS.map((r) => (
              <button
                key={r.type}
                type="button"
                title={r.label}
                onClick={() => pick(r.type)}
                className="rounded-full p-1 text-2xl transition hover:scale-125"
              >
                {r.emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {list.length > 0 && (
        <button
          type="button"
          onClick={() => setListOpen(true)}
          className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted/70"
        >
          <span className="flex -space-x-1">
            {topTypes.map((r) => (
              <span key={r.type} className="text-sm leading-none">{r.emoji}</span>
            ))}
          </span>
          <span>{list.length}</span>
        </button>
      )}

      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>التفاعلات ({list.length})</DialogTitle></DialogHeader>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {list.map((r) => (
              <div key={r.userId + r.type} className="flex items-center gap-3 rounded-md border p-2 text-sm">
                <span className="text-xl">{meta(r.type).emoji}</span>
                <span className="flex-1">{r.userName}</span>
                <span className={`text-xs ${meta(r.type).color}`}>{meta(r.type).label}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
