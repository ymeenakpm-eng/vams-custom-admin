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

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { base, token } = env()
  const { id } = await context.params
  const ct = req.headers.get("content-type") || ""
  const isForm = ct.includes("application/x-www-form-urlencoded")

  if (isForm) {
    const fd = await req.formData()
    const intent = String(fd.get("intent") || "")
    if (intent === "delete") {
      let res = await fetch(`${base}/admin/product-categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      if (res.status === 401) {
        try {
          const basic = Buffer.from(`${token}:`).toString("base64")
          const resBasic = await fetch(`${base}/admin/product-categories/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Basic ${basic}` },
            cache: "no-store",
          })
          if (resBasic.status !== 401) res = resBasic
        } catch {}
      }

      if (!res.ok) {
        const text = await res.text()
        const u = new URL(`/categories`, req.url)
        u.searchParams.set("error", "1")
        if (text) u.searchParams.set("msg", String(text).slice(0, 160))
        return NextResponse.redirect(u, 303)
      }

      const u = new URL(`/categories`, req.url)
      u.searchParams.set("deleted", "1")
      return NextResponse.redirect(u, 303)
    }
  }

  return NextResponse.json({ error: "Unsupported operation" }, { status: 400 })
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { base, token } = env()
  const { id } = await context.params
  let res = await fetch(`${base}/admin/product-categories/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (res.status === 401) {
    try {
      const basic = Buffer.from(`${token}:`).toString("base64")
      const resBasic = await fetch(`${base}/admin/product-categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Basic ${basic}` },
        cache: "no-store",
      })
      if (resBasic.status !== 401) res = resBasic
    } catch {}
  }
  const text = await res.text()
  return new NextResponse(text, { status: res.status, headers: { "content-type": res.headers.get("content-type") || "application/json" } })
}
