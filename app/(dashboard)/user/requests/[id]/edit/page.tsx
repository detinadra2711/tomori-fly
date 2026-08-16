"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Panel } from "@/components/cards/Panel";
import { TripEditor } from "@/components/forms/TripEditor";
import { Loader } from "@/components/ui/loader";
import { useTrips } from "@/lib/trip-store";

export default function EditRequestPage() {
  const params = useParams<{ id: string }>();
  const { trips, loading } = useTrips();
  const trip = trips.find((item) => item.id === params.id);

  if (loading) {
    return (
      <Panel className="flex min-h-[40vh] items-center justify-center p-10">
        <Loader label="Memuat pengajuan..." />
      </Panel>
    );
  }

  if (!trip) {
    return (
      <Panel className="p-10 text-center">
        <p className="text-lg">Pengajuan tidak ditemukan.</p>
        <Link href="/user/requests" className="mt-4 inline-flex text-sm text-accent-blue hover:underline">
          Kembali ke daftar
        </Link>
      </Panel>
    );
  }

  if (trip.status !== "DRAFT" && trip.status !== "REJECTED") {
    return (
      <Panel className="p-10 text-center">
        <p className="text-lg">
          Hanya pengajuan berstatus Draft atau Dikembalikan yang dapat diedit.
        </p>
        <Link
          href={`/user/requests/${trip.id}`}
          className="mt-4 inline-flex text-sm text-accent-blue hover:underline"
        >
          Kembali ke detail
        </Link>
      </Panel>
    );
  }

  return <TripEditor trip={trip} />;
}
