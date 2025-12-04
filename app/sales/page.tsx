export const dynamic = "force-dynamic"
export const revalidate = 0

async function fetchSalesData() {
  const base =
    (process.env.NEXT_PUBLIC_BASE_URL && process.env.NEXT_PUBLIC_BASE_URL.trim()) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  // Pull more orders so we can build a 30-day series
  const res = await fetch(`${base}/api/admin/orders?limit=200&sort=created_desc`, {
    cache: "no-store",
  }).catch(() => null as any)

  let orders: any[] = []
  if (res && res.ok) {
    const data = await res.json().catch(() => ({}))
    orders = data.orders || []
  }

  const now = Date.now()
  const cutoff30 = now - 30 * 24 * 60 * 60 * 1000
  const recentOrders = orders.filter(
    (o: any) => o.created_at && new Date(o.created_at).getTime() >= cutoff30,
  )

  const perDay: Record<string, number> = {}
  recentOrders.forEach((o: any) => {
    if (!o.created_at || typeof o.total !== "number") return
    const d = new Date(o.created_at)
    const key = d.toISOString().slice(0, 10)
    perDay[key] = (perDay[key] || 0) + o.total
  })

  const series: { label: string; total: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    const label = `${d.getMonth() + 1}/${d.getDate()}`
    series.push({ label, total: perDay[key] || 0 })
  }

  const totalRevenue = recentOrders.reduce(
    (sum: number, o: any) => sum + (typeof o.total === "number" ? o.total : 0),
    0,
  )
  const totalOrders = recentOrders.length
  const avgOrder = totalOrders ? Math.round(totalRevenue / totalOrders) : 0

  const currency =
    recentOrders[0]?.currency_code || recentOrders[0]?.currency || "usd"

  return { series, totalRevenue, totalOrders, avgOrder, currency, recentOrders }
}

export default async function SalesPage() {
  const { series, totalRevenue, totalOrders, avgOrder, currency, recentOrders } =
    await fetchSalesData()

  const formatMoney = (amount: number) => {
    if (!amount) return "0.00 " + currency.toUpperCase()
    return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`
  }

  const max = Math.max(...series.map((d) => d.total || 0)) || 1

  return (
    <main className="w-full px-4 py-6">
      <div className="bg-white border rounded-lg p-4 shadow-sm mb-4">
        <h1 className="text-lg font-semibold">Sales</h1>
        <p className="text-sm text-gray-600 mt-1">
          30-day sales overview powered by Medusa orders.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Revenue (last 30 days)
          </div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">
            {formatMoney(totalRevenue)}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Orders (last 30 days)
          </div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">
            {totalOrders}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Avg order value
          </div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">
            {formatMoney(avgOrder)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">
            Revenue by day (last 30 days)
          </h2>
          {series.every((d) => d.total === 0) ? (
            <p className="text-xs text-gray-500">No sales in the last 30 days.</p>
          ) : (
            <div className="mt-2 space-y-1 max-h-80 overflow-y-auto pr-1">
              {series.map((d) => {
                const widthPct = Math.max(4, Math.round((d.total / max) * 100))
                return (
                  <div
                    key={d.label}
                    className="flex items-center gap-2 text-[11px] text-gray-700"
                  >
                    <div className="w-12 text-gray-600">{d.label}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 bg-cyan-500"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <div className="w-24 text-right">
                      {formatMoney(d.total)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Recent orders</h2>
          {recentOrders.length === 0 ? (
            <p className="text-xs text-gray-500">No recent orders.</p>
          ) : (
            <ul className="space-y-2 text-xs text-gray-700">
              {recentOrders.slice(0, 8).map((o: any) => {
                const label = o.display_id ? `#${o.display_id}` : o.id
                const total =
                  typeof o.total === "number" ? formatMoney(o.total) : "—"
                const created = o.created_at
                  ? new Date(o.created_at).toLocaleDateString()
                  : "—"
                return (
                  <li key={o.id} className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-mono text-[11px] text-cyan-700">
                        {label}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {created}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-800">{total}</div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}
