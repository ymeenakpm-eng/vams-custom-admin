import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

function env() {
  const baseRaw = process.env.MEDUSA_BACKEND_URL || ""
  const tokenRaw = process.env.MEDUSA_ADMIN_TOKEN || process.env.MEDUSA_ADMIN_API_TOKEN || ""
  const base = baseRaw.trim().replace(/\/+$/, "")
  const token = tokenRaw.trim()
  if (!base || !token) throw new Error("MEDUSA_BACKEND_URL or MEDUSA_ADMIN_TOKEN missing")
  return { base, token }
}

export async function GET(req: NextRequest) {
  try {
    const { base, token } = env()
    const sp = req.nextUrl.searchParams
    const url = new URL(`${base}/admin/product-categories`)

    const q = sp.get("q") || ""
    const limit = sp.get("limit") || ""
    const offset = sp.get("offset") || ""
    const sort = sp.get("sort") || ""
    let order = sp.get("order") || ""

    if (q) url.searchParams.set("q", q)
    if (limit) url.searchParams.set("limit", limit)
    if (offset) url.searchParams.set("offset", offset)

    if (!order && sort) {
      // Map UI sort values to Medusa order param
      if (sort === "created_asc") order = "created_at"
      else if (sort === "created_desc") order = "-created_at"
      else if (sort === "name_asc") order = "name"
      else if (sort === "name_desc") order = "-name"
    }
    if (order) url.searchParams.set("order", order)

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-medusa-access-token": token,
        "x-medusa-api-key": token,
        "x-api-key": token,
      },
      cache: "no-store",
    })
    const text = await res.text()
    return new NextResponse(text, { status: res.status, headers: { "content-type": res.headers.get("content-type") || "application/json" } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { base, token } = env()

    let body: any = {}
    const ct = req.headers.get("content-type") || ""
    if (ct.includes("application/json")) {
      body = await req.json()
    } else if (ct.includes("application/x-www-form-urlencoded")) {
      const fd = await req.formData()
      body = {
        name: String(fd.get("name") || "").trim(),
        handle: String(fd.get("handle") || "").trim() || undefined,
      }
    } else {
      try { body = await req.json() } catch { body = {} }
    }

    const res = await fetch(`${base}/admin/product-categories`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-medusa-access-token": token,
        "x-medusa-api-key": token,
        "x-api-key": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    })

    const referer = req.headers.get("referer") || ""
    if (!res.ok) {
      const text = await res.text()
      if (referer.includes("/categories")) {
        return NextResponse.redirect(new URL(`/categories?error=1`, req.url))
      }
      return NextResponse.json({ error: text }, { status: res.status })
    }

    if (referer.includes("/categories")) {
      return NextResponse.redirect(new URL(`/categories?saved=1`, req.url))
    }

    const text = await res.text()
    return new NextResponse(text, { status: 200, headers: { "content-type": "application/json" } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}
