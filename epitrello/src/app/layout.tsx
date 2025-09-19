import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EpiTrello",
  description: "Epitrello is based on the well-known app Trello, the principal functionnality is based on the organization of projects into boards listing cards, each representing tasks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-neutral-950 text-neutral-100">
        <div className="max-w-6xl mx-auto p-4">{children}</div>
        <Toaster/>
      </body>
    </html>
  );
}

