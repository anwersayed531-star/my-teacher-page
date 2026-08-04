// TODO: connect to Supabase — announcements, comments, reactions, and grade filters will be realtime/persisted.
import { createContext, useContext, useState, type ReactNode } from "react";
import { initialAnnouncements, type Announcement } from "./mock-data";
import type { GradeLevel } from "./grades";

export type ReactionType = "like" | "love" | "haha" | "angry" | "sad";

export interface ReactionEntry {
  userId: string;
  userName: string;
  type: ReactionType;
}

export interface CommentEntry {
  id: string;
  videoId: string;
  authorId: string;
  authorName: string;
  authorRole: "teacher" | "student";
  text: string;
  timestampSec: number | null; // null = general, number = video timestamp comment
  createdAt: string;
}

interface AppState {
  announcements: Announcement[];
  addAnnouncement: (a: Omit<Announcement, "id" | "createdAt">) => void;
  bannerDismissed: boolean;
  dismissBanner: () => void;
  currentRole: "teacher" | "student";
  setRole: (r: "teacher" | "student") => void;

  // Grade filtering
  studentGrade: GradeLevel;
  setStudentGrade: (g: GradeLevel) => void;
  selectedGrade: GradeLevel | "all";
  setSelectedGrade: (g: GradeLevel | "all") => void;

  // Comments (keyed by videoId)
  comments: Record<string, CommentEntry[]>;
  addComment: (c: Omit<CommentEntry, "id" | "createdAt">) => void;
  deleteComment: (videoId: string, commentId: string) => void;

  // Reactions (keyed by target id e.g. "video:v1" or "comment:c1")
  reactions: Record<string, ReactionEntry[]>;
  toggleReaction: (targetId: string, type: ReactionType) => void;

  // Current mock user
  me: { id: string; name: string };
}

const Ctx = createContext<AppState | null>(null);

const seedComments: Record<string, CommentEntry[]> = {
  v1: [
    { id: "cm1", videoId: "v1", authorId: "s1", authorName: "أحمد محمود", authorRole: "student", text: "شرح رائع، شكراً!", timestampSec: null, createdAt: "قبل ساعة" },
    { id: "cm2", videoId: "v1", authorId: "s2", authorName: "فاطمة علي", authorRole: "student", text: "لم أفهم هذه النقطة جيداً", timestampSec: 42, createdAt: "قبل ٣٠ دقيقة" },
  ],
};

const seedReactions: Record<string, ReactionEntry[]> = {
  "video:v1": [
    { userId: "s1", userName: "أحمد محمود", type: "love" },
    { userId: "s2", userName: "فاطمة علي", type: "like" },
    { userId: "s3", userName: "يوسف حسن", type: "haha" },
  ],
  "comment:cm1": [
    { userId: "s3", userName: "يوسف حسن", type: "like" },
  ],
};

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [currentRole, setRole] = useState<"teacher" | "student">("teacher");
  const [studentGrade, setStudentGrade] = useState<GradeLevel>("الصف الثالث الثانوي");
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | "all">("all");
  const [comments, setComments] = useState<Record<string, CommentEntry[]>>(seedComments);
  const [reactions, setReactions] = useState<Record<string, ReactionEntry[]>>(seedReactions);
  const me = { id: "me", name: "أنا" };

  const addComment: AppState["addComment"] = (c) => {
    const entry: CommentEntry = { ...c, id: `cm${Date.now()}`, createdAt: "الآن" };
    setComments((prev) => ({ ...prev, [c.videoId]: [entry, ...(prev[c.videoId] || [])] }));
  };

  const deleteComment: AppState["deleteComment"] = (videoId, commentId) => {
    setComments((prev) => ({ ...prev, [videoId]: (prev[videoId] || []).filter((x) => x.id !== commentId) }));
  };

  const toggleReaction: AppState["toggleReaction"] = (targetId, type) => {
    setReactions((prev) => {
      const list = prev[targetId] || [];
      const mine = list.find((r) => r.userId === me.id);
      let next: ReactionEntry[];
      if (mine && mine.type === type) {
        next = list.filter((r) => r.userId !== me.id);
      } else if (mine) {
        next = list.map((r) => (r.userId === me.id ? { ...r, type } : r));
      } else {
        next = [...list, { userId: me.id, userName: me.name, type }];
      }
      return { ...prev, [targetId]: next };
    });
  };

  return (
    <Ctx.Provider
      value={{
        announcements,
        addAnnouncement: (a) =>
          setAnnouncements((prev) => [{ id: `an${Date.now()}`, createdAt: "الآن", ...a }, ...prev]),
        bannerDismissed,
        dismissBanner: () => setBannerDismissed(true),
        currentRole,
        setRole,
        studentGrade,
        setStudentGrade,
        selectedGrade,
        setSelectedGrade,
        comments,
        addComment,
        deleteComment,
        reactions,
        toggleReaction,
        me,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAppState() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppState must be used within AppStateProvider");
  return v;
}
