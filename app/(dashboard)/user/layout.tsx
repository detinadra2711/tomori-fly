import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Travel agent adalah pihak eksternal: tidak boleh mengajukan perjalanan.
  if (user.role === "travel_agent") redirect("/travel-agent/bookings");
  return <>{children}</>;
}
