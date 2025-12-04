import Link from "next/link"
import ConfirmDeleteButton from "../_components/ConfirmDeleteButton"
import SearchBox from "../_components/SearchBox"
import PageSizeSelect from "../_components/PageSizeSelect"
import CategorySortSelect from "../_components/CategorySortSelect"
import EditCategoryButton from "../_components/EditCategoryButton"
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
    <main className="max-w-5xl">
      <div className="bg-white border rounded-lg p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold">Categories</h1>
          <Link href="/products" className="text-cyan-700 hover:underline text-sm">← Back to products</Link>
        </div>
        <div className="flex items-center gap-2">
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
        {sp?.saved === "1" && (
          <div className="mt-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
            Category created successfully.
          </div>
        )}
        {sp?.error === "1" && (
          <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            Failed to create category. Please try again.
          </div>
        )}
      </div>

      <section style={{ marginTop: 16, marginBottom: 24 }}>
        <form method="POST" action="/api/admin/categories" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input name="name" placeholder="New category name" required className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
          <input name="handle" placeholder="handle (optional)" className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
          <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-2 rounded-md text-sm shadow">New category</button>
        </form>
      </section>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2 border-b">Name</th>
              <th className="text-left px-3 py-2 border-b">Handle</th>
              <th className="text-left px-3 py-2 border-b">ID</th>
              <th className="text-left px-3 py-2 border-b">Internal</th>
              <th className="text-left px-3 py-2 border-b">Active</th>
              <th className="text-left px-3 py-2 border-b">Created</th>
              <th className="text-left px-3 py-2 border-b">Updated</th>
              <th className="text-left px-3 py-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-3 border-t text-center text-gray-500">
                  No categories yet.
                </td>
              </tr>
            ) : (
              categories.map((c: any, i: number) => (
                <tr key={c.id} className={i % 2 ? "bg-gray-50/40" : "bg-white hover:bg-gray-50"}>
                  <td className="px-3 py-2 border-t align-top">{c.name}</td>
                  <td className="px-3 py-2 border-t align-top">{c.handle}</td>
                  <td className="px-3 py-2 border-t align-top font-mono text-[11px] break-all">{c.id}</td>
                  <td className="px-3 py-2 border-t align-top text-xs">{String(c.is_internal ?? false)}</td>
                  <td className="px-3 py-2 border-t align-top text-xs">{String(c.is_active ?? true)}</td>
                  <td className="px-3 py-2 border-t align-top text-xs text-gray-600">{new Date(c.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2 border-t align-top text-xs text-gray-600">{c.updated_at ? new Date(c.updated_at).toLocaleString() : ""}</td>
                  <td className="px-3 py-2 border-t align-top space-x-2">
                    <EditCategoryButton id={c.id} name={c.name} handle={c.handle} />
                    <ConfirmDeleteButton action={`/api/admin/categories/${c.id}`} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 mt-4">
        <a href={`/categories?${new URLSearchParams({ q, offset: String(prevOffset) }).toString()}`} className={hasPrev ? "text-gray-700" : "text-gray-400"}>Prev</a>
        <a href={`/categories?${new URLSearchParams({ q, offset: String(nextOffset) }).toString()}`} className={hasNext ? "text-gray-700" : "text-gray-400"}>Next</a>
        <span className="ml-2 text-gray-600 text-sm">{offset + 1}-{Math.min(offset + limit, count)} of {count}</span>
      </div>
    </main>
  )
}
