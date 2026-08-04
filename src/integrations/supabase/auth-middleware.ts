import { createMiddleware } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env["SUPABASE_URL"] ?? process.env["SB_URL"]!;
const SUPABASE_PUBLISHABLE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SB_ANON_KEY"]!;

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(async (options) => {
  const { next } = options;
  const request = (options as any).request as Request;
  const authHeader = request.headers.get("Authorization") ?? "";
  const userToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  const headers: Record<string, string> = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
  };

  if (userToken && userToken.split(".").length === 3) {
    headers["Authorization"] = `Bearer ${userToken}`;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { headers },
  });

  const { data, error } = await supabase.auth.getUser(userToken);
  if (error || !data.user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  return next({
    context: {
      supabase,
      userId: data.user.id,
      claims: data.user,
    },
  });
});


