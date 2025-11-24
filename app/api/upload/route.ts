import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import crypto from "crypto"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const cloud = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET
    if (!cloud || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Missing Cloudinary env. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET" },
        { status: 400 }
      )
    }

    const fd = await req.formData()
    const file = fd.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 })
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const folder = (fd.get("folder") as string) || "vams-admin"

    // Build signature string sorted by key name
    const params: Record<string, string | number> = { folder, timestamp }
    const toSign = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&")
    const signature = crypto.createHash("sha1").update(toSign + apiSecret).digest("hex")

    const out = new FormData()
    out.append("file", new Blob([await file.arrayBuffer()], { type: file.type || "application/octet-stream" }), (file as any).name || "upload")
    out.append("api_key", apiKey)
    out.append("timestamp", String(timestamp))
    out.append("signature", signature)
    out.append("folder", folder)

    const cloudUrl = `https://api.cloudinary.com/v1_1/${cloud}/image/upload`
    const res = await fetch(cloudUrl, { method: "POST", body: out })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json({ error: data?.error?.message || "Upload failed" }, { status: res.status })
    }

    return NextResponse.json({ url: data.secure_url || data.url, public_id: data.public_id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}
