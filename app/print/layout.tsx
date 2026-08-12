import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cetak — TravelSys",
};

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-white">{children}</div>;
}
