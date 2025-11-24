import Link from "next/link"

async function fetchCategories() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? ""
  const res = await fetch(`${base}/api/admin/categories`, { cache: "no-store" }).catch(() => null as any)
  if (!res || !res.ok) return [] as any[]
  const data = await res.json().catch(() => ({ product_categories: [] }))
  return data.product_categories ?? []
}

export default async function CategoriesPage() {
  const categories = await fetchCategories()

  return (
    <main style={{ padding: 32 }}>
      <h1>Categories</h1>
      <p style={{ marginTop: 8 }}><Link href="/products">← Back to products</Link></p>

      <section style={{ marginTop: 16, marginBottom: 24 }}>
        <form method="POST" action="/api/admin/categories" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input name="name" placeholder="New category name" required />
          <input name="handle" placeholder="handle (optional)" />
          <button type="submit">Create</button>
        </form>
      </section>

      {categories.length === 0 ? (
        <p>No categories yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th align="left">Name</th>
              <th align="left">Handle</th>
              <th align="left">Created</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c: any) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.handle}</td>
                <td>{new Date(c.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
