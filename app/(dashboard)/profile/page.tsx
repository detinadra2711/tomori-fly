import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { hasOfficerPassphrase } from "@/lib/officer/passphrase";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const passphraseSet =
    user.role === "officer" ? await hasOfficerPassphrase(user.id) : false;
  return <ProfileForm user={user} passphraseSet={passphraseSet} />;
}
