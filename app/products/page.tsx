async function fetchProducts(params: { q?: string; offset?: number; limit?: number }) {
  const base = process.env.MEDUSA_BACKEND_URL
  const pubKey = process.env.MEDUSA_ADMIN_API_TOKEN

  console.log("Using MEDUSA_BACKEND_URL:", base)
  console.log("Using publishable key prefix:", pubKey?.slice(0, 8))

  if (!base || !pubKey) {
    throw new Error("MEDUSA_BACKEND_URL or MEDUSA_ADMIN_API_TOKEN missing")
  }

  const url = new URL(`${base}/store/products`)
  const limit = params.limit ?? 20
  const offset = params.offset ?? 0
  if (params.q) url.searchParams.set("q", params.q)
  url.searchParams.set("limit", String(limit))
  url.searchParams.set("offset", String(offset))

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-publishable-api-key": pubKey,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to fetch products: ${res.status} ${text}`)
  }

  const data = await res.json()
  return { products: data.products ?? [], count: data.count ?? (data.products?.length || 0), limit, offset, q: params.q || "" }
}

export default async function ProductsPage(props: any) {
  const sp: Record<string, string> = (await (props?.searchParams ?? {})) as any
  const q = (sp?.q as string) || ""
  const offset = Number(sp?.offset || 0) || 0
  const limit = 20
  const { products, count } = await fetchProducts({ q, offset, limit })
  const nextOffset = offset + limit
  const prevOffset = Math.max(0, offset - limit)
  const hasNext = nextOffset < count
  const hasPrev = offset > 0

  return (
    <main>
      <h1 style={{ fontWeight: 600, fontSize: 20 }}>Products</h1>

      <form method="GET" action="/products" style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12, marginBottom: 12 }}>
        <input name="q" placeholder="Search products" defaultValue={q} />
        <button type="submit">Search</button>
      </form>

      <section style={{ marginTop: 16, marginBottom: 24 }}>
        <form method="POST" action="/api/admin/products" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input name="title" placeholder="New product title" required />
          <select name="status" defaultValue="published">
            <option value="published">published</option>
            <option value="draft">draft</option>
          </select>
          <button type="submit">Create</button>
        </form>
      </section>

      {products.length === 0 ? (
        <p>No products yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left" style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>Title</th>
              <th align="left" style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>Status</th>
              <th align="left" style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>Created</th>
              <th align="left" style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p: any) => (
              <tr key={p.id}>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{p.title}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{p.status}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>{new Date(p.created_at).toLocaleString()}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f4f6" }}>
                  <a href={`/products/${p.id}`} style={{ marginRight: 8 }}>Edit</a>
                  <form method="POST" action={`/api/admin/products/${p.id}`} style={{ display: "inline" }}>
                    <input type="hidden" name="intent" value="delete" />
                    <button type="submit" style={{ color: "#e11d48" }}>Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
        <a href={`/products?${new URLSearchParams({ q, offset: String(prevOffset) }).toString()}`} style={{ pointerEvents: hasPrev ? "auto" : "none", opacity: hasPrev ? 1 : 0.5 }}>Prev</a>
        <a href={`/products?${new URLSearchParams({ q, offset: String(nextOffset) }).toString()}`} style={{ pointerEvents: hasNext ? "auto" : "none", opacity: hasNext ? 1 : 0.5 }}>Next</a>
        <span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280" }}>{offset + 1}-{Math.min(offset + limit, count)} of {count}</span>
      </div>
    </main>
  )
}