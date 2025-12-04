import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Reuse the same env requirements as products route
function requireEnv() {
  const baseRaw = process.env.MEDUSA_BACKEND_URL || "";
  const tokenRaw =
    process.env.MEDUSA_ADMIN_TOKEN || process.env.MEDUSA_ADMIN_API_TOKEN || "";
  const base = baseRaw.trim().replace(/\/+$/, "");
  const token = tokenRaw.trim();
  if (!base || !token) {
    throw new Error("MEDUSA_BACKEND_URL or MEDUSA_ADMIN_TOKEN missing");
  }
  return { base, token };
}

export async function GET(req: NextRequest) {
  try {
    const { base, token } = requireEnv();
    const sp = req.nextUrl.searchParams;
    const id = sp.get("id")?.trim();

    if (!id) {
      return NextResponse.json(
        { error: "Missing cart id in query parameter 'id'" },
        { status: 400 },
      );
    }

    const url = `${base}/admin/carts/${encodeURIComponent(id)}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-medusa-access-token": token,
        "x-medusa-api-key": token,
        "x-api-key": token,
      },
      cache: "no-store",
    });

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") || "application/json",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || String(e) },
      { status: 500 },
    );
  }
}
