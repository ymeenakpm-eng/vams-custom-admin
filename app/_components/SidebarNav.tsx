"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + "/")
  return (
    <Link
      href={href}
      className={`block px-3 py-2 rounded text-sm ${active ? "bg-gray-100 font-medium" : "hover:bg-gray-50"}`}
    >
      {children}
    </Link>
  )
}

export default function SidebarNav() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-4 border-b">
        <div className="text-base font-semibold">VAMS Admin</div>
        <div className="text-xs text-gray-500">Manage your catalog</div>
      </div>
      <nav className="p-2 space-y-1 flex-1">
        <NavLink href="/products">Products</NavLink>
        <NavLink href="/categories">Categories</NavLink>
      </nav>
      <div className="p-3 border-t">
        <form method="POST" action="/api/auth/logout">
          <button className="w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-50" type="submit">Logout</button>
        </form>
      </div>
    </div>
  )
}
