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

      {products.length === 0 ? (
        <p>No products yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th align="left">Title</th>
              <th align="left">Status</th>
              <th align="left">Created</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p: any) => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>{p.status}</td>
                <td>{new Date(p.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}