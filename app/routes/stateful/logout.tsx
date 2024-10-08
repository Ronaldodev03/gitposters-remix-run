import { useOutletContext } from "@remix-run/react";
import { Button } from "../../components/ui/button";
import type { SupabaseOutletContext } from "@/lib/supabase";

export function Logout() {
  const { supabase } = useOutletContext<SupabaseOutletContext>();

  const handleSignOut = async () => {
    await supabase.auth.signOut(); //metodo de supabase para logout
  };

  return <Button onClick={handleSignOut}>Logout</Button>;
}
