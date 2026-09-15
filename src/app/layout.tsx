import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { SesiProvider } from "@/components/SesiProvider";
import { getProfileSaya } from "@/lib/supabase/auth";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Absensi Al Manna Bakery",
  description: "Absensi GPS + rekap keterlambatan dan lembur",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const profile = await getProfileSaya();

  return (
    <html lang="id" className={`${nunito.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <SesiProvider profileAwal={profile}>{children}</SesiProvider>
      </body>
    </html>
  );
}
