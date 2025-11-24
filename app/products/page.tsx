import SearchBox from "../_components/SearchBox"
import ConfirmDeleteButton from "../_components/ConfirmDeleteButton"
import SortSelect from "../_components/SortSelect"
import PageSizeSelect from "../_components/PageSizeSelect"
import CreateProductModal from "../_components/CreateProductModal"
import { Suspense } from "react"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function fetchProducts(params: { q?: string; offset?: number; limit?: number; sort?: string }) {
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
  const sort = params.sort || "created_desc"
  // Medusa Store API supports order via "order" param in some versions; otherwise we sort client-side minimally.
  // We'll request latest-first by default via updated_at/created_at where available.
  if (sort === "created_asc") url.searchParams.set("order", "created_at")
  else if (sort === "created_desc") url.searchParams.set("order", "-created_at")
  else if (sort === "title_asc") url.searchParams.set("order", "title")
  else if (sort === "title_desc") url.searchParams.set("order", "-title")

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
  const limit = Number(sp?.limit || 20) || 20
  const sort = (sp?.sort as string) || "created_desc"
  const { products, count } = await fetchProducts({ q, offset, limit, sort })

  const nextOffset = offset + limit
  const prevOffset = Math.max(0, offset - limit)
  const hasNext = nextOffset < count
  const hasPrev = offset > 0

  return (
    <main>
      <div className="bg-white border rounded-lg p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold">Products</h1>
          <CreateProductModal />
        </div>
        <div className="flex items-center gap-2">
          <Suspense fallback={null}>
            <SearchBox placeholder="Search products" />
          </Suspense>
          <Suspense fallback={null}>
            <SortSelect />
          </Suspense>
          <Suspense fallback={null}>
            <PageSizeSelect values={[10, 20, 50]} />
          </Suspense>
        </div>
      </div>

      {products.length === 0 ? (
        <p>No products yet.</p>
      ) : (
        <div className="bg-white border rounded-lg shadow-sm overflow-auto max-h-[calc(100vh-18rem)]">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="text-left px-3 py-2 border-b">Title</th>
                <th className="text-left px-3 py-2 border-b">Status</th>
                <th className="text-left px-3 py-2 border-b">Created</th>
                <th className="text-left px-3 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: any, i: number) => (
                <tr key={p.id} className={i % 2 ? "bg-gray-50/40" : "bg-white hover:bg-gray-50"}>
                  <td className="px-3 py-2 border-t">{p.title}</td>
                  <td className="px-3 py-2 border-t">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-700"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 border-t">{new Date(p.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2 border-t">
                    <a href={`/products/${p.id}`} className="text-cyan-700 hover:underline mr-3">Edit</a>
                    <ConfirmDeleteButton action={`/api/admin/products/${p.id}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-2 mt-4">
        <a href={`/products?${new URLSearchParams({ q, offset: String(prevOffset) }).toString()}`} className={hasPrev ? "text-gray-700" : "text-gray-400"}>Prev</a>
        <a href={`/products?${new URLSearchParams({ q, offset: String(nextOffset) }).toString()}`} className={hasNext ? "text-gray-700" : "text-gray-400"}>Next</a>
        <span className="ml-2 text-gray-600 text-sm">{offset + 1}-{Math.min(offset + limit, count)} of {count}</span>
      </div>
    </main>
  )
}