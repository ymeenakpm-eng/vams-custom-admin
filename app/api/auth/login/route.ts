import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { email, password } = await req.json()

  if (
    email === process.env.ADMIN_UI_EMAIL &&
    password === process.env.ADMIN_UI_PASSWORD
  ) {
    const res = NextResponse.json({ ok: true })
    res.cookies.set("admin_session", "ok", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8h
    })
    return res
  }

  return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
}