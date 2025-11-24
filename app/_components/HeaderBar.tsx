"use client"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

export default function HeaderBar() {
  const sp = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const initial = useMemo(() => sp.get("q") || "", [sp])
  const [value, setValue] = useState(initial)
  const logoSrc = process.env.NEXT_PUBLIC_ADMIN_LOGO || "/vamsbiome.svg"

  useEffect(() => { setValue(initial) }, [initial])

  // Debounce search to /products
  useEffect(() => {
    const t = setTimeout(() => {
      const target = "/products"
      const params = new URLSearchParams()
      if (value) params.set("q", value)
      if (pathname.startsWith("/products")) {
        const current = new URLSearchParams(sp.toString())
        if (value) current.set("q", value); else current.delete("q")
        current.delete("offset")
        router.replace(`${pathname}?${current.toString()}`)
      } else {
        router.push(`${target}?${params.toString()}`)
      }
    }, 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const links: { href: string; label: string }[] = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/customers", label: "Customers" },
    { href: "/sales", label: "Sales" },
    { href: "/orders", label: "Orders" },
  ]

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-cyan-500 via-sky-500 to-violet-500 text-white shadow">
      <div className="h-12 max-w-5xl mx-auto px-4 flex items-center justify-between gap-3">
        <Link href="/products" className="flex items-center gap-2">
          <img src={logoSrc} alt="VAMS Biome" className="h-7 w-7 rounded shadow" />
          <div className="hidden sm:block">
            <div className="text-sm font-semibold leading-tight">VAMS BIOME</div>
            <div className="text-xs opacity-90 -mt-0.5">Admin</div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/") || (l.href === "/" && pathname === "/")
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-2.5 py-1.5 rounded-md text-sm ${active ? "bg-white/25" : "hover:bg-white/15"}`}
              >
                {l.label}
              </Link>
            )
          })}
        </nav>
        <div className="hidden md:block w-80">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search…"
            className="w-full bg-white/95 text-gray-800 placeholder-gray-500 px-3 py-1.5 rounded-md outline-none focus:ring-2 focus:ring-white/60 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-white/20 hover:bg-white/25 px-3 py-1.5 text-[13px]">Admin</div>
        </div>
      </div>
    </header>
  )
}
