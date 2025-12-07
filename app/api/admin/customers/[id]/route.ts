import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

function env() {
  const base = process.env.MEDUSA_BACKEND_URL
  const token = process.env.MEDUSA_ADMIN_TOKEN || process.env.MEDUSA_ADMIN_API_TOKEN || ""
  if (!base || !token) throw new Error("MEDUSA_BACKEND_URL or MEDUSA_ADMIN_TOKEN missing")
  return { base: base.replace(/\/+$/, ""), token: token.trim() }
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { base, token } = env()
    const { id } = await context.params

    const res = await fetch(`${base}/admin/customers/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })

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
