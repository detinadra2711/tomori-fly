import { Pagination } from "@/components/shell/Pagination";
import { listOfficerRequestsPaged } from "@/lib/officer/requests";
import { parsePage, totalPages } from "@/lib/pagination";
import { RequestsMonitor } from "./RequestsMonitor";

export default async function OfficerRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageParam, q } = await searchParams;
  const { page, perPage, from, to } = parsePage(pageParam);
  const { trips, count } = await listOfficerRequestsPaged(from, to, q);
  const suffix = q ? `&q=${encodeURIComponent(q)}` : "";

  return (
    <>
      <RequestsMonitor trips={trips} query={q ?? ""} />
      <Pagination
        page={page}
        totalPages={totalPages(count, perPage)}
        totalCount={count}
        makeHref={(p) => `/officer/requests?page=${p}${suffix}`}
      />
    </>
  );
}
