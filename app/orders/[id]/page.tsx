import Link from "next/link"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function getOrder(id: string) {
  const base =
    (process.env.NEXT_PUBLIC_BASE_URL && process.env.NEXT_PUBLIC_BASE_URL.trim()) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  const res = await fetch(`${base}/api/admin/orders/${encodeURIComponent(id)}`, {
    cache: "no-store",
  }).catch(() => null as any)
  if (!res || !res.ok) return null
  const data = await res.json().catch(() => null as any)
  return data?.order ?? null
}

function formatMoney(amount: number | null | undefined, currency: string | null | undefined) {
  if (typeof amount !== "number") return "—"
  if (!currency) return amount
  return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = await getOrder(params.id)

  if (!order) {
    return (
      <main className="w-full px-4 py-6">
        <p className="mb-2 text-sm">Order not found.</p>
        <Link href="/orders" className="text-cyan-700 text-sm hover:underline">
          ← Back to orders
        </Link>
      </main>
    )
  }

  const currency = order.currency_code || order.currency || "usd"
  const orderLabel = order.display_id ? `#${order.display_id}` : order.id
  const created = order.created_at ? new Date(order.created_at).toLocaleString() : "—"
  const updated = order.updated_at ? new Date(order.updated_at).toLocaleString() : "—"
  const customerName = order.customer
    ? [order.customer.first_name, order.customer.last_name].filter(Boolean).join(" ")
    : "—"

  const shippingAddress = order.shipping_address || {}
  const billingAddress = order.billing_address || {}

  const lineItems: any[] = Array.isArray(order.items) ? order.items : []
  const itemCount = lineItems.reduce(
    (sum: number, it: any) => sum + (typeof it.quantity === "number" ? it.quantity : 0),
    0,
  )

  const subtotal = formatMoney(order.subtotal, currency)
  const taxTotal = formatMoney(order.tax_total, currency)
  const shippingTotal = formatMoney(order.shipping_total, currency)
  const discountTotal = formatMoney(order.discount_total, currency)
  const giftCardTotal = formatMoney(order.gift_card_total, currency)
  const refundedTotal = formatMoney(order.refunded_total, currency)
  const total = formatMoney(order.total, currency)

  return (
    <main className="w-full px-4 py-6 space-y-4">
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">Order {orderLabel}</h1>
            <p className="text-xs text-gray-600">Created {created}</p>
            <p className="text-xs text-gray-600">Updated {updated}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Link
              href="/orders"
              className="text-xs text-cyan-700 hover:text-cyan-800"
            >
              ← Back to orders
            </Link>
            <div className="flex flex-wrap gap-1 mt-1 justify-end">
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-800">
                {order.status || order.fulfillment_status || "unknown"}
              </span>
              {order.payment_status && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-800">
                  payment: {order.payment_status}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4 shadow-sm space-y-3 lg:col-span-2">
          <h2 className="text-sm font-semibold mb-1">Line items</h2>
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 border-b">Item</th>
                <th className="text-left px-3 py-2 border-b">Variant</th>
                <th className="text-left px-3 py-2 border-b">Qty</th>
                <th className="text-left px-3 py-2 border-b">Unit price</th>
                <th className="text-left px-3 py-2 border-b">Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-4 text-center text-gray-500 text-xs border-b"
                  >
                    No items on this order.
                  </td>
                </tr>
              ) : (
                lineItems.map((it: any) => {
                  const qty = typeof it.quantity === "number" ? it.quantity : 0
                  const unit = formatMoney(it.unit_price, currency)
                  const lineTotal = formatMoney(it.total, currency)
                  return (
                    <tr key={it.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 border-b text-xs">
                        <div className="font-medium text-gray-900">{it.title || "—"}</div>
                        <div className="text-[11px] text-gray-500">{it.description || it.variant?.sku}</div>
                      </td>
                      <td className="px-3 py-2 border-b text-xs">
                        <div className="text-[11px] text-gray-700">{it.variant?.title || "—"}</div>
                        {it.variant?.sku && (
                          <div className="text-[10px] text-gray-500">SKU: {it.variant.sku}</div>
                        )}
                      </td>
                      <td className="px-3 py-2 border-b text-xs">{qty}</td>
                      <td className="px-3 py-2 border-b text-xs">{unit}</td>
                      <td className="px-3 py-2 border-b text-xs">{lineTotal}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="bg-white border rounded-lg p-4 shadow-sm text-xs space-y-2">
            <h2 className="text-sm font-semibold mb-1">Customer</h2>
            <div>
              <div className="text-gray-900">{customerName}</div>
              <div className="text-gray-600">{order.email || "—"}</div>
            </div>
            <div className="mt-2">
              <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                Shipping address
              </div>
              <div className="text-xs text-gray-700">
                {shippingAddress?.address_1 || shippingAddress?.address_2 ? (
                  <>
                    <div>{shippingAddress.address_1}</div>
                    {shippingAddress.address_2 && <div>{shippingAddress.address_2}</div>}
                    <div>
                      {[shippingAddress.postal_code, shippingAddress.city]
                        .filter(Boolean)
                        .join(" ")}
                    </div>
                    <div className="uppercase">{shippingAddress.country_code}</div>
                  </>
                ) : (
                  <div>—</div>
                )}
              </div>
            </div>
            <div className="mt-2">
              <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                Billing address
              </div>
              <div className="text-xs text-gray-700">
                {billingAddress?.address_1 || billingAddress?.address_2 ? (
                  <>
                    <div>{billingAddress.address_1}</div>
                    {billingAddress.address_2 && <div>{billingAddress.address_2}</div>}
                    <div>
                      {[billingAddress.postal_code, billingAddress.city]
                        .filter(Boolean)
                        .join(" ")}
                    </div>
                    <div className="uppercase">{billingAddress.country_code}</div>
                  </>
                ) : (
                  <div>—</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4 shadow-sm text-xs space-y-1">
            <h2 className="text-sm font-semibold mb-1">Totals</h2>
            <div className="flex justify-between">
              <span className="text-gray-600">Items ({itemCount})</span>
              <span className="text-gray-900">{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span className="text-gray-900">{taxTotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className="text-gray-900">{shippingTotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Discounts</span>
              <span className="text-gray-900">{discountTotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Gift cards</span>
              <span className="text-gray-900">{giftCardTotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Refunded</span>
              <span className="text-gray-900">{refundedTotal}</span>
            </div>
            <div className="border-t mt-2 pt-2 flex justify-between">
              <span className="text-gray-900 font-semibold">Total</span>
              <span className="text-gray-900 font-semibold">{total}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
