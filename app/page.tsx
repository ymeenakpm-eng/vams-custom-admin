export const dynamic = "force-dynamic"

async function getDashboardData() {
  const base =
    (process.env.NEXT_PUBLIC_BASE_URL && process.env.NEXT_PUBLIC_BASE_URL.trim()) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  const [productsRes, ordersRes, customersRes] = await Promise.all([
    fetch(`${base}/api/admin/products?limit=1`, { cache: "no-store" }).catch(() => null as any),
    fetch(`${base}/api/admin/orders?limit=10&sort=created_desc`, { cache: "no-store" }).catch(() => null as any),
    fetch(`${base}/api/admin/customers?limit=1`, { cache: "no-store" }).catch(() => null as any),
  ])

  let productCount = 0
  let orders: any[] = []
  let orderCount = 0
  let recentTotal = 0
  let customerCount = 0
  let salesSeries: { label: string; total: number }[] = []

  if (productsRes && productsRes.ok) {
    const data = await productsRes.json().catch(() => ({}))
    productCount = typeof data.count === "number" ? data.count : (data.products?.length || 0)
  }

  if (ordersRes && ordersRes.ok) {
    const data = await ordersRes.json().catch(() => ({}))
    orders = data.orders || []
    orderCount = typeof data.count === "number" ? data.count : orders.length
    const now = Date.now()
    const cutoff30 = now - 30 * 24 * 60 * 60 * 1000
    recentTotal = orders
      .filter((o: any) => o.created_at && new Date(o.created_at).getTime() >= cutoff30)
      .reduce((sum: number, o: any) => sum + (typeof o.total === "number" ? o.total : 0), 0)

    // Build simple last-7-days sales series
    const cutoff7 = now - 7 * 24 * 60 * 60 * 1000
    const perDay: Record<string, number> = {}
    orders
      .filter((o: any) => o.created_at && new Date(o.created_at).getTime() >= cutoff7)
      .forEach((o: any) => {
        if (!o.created_at || typeof o.total !== "number") return
        const d = new Date(o.created_at)
        const key = d.toISOString().slice(0, 10) // YYYY-MM-DD
        perDay[key] = (perDay[key] || 0) + o.total
      })
    const days: { label: string; total: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().slice(0, 10)
      const label = `${d.getMonth() + 1}/${d.getDate()}`
      days.push({ label, total: perDay[key] || 0 })
    }
    salesSeries = days
  }

  if (customersRes && customersRes.ok) {
    const data = await customersRes.json().catch(() => ({}))
    customerCount = typeof data.count === "number" ? data.count : (data.customers?.length || 0)
  }

  return { productCount, orders, orderCount, recentTotal, customerCount, salesSeries }
}

export default async function Home() {
  const { productCount, orders, orderCount, recentTotal, customerCount, salesSeries } = await getDashboardData()

  const formatMoney = (amount: number, currency = "usd") => {
    if (!amount) return "0.00 " + currency.toUpperCase()
    return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`
  }

  const recentCurrency = orders[0]?.currency_code || orders[0]?.currency || "usd"

  return (
    <main className="w-full px-4 py-6">
      <div className="bg-white border rounded-lg p-4 shadow-sm mb-4">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">High-level view of products, sales, and orders.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Products</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">{productCount}</div>
          <div className="mt-1 text-xs text-gray-500">Total products in catalog</div>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Orders</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">{orderCount}</div>
          <div className="mt-1 text-xs text-gray-500">All-time orders</div>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last 30 days sales</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">{formatMoney(recentTotal, recentCurrency)}</div>
          <div className="mt-1 text-xs text-gray-500">Based on recent orders loaded here</div>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Customers</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">{customerCount}</div>
          <div className="mt-1 text-xs text-gray-500">Total customers</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white border rounded-lg shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="text-sm font-semibold text-gray-900">Recent orders</h2>
            <a href="/orders" className="text-xs text-cyan-700 hover:text-cyan-800">View all</a>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 border-b">Order</th>
                  <th className="text-left px-3 py-2 border-b">Customer</th>
                  <th className="text-left px-3 py-2 border-b">Email</th>
                  <th className="text-left px-3 py-2 border-b">Total</th>
                  <th className="text-left px-3 py-2 border-b">Status</th>
                  <th className="text-left px-3 py-2 border-b">Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-gray-500 text-xs border-b">No orders yet.</td>
                  </tr>
                ) : (
                  orders.map((o: any) => {
                    const orderLabel = o.display_id ? `#${o.display_id}` : (o.id || "—")
                    const customerName = o.customer ? [o.customer.first_name, o.customer.last_name].filter(Boolean).join(" ") : ""
                    const currency = o.currency_code || o.currency || ""
                    const total = typeof o.total === "number" ? formatMoney(o.total, currency || "usd") : "—"
                    const created = o.created_at ? new Date(o.created_at).toLocaleString() : "—"
                    const status = o.status || o.fulfillment_status || "unknown"
                    return (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 border-b font-mono text-xs"><a href={`/orders/${o.id}`} className="text-cyan-700 hover:underline">{orderLabel}</a></td>
                        <td className="px-3 py-2 border-b text-xs">{customerName || "—"}</td>
                        <td className="px-3 py-2 border-b text-xs">{o.email || "—"}</td>
                        <td className="px-3 py-2 border-b text-xs">{total}</td>
                        <td className="px-3 py-2 border-b text-xs">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-800">
                            {status}
                          </span>
                        </td>
                        <td className="px-3 py-2 border-b text-xs">{created}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: sales chart + catalog overview / actions */}
        <div className="space-y-4">
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Last 7 days sales</h2>
            {salesSeries.length === 0 ? (
              <p className="text-xs text-gray-500">No sales in the last 7 days.</p>
            ) : (
              <div className="space-y-1 mt-1">
                {salesSeries.map((d) => {
                  const max = Math.max(...salesSeries.map((x) => x.total || 0)) || 1
                  const widthPct = Math.max(4, Math.round((d.total / max) * 100))
                  return (
                    <div key={d.label} className="flex items-center gap-2 text-[11px]">
                      <div className="w-10 text-gray-600">{d.label}</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div className="h-3 bg-cyan-500" style={{ width: `${widthPct}%` }} />
                      </div>
                      <div className="w-20 text-right text-gray-700">{formatMoney(d.total, recentCurrency)}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Catalog overview / actions */}
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Catalog overview</h2>
            <p className="text-xs text-gray-600 mb-3">Manage your products and categories.</p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Products</span>
                <span className="font-semibold text-gray-900">{productCount}</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <a href="/products" className="inline-flex items-center rounded-md bg-cyan-500 px-3 py-1.5 text-white shadow-sm hover:bg-cyan-600">View products</a>
              <a href="/categories" className="inline-flex items-center rounded-md bg-cyan-500 px-3 py-1.5 text-white shadow-sm hover:bg-cyan-600">View categories</a>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Quick actions</h2>
            <div className="flex flex-col gap-2 text-xs">
              <a href="/products" className="inline-flex items-center rounded-md bg-cyan-500 px-3 py-1.5 text-white shadow-sm hover:bg-cyan-600">New product</a>
              <a href="/categories" className="inline-flex items-center rounded-md bg-cyan-500 px-3 py-1.5 text-white shadow-sm hover:bg-cyan-600">New category</a>
              <a href="/orders" className="inline-flex items-center rounded-md bg-cyan-500 px-3 py-1.5 text-white shadow-sm hover:bg-cyan-600">Sales &amp; exports</a>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
