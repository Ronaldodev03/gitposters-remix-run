// server client supabase

import { createServerClient, parse, serialize } from "@supabase/ssr"; //for creating server client
import type { Database } from "database.types"; //types for ts

//this is called in root in a loader, to have access to the env consts
export const getSupabaseEnv = () => ({
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
});

//this will be used in the fucntion below (getSupabaseWithSessionHeaders)
//and also in lib/resources.auth.callback.tsx
export function getSupabaseWithHeaders({ request }: { request: Request }) {
  //START| this comes from the doc
  const cookies = parse(request.headers.get("Cookie") ?? "");
  const headers = new Headers();

  const supabase = createServerClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key) {
          return cookies[key];
        },
        set(key, value, options) {
          headers.append("Set-Cookie", serialize(key, value, options));
        },
        remove(key, options) {
          headers.append("Set-Cookie", serialize(key, "", options));
        },
      },
      auth: {
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    }
  );
  //END| this comes from the doc

  return { supabase, headers };
}

//this is called in root
export async function getSupabaseWithSessionAndHeaders({
  request,
}: {
  request: Request;
}) {
  const { supabase, headers } = getSupabaseWithHeaders({
    request,
  });

  const {
    data: { session: session },
  } = await supabase.auth.getSession();

  //********console.log("supabase server:", supabase);
  //********** */ console.log("supabase server session:", session);

  return { session, headers, supabase };
}
