import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

function requireEnv() {
  const baseRaw = process.env.MEDUSA_BACKEND_URL || ""
  const tokenRaw = process.env.MEDUSA_ADMIN_TOKEN || process.env.MEDUSA_ADMIN_API_TOKEN || ""
  const base = baseRaw.trim().replace(/\/+$/, "")
  const token = tokenRaw.trim()
  if (!base || !token) {
    throw new Error("MEDUSA_BACKEND_URL or MEDUSA_ADMIN_TOKEN missing")
  }
  return { base, token }
}

async function loginAndGetCookie(base: string): Promise<string | null> {
  const email = process.env.MEDUSA_ADMIN_EMAIL || process.env.ADMIN_UI_EMAIL
  const password = process.env.MEDUSA_ADMIN_PASSWORD || process.env.ADMIN_UI_PASSWORD
  if (!email || !password) return null
  try {
    const res = await fetch(`${base}/admin/auth`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    })
    if (!res.ok) return null
    const cookie = res.headers.get("set-cookie")
    return cookie || null
  } catch {
    return null
  }
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

    let res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-medusa-access-token": token,
        "x-medusa-api-key": token,
        "x-api-key": token,
      },
      cache: "no-store",
    })
    if (res.status === 401) {
      try {
        const basic = Buffer.from(`${token}:`).toString("base64")
        const resBasic = await fetch(url.toString(), {
          method: "GET",
          headers: { Authorization: `Basic ${basic}` },
          cache: "no-store",
        })
        if (resBasic.status !== 401) {
          res = resBasic
        }
      } catch {}
      const cookie = await loginAndGetCookie(base)
      if (cookie) {
        res = await fetch(url.toString(), {
          method: "GET",
          headers: { cookie },
          cache: "no-store",
        })
      }
    }
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

    let res = await fetch(`${base}/admin/products`, {
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
    if (res.status === 401) {
      try {
        const basic = Buffer.from(`${token}:`).toString("base64")
        const resBasic = await fetch(`${base}/admin/products`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${basic}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          cache: "no-store",
        })
        if (resBasic.status !== 401) {
          res = resBasic
        }
      } catch {}
      const cookie = await loginAndGetCookie(base)
      if (cookie) {
        res = await fetch(`${base}/admin/products`, {
          method: "POST",
          headers: {
            cookie,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          cache: "no-store",
        })
      }
    }

    const referer = req.headers.get("referer") || ""
    const text = await res.text()
    if (!res.ok) {
      if (referer.includes("/products")) {
        let msg = ""
        try { msg = JSON.parse(text)?.message || "" } catch { msg = text || "" }
        const u = new URL(`/products`, req.url)
        u.searchParams.set("error", "1")
        if (msg) u.searchParams.set("msg", String(msg).slice(0, 160))
        return NextResponse.redirect(u)
      }
      return NextResponse.json({ error: text }, { status: res.status })
    }

    // If came from a form submit, redirect back to /products with toast flag
    if (referer.includes("/products")) {
      const u = new URL("/products", req.url)
      u.searchParams.set("created", "1")
      return NextResponse.redirect(u)
    }

    return new NextResponse(text, { status: 200, headers: { "content-type": "application/json" } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}
