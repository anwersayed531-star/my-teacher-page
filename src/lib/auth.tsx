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

function profileFromUser(user: User): Profile {
  const m = (user.user_metadata ?? {}) as Record<string, string | null>;
  return {
    id: user.id,
    full_name: m.full_name ?? null,
    phone: m.phone ?? null,
    grade: m.grade ?? null,
    bio: m.bio ?? null,
    avatar_url: m.avatar_url ?? null,
  };
}

/** يقرأ الجلسة + بيانات البروفايل، ولو الجداول لسه مش متعملة بيرجع بيانات الحساب نفسه. */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [tablesReady, setTablesReady] = useState(true);

  const load = useCallback(async (user: User | null) => {
    if (!user) {
      setProfile(null);
      setRole(null);
      setLoading(false);
      return;
    }
    const fallback = profileFromUser(user);
    const metaRole = ((user.user_metadata ?? {}) as { role?: Role }).role ?? "student";

    const [{ data: p, error: pErr }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
    ]);

    if (pErr) setTablesReady(false);
    setProfile(p ? { ...fallback, ...(p as Partial<Profile>) } : fallback);
    setRole((((r as { role?: Role } | null)?.role ?? metaRole) as Role));
    setLoading(false);

    // لو الجداول موجودة والصفوف ناقصة، ننشئها من التطبيق (بديل الـ trigger).
    if (!pErr && !p) {
      await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fallback.full_name,
        phone: fallback.phone,
        grade: fallback.grade,
        bio: fallback.bio,
        updated_at: new Date().toISOString(),
      });
    }
    if (!r) {
      await supabase.from("user_roles").insert({ user_id: user.id, role: metaRole });
    }
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
    async (values: Partial<Profile>) => {
      const user = session?.user;
      if (!user) return { error: "مفيش جلسة مسجّلة." };
      await supabase.auth.updateUser({ data: values });
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, ...values, updated_at: new Date().toISOString() });
      setProfile((prev) => ({ ...(prev ?? profileFromUser(user)), ...values }) as Profile);
      if (error) {
        setTablesReady(false);
        return { error: "اتحفظت في الحساب بس جدول profiles لسه مش متعمل في Supabase (شغّل ملف SQL)." };
      }
      return { error: null };
    },
    [session],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { session, user: session?.user ?? null, profile, role, loading, tablesReady, saveProfile, signOut };
}
