"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + "/")
  return (
    <Link
      href={href}
      className={`block px-4 py-2.5 rounded-md text-[15px] font-semibold ${
        active
          ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 font-medium"
          : "text-gray-700 border border-transparent hover:border-gray-200 hover:bg-gray-50"
      }`}
    >
      {children}
    </Link>
  )
}

export default function SidebarNav() {
  return (
    <div className="h-full flex flex-col">
      <nav className="px-4 py-3 space-y-2 flex-1">
        <NavLink href="/products">Products</NavLink>
        <NavLink href="/orders">Sales</NavLink>
        <NavLink href="/orders">Orders</NavLink>
        <NavLink href="/categories">Categories</NavLink>
      </nav>
      <div className="px-4 py-3 border-t">
        <form method="POST" action="/api/auth/logout">
          <button className="w-full text-left px-3 py-2.5 rounded text-sm hover:bg-gray-50" type="submit">Logout</button>
        </form>
      </div>
    </div>
  )
}
