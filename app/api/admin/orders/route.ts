import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

function env() {
  const base = process.env.MEDUSA_BACKEND_URL
  const token = process.env.MEDUSA_ADMIN_TOKEN
  if (!base || !token) throw new Error("MEDUSA_BACKEND_URL or MEDUSA_ADMIN_TOKEN missing")
  return { base, token }
}

export async function GET(req: NextRequest) {
  try {
    const { base, token } = env()
    const sp = req.nextUrl.searchParams

    const url = new URL(`${base}/admin/orders`)
    const q = sp.get("q") || ""
    const limit = sp.get("limit") || ""
    const offset = sp.get("offset") || ""
    const sort = sp.get("sort") || ""
    let order = sp.get("order") || ""

    if (q) url.searchParams.set("q", q)
    if (limit) url.searchParams.set("limit", limit)
    if (offset) url.searchParams.set("offset", offset)

    if (!order && sort) {
      if (sort === "created_asc") order = "created_at"
      else if (sort === "created_desc") order = "-created_at"
    }
    if (order) url.searchParams.set("order", order)

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })

    const text = await res.text()
    return new NextResponse(text, { status: res.status, headers: { "content-type": res.headers.get("content-type") || "application/json" } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}
