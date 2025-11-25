import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const url = new URL("/login", process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin)
  const res = NextResponse.redirect(url, 303) // force GET on redirect target
  res.cookies.set("admin_session", "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 })
  res.cookies.set("admin_email", "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 })
  res.cookies.set("admin_name", "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 })
  return res
}

export async function GET(req: Request) {
  return POST(req)
}
