import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { Pool } from "pg"

function env() {
  const baseRaw = process.env.MEDUSA_BACKEND_URL || ""
  const tokenRaw = process.env.MEDUSA_ADMIN_TOKEN || process.env.MEDUSA_ADMIN_API_TOKEN || ""
  const base = baseRaw.trim().replace(/\/+$/, "")
  const token = tokenRaw.trim()
  if (!base || !token) throw new Error("MEDUSA_BACKEND_URL or MEDUSA_ADMIN_TOKEN missing")
  return { base, token }
}

let pgPool: Pool | null = null

function getPgPool(): Pool {
  if (pgPool) return pgPool
  const conn = process.env.PG_CONN_STRING || ""
  if (!conn.trim()) {
    throw new Error("PG_CONN_STRING missing in environment")
  }
  pgPool = new Pool({ connectionString: conn })
  return pgPool
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams

    const q = (sp.get("q") || "").trim()
    const limit = Number(sp.get("limit") || 20) || 20
    const offset = Number(sp.get("offset") || 0) || 0
    const sort = sp.get("sort") || "created_desc"

    const pg = getPgPool()

    const where: string[] = ["pc.deleted_at is null"]
    const params: any[] = []

    if (q) {
      params.push(`%${q.toLowerCase()}%`)
      where.push("(lower(pc.name) like $" + params.length + " or lower(pc.handle) like $" + params.length + ")")
    }

    let orderBy = "pc.created_at desc"
    if (sort === "created_asc") orderBy = "pc.created_at asc"
    else if (sort === "created_desc") orderBy = "pc.created_at desc"
    else if (sort === "name_asc") orderBy = "pc.name asc"
    else if (sort === "name_desc") orderBy = "pc.name desc"

    // Count total categories first
    const countSql = `select count(*) as count
                        from product_category pc
                       where ${where.join(" and ")}`
    const countRes = await pg.query(countSql, params)
    const total = Number(countRes.rows[0]?.count || 0)

    // Fetch paginated list with product counts
    params.push(limit)
    params.push(offset)
    const limitIndex = params.length - 1
    const offsetIndex = params.length

    const listSql = `select pc.*, coalesce(count(p.id), 0)::int as product_count
                       from product_category pc
                       left join product_category_product pcp
                         on pc.id = pcp.product_category_id
                       left join product p
                         on p.id = pcp.product_id
                        and p.deleted_at is null
                      where ${where.join(" and ")}
                      group by pc.id
                      order by ${orderBy}
                      limit $${limitIndex}
                     offset $${offsetIndex}`

    const listRes = await pg.query(listSql, params)

    return NextResponse.json(
      {
        categories: listRes.rows,
        count: total,
        limit,
        offset,
      },
      { status: 200 },
    )
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { base, token } = env()

    let body: any = {}
    const ct = req.headers.get("content-type") || ""
    const isForm = ct.includes("application/x-www-form-urlencoded")
    if (ct.includes("application/json")) {
      body = await req.json()
    } else if (ct.includes("application/x-www-form-urlencoded")) {
      const fd = await req.formData()
      body = {
        name: String(fd.get("name") || "").trim(),
        handle: String(fd.get("handle") || "").trim() || undefined,
      }
    } else {
      try { body = await req.json() } catch { body = {} }
    }

    // Use the product-categories plugin endpoint consistently for create
    let res = await fetch(`${base}/admin/product-categories`, {
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
        const resBasic = await fetch(`${base}/admin/product-categories`, {
          method: "POST",
          headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json" },
          body: JSON.stringify(body),
          cache: "no-store",
        })
        if (resBasic.status !== 401) res = resBasic
      } catch {}
    }

    const referer = req.headers.get("referer") || ""
    if (!res.ok) {
      const text = await res.text()
      if (referer.includes("/categories") || isForm) {
        let msg = ""
        try { msg = JSON.parse(text)?.message || "" } catch { msg = text || "" }
        const u = new URL(`/categories`, req.url)
        u.searchParams.set("error", "1")
        if (msg) u.searchParams.set("msg", String(msg).slice(0, 160))
        return NextResponse.redirect(u)
      }
      return NextResponse.json({ error: text }, { status: res.status })
    }

    if (referer.includes("/categories") || isForm) {
      const u = new URL(`/categories`, req.url)
      u.searchParams.set("saved", "1")
      return NextResponse.redirect(u)
    }

    const text = await res.text()
    return new NextResponse(text, { status: 200, headers: { "content-type": "application/json" } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
  }
}
