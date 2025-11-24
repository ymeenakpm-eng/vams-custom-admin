import Link from "next/link"
import SearchBox from "../_components/SearchBox"
import PageSizeSelect from "../_components/PageSizeSelect"
import CategorySortSelect from "../_components/CategorySortSelect"
import { Suspense } from "react"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function fetchCategories(params: { q?: string; offset?: number; limit?: number; sort?: string }) {
  try {
    const base = (process.env.NEXT_PUBLIC_BASE_URL && process.env.NEXT_PUBLIC_BASE_URL.trim())
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
    const qs = new URLSearchParams()
    if (params.q) qs.set("q", params.q)
    if (params.limit != null) qs.set("limit", String(params.limit))
    if (params.offset != null) qs.set("offset", String(params.offset))
    if (params.sort) qs.set("sort", params.sort)
    const resolvedBase = base || "http://localhost:3000"
    const url = `${resolvedBase}/api/admin/categories?${qs.toString()}`
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) {
      return { categories: [] as any[], count: 0, limit: params.limit ?? 20, offset: params.offset ?? 0 }
    }
    const data = await res.json().catch(() => ({ product_categories: [], count: 0 }))
    const cats = data.product_categories ?? []
    const count = typeof data.count === "number" ? data.count : cats.length
    const limit = params.limit ?? 20
    const offset = params.offset ?? 0
    return { categories: cats, count, limit, offset }
  } catch {
    return { categories: [] as any[], count: 0, limit: params.limit ?? 20, offset: params.offset ?? 0 }
  }
}

export default async function CategoriesPage(props: any) {
  const sp: Record<string, string> = (await (props?.searchParams ?? {})) as any
  const q = (sp?.q as string) || ""
  const offset = Number(sp?.offset || 0) || 0
  const limit = Number(sp?.limit || 20) || 20
  const sort = (sp?.sort as string) || "created_desc"
  const { categories, count } = await fetchCategories({ q, offset, limit, sort })

  const nextOffset = offset + limit
  const prevOffset = Math.max(0, offset - limit)
  const hasNext = nextOffset < count
  const hasPrev = offset > 0

  return (
    <main style={{ padding: 32 }}>
      <h1>Categories</h1>
      <p style={{ marginTop: 8 }}><Link href="/products">← Back to products</Link></p>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12, marginBottom: 12 }}>
        <Suspense fallback={null}>
          <SearchBox placeholder="Search categories" />
        </Suspense>
        <Suspense fallback={null}>
          <CategorySortSelect />
        </Suspense>
        <Suspense fallback={null}>
          <PageSizeSelect values={[10, 20, 50]} />
        </Suspense>
      </div>

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

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
        <a href={`/categories?${new URLSearchParams({ q, offset: String(prevOffset) }).toString()}`} style={{ pointerEvents: hasPrev ? "auto" : "none", opacity: hasPrev ? 1 : 0.5 }}>Prev</a>
        <a href={`/categories?${new URLSearchParams({ q, offset: String(nextOffset) }).toString()}`} style={{ pointerEvents: hasNext ? "auto" : "none", opacity: hasNext ? 1 : 0.5 }}>Next</a>
        <span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280" }}>{offset + 1}-{Math.min(offset + limit, count)} of {count}</span>
      </div>
    </main>
  )
}
