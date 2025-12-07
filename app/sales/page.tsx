import Link from "next/link"

export const dynamic = "force-dynamic"
export const revalidate = 0

type SalesFilters = {
  from?: string
  to?: string
  status?: string
  payment_status?: string
  region?: string
  sales_channel?: string
}

async function fetchSalesData(filters: SalesFilters) {
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
  let recentOrders = orders.filter(
    (o: any) => o.created_at && new Date(o.created_at).getTime() >= cutoff30,
  )

  const fromStr = filters.from || ""
  const toStr = filters.to || ""
  let fromTs: number | null = null
  let toTs: number | null = null
  if (fromStr) {
    const d = new Date(fromStr)
    if (!isNaN(d.getTime())) fromTs = d.getTime()
  }
  if (toStr) {
    const d = new Date(toStr)
    if (!isNaN(d.getTime())) {
      // include the whole day
      toTs = d.getTime() + 24 * 60 * 60 * 1000
    }
  }

  if (fromTs != null || toTs != null) {
    recentOrders = recentOrders.filter((o: any) => {
      if (!o.created_at) return false
      const t = new Date(o.created_at).getTime()
      if (fromTs != null && t < fromTs) return false
      if (toTs != null && t >= toTs) return false
      return true
    })
  }

  if (filters.status && filters.status !== "all") {
    recentOrders = recentOrders.filter(
      (o: any) => o.status === filters.status || o.fulfillment_status === filters.status,
    )
  }

  if (filters.payment_status && filters.payment_status !== "all") {
    recentOrders = recentOrders.filter(
      (o: any) => o.payment_status === filters.payment_status,
    )
  }

  if (filters.region && filters.region !== "all") {
    recentOrders = recentOrders.filter(
      (o: any) => (o.region?.name || "") === filters.region,
    )
  }

  if (filters.sales_channel && filters.sales_channel !== "all") {
    recentOrders = recentOrders.filter(
      (o: any) => (o.sales_channel?.name || "") === filters.sales_channel,
    )
  }

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

  const regionOptions = Array.from(
    new Set(
      orders
        .map((o: any) => o.region?.name || "")
        .filter((v: string) => v && v.trim().length > 0),
    ),
  )

  const salesChannelOptions = Array.from(
    new Set(
      orders
        .map((o: any) => o.sales_channel?.name || "")
        .filter((v: string) => v && v.trim().length > 0),
    ),
  )

  const byStatus: Record<string, { count: number; revenue: number }> = {}
  const byPayment: Record<string, { count: number; revenue: number }> = {}
  recentOrders.forEach((o: any) => {
    const keyStatus = o.status || o.fulfillment_status || "unknown"
    const keyPay = o.payment_status || "unknown"
    const amt = typeof o.total === "number" ? o.total : 0
    if (!byStatus[keyStatus]) byStatus[keyStatus] = { count: 0, revenue: 0 }
    if (!byPayment[keyPay]) byPayment[keyPay] = { count: 0, revenue: 0 }
    byStatus[keyStatus].count += 1
    byStatus[keyStatus].revenue += amt
    byPayment[keyPay].count += 1
    byPayment[keyPay].revenue += amt
  })

  return {
    series,
    totalRevenue,
    totalOrders,
    avgOrder,
    currency,
    recentOrders,
    regionOptions,
    salesChannelOptions,
    byStatus,
    byPayment,
  }
}

export default async function SalesPage(props: any) {
  const sp: Record<string, string> = (await (props?.searchParams ?? {})) as any

  const filters: SalesFilters = {
    from: (sp.from as string) || "",
    to: (sp.to as string) || "",
    status: (sp.status as string) || "all",
    payment_status: (sp.payment_status as string) || "all",
    region: (sp.region as string) || "all",
    sales_channel: (sp.sales_channel as string) || "all",
  }

  const {
    series,
    totalRevenue,
    totalOrders,
    avgOrder,
    currency,
    recentOrders,
    regionOptions,
    salesChannelOptions,
    byStatus,
    byPayment,
  } = await fetchSalesData(filters)

  const formatMoney = (amount: number) => {
    if (!amount) return "0.00 " + currency.toUpperCase()
    return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`
  }

  const max = Math.max(...series.map((d) => d.total || 0)) || 1

  return (
    <main className="w-full px-4 py-6">
      <div className="bg-white border rounded-lg p-4 shadow-sm mb-4 space-y-3">
        <div>
          <h1 className="text-lg font-semibold">Sales</h1>
          <p className="text-sm text-gray-600 mt-1">
            30-day sales overview powered by Medusa orders.
          </p>
        </div>

        <form className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs" action="/sales" method="GET">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-600">From</label>
            <input
              type="date"
              name="from"
              defaultValue={filters.from}
              className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-600">To</label>
            <input
              type="date"
              name="to"
              defaultValue={filters.to}
              className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-600">Status</label>
            <select
              name="status"
              defaultValue={filters.status}
              className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
              <option value="requires_action">Requires action</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-600">Payment</label>
            <select
              name="payment_status"
              defaultValue={filters.payment_status}
              className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="all">All</option>
              <option value="awaiting">Awaiting</option>
              <option value="captured">Captured</option>
              <option value="refunded">Refunded</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 md:col-span-1">
            <label className="text-[11px] font-medium text-gray-600">Region</label>
            <select
              name="region"
              defaultValue={filters.region}
              className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="all">All regions</option>
              {regionOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 md:col-span-1">
            <label className="text-[11px] font-medium text-gray-600">Sales channel</label>
            <select
              name="sales_channel"
              defaultValue={filters.sales_channel}
              className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="all">All channels</option>
              {salesChannelOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-cyan-500 px-3 py-1.5 text-xs text-white shadow-sm hover:bg-cyan-600"
            >
              Apply
            </button>
          </div>
        </form>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
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
        <div className="bg-white border rounded-lg p-4 shadow-sm text-xs">
          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">
            By status (last 30 days)
          </div>
          {Object.keys(byStatus).length === 0 ? (
            <p className="text-[11px] text-gray-500">No data.</p>
          ) : (
            <ul className="space-y-1 max-h-24 overflow-y-auto pr-1">
              {Object.entries(byStatus).map(([key, v]) => (
                <li key={key} className="flex items-center justify-between">
                  <span className="text-gray-700">
                    {key}
                  </span>
                  <span className="text-gray-900">
                    {v.count} · {formatMoney(v.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm text-xs">
          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1">
            By payment (last 30 days)
          </div>
          {Object.keys(byPayment).length === 0 ? (
            <p className="text-[11px] text-gray-500">No data.</p>
          ) : (
            <ul className="space-y-1 max-h-24 overflow-y-auto pr-1">
              {Object.entries(byPayment).map(([key, v]) => (
                <li key={key} className="flex items-center justify-between">
                  <span className="text-gray-700">
                    {key}
                  </span>
                  <span className="text-gray-900">
                    {v.count} · {formatMoney(v.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
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
                      <Link
                        href={`/orders/${o.id}`}
                        className="font-mono text-[11px] text-cyan-700 hover:underline"
                      >
                        {label}
                      </Link>
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
