import { Pagination } from "@/components/shell/Pagination";
import { listAccountsPaged } from "@/lib/admin/accounts";
import { parsePage, totalPages } from "@/lib/pagination";
import { AccountsList } from "./AccountsList";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageParam, q } = await searchParams;
  const { page, perPage, from, to } = parsePage(pageParam);
  const { accounts, count } = await listAccountsPaged(from, to, q);
  const suffix = q ? `&q=${encodeURIComponent(q)}` : "";

  return (
    <>
      <AccountsList accounts={accounts} query={q ?? ""} />
      <Pagination
        page={page}
        totalPages={totalPages(count, perPage)}
        totalCount={count}
        makeHref={(p) => `/admin/users?page=${p}${suffix}`}
      />
    </>
  );
}
