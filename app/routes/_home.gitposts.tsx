import { redirect } from "@remix-run/node";
import { type LoaderFunctionArgs, json } from "@remix-run/node";
import type { ShouldRevalidateFunctionArgs } from "@remix-run/react";
import { Outlet, useLoaderData, useNavigation } from "@remix-run/react";
import { getSupabaseWithSessionAndHeaders } from "@/lib/supabase.server";
import { Separator } from "@/components/ui/separator";
import { PostSearch } from "@/components/post-search";
import { getAllPostsWithDetails } from "@/lib/database.server"; // de supabase
import { combinePostsWithLikes, getUserDataFromSession } from "@/lib/utils";
import { InfiniteVirtualList } from "@/routes/stateful/infinite-virtual-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { WritePost } from "@/components/write-post";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { supabase, headers, session } = await getSupabaseWithSessionAndHeaders(
    {
      request,
    }
  );

  //si no estoy logged hace un redirect a login
  if (!session) {
    return redirect("/login", { headers });
  }

  /* START | Con esto, el valor de la input será el valor de la query, esto es para que en los reloads el valor de la input matchee con la query */
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const query = searchParams.get("query");
  /* END | Con esto, el valor de la input será el valor de la query, esto es para que en los reloads el valor de la input matchee con la query */

  const page = Number(searchParams.get("page")) || 1;

  //esto viene de la DB, hay que meterle como prop url dbClient que viene de supabase.server.ts
  const { data, totalPages, limit } = await getAllPostsWithDetails({
    dbClient: supabase,
    query,
    page: isNaN(page) ? 1 : page,
  });

  const {
    userId: sessionUserId,
    userAvatarUrl,
    username,
  } = getUserDataFromSession(session);

  const posts = combinePostsWithLikes(data, sessionUserId);

  return json(
    {
      posts,
      userDetails: { sessionUserId, userAvatarUrl, username },
      query,
      totalPages,
      limit,
    },
    { headers }
  );
};

export default function GitPosts() {
  const {
    posts,
    userDetails: { sessionUserId },
    query,
    totalPages,
  } = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  // When nothing is happening, navigation.location will be undefined,
  // but when the user navigates it will be populated with the next
  // location while data loads. Then we check if they're searching with
  // location.search.
  const isSearching = Boolean(
    navigation.location &&
      new URLSearchParams(navigation.location.search).has("query")
  );

  return (
    <div className="w-full max-w-xl px-4 flex flex-col">
      <Tabs defaultValue="view-posts" className="my-2">
        {/* BUTTONS */}
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="view-posts">View Posts</TabsTrigger>
          <TabsTrigger value="write-post">Write Post</TabsTrigger>
        </TabsList>

        {/* CONTENT */}
        <TabsContent value="view-posts">
          <Outlet />
          <Separator />
          <PostSearch searchQuery={query} isSearching={isSearching} />

          <InfiniteVirtualList
            sessionUserId={sessionUserId}
            posts={posts}
            totalPages={totalPages}
          />
        </TabsContent>

        {/* CONTENT */}
        <TabsContent value="write-post">
          <WritePost sessionUserId={sessionUserId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function shouldRevalidate({
  actionResult,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  const skipRevalidation =
    actionResult?.skipRevalidation &&
    actionResult?.skipRevalidation?.includes("/gitposts");

  if (skipRevalidation) {
    console.log("Skipped revalidation");
    return false;
  }

  console.log("Did not skip revalidation");

  return defaultShouldRevalidate;
}
