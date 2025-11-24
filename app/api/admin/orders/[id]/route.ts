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
    const res = await fetch(`${base}/admin/orders/${id}`, {
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
    const { id } = await context.params
    const referer = req.headers.get("referer") || ""

    // Placeholder: acknowledge action and redirect with toast
    const ct = req.headers.get("content-type") || ""
    if (ct.includes("application/x-www-form-urlencoded")) {
      await req.formData() // consume
    } else {
      try { await req.json() } catch {}
    }

    if (referer.includes(`/orders/${id}`)) {
      return NextResponse.redirect(new URL(`/orders/${id}?saved=1`, req.url))
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}
