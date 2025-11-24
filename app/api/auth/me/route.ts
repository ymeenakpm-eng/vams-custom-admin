import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const session = req.cookies.get("admin_session")?.value
  const email = req.cookies.get("admin_email")?.value || ""
  const name = req.cookies.get("admin_name")?.value || (email ? email.split("@")[0] : "Admin")
  return NextResponse.json({ authenticated: session === "ok", email, name })
}
