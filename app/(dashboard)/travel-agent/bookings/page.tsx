import { Pagination } from "@/components/shell/Pagination";
import { listAgentBookingsPaged } from "@/lib/travel-agent/bookings";
import { parsePage, totalPages } from "@/lib/pagination";
import { BookingsList } from "./BookingsList";

export default async function AgentBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageParam, q } = await searchParams;
  const { page, perPage, from, to } = parsePage(pageParam);
  const { trips, count } = await listAgentBookingsPaged(from, to, q);
  const suffix = q ? `&q=${encodeURIComponent(q)}` : "";

  return (
    <>
      <BookingsList trips={trips} query={q ?? ""} />
      <Pagination
        page={page}
        totalPages={totalPages(count, perPage)}
        totalCount={count}
        makeHref={(p) => `/travel-agent/bookings?page=${p}${suffix}`}
      />
    </>
  );
}
