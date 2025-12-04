import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

function env() {
  const base = process.env.MEDUSA_BACKEND_URL
  const token = process.env.MEDUSA_ADMIN_TOKEN
  if (!base || !token) throw new Error("MEDUSA_BACKEND_URL or MEDUSA_ADMIN_TOKEN missing")
  return { base, token }
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { base, token } = env()
    const { id } = await context.params
    const res = await fetch(`${base}/admin/products/${id}`, {
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

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { base, token } = env()

    let body: any = {}
    const ct = req.headers.get("content-type") || ""
    if (ct.includes("application/json")) {
      body = await req.json()
    } else if (ct.includes("application/x-www-form-urlencoded")) {
      const fd = await req.formData()
      const intent = String(fd.get("intent") || "")
      if (intent === "delete") {
        const { id } = await context.params
        const res = await fetch(`${base}/admin/products/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        })
        const referer = req.headers.get("referer") || ""
        if (referer.includes(`/products/${id}`)) {
          return NextResponse.redirect(new URL(`/products?deleted=1`, req.url))
        }
        const text = await res.text()
        return new NextResponse(text, { status: res.status, headers: { "content-type": res.headers.get("content-type") || "application/json" } })
      }
      body = {
        title: String(fd.get("title") || "").trim(),
        status: String(fd.get("status") || "published"),
        description: String(fd.get("description") || "").trim() || undefined,
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
      const catIds = fd.getAll("category_ids")?.map(String).filter(Boolean)
      if (catIds?.length) {
        ;(body as any).category_ids = catIds
      }
      // images: accept multiple image_urls fields and/or a combined textarea
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
    } else {
      try { body = await req.json() } catch { body = {} }
    }

    const { id } = await context.params
    const res = await fetch(`${base}/admin/products/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    })

    const referer = req.headers.get("referer") || ""
    if (!res.ok) {
      const text = await res.text()
      if (referer.includes("/products/")) {
        return NextResponse.redirect(new URL(`/products/${id}?error=1`, req.url))
      }
      return NextResponse.json({ error: text }, { status: res.status })
    }

    if (referer.includes("/products/")) {
      return NextResponse.redirect(new URL(`/products/${id}?saved=1`, req.url))
    }

    const text = await res.text()
    return new NextResponse(text, { status: 200, headers: { "content-type": "application/json" } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { base, token } = env()
    const { id } = await context.params
    const res = await fetch(`${base}/admin/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })

    const referer = req.headers.get("referer") || ""
    if (referer.includes(`/products/${id}`)) {
      return NextResponse.redirect(new URL(`/products?deleted=1`, req.url))
    }

    const text = await res.text()
    return new NextResponse(text, { status: res.status, headers: { "content-type": res.headers.get("content-type") || "application/json" } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}
