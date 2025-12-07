import SearchBox from "../_components/SearchBox"
import SortSelect from "../_components/SortSelect"
import PageSizeSelect from "../_components/PageSizeSelect"
import CreateProductModal from "../_components/CreateProductModal"
import { Suspense } from "react"
import ProductsTable from "../_components/ProductsTable"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function fetchProducts(params: { q?: string; offset?: number; limit?: number; sort?: string }) {
  const base = (process.env.NEXT_PUBLIC_BASE_URL && process.env.NEXT_PUBLIC_BASE_URL.trim())
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")

  const limit = params.limit ?? 20
  const offset = params.offset ?? 0
  const qs = new URLSearchParams()
  if (params.q) qs.set("q", params.q)
  qs.set("limit", String(limit))
  qs.set("offset", String(offset))
  const sort = params.sort || "created_desc"

  let order = ""
  if (sort === "created_asc") order = "created_at"
  else if (sort === "created_desc") order = "-created_at"
  else if (sort === "title_asc") order = "title"
  else if (sort === "title_desc") order = "-title"
  else if (sort === "updated_asc") order = "updated_at"
  else if (sort === "updated_desc") order = "-updated_at"

  if (order) qs.set("order", order)
  // Always expand categories and sales channels so filters can use them
  qs.set("expand", "categories,sales_channels")

  const resolvedBase = base || "http://localhost:3000"
  const url = `${resolvedBase}/api/admin/products?${qs.toString()}`
  const res = await fetch(url, { cache: "no-store" })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to fetch products: ${res.status} ${text}`)
  }

  const data = await res.json().catch(() => ({ products: [], count: 0 }))
  return { products: data.products ?? [], count: data.count ?? (data.products?.length || 0), limit, offset, q: params.q || "" }
}

export default async function ProductsPage(props: any) {
  const sp: Record<string, string> = (await (props?.searchParams ?? {})) as any
  const q = (sp?.q as string) || ""
  const offset = Number(sp?.offset || 0) || 0
  const limit = Number(sp?.limit || 20) || 20
  const sort = (sp?.sort as string) || "created_desc"

  const status = (sp?.status as string) || ""
  const rawTitleContains = (sp?.title_contains as string) || ""
  const rawHandleContains = (sp?.handle_contains as string) || ""
  const rawExternalContains = (sp?.external_id_contains as string) || ""
  const rawDescriptionContains = (sp?.description_contains as string) || ""

  const hasVariants = (sp?.has_variants as string) || ""

  const createdFrom = (sp?.created_from as string) || ""
  const createdTo = (sp?.created_to as string) || ""
  const updatedFrom = (sp?.updated_from as string) || ""
  const updatedTo = (sp?.updated_to as string) || ""
  const categoryId = (sp?.category_id as string) || ""
  const salesChannelId = (sp?.sales_channel_id as string) || ""

  const titleContains = rawTitleContains.trim().toLowerCase()
  const handleContains = rawHandleContains.trim().toLowerCase()
  const externalContains = rawExternalContains.trim().toLowerCase()
  const descriptionContains = rawDescriptionContains.trim().toLowerCase()

  const advancedFilterActive =
    !!status ||
    !!titleContains ||
    !!handleContains ||
    !!externalContains ||
    !!descriptionContains ||
    !!hasVariants ||
    !!createdFrom ||
    !!createdTo ||
    !!updatedFrom ||
    !!updatedTo ||
    !!categoryId ||
    !!salesChannelId

  let products: any[] = []

  let count = 0
  let errorMessage = ""

  try {
    const effOffset = advancedFilterActive ? 0 : offset
    const effLimit = advancedFilterActive ? 250 : limit
    const result = await fetchProducts({ q, offset: effOffset, limit: effLimit, sort })

    products = result.products
    count = result.count
  } catch (e: any) {
    errorMessage = e?.message || "Failed to load products"
  }

  // Apply filters on the current page of products
  const createdFromTs = createdFrom ? new Date(createdFrom).getTime() : 0
  const createdToTs = createdTo ? new Date(createdTo).getTime() : 0
  const updatedFromTs = updatedFrom ? new Date(updatedFrom).getTime() : 0
  const updatedToTs = updatedTo ? new Date(updatedTo).getTime() : 0

  const filteredProducts = products.filter((p: any) => {
    if (status && p.status !== status) return false

    const title = (p.title || "").toLowerCase()
    const handle = (p.handle || "").toLowerCase()
    const externalId = (p.external_id || "").toLowerCase()
    const description = (p.description || "").toLowerCase()

    if (titleContains && !title.includes(titleContains)) return false
    if (handleContains && !handle.includes(handleContains)) return false
    if (externalContains && !externalId.includes(externalContains)) return false
    if (descriptionContains && !description.includes(descriptionContains)) return false

    if (hasVariants === "yes") {
      if (!Array.isArray(p.variants) || p.variants.length === 0) return false
    } else if (hasVariants === "no") {
      if (Array.isArray(p.variants) && p.variants.length > 0) return false
    }

    if (createdFromTs) {
      const created = p.created_at ? new Date(p.created_at).getTime() : 0
      if (!created || created < createdFromTs) return false
    }
    if (createdToTs) {
      const created = p.created_at ? new Date(p.created_at).getTime() : 0
      if (!created || created > createdToTs) return false
    }

    if (updatedFromTs) {
      const updated = p.updated_at ? new Date(p.updated_at).getTime() : 0
      if (!updated || updated < updatedFromTs) return false
    }
    if (updatedToTs) {
      const updated = p.updated_at ? new Date(p.updated_at).getTime() : 0
      if (!updated || updated > updatedToTs) return false
    }

    if (categoryId) {
      const cats = Array.isArray(p.categories) ? p.categories : []
      if (!cats.some((c: any) => c.id === categoryId)) return false
    }

    if (salesChannelId) {
      const scs = Array.isArray(p.sales_channels) ? p.sales_channels : []
      if (!scs.some((sc: any) => sc.id === salesChannelId)) return false
    }

    return true
  })

  // Build category and sales channel options from current page
  const categoryOptions: { id: string; title: string }[] = Array.from(
    new Map(
      products
        .flatMap((p: any) => (Array.isArray(p.categories) ? p.categories : []))
        .filter((c: any) => c && c.id)
        .map((c: any) => [c.id, { id: c.id, title: c.name || c.title || c.id }]),
    ).values(),
  )

  const salesChannelOptions: { id: string; name: string }[] = Array.from(
    new Map(
      products
        .flatMap((p: any) =>
          Array.isArray(p.sales_channels) ? p.sales_channels : [],
        )
        .filter((sc: any) => sc && sc.id)
        .map((sc: any) => [sc.id, { id: sc.id, name: sc.name || sc.id }]),
    ).values(),
  )

  const effectiveCount = advancedFilterActive ? filteredProducts.length : count

  const nextOffset = offset + limit
  const prevOffset = Math.max(0, offset - limit)
  const hasNext = !advancedFilterActive && nextOffset < effectiveCount
  const hasPrev = !advancedFilterActive && offset > 0

  return (
    <main className="w-full">
      <div className="bg-white border rounded-lg p-4 shadow-sm mb-4 w-full">
        <div className="flex items-center gap-3 mb-3">
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

        {/* Filters (collapsible) */}
        <details
          className="mt-3 rounded-md border bg-slate-50 px-3 py-2 text-xs text-slate-700"
          open={advancedFilterActive}
        >
          <summary className="cursor-pointer select-none text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            Filters
          </summary>

          <form className="mt-3 grid gap-2 md:grid-cols-4 lg:grid-cols-5 text-xs" method="GET">
            {/* Preserve basic params */}
            <input type="hidden" name="q" value={q} />
            <input type="hidden" name="sort" value={sort} />
            <input type="hidden" name="limit" value={String(limit)} />

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-600">Status</label>
              <select
                name="status"
                defaultValue={status}
                className="border border-gray-300 rounded-md px-2 py-1 bg-white"
              >
                <option value="">All</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-600">Title contains</label>
              <input
                name="title_contains"
                defaultValue={titleContains}
                className="border border-gray-300 rounded-md px-2 py-1"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-600">Handle contains</label>
              <input
                name="handle_contains"
                defaultValue={handleContains}
                className="border border-gray-300 rounded-md px-2 py-1"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-600">External ID contains</label>
              <input
                name="external_id_contains"
                defaultValue={externalContains}
                className="border border-gray-300 rounded-md px-2 py-1"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-600">Description contains</label>
              <input
                name="description_contains"
                defaultValue={descriptionContains}
                className="border border-gray-300 rounded-md px-2 py-1"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-600">Has variants</label>
              <select
                name="has_variants"
                defaultValue={hasVariants}
                className="border border-gray-300 rounded-md px-2 py-1 bg-white"
              >
                <option value="">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-600">Created from</label>
              <input
                type="date"
                name="created_from"
                defaultValue={createdFrom}
                className="border border-gray-300 rounded-md px-2 py-1"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-600">Created to</label>
              <input
                type="date"
                name="created_to"
                defaultValue={createdTo}
                className="border border-gray-300 rounded-md px-2 py-1"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-600">Updated from</label>
              <input
                type="date"
                name="updated_from"
                defaultValue={updatedFrom}
                className="border border-gray-300 rounded-md px-2 py-1"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-600">Updated to</label>
              <input
                type="date"
                name="updated_to"
                defaultValue={updatedTo}
                className="border border-gray-300 rounded-md px-2 py-1"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-600">Category</label>
              <select
                name="category_id"
                defaultValue={categoryId}
                className="border border-gray-300 rounded-md px-2 py-1 bg-white"
              >
                <option value="">All</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-600">Sales channel</label>
              <select
                name="sales_channel_id"
                defaultValue={salesChannelId}
                className="border border-gray-300 rounded-md px-2 py-1 bg-white"
              >
                <option value="">All</option>
                {salesChannelOptions.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2 mt-1">
              <button
                type="submit"
                className="inline-flex items-center rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-cyan-600"
              >
                Apply
              </button>
              <a
                href="/products"
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear
              </a>
            </div>
          </form>
        </details>

        {sp?.created === "1" && (
          <div className="mt-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
            Product added successfully.
          </div>
        )}
        {sp?.error === "1" && (
          <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            Failed to create product. Please try again.
            {sp?.msg && (
              <span className="block text-[11px] text-red-600 mt-1 break-words">
                {sp.msg}
              </span>
            )}
          </div>
        )}
        {errorMessage && (
          <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {errorMessage}
          </div>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <p>No products yet.</p>
      ) : (
        <ProductsTable products={filteredProducts} />
      )}

      <div className="flex items-center gap-2 mt-4">
        <a
          href={`/products?${new URLSearchParams({ q, offset: String(prevOffset) }).toString()}`}
          className={hasPrev ? "text-gray-700" : "text-gray-400"}
        >
          Prev
        </a>
        <a
          href={`/products?${new URLSearchParams({ q, offset: String(nextOffset) }).toString()}`}
          className={hasNext ? "text-gray-700" : "text-gray-400"}
        >
          Next
        </a>
        <span className="ml-2 text-gray-600 text-sm">
          {advancedFilterActive
            ? `1-${filteredProducts.length} of ${filteredProducts.length}`
            : `${offset + 1}-${Math.min(offset + limit, effectiveCount)} of ${effectiveCount}`}
        </span>
      </div>
    </main>
  )
}