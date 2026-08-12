import { notFound } from "next/navigation";
import { getAccount } from "@/lib/admin/accounts";
import { AccountForm } from "../../AccountForm";

export default async function EditAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const account = await getAccount(id);
  if (!account) notFound();
  return <AccountForm account={account} />;
}
