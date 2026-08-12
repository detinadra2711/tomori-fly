import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { homeForRole } from "@/lib/auth/home";

export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? homeForRole(user.role) : "/login");
}
