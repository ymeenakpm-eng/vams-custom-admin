import { NextResponse } from "next/server"

function requireEnv() {
  const base = process.env.MEDUSA_BACKEND_URL
  const token = process.env.MEDUSA_ADMIN_TOKEN
  if (!base || !token) {
    throw new Error("MEDUSA_BACKEND_URL or MEDUSA_ADMIN_TOKEN missing")
  }
  return { base, token }
}

export async function POST(req: Request) {
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
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    })

    const text = await res.text()
    if (!res.ok) {
      return NextResponse.json({ error: text }, { status: res.status })
    }

    // If came from a form submit, redirect back to /products
    const referer = req.headers.get("referer") || ""
    if (referer.includes("/products")) {
      return NextResponse.redirect(new URL("/products", req.url))
    }

    return new NextResponse(text, { status: 200, headers: { "content-type": "application/json" } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}
