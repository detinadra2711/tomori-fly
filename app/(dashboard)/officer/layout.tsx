import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";

export default async function OfficerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isActive) redirect("/login");
  // Officer memantau; admin diizinkan melihat untuk keperluan administrasi.
  if (user.role !== "officer" && user.role !== "admin") {
    redirect("/user/dashboard");
  }
  return <>{children}</>;
}
