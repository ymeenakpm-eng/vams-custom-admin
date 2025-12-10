// app/api/admin/products/[id]/route.ts
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

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

/**
 * Helper: attach a product to all selected product-categories
 * (Medusa product-categories plugin).
 */
type PluginSyncResult = { ok: boolean; status?: number; err?: string }

async function syncProductCategories(
  base: string,
  token: string,
  productId: string,
  categoryIds: string[],
) : Promise<PluginSyncResult> {
  if (!categoryIds.length) return { ok: true }

  try {
    const url = `${base}/admin/custom/products/${encodeURIComponent(
      productId,
    )}/categories`

    // 1) Bearer
    let res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-medusa-access-token": token,
        "x-medusa-api-key": token,
        "x-api-key": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ category_ids: categoryIds }),
      cache: "no-store",
    })

    // 2) Basic fallback
    if (res.status === 401) {
      try {
        const basic = Buffer.from(`${token}:`).toString("base64")
        const resBasic = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Basic ${basic}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ category_ids: categoryIds }),
          cache: "no-store",
        })
        if (resBasic.status !== 401) {
          res = resBasic
        }
      } catch {}
    }

    // 3) Cookie session fallback
    if (res.status === 401) {
      const cookie = await loginAndGetCookie(base)
      if (cookie) {
        res = await fetch(url, {
          method: "POST",
          headers: { cookie, "Content-Type": "application/json" },
          body: JSON.stringify({ category_ids: categoryIds }),
          cache: "no-store",
        })
      }
    }

    let err: string | undefined
    if (!res.ok) {
      try {
        err = await res.text()
      } catch {
        err = undefined
      }
    }

    return { ok: res.ok, status: res.status, err }
  } catch {
    return { ok: false, err: "network_error" }
  }
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { base, token } = requireEnv()
    const { id } = await context.params
    const baseUrl = `${base}/admin/products/${encodeURIComponent(id)}`
    const url = `${baseUrl}?expand=categories`

    let res = await fetch(url, {
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
        const resBasic = await fetch(url, {
          method: "GET",
          headers: { Authorization: `Basic ${basic}` },
          cache: "no-store",
        })
        if (resBasic.status !== 401) {
          res = resBasic
        }
      } catch {}

      if (res.status === 401) {
        const cookie = await loginAndGetCookie(base)
        if (cookie) {
          res = await fetch(url, {
            method: "GET",
            headers: { cookie },
            cache: "no-store",
          })
        }
      }
    }

    // If the expanded request still fails (e.g., backend doesn't accept expand),
    // fall back to the plain product endpoint so the edit page can load.
    if (!res.ok) {
      let resPlain = await fetch(baseUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-medusa-access-token": token,
          "x-medusa-api-key": token,
          "x-api-key": token,
        },
        cache: "no-store",
      })

      if (resPlain.status === 401) {
        try {
          const basic = Buffer.from(`${token}:`).toString("base64")
          const resBasic = await fetch(baseUrl, {
            method: "GET",
            headers: { Authorization: `Basic ${basic}` },
            cache: "no-store",
          })
          if (resBasic.status !== 401) {
            resPlain = resBasic
          }
        } catch {}

        if (resPlain.status === 401) {
          const cookie = await loginAndGetCookie(base)
          if (cookie) {
            resPlain = await fetch(baseUrl, {
              method: "GET",
              headers: { cookie },
              cache: "no-store",
            })
          }
        }
      }

      // Replace response with the plain one if it's more successful
      if (resPlain.ok) {
        res = resPlain
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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { base, token } = requireEnv()
    const { id } = await context.params

    let body: any = {}
    let selectedCategoryIds: string[] | null = null

    const ct = req.headers.get("content-type") || ""

    // ---------- JSON (Retool / API clients) ----------
    if (ct.includes("application/json")) {
      body = await req.json().catch(() => ({}))

      // If caller passed category_ids, remember them but DO NOT forward
      if (body && typeof body === "object" && "category_ids" in body) {
        const ids = body.category_ids
        if (Array.isArray(ids)) {
          selectedCategoryIds = ids.map(String).filter(Boolean)
        }
        delete (body as any).category_ids
        // Also update core shape so either core or plugin persists
        if (selectedCategoryIds && selectedCategoryIds.length) {
          ;(body as any).categories = selectedCategoryIds.map((id) => ({ id }))
        }
      }
    }
    // ---------- HTML form from dashboard ----------
    else if (ct.includes("application/x-www-form-urlencoded")) {
      const fd = await req.formData()
      const intent = String(fd.get("intent") || "")

      // Delete from details page
      if (intent === "delete") {
        const url = `${base}/admin/products/${id}`
        let res = await fetch(url, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
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
          if (res.status === 401) {
            const cookie = await loginAndGetCookie(base)
            if (cookie) {
              res = await fetch(url, {
                method: "DELETE",
                headers: { cookie },
                cache: "no-store",
              })
            }
          }
        }

        const referer = req.headers.get("referer") || ""
        if (referer.includes("/products")) {
          return NextResponse.redirect(new URL(`/products?deleted=1`, req.url))
        }
        const text = await res.text()
        return new NextResponse(text, {
          status: res.status,
          headers: {
            "content-type":
              res.headers.get("content-type") || "application/json",
          },
        })
      }

      // Normal edit form
      body = {
        title: String(fd.get("title") || "").trim(),
        status: String(fd.get("status") || "published"),
        description:
          String(fd.get("description") || "").trim() || undefined,
      }

      const handle = String(fd.get("handle") || "").trim()
      if (handle) (body as any).handle = handle
      const thumbnail = String(fd.get("thumbnail") || "").trim()
      if (thumbnail) (body as any).thumbnail = thumbnail

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

      // Category IDs from the multiselect (support both name variants)
      const rawCat1 = fd.getAll("category_ids")
      const rawCat2 = fd.getAll("category_ids[]")
      const mergedCats = [...rawCat1, ...rawCat2].map(String).filter(Boolean)
      const uniqueCats = Array.from(new Set(mergedCats))
      if (uniqueCats.length) {
        selectedCategoryIds = uniqueCats
        // Also set core shape for compatibility
        ;(body as any).categories = uniqueCats.map((id) => ({ id }))
      } else {
        selectedCategoryIds = []
      }

      // Images (textarea / multiple inputs)
      const rawMulti = fd.getAll("image_urls").map((v) => String(v))
      const rawSingle = String(fd.get("image_url") || "")
      const parts = [
        ...rawMulti,
        ...rawSingle.split(/[\n,]/g).map((s) => s.trim()),
      ].filter(Boolean)
      if (parts.length) {
        ;(body as any).images = parts
        ;(body as any).thumbnail = parts[0]
      }
    }
    // ---------- Fallback ----------
    else {
      body = await req.json().catch(() => ({}))
      if (body && typeof body === "object" && "category_ids" in body) {
        const ids = body.category_ids
        if (Array.isArray(ids)) {
          selectedCategoryIds = ids.map(String).filter(Boolean)
        }
        delete (body as any).category_ids
        if (selectedCategoryIds && selectedCategoryIds.length) {
          ;(body as any).categories = selectedCategoryIds.map((id) => ({ id }))
        }
      }
    }

    // Main product update
    const url = `${base}/admin/products/${id}`
    let res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    })

    if (res.status === 401) {
      try {
        const basic = Buffer.from(`${token}:`).toString("base64")
        const resBasic = await fetch(url, {
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

      if (res.status === 401) {
        const cookie = await loginAndGetCookie(base)
        if (cookie) {
          res = await fetch(url, {
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
    }

    const referer = req.headers.get("referer") || ""

    if (!res.ok) {
      const text = await res.text()
      if (referer.includes("/products/")) {
        let msg = ""
        try {
          msg = JSON.parse(text)?.message || ""
        } catch {
          msg = text || ""
        }
        const u = new URL(`/products/${id}`, req.url)
        u.searchParams.set("error", "1")
        if (msg) u.searchParams.set("msg", String(msg).slice(0, 160))
        return NextResponse.redirect(u, 303)
      }
      return NextResponse.json({ error: text }, { status: res.status })
    }

    // After successful update, sync categories via product-categories plugin
    let pluginRes: PluginSyncResult | null = null
    if (selectedCategoryIds && selectedCategoryIds.length) {
      pluginRes = await syncProductCategories(base, token, id, selectedCategoryIds)
    }

    if (referer.includes("/products/")) {
      const u = new URL(`/products`, req.url)
      u.searchParams.set("saved", "1")
      if (pluginRes !== null) {
        u.searchParams.set("pc", pluginRes.ok ? "1" : "0")
        if (pluginRes.status != null) u.searchParams.set("pc_status", String(pluginRes.status))
        if (pluginRes.err) u.searchParams.set("pc_err", pluginRes.err.slice(0, 80))
      }
      if (Array.isArray(selectedCategoryIds)) {
        u.searchParams.set("cat_count", String(selectedCategoryIds.length))
        if (selectedCategoryIds.length) u.searchParams.set("cat0", selectedCategoryIds[0])
      }
      return NextResponse.redirect(u, 303)
    }

    const text = await res.text()
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

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { base, token } = requireEnv()
    const { id } = await context.params
    const url = `${base}/admin/products/${id}`
    let res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
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

      if (res.status === 401) {
        const cookie = await loginAndGetCookie(base)
        if (cookie) {
          res = await fetch(url, {
            method: "DELETE",
            headers: { cookie },
            cache: "no-store",
          })
        }
      }
    }

    const referer = req.headers.get("referer") || ""
    if (referer.includes("/products")) {
      return NextResponse.redirect(new URL(`/products?deleted=1`, req.url))
    }

    const text = await res.text()
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "content-type":
          res.headers.get("content-type") || "application/json",
      },
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || String(e) },
      { status: 500 },
    )
  }
}
