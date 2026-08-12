import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";

export default async function TravelAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isActive) redirect("/login");
  if (user.role !== "travel_agent" && user.role !== "admin") {
    redirect("/user/dashboard");
  }
  return <>{children}</>;
}
