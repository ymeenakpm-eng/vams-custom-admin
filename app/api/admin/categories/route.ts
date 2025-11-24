import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

function env() {
  const base = process.env.MEDUSA_BACKEND_URL
  const token = process.env.MEDUSA_ADMIN_TOKEN
  if (!base || !token) throw new Error("MEDUSA_BACKEND_URL or MEDUSA_ADMIN_TOKEN missing")
  return { base, token }
}

export async function GET(_req: NextRequest) {
  try {
    const { base, token } = env()
    const res = await fetch(`${base}/admin/product-categories`, {
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
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
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
