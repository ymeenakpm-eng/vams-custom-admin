import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Toaster from "./_components/Toaster";
import SidebarNav from "./_components/SidebarNav";
import { Suspense } from "react";
import HeaderBar from "./_components/HeaderBar";

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
        <Suspense fallback={null}>
          <HeaderBar />
        </Suspense>
        <div className="flex min-h-screen">
          <aside className="w-56 border-r bg-white sticky top-12 h-[calc(100vh-3rem)] hidden md:block shadow-sm">
            <Suspense fallback={null}>
              <SidebarNav />
            </Suspense>
          </aside>
          <main className="flex-1 px-6 py-6">
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
