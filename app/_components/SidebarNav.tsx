"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + "/")
  return (
    <Link
      href={href}
      className={`block px-3 py-2 rounded-md text-sm ${
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
  const logoSrc = process.env.NEXT_PUBLIC_ADMIN_LOGO || "/vams-biome-logo.png"
  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-4 border-b">
        <div className="flex items-center gap-3">
          <img src={logoSrc} alt="VAMS Biome" className="h-8 w-auto object-contain" />
          <div>
            <div className="text-sm font-semibold leading-tight">VAMS BIOME</div>
            <div className="text-xs text-gray-500">Admin</div>
          </div>
        </div>
      </div>
      <nav className="p-2 space-y-1 flex-1">
        <NavLink href="/products">Products</NavLink>
        <NavLink href="/orders">Orders</NavLink>
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
