import {
  json,
  type LinksFunction,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import styles from "@/styles/index.css?url";
import {
  getSupabaseEnv,
  getSupabaseWithSessionAndHeaders,
} from "./lib/supabase.server";
import { useSupabase } from "./lib/supabase";
import { Toaster } from "./components/ui/toaster";
import { Toaster as SonnerToaster } from "./components/ui/sonner";
import {
  getHints,
  ClientHintCheck,
  useTheme,
  useNonce,
} from "./lib/client-hints";
import { getTheme } from "./lib/theme.server";
import clsx from "clsx";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

//we return the server info in this loader using json
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, headers } = await getSupabaseWithSessionAndHeaders({
    request,
  });
  const domainUrl = process.env.DOMAIN_URL!; //este es el local host que a posteriori será la URL del deploy

  //.log("session root:", session);

  //console.log("headers root:", headers);

  //***********const env = getSupabaseEnv();
  //*********console.log("env root:", env);

  return json(
    {
      env: getSupabaseEnv(),
      session,
      domainUrl,
      requestInfo: {
        hints: getHints(request),
        userPrefs: {
          theme: getTheme(request),
        },
      },
    },
    { headers }
  );
};

export default function App() {
  const { env, session, domainUrl } = useLoaderData<typeof loader>(); //we grab the data from the loader

  //we create a browser client, then we pass it in the context of remix, we grab the data in the components using useOutletContext hook
  const { supabase } = useSupabase({ env, session });
  const theme = useTheme();
  const nonce = useNonce();

  //*************console.log("session root component:", session);

  return (
    <html lang="en" className={clsx(theme)}>
      <head>
        {<ClientHintCheck nonce={nonce} />}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="overscroll-none">
        <Toaster />
        <SonnerToaster position="top-center" richColors />
        <Outlet context={{ supabase, domainUrl }} />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
