import Link from "next/link"

async function getProduct(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/admin/products/${id}`, {
    // When running on server, relative fetch also works, but NEXT_PUBLIC_BASE_URL allows edge/runtime consistency
    cache: "no-store",
  }).catch(() => null as any)
  if (!res || !res.ok) return null
  const data = await res.json().catch(() => null as any)
  return data?.product ?? null
}

async function getCategories() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/admin/categories`, {
    cache: "no-store",
  }).catch(() => null as any)
  if (!res || !res.ok) return [] as any[]
  const data = await res.json().catch(() => ({ product_categories: [] }))
  return data.product_categories ?? []
}

export default async function ProductEditPage({ params }: { params: { id: string } }) {
  const [product, categories] = await Promise.all([
    getProduct(params.id),
    getCategories(),
  ])

  if (!product) {
    return (
      <main style={{ padding: 32 }}>
        <p>Product not found.</p>
        <p><Link href="/products">Back to products</Link></p>
      </main>
    )
  }

  const selectedCats = new Set<string>((product.categories || []).map((c: any) => c.id))

  return (
    <main style={{ padding: 32 }}>
      <h1>Edit Product</h1>
      <p style={{ marginBottom: 16 }}>
        <Link href="/products">← Back to products</Link>
      </p>

      <form method="POST" action={`/api/admin/products/${product.id}`} style={{ display: "grid", gap: 12, maxWidth: 560 }}>
        <label>
          <div>Title</div>
          <input name="title" defaultValue={product.title} required />
        </label>

        <label>
          <div>Status</div>
          <select name="status" defaultValue={product.status}>
            <option value="published">published</option>
            <option value="draft">draft</option>
          </select>
        </label>

        <label>
          <div>Description</div>
          <textarea name="description" defaultValue={product.description || ""} rows={4} />
        </label>

        <label>
          <div>Categories</div>
          <select name="category_ids" multiple defaultValue={[...selectedCats]} size={Math.min(8, Math.max(3, categories.length))}>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.handle})
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit">Save</button>
        </div>
      </form>

      <form method="POST" action={`/api/admin/products/${product.id}`} style={{ marginTop: 8 }}>
        <input type="hidden" name="intent" value="delete" />
        <button type="submit" style={{ background: "#e11d48", color: "white" }}>Delete</button>
      </form>
    </main>
  )
}
