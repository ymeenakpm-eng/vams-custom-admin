import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Toaster from "./_components/Toaster";
import SidebarNav from "./_components/SidebarNav";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VAMS Admin",
  description: "Custom admin UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex min-h-screen">
          <aside className="w-56 border-r bg-white sticky top-0 h-screen hidden md:block">
            <Suspense fallback={null}>
              <SidebarNav />
            </Suspense>
          </aside>
          <main className="flex-1 px-4 py-6 max-w-5xl">
            {children}
          </main>
        </div>
        <Suspense fallback={null}>
          <Toaster />
        </Suspense>
      </body>
    </html>
  );
}
