import SearchBox from "../_components/SearchBox"
import PageSizeSelect from "../_components/PageSizeSelect"
import OrdersSortSelect from "../_components/OrdersSortSelect"
import { Suspense } from "react"
import Link from "next/link"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function fetchOrders(params: { q?: string; offset?: number; limit?: number; sort?: string }) {
  try {
    const base = (process.env.NEXT_PUBLIC_BASE_URL && process.env.NEXT_PUBLIC_BASE_URL.trim())
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
    const qs = new URLSearchParams()
    if (params.q) qs.set("q", params.q)
    if (params.limit != null) qs.set("limit", String(params.limit))
    if (params.offset != null) qs.set("offset", String(params.offset))
    if (params.sort) qs.set("sort", params.sort)
    const resolvedBase = base || "http://localhost:3000"
    const url = `${resolvedBase}/api/admin/orders?${qs.toString()}`
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) {
      return { orders: [] as any[], count: 0, limit: params.limit ?? 20, offset: params.offset ?? 0 }
    }
    const data = await res.json().catch(() => ({ orders: [], count: 0 }))
    const orders = data.orders ?? []
    const count = typeof data.count === "number" ? data.count : orders.length
    const limit = params.limit ?? 20
    const offset = params.offset ?? 0
    return { orders, count, limit, offset }
  } catch {
    return { orders: [] as any[], count: 0, limit: params.limit ?? 20, offset: params.offset ?? 0 }
  }
}

export default async function OrdersPage(props: any) {
  const sp: Record<string, string> = (await (props?.searchParams ?? {})) as any
  const q = (sp?.q as string) || ""
  const offset = Number(sp?.offset || 0) || 0
  const limit = Number(sp?.limit || 20) || 20
  const sort = (sp?.sort as string) || "created_desc"
  const { orders, count } = await fetchOrders({ q, offset, limit, sort })

  const nextOffset = offset + limit
  const prevOffset = Math.max(0, offset - limit)
  const hasNext = nextOffset < count
  const hasPrev = offset > 0

  return (
    <main>
      <h1 style={{ fontWeight: 600, fontSize: 20 }}>Orders</h1>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12, marginBottom: 12 }}>
        <Suspense fallback={null}>
          <SearchBox placeholder="Search orders" />
        </Suspense>
        <Suspense fallback={null}>
          <OrdersSortSelect />
        </Suspense>
        <Suspense fallback={null}>
          <PageSizeSelect values={[10, 20, 50]} />
        </Suspense>
      </div>

      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left" style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>Order</th>
              <th align="left" style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>Email</th>
              <th align="left" style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>Status</th>
              <th align="left" style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>Total</th>
              <th align="left" style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>Created</th>
              <th align="left" style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o: any) => {
              const total = typeof o.total === "number" ? o.total : (o.total ?? 0)
              const currency = o.currency_code || o.currency || ""
              const displayTotal = typeof total === "number" ? (currency ? `${(total / 100).toFixed(2)} ${currency.toUpperCase()}` : total) : "—"
              const orderLabel = o.display_id ? `#${o.display_id}` : (o.id || "—")
              return (
                <tr key={o.id}>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{orderLabel}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{o.email || "—"}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>
                    <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 9999, background: "#E5E7EB", color: "#111827" }}>
                      {o.status || o.fulfillment_status || "unknown"}
                    </span>
                  </td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{displayTotal}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{o.created_at ? new Date(o.created_at).toLocaleString() : "—"}</td>
                  <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>
                    <Link href={`/orders/${o.id}`}>View</Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
        <a href={`/orders?${new URLSearchParams({ q, offset: String(prevOffset) }).toString()}`} style={{ pointerEvents: hasPrev ? "auto" : "none", opacity: hasPrev ? 1 : 0.5 }}>Prev</a>
        <a href={`/orders?${new URLSearchParams({ q, offset: String(nextOffset) }).toString()}`} style={{ pointerEvents: hasNext ? "auto" : "none", opacity: hasNext ? 1 : 0.5 }}>Next</a>
        <span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280" }}>{offset + 1}-{Math.min(offset + limit, count)} of {count}</span>
      </div>
    </main>
  )
}
