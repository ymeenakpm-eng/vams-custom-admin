import Link from "next/link"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function getCustomer(id: string) {
  const base =
    (process.env.NEXT_PUBLIC_BASE_URL && process.env.NEXT_PUBLIC_BASE_URL.trim()) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  const res = await fetch(`${base}/api/admin/customers/${encodeURIComponent(id)}`, {
    cache: "no-store",
  }).catch(() => null as any)
  if (!res || !res.ok) return null
  const data = await res.json().catch(() => null as any)
  return data?.customer ?? null
}

async function getCustomerOrders(customerId: string) {
  const base =
    (process.env.NEXT_PUBLIC_BASE_URL && process.env.NEXT_PUBLIC_BASE_URL.trim()) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  const qs = new URLSearchParams()
  qs.set("limit", "50")
  qs.set("customer_id", customerId)
  const res = await fetch(`${base}/api/admin/orders?${qs.toString()}`, {
    cache: "no-store",
  }).catch(() => null as any)
  if (!res || !res.ok) return { orders: [] as any[] }
  const data = await res.json().catch(() => ({ orders: [] }))
  return { orders: data.orders || [] }
}

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const [customer, { orders }] = await Promise.all([
    getCustomer(params.id),
    getCustomerOrders(params.id),
  ])

  if (!customer) {
    return (
      <main className="w-full px-4 py-6">
        <p className="mb-2 text-sm">Customer not found.</p>
        <Link href="/customers" className="text-cyan-700 text-sm hover:underline">
          f Back to customers
        </Link>
      </main>
    )
  }

  const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ") || "f"
  const email = customer.email || "f"
  const phone = customer.phone || "f"
  const country =
    customer.shipping_addresses?.[0]?.country_code ||
    customer.billing_address?.country_code ||
    ""
  const created = customer.created_at
    ? new Date(customer.created_at).toLocaleString()
    : "f"

  const totalOrders = orders.length
  const totalSpend = orders.reduce(
    (sum: number, o: any) => sum + (typeof o.total === "number" ? o.total : 0),
    0,
  )
  const currency = orders[0]?.currency_code || orders[0]?.currency || "usd"
  const formatMoney = (amount: number) =>
    `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`

  return (
    <main className="w-full px-4 py-6 space-y-4">
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-lg font-semibold">{name}</h1>
            <p className="text-xs text-gray-600">Customer since {created}</p>
          </div>
          <Link
            href="/customers"
            className="text-xs text-cyan-700 hover:text-cyan-800"
          >
            f Back to customers
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm mt-2">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Email</div>
            <div className="text-gray-900">{email}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Phone</div>
            <div className="text-gray-900">{phone}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Country</div>
            <div className="text-gray-900 uppercase">{country || "f"}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total orders</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {totalOrders}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total spend</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {totalOrders ? formatMoney(totalSpend) : `0.00 ${currency.toUpperCase()}`}
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-sm font-semibold text-gray-900">Recent orders</h2>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2 border-b">Order</th>
              <th className="text-left px-3 py-2 border-b">Total</th>
              <th className="text-left px-3 py-2 border-b">Status</th>
              <th className="text-left px-3 py-2 border-b">Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-4 text-center text-gray-500 text-xs border-b"
                >
                  No orders for this customer yet.
                </td>
              </tr>
            ) : (
              orders.map((o: any) => {
                const orderLabel = o.display_id ? `#${o.display_id}` : o.id
                const total =
                  typeof o.total === "number" ? formatMoney(o.total) : "f"
                const createdAt = o.created_at
                  ? new Date(o.created_at).toLocaleString()
                  : "f"
                const status = o.status || o.fulfillment_status || "unknown"
                return (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border-b font-mono text-[11px]">
                      <Link
                        href={`/orders/${o.id}`}
                        className="text-cyan-700 hover:underline"
                      >
                        {orderLabel}
                      </Link>
                    </td>
                    <td className="px-3 py-2 border-b text-xs">{total}</td>
                    <td className="px-3 py-2 border-b text-xs">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-800">
                        {status}
                      </span>
                    </td>
                    <td className="px-3 py-2 border-b text-xs">{createdAt}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
