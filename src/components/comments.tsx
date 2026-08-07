import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Reactions } from "@/components/reactions";
import { addVideoComment, deleteVideoComment, listVideoComments } from "@/lib/platform.functions";

interface Props { videoId: string; canParticipate: boolean; isTeacher: boolean; getCurrentTime?: () => number }
const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
export function VideoComments({ videoId, canParticipate, isTeacher, getCurrentTime }: Props) {
  const queryClient = useQueryClient(); const [text, setText] = useState("");
  const { data: list = [] } = useQuery({ queryKey: ["video-comments", videoId], queryFn: () => listVideoComments({ data: { videoId } }), enabled: canParticipate });
  if (!canParticipate) return <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">التعليقات متاحة للمشتركين فقط.</CardContent></Card>;
  const post = async (withTimestamp: boolean) => { if (!text.trim()) return; await addVideoComment({ data: { videoId, text: text.trim(), timestampSec: withTimestamp && getCurrentTime ? Math.floor(getCurrentTime()) : null } }); setText(""); await queryClient.invalidateQueries({ queryKey: ["video-comments", videoId] }); };
  return <div className="space-y-3"><div className="flex flex-wrap gap-2"><Input value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتب تعليقاً..." /><Button size="sm" onClick={() => void post(false)}><Send className="ml-1 h-4 w-4" />إرسال</Button>{getCurrentTime && <Button size="sm" variant="outline" onClick={() => void post(true)}><Clock className="ml-1 h-4 w-4" />عند هذه اللحظة</Button>}</div><div className="space-y-2">{list.length === 0 && <p className="text-center text-sm text-muted-foreground">لا توجد تعليقات بعد.</p>}{list.map((c) => <div key={c.id} className="rounded-md border p-3"><div className="flex items-center gap-2"><span className="font-medium">{c.authorName}</span>{c.authorRole === "teacher" && <Badge>الأستاذ</Badge>}{c.timestampSec !== null && <Badge variant="outline">{fmt(c.timestampSec)}</Badge>}<span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString("ar-EG")}</span>{(isTeacher || c.mine) && <Button className="mr-auto" size="icon" variant="ghost" onClick={() => void deleteVideoComment({ data: { id: c.id } }).then(() => queryClient.invalidateQueries({ queryKey: ["video-comments", videoId] }))}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div><p className="mt-2 text-sm">{c.text}</p><Reactions targetId={`comment:${c.id}`} size="sm" /></div>)}</div></div>;
}