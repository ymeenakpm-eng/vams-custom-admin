import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

function requireEnv() {
  const baseRaw = process.env.MEDUSA_BACKEND_URL || ""
  const tokenRaw =
    process.env.MEDUSA_ADMIN_TOKEN || process.env.MEDUSA_ADMIN_API_TOKEN || ""
  const base = baseRaw.trim().replace(/\/+$/, "")
  const token = tokenRaw.trim()
  if (!base || !token) {
    throw new Error("MEDUSA_BACKEND_URL or MEDUSA_ADMIN_TOKEN missing")
  }
  return { base, token }
}

async function loginAndGetCookie(base: string): Promise<string | null> {
  const email = process.env.MEDUSA_ADMIN_EMAIL || process.env.ADMIN_UI_EMAIL
  const password =
    process.env.MEDUSA_ADMIN_PASSWORD || process.env.ADMIN_UI_PASSWORD
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
    const expand = sp.get("expand") || ""

    if (q) url.searchParams.set("q", q)
    if (limit) url.searchParams.set("limit", limit)
    if (offset) url.searchParams.set("offset", offset)
    if (order) url.searchParams.set("order", order)
    if (expand) {
      url.searchParams.set("expand", expand)
    } else {
      // By default, ask Medusa to include product_categories so the
      // Products table can show category names without extra round trips.
      url.searchParams.set("expand", "product_categories")
    }

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
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") || "application/json",
      },
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || String(e) },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { base, token } = requireEnv()

    const sp = req.nextUrl.searchParams
    const id = sp.get("id")?.trim()

    if (!id) {
      return NextResponse.json(
        { error: "Missing product id in query parameter 'id'" },
        { status: 400 },
      )
    }

    const url = `${base}/admin/products/${encodeURIComponent(id)}`

    let res = await fetch(url, {
      method: "DELETE",
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
        const resBasic = await fetch(url, {
          method: "DELETE",
          headers: { Authorization: `Basic ${basic}` },
          cache: "no-store",
        })
        if (resBasic.status !== 401) {
          res = resBasic
        }
      } catch {}

      const cookie = await loginAndGetCookie(base)
      if (cookie) {
        res = await fetch(url, {
          method: "DELETE",
          headers: { cookie },
          cache: "no-store",
        })
      }
    }

    const text = await res.text()
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") || "application/json",
      },
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || String(e) },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { base, token } = requireEnv()

    let body: any = {}
    let selectedCategoryIds: string[] | null = null

    const contentType = req.headers.get("content-type") || ""
    const isForm = contentType.includes("application/x-www-form-urlencoded")
    const fromRetool = req.headers.get("x-from-retool") === "1"

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
      const handle = String(fd.get("handle") || "").trim()
      if (handle) body.handle = handle
      const thumbnail = String(fd.get("thumbnail") || "").trim()
      if (thumbnail) body.thumbnail = thumbnail
      const parseNumber = (v: FormDataEntryValue | null) => {
        if (v == null) return undefined
        const n = Number(String(v))
        return Number.isFinite(n) ? n : undefined
      }
      const weight = parseNumber(fd.get("weight"))
      if (weight != null) (body as any).weight = weight
      const length = parseNumber(fd.get("length"))
      if (length != null) (body as any).length = length
      const height = parseNumber(fd.get("height"))
      if (height != null) (body as any).height = height
      const width = parseNumber(fd.get("width"))
      if (width != null) (body as any).width = width
      const hsCode = String(fd.get("hs_code") || "").trim()
      if (hsCode) (body as any).hs_code = hsCode
      const originCountry = String(fd.get("origin_country") || "").trim()
      if (originCountry) (body as any).origin_country = originCountry
      const catIds = fd.getAll("category_ids")?.map(String).filter(Boolean)
      if (catIds && catIds.length) {
        selectedCategoryIds = catIds
        // Medusa core accepts categories: [{ id }]
        ;(body as any).categories = catIds.map((id) => ({ id }))
      }

      // image_urls can be provided as multiple fields or comma/line separated in a single field
      const rawMulti = fd.getAll("image_urls").map((v) => String(v))
      const rawSingle = String(fd.get("image_url") || "")
      const parts = [
        ...rawMulti,
        ...rawSingle.split(/[\n,]/g).map((s) => s.trim()),
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

    // If no explicit variants/options are provided, create a minimal
    // default option + variant so Medusa will accept the product. This
    // applies both to Retool JSON calls and to the dashboard form.
    const needsDefaultVariant = fromRetool || isForm
    if (needsDefaultVariant) {
      const hasVariants = Array.isArray(body.variants) && body.variants.length > 0
      const hasOptions = Array.isArray(body.options) && body.options.length > 0
      const title = (body.title || "Untitled Product").toString()

      if (!hasVariants) {
        // Ensure at least one option exists with values
        if (!hasOptions) {
          body.options = [
            {
              title: "Title",
              values: [title], // array of strings
            },
          ]
        } else if (
          !body.options[0].values ||
          !Array.isArray(body.options[0].values)
        ) {
          body.options[0].values = [title] // array of strings
        }

        body.variants = [
          {
            title,
            // options must be an object: key = option title, value = chosen value
            options: { [body.options[0].title]: title },
            prices: [
              {
                amount: 0,
                currency_code: "usd",
              },
            ],
          },
        ]
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
      if ((referer.includes("/products") || isForm) && !fromRetool) {
        let msg = ""
        try {
          msg = JSON.parse(text)?.message || ""
        } catch {
          msg = text || ""
        }
        const u = new URL(`/products`, req.url)
        u.searchParams.set("error", "1")
        if (msg) u.searchParams.set("msg", String(msg).slice(0, 160))
        return NextResponse.redirect(u, 303)
      }
      return NextResponse.json({ error: text }, { status: res.status })
    }

    // If categories were selected on create, also call the Medusa
    // product-categories helper to ensure plugin relations are stored.
    if (selectedCategoryIds && selectedCategoryIds.length) {
      try {
        const json: any = JSON.parse(text)
        const created = json?.product || json
        const id = created?.id
        if (id) {
          const catUrl = `${base}/admin/products/${encodeURIComponent(id)}/categories`
          await fetch(catUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ product_category_ids: selectedCategoryIds }),
            cache: "no-store",
          })
        }
      } catch {
        // best-effort only; don't block creation on this
      }
    }

    // If came from a form submit, redirect back to /products with toast flag
    if ((referer.includes("/products") || isForm) && !fromRetool) {
      const u = new URL("/products", req.url)
      u.searchParams.set("created", "1")
      return NextResponse.redirect(u, 303)
    }

    return new NextResponse(text, {
      status: 200,
      headers: { "content-type": "application/json" },
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || String(e) },
      { status: 500 },
    )
  }
}