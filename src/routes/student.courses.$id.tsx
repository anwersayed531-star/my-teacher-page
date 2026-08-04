import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { VideoPlayer } from "@/components/video-player";
import { Reactions } from "@/components/reactions";
import { VideoComments } from "@/components/comments";
import { getCourse } from "@/lib/courses.functions";
import {
  Lock, Video, FileText, FileQuestion, ChevronDown, Circle, KeyRound, Play, Loader2,
} from "lucide-react";

export const Route = createFileRoute("/student/courses/$id")({
  component: StudentCourse,
});

type RedeemStatus = null | "success" | "invalid" | "used";

function StudentCourse() {
  const { id } = useParams({ from: "/student/courses/$id" });
  const { data: course, isLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: () => getCourse({ data: { courseId: id } }),
  });
  const [redeemed, setRedeemed] = useState(false);
  const subscribed = !!course && (!course.isPaid || redeemed);
  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<RedeemStatus>(null);
  const [playing, setPlaying] = useState<{ id: string; title: string; url: string } | null>(null);
  const getTimeRef = useRef<() => number>(() => 0);

  const redeem = () => {
    // TODO: connect to Supabase — single-use code redemption; grants lifetime access.
    if (code.trim().toUpperCase() === "VALID") { setStatus("success"); setRedeemed(true); }
    else if (code.trim().toUpperCase() === "USED") setStatus("used");
    else setStatus("invalid");
  };

  if (isLoading || !course) {
    return (
      <>
        <TopBar title="الدورة" />
        <main className="flex flex-1 items-center justify-center p-6">
          {isLoading ? <Loader2 className="h-8 w-8 animate-spin text-primary" />
            : <p className="text-muted-foreground">لم يتم العثور على الدورة.</p>}
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar title={course.title} />
      <main className="flex-1 space-y-6 p-6">
        <Card className="overflow-hidden">
          {course.cover ? (
            <img src={course.cover} alt={course.title} className="h-56 w-full object-cover" />
          ) : (
            <div className="flex h-40 items-center justify-center bg-gradient-to-br from-primary/20 to-accent/30 text-primary">
              <span className="font-display text-xl">{course.title}</span>
            </div>
          )}
          <CardContent className="flex flex-col justify-between gap-4 pt-6 md:flex-row md:items-center">
            <div>
              <h2 className="font-display text-2xl font-bold">{course.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{course.description}</p>
              {!course.isPaid && <Badge variant="secondary" className="mt-2">دورة مجانية</Badge>}
            </div>
            {subscribed ? <Badge>{course.isPaid ? "أنت مشترك" : "متاح للجميع"}</Badge> : (
              <Dialog open={codeOpen} onOpenChange={(o) => { setCodeOpen(o); if (!o) setStatus(null); }}>
                <DialogTrigger asChild>
                  <Button className="rounded-full"><KeyRound className="ml-2 h-4 w-4" /> أدخل كود الاشتراك</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>الاشتراك في الدورة</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="rounded-md bg-muted p-3 text-sm">
                      للاشتراك، يرجى التواصل مع الأستاذ للحصول على كود التفعيل الخاص بك، ثم أدخله في الحقل أدناه. بعد التفعيل يصبح الوصول للدورة دائمًا.
                    </div>
                    <Input placeholder="أدخل الكود هنا" value={code} onChange={(e) => setCode(e.target.value)} />
                    {status === "success" && <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">تم قبول الكود — تم فتح الدورة!</div>}
                    {status === "invalid" && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">كود غير صالح.</div>}
                    {status === "used" && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">هذا الكود مستخدم من قبل.</div>}
                    <Button onClick={redeem} className="w-full rounded-full">تفعيل الكود</Button>
                    <p className="text-xs text-muted-foreground">جرّب: VALID / USED / أي نص آخر</p>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>


        <div className="space-y-3">
          {course.units.length === 0 && (
            <Card><CardContent className="py-10 text-center text-muted-foreground">لا توجد وحدات بعد.</CardContent></Card>
          )}
          {course.units.map((u) => (
            <Card key={u.id}>
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex w-full items-center gap-2 p-4 text-right">
                  <ChevronDown className="h-4 w-4" />
                  <span className="flex-1 font-semibold">{u.title}</span>
                  <Badge variant="secondary">{u.lessons.length} درس</Badge>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 border-t p-4">
                  {u.lessons.map((l) => (
                    <div key={l.id} className="rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        {subscribed ? (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        ) : <Lock className="h-4 w-4 text-muted-foreground" />}
                        <span className="flex-1 font-medium">{l.title}</span>
                        {!subscribed && <Badge variant="outline">مغلق</Badge>}
                      </div>
                      <div className="mt-2 space-y-1 pr-6">
                        {l.videos.map((v) => (
                          <div key={v.id} className="flex items-center gap-2 text-sm">
                            <Video className="h-3.5 w-3.5 text-primary" />
                            <span className="flex-1">{v.title}</span>
                            <Button size="sm" variant="ghost" disabled={!subscribed}
                              onClick={() => setPlaying({ id: v.id, title: v.title, url: v.url })}>
                              <Play className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                        {l.files.map((f) => (
                          <div key={f.id} className="flex items-center gap-2 text-sm">
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            <span className="flex-1">{f.name}</span>
                            {subscribed && f.url && f.url !== "#" ? (
                              <Button asChild size="sm" variant="ghost">
                                <a href={f.url} download={f.name} target="_blank" rel="noreferrer">تحميل</a>
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" disabled>تحميل</Button>
                            )}
                          </div>
                        ))}
                        {l.exams.map((e) => (
                          <div key={e.id} className="flex items-center gap-2 text-sm">
                            <FileQuestion className="h-3.5 w-3.5 text-primary" />
                            <span className="flex-1">{e.title}</span>
                            {subscribed ? (
                              <Button asChild size="sm" variant="ghost">
                                <Link to="/student/exams/$id" params={{ id: e.id }} search={{ preview: undefined }}>ابدأ</Link>
                              </Button>
                            ) : <Button size="sm" variant="ghost" disabled>مغلق</Button>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>

        <Dialog open={!!playing} onOpenChange={(o) => !o && setPlaying(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>{playing?.title}</DialogTitle></DialogHeader>
            {playing && (
              <div className="space-y-4">
                <VideoPlayer
                  src={playing.url}
                  title={playing.title}
                  storageKey={playing.id}
                  onReady={(get) => { getTimeRef.current = get; }}
                />
                <div className="flex items-center justify-between rounded-lg border bg-card p-2">
                  <span className="text-sm font-medium">تفاعل مع الفيديو</span>
                  <Reactions targetId={`video:${playing.id}`} />
                </div>
                <div>
                  <h4 className="mb-2 font-semibold">التعليقات</h4>
                  <VideoComments
                    videoId={playing.id}
                    canParticipate={subscribed}
                    isTeacher={false}
                    getCurrentTime={() => getTimeRef.current()}
                  />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
