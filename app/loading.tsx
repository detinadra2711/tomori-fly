import { Loader } from "@/components/ui/loader";

export default function Loading() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <Loader label="Menyiapkan Tomori Fly..." />
    </main>
  );
}
