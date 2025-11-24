import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PROTECTED_PATHS = ["/", "/products", "/categories", "/orders", "/profile"]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    const session = req.cookies.get("admin_session")?.value
    if (session !== "ok") {
      const url = new URL("/login", req.url)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/profile", "/products/:path*", "/products", "/categories/:path*", "/categories", "/orders/:path*", "/orders"],
}