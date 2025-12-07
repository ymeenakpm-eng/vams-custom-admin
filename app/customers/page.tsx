import Link from "next/link"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function fetchCustomers(params: { q?: string; offset?: number; limit?: number }) {
  const base =
    (process.env.NEXT_PUBLIC_BASE_URL && process.env.NEXT_PUBLIC_BASE_URL.trim()) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  const limit = params.limit ?? 20
  const offset = params.offset ?? 0
  const qs = new URLSearchParams()
  if (params.q) qs.set("q", params.q)
  qs.set("limit", String(limit))
  qs.set("offset", String(offset))

  const url = `${base}/api/admin/customers?${qs.toString()}`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    return { customers: [] as any[], count: 0, limit, offset }
  }
  const data = await res.json().catch(() => ({ customers: [], count: 0 }))
  const customers = data.customers ?? []
  const count = typeof data.count === "number" ? data.count : customers.length
  return { customers, count, limit, offset }
}

export default async function CustomersPage(props: any) {
  const sp: Record<string, string> = (await (props?.searchParams ?? {})) as any
  const q = (sp?.q as string) || ""
  const offset = Number(sp?.offset || 0) || 0
  const limit = Number(sp?.limit || 20) || 20

  const { customers, count } = await fetchCustomers({ q, offset, limit })

  const nextOffset = offset + limit
  const prevOffset = Math.max(0, offset - limit)
  const hasNext = nextOffset < count
  const hasPrev = offset > 0

  return (
    <main className="w-full px-4 py-6">
      <div className="bg-white border rounded-lg p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold">Customers</h1>
        </div>
        <div className="flex items-center gap-2">
          <form className="flex items-center gap-2" action="/customers" method="GET">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search customers"
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
            <select
              name="limit"
              defaultValue={String(limit)}
              className="border border-gray-300 rounded-md px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="10">10/page</option>
              <option value="20">20/page</option>
              <option value="50">50/page</option>
            </select>
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-cyan-500 px-3 py-2 text-sm text-white shadow-sm hover:bg-cyan-600"
            >
              Apply
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2 border-b">Name</th>
              <th className="text-left px-3 py-2 border-b">Email</th>
              <th className="text-left px-3 py-2 border-b">Phone</th>
              <th className="text-left px-3 py-2 border-b">Country</th>
              <th className="text-left px-3 py-2 border-b">Created</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-4 text-center text-gray-500 text-sm border-b"
                >
                  No customers yet.
                </td>
              </tr>
            ) : (
              customers.map((c: any) => {
                const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || "—"
                const country = c.shipping_addresses?.[0]?.country_code || c.billing_address?.country_code || ""
                const created = c.created_at ? new Date(c.created_at).toLocaleString() : "—"
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border-b text-sm">
                      <Link
                        href={`/customers/${c.id}`}
                        className="text-cyan-700 hover:underline"
                      >
                        {name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 border-b text-sm">{c.email || "—"}</td>
                    <td className="px-3 py-2 border-b text-sm">{c.phone || "—"}</td>
                    <td className="px-3 py-2 border-b text-sm uppercase">{country}</td>
                    <td className="px-3 py-2 border-b text-sm">{created}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 mt-4 text-sm">
        <a
          href={`/customers?${new URLSearchParams({ q, offset: String(prevOffset), limit: String(limit) }).toString()}`}
          className={hasPrev ? "text-gray-700" : "text-gray-400 pointer-events-none"}
        >
          Prev
        </a>
        <a
          href={`/customers?${new URLSearchParams({ q, offset: String(nextOffset), limit: String(limit) }).toString()}`}
          className={hasNext ? "text-gray-700" : "text-gray-400 pointer-events-none"}
        >
          Next
        </a>
        <span className="ml-2 text-gray-600 text-sm">
          {count === 0 ? "0" : `${offset + 1}-${Math.min(offset + limit, count)}`} of {count}
        </span>
      </div>
    </main>
  )
}
