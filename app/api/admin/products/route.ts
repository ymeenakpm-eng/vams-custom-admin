import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

function requireEnv() {
  const base = process.env.MEDUSA_BACKEND_URL
  const token = process.env.MEDUSA_ADMIN_TOKEN || process.env.MEDUSA_ADMIN_API_TOKEN
  if (!base || !token) {
    throw new Error("MEDUSA_BACKEND_URL or MEDUSA_ADMIN_TOKEN missing")
  }
  return { base, token }
}

export async function GET(req: NextRequest) {
  try {
    const { base, token } = requireEnv()
    const sp = req.nextUrl.searchParams
    const url = new URL(`${base}/admin/products`)

    // Pass through common query params
    const q = sp.get("q") || ""
    const limit = sp.get("limit") || ""
    const offset = sp.get("offset") || ""
    const order = sp.get("order") || ""
    if (q) url.searchParams.set("q", q)
    if (limit) url.searchParams.set("limit", limit)
    if (offset) url.searchParams.set("offset", offset)
    if (order) url.searchParams.set("order", order)

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, "x-medusa-access-token": token },
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
    const { base, token } = requireEnv()

    let body: any = {}
    const contentType = req.headers.get("content-type") || ""

    if (contentType.includes("application/json")) {
      body = await req.json()
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const fd = await req.formData()
      body = {
        title: String(fd.get("title") || "").trim(),
        status: String(fd.get("status") || "published"),
      }
      const description = String(fd.get("description") || "").trim()
      if (description) body.description = description
      const catIds = fd.getAll("category_ids")?.map(String).filter(Boolean)
      if (catIds && catIds.length) body.category_ids = catIds
      // image_urls can be provided as multiple fields or comma/line separated in a single field
      const rawMulti = fd.getAll("image_urls").map((v) => String(v))
      const rawSingle = String(fd.get("image_url") || "")
      const parts = [
        ...rawMulti,
        ...rawSingle.split(/[\n,]/g).map((s) => s.trim())
      ].filter(Boolean)
      if (parts.length) body.images = parts
    } else {
      // default: try json
      try {
        body = await req.json()
      } catch {
        body = {}
      }
    }

    const res = await fetch(`${base}/admin/products`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-medusa-access-token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    })

    const referer = req.headers.get("referer") || ""
    const text = await res.text()
    if (!res.ok) {
      if (referer.includes("/products")) {
        return NextResponse.redirect(new URL(`/products?error=1`, req.url))
      }
      return NextResponse.json({ error: text }, { status: res.status })
    }

    // If came from a form submit, redirect back to /products with toast flag
    if (referer.includes("/products")) {
      return NextResponse.redirect(new URL("/products?created=1", req.url))
    }

    return new NextResponse(text, { status: 200, headers: { "content-type": "application/json" } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}
