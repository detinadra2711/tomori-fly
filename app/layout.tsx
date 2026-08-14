import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tomori Fly — Flight & Hotel Reservation System",
  description:
    "Sistem pemesanan tiket penerbangan & reservasi hotel internal dengan alur mengetahui Officer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      {/* suppressHydrationWarning: ekstensi browser (mis. Grammarly) menyuntik
          atribut ke <body> sebelum React hydrate, memicu mismatch palsu. */}
      <body className="min-h-full bg-base text-primary" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
