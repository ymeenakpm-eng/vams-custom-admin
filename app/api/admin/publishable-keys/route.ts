import { NextResponse } from "next/server";

function requireEnv() {
  const baseRaw = process.env.MEDUSA_BACKEND_URL || "";
  const tokenRaw =
    process.env.MEDUSA_ADMIN_TOKEN || process.env.MEDUSA_ADMIN_API_TOKEN || "";
  const base = baseRaw.trim().replace(/\/+$/, "");
  const token = tokenRaw.trim();

  // Temporary debug log to verify env vars are loaded
  console.log("PUBLISHABLE KEYS ENV CHECK", {
    base,
    MEDUSA_ADMIN_TOKEN: process.env.MEDUSA_ADMIN_TOKEN,
    MEDUSA_ADMIN_API_TOKEN: process.env.MEDUSA_ADMIN_API_TOKEN,
  });

  if (!base || !token) {
    throw new Error("MEDUSA_BACKEND_URL or MEDUSA_ADMIN_TOKEN missing");
  }
  return { base, token };
}

async function loginAndGetCookie(base: string): Promise<string | null> {
  const email = process.env.MEDUSA_ADMIN_EMAIL || process.env.ADMIN_UI_EMAIL;
  const password =
    process.env.MEDUSA_ADMIN_PASSWORD || process.env.ADMIN_UI_PASSWORD;
  if (!email || !password) return null;
  try {
    const res = await fetch(`${base}/admin/auth`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const cookie = res.headers.get("set-cookie");
    return cookie || null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { base, token } = requireEnv();
    const body = (await req.json().catch(() => ({}))) as { title?: string };
    const title = body.title || "VamsBiome Storefront";

    let res = await fetch(`${base}/admin/publishable-api-keys`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-medusa-access-token": token,
        "x-medusa-api-key": token,
        "x-api-key": token,
      },
      body: JSON.stringify({ title }),
      cache: "no-store",
    });

    if (res.status === 401) {
      // Fallback: try basic auth then cookie login (same pattern as products proxy)
      try {
        const basic = Buffer.from(`${token}:`).toString("base64");
        const resBasic = await fetch(`${base}/admin/publishable-api-keys`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${basic}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({ title }),
          cache: "no-store",
        });
        if (resBasic.status !== 401) {
          res = resBasic;
        }
      } catch {}

      if (res.status === 401) {
        const cookie = await loginAndGetCookie(base);
        if (cookie) {
          res = await fetch(`${base}/admin/publishable-api-keys`, {
            method: "POST",
            headers: {
              cookie,
              "content-type": "application/json",
            },
            body: JSON.stringify({ title }),
            cache: "no-store",
          });
        }
      }
    }

    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    return NextResponse.json(
      {
        status: res.status,
        ok: res.ok,
        data: json,
      },
      { status: res.ok ? 200 : res.status },
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || String(e) },
      { status: 500 },
    );
  }
}
