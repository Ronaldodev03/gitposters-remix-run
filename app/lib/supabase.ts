// browser client supabase
import { createBrowserClient } from "@supabase/ssr"; //for creating browser client
import type { Session, SupabaseClient } from "@supabase/supabase-js"; //types for ts
import { useEffect, useState } from "react";
import type { Database } from "database.types"; //type for ts
import { useRevalidator } from "@remix-run/react";

//type para la data que viene de supabase
export type TypedSupabaseClient = SupabaseClient<Database>;

//type para el context de remix
export type SupabaseOutletContext = {
  supabase: TypedSupabaseClient;
  domainUrl: string;
};

//type para las env
type SupabaseEnv = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
};

//type para el custom hook
type UseSupabase = {
  env: SupabaseEnv;
  session: Session | null;
};

//custom hook
export const useSupabase = ({ env, session }: UseSupabase) => {
  // Singleton... why in a useState? bc we want only one instance throghout our app
  const [supabase] = useState(
    () =>
      createBrowserClient<Database>(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!) //we create browser client
  );

  const revalidator = useRevalidator();

  const serverAccessToken = session?.access_token;

  //**************** */ console.log("supabase serverAccessToken:", serverAccessToken);

  //didn't get all of this, is for checking if user is logedin
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      //  console.log("Auth event happened: ", event, session);

      //client token === server token?
      if (session?.access_token !== serverAccessToken) {
        // call loaders, if not user then will redirect to login
        revalidator.revalidate();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, serverAccessToken, revalidator]);

  return { supabase }; //we return the client from the custom hook
};

//component, have not seen it yet
export function getRealTimeSubscription(
  supabase: TypedSupabaseClient,
  callback: () => void
) {
  return supabase
    .channel("realtime posts and likes")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "posts",
      },
      () => {
        callback();
      }
    )
    .subscribe();
}
