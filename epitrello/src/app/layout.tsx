import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import UserBadge from "@/components/user-badge";

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
    <html lang="fr" className="h-full">
      <body className="min-h-screen h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="min-h-screen">
          {children}
        </div>
        <UserBadge/>
        <Toaster />
      </body>
    </html>
  );
}
