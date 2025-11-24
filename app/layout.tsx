import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
        <header className="border-b">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4">
            <div className="font-semibold">VAMS Admin</div>
            <nav className="flex items-center gap-4 text-sm">
              <a href="/products" className="hover:underline">Products</a>
              <a href="/categories" className="hover:underline">Categories</a>
            </nav>
            <div className="ml-auto">
              <form method="POST" action="/api/auth/logout">
                <button className="text-sm px-3 py-1 border rounded hover:bg-gray-50" type="submit">Logout</button>
              </form>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
