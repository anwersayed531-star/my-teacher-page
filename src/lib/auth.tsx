import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** حساب واحد فقط في المنصة: حساب المدير (صاحب المدرسة). */
export function useAdmin() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (user: User | null) => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.rpc("is_admin");
    setIsAdmin(!error && data === true);
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

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { session, user: session?.user ?? null, isAdmin, loading, signOut };
}
