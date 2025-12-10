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
    // Use Medusa product-categories plugin under /admin/product-categories
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
        } else {
          const email = process.env.MEDUSA_ADMIN_EMAIL || process.env.ADMIN_UI_EMAIL
          const password = process.env.MEDUSA_ADMIN_PASSWORD || process.env.ADMIN_UI_PASSWORD
          if (email && password) {
            // First try cookie-based session (some backends allow this)
            try {
              const login = await fetch(`${base}/admin/auth`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email, password }),
                cache: "no-store",
              })
              const cookie = login.headers.get("set-cookie")
              if (cookie) {
                const resCookie = await fetch(url.toString(), {
                  method: "GET",
                  headers: { cookie },
                  cache: "no-store",
                })
                if (resCookie.status !== 401) {
                  res = resCookie
                } else {
                  // If cookie session is not enough, also try using the
                  // JWT returned by /admin/auth as a Bearer token. This is
                  // required by some setups/plugins for /admin/categories.
                  try {
                    const loginJson: any = await login.clone().json().catch(() => null)
                    const jwt = loginJson?.token
                    if (jwt) {
                      const resJwt = await fetch(url.toString(), {
                        method: "GET",
                        headers: { Authorization: `Bearer ${jwt}` },
                        cache: "no-store",
                      })
                      if (resJwt.status !== 401) {
                        res = resJwt
                      }
                    }
                  } catch {}
                }
              }
            } catch {}
          }
        }
      } catch {}
    }

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
    const isForm = ct.includes("application/x-www-form-urlencoded")
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

    // Use the product-categories plugin endpoint consistently for create
    let res = await fetch(`${base}/admin/product-categories`, {
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
        const resBasic = await fetch(`${base}/admin/product-categories`, {
          method: "POST",
          headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json" },
          body: JSON.stringify(body),
          cache: "no-store",
        })
        if (resBasic.status !== 401) res = resBasic
      } catch {}
    }

    const referer = req.headers.get("referer") || ""
    if (!res.ok) {
      const text = await res.text()
      if (referer.includes("/categories") || isForm) {
        let msg = ""
        try { msg = JSON.parse(text)?.message || "" } catch { msg = text || "" }
        const u = new URL(`/categories`, req.url)
        u.searchParams.set("error", "1")
        if (msg) u.searchParams.set("msg", String(msg).slice(0, 160))
        return NextResponse.redirect(u)
      }
      return NextResponse.json({ error: text }, { status: res.status })
    }

    if (referer.includes("/categories") || isForm) {
      const u = new URL(`/categories`, req.url)
      u.searchParams.set("saved", "1")
      return NextResponse.redirect(u)
    }

    const text = await res.text()
    return new NextResponse(text, { status: 200, headers: { "content-type": "application/json" } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}
