import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  grade: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export type Role = "teacher" | "student" | "assistant";

/** يقرأ الجلسة + البروفايل + الصلاحية من قاعدة البيانات الحقيقية. */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (user: User | null) => {
    if (!user) {
      setProfile(null);
      setRole(null);
      setLoading(false);
      return;
    }

    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
    ]);

    setProfile(
      p
        ? {
            id: p.id,
            full_name: p.full_name,
            phone: p.phone,
            grade: p.grade,
            bio: p.bio,
            avatar_url: p.avatar_url,
          }
        : null,
    );
    setRole((r?.role as Role | undefined) ?? "student");
    setLoading(false);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      void load(s?.user ?? null);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      void load(data.session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const saveProfile = useCallback(
    async (values: Partial<Omit<Profile, "id">>) => {
      const user = session?.user;
      if (!user) return { error: "مفيش جلسة مسجّلة." };
      const { error } = await supabase
        .from("profiles")
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) return { error: error.message };
      setProfile((prev) => ({ ...(prev ?? { id: user.id, full_name: null, phone: null, grade: null, bio: null, avatar_url: null }), ...values }));
      return { error: null };
    },
    [session],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return {
    session,
    user: session?.user ?? null,
    profile,
    role,
    isTeacher: role === "teacher" || role === "assistant",
    loading,
    saveProfile,
    signOut,
  };
}
