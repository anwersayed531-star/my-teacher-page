import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { listReactions, toggleReaction } from "@/lib/platform.functions";

type ReactionType = "like" | "love" | "haha" | "angry" | "sad";
const choices: { type: ReactionType; label: string; emoji: string }[] = [{ type: "like", label: "أعجبني", emoji: "👍" }, { type: "love", label: "أحببته", emoji: "❤️" }, { type: "haha", label: "هاها", emoji: "😂" }, { type: "angry", label: "غاضب", emoji: "😡" }, { type: "sad", label: "حزين", emoji: "😢" }];
export function Reactions({ targetId }: { targetId: string; size?: "sm" | "md" }) {
  const qc = useQueryClient(); const { data: list = [] } = useQuery({ queryKey: ["reactions", targetId], queryFn: () => listReactions({ data: { targetId } }) });
  const mine = list.find((r) => r.mine); const meta = choices.find((r) => r.type === mine?.type);
  const pick = async (type: ReactionType) => { await toggleReaction({ data: { targetId, type } }); await qc.invalidateQueries({ queryKey: ["reactions", targetId] }); };
  return <div className="flex items-center gap-2"><Popover><PopoverTrigger asChild><Button size="sm" variant="ghost">{meta ? <span>{meta.emoji} {meta.label}</span> : <><ThumbsUp className="ml-1 h-4 w-4" />أعجبني</>}</Button></PopoverTrigger><PopoverContent className="w-auto p-1"><div className="flex">{choices.map((r) => <Button key={r.type} variant="ghost" size="icon" title={r.label} onClick={() => void pick(r.type)}>{r.emoji}</Button>)}</div></PopoverContent></Popover>{list.length > 0 && <span className="text-xs text-muted-foreground">{list.length}</span>}</div>;
}