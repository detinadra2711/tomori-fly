import { redirect } from "next/navigation";
import { MobileNav, Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { getCurrentUser } from "@/lib/supabase/auth";
import { countUnread, listNotifications } from "@/lib/notifications/queries";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [notifications, unreadCount] = await Promise.all([
    listNotifications(),
    countUnread(),
  ]);

  return (
    <div className="flex min-h-dvh gap-4 p-4">
      <Sidebar role={user.role} />
      <div className="flex flex-1 flex-col gap-6 py-2">
        <Topbar
          user={user}
          notifications={notifications}
          unreadCount={unreadCount}
        />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>
      <MobileNav role={user.role} />
    </div>
  );
}
