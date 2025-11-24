async function fetchProducts() {
  const base = process.env.MEDUSA_BACKEND_URL
  const pubKey = process.env.MEDUSA_ADMIN_API_TOKEN

  console.log("Using MEDUSA_BACKEND_URL:", base)
  console.log("Using publishable key prefix:", pubKey?.slice(0, 8))

  if (!base || !pubKey) {
    throw new Error("MEDUSA_BACKEND_URL or MEDUSA_ADMIN_API_TOKEN missing")
  }

  const url = new URL(`${base}/store/products`)
  url.searchParams.set("limit", "100")
  url.searchParams.set("offset", "0")

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
  return data.products ?? []
}

export default async function ProductsPage() {
  const products = await fetchProducts()

  return (
    <main style={{ padding: 32 }}>
      <h1>Products</h1>

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
        <table>
          <thead>
            <tr>
              <th align="left">Title</th>
              <th align="left">Status</th>
              <th align="left">Created</th>
              <th align="left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p: any) => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>{p.status}</td>
                <td>{new Date(p.created_at).toLocaleString()}</td>
                <td>
                  <a href={`/products/${p.id}`}>Edit</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}