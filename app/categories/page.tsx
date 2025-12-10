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
    const data = await res.json().catch(() => ({ categories: [], product_categories: [], count: 0 }))
    const cats =
      (Array.isArray((data as any).product_categories) && (data as any).product_categories.length
        ? (data as any).product_categories
        : (data as any).categories) || []
    const count = typeof (data as any).count === "number" ? (data as any).count : cats.length
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

  const rawNameContains = (sp?.name_contains as string) || ""
  const rawHandleContains = (sp?.handle_contains as string) || ""
  const rawIdContains = (sp?.id_contains as string) || ""
  const internal = (sp?.is_internal as string) || ""
  const active = (sp?.is_active as string) || ""
  const hasProductsQuick = (sp?.has_products as string) || "" // "yes" | "no" | ""
  const createdFrom = (sp?.created_from as string) || ""
  const createdTo = (sp?.created_to as string) || ""
  const updatedFrom = (sp?.updated_from as string) || ""
  const updatedTo = (sp?.updated_to as string) || ""

  const nameContains = rawNameContains.trim().toLowerCase()
  const handleContains = rawHandleContains.trim().toLowerCase()
  const idContains = rawIdContains.trim().toLowerCase()

  const advancedFilterActive =
    !!nameContains ||
    !!handleContains ||
    !!idContains ||
    !!internal ||
    !!active ||
    !!createdFrom ||
    !!createdTo ||
    !!updatedFrom ||
    !!updatedTo

  const createdFromTs = createdFrom ? new Date(createdFrom).getTime() : 0
  const createdToTs = createdTo ? new Date(createdTo).getTime() : 0
  const updatedFromTs = updatedFrom ? new Date(updatedFrom).getTime() : 0
  const updatedToTs = updatedTo ? new Date(updatedTo).getTime() : 0

  const effOffset = advancedFilterActive ? 0 : offset
  const effLimit = advancedFilterActive ? 250 : limit
  const { categories, count } = await fetchCategories({ q, offset: effOffset, limit: effLimit, sort })

  const withProducts = categories.filter((c: any) => {
    const pc = (c as any).product_count
    if (typeof pc === "number") return pc > 0
    if (Array.isArray((c as any).products)) return (c as any).products.length > 0
    return false
  })
  const withoutProducts = categories.filter((c: any) => {
    const pc = (c as any).product_count
    if (typeof pc === "number") return pc === 0
    if (Array.isArray((c as any).products)) return (c as any).products.length === 0
    return true
  })
  const totalProductsAcrossCategories = withProducts.reduce((sum: number, c: any) => {
    const pc = (c as any).product_count
    if (typeof pc === "number") return sum + pc
    if (Array.isArray((c as any).products)) return sum + (c as any).products.length
    return sum
  }, 0)

  type CategoryShareSlice = { id: string; title: string; count: number }

  const categoryShareDataRaw: CategoryShareSlice[] = withProducts
    .map((c: any): CategoryShareSlice => {
      const pc = (c as any).product_count
      const count =
        typeof pc === "number"
          ? pc
          : Array.isArray((c as any).products)
          ? (c as any).products.length
          : 0
      return {
        id: c.id as string,
        title: (c.name as string) || (c.handle as string) || (c.id as string),
        count,
      }
    })
    .filter((slice: CategoryShareSlice) => slice.count > 0)
    .sort((a: CategoryShareSlice, b: CategoryShareSlice) => b.count - a.count || a.title.localeCompare(b.title))

  const maxSlices = 5
  const topCategoryShare = categoryShareDataRaw.slice(0, maxSlices)
  const usedTotal = topCategoryShare.reduce((sum: number, x: CategoryShareSlice) => sum + x.count, 0)
  const otherCountForShare = Math.max(totalProductsAcrossCategories - usedTotal, 0)

  const shareSlices = [...topCategoryShare]
  if (otherCountForShare > 0) {
    shareSlices.push({ id: "__other__", title: "Other", count: otherCountForShare })
  }

  const donutRadius = 64
  const donutCircumference = 2 * Math.PI * donutRadius

  const sliceColors: { stroke: string; dot: string }[] = [
    { stroke: "stroke-cyan-500", dot: "bg-cyan-500" },
    { stroke: "stroke-emerald-500", dot: "bg-emerald-500" },
    { stroke: "stroke-amber-400", dot: "bg-amber-400" },
    { stroke: "stroke-violet-500", dot: "bg-violet-500" },
    { stroke: "stroke-rose-500", dot: "bg-rose-500" },
    { stroke: "stroke-slate-300", dot: "bg-slate-300" },
  ]

  const filteredCategories = categories.filter((c: any) => {
    const name = (c.name || "").toLowerCase()
    const handle = (c.handle || "").toLowerCase()
    const id = (c.id || "").toLowerCase()

    if (nameContains && !name.includes(nameContains)) return false
    if (handleContains && !handle.includes(handleContains)) return false
    if (idContains && !id.includes(idContains)) return false

    if (internal === "yes" && !c.is_internal) return false
    if (internal === "no" && c.is_internal) return false
    if (active === "yes" && c.is_active === false) return false
    if (active === "no" && c.is_active === true) return false

    if (hasProductsQuick === "yes") {
      const pc = (c as any).product_count
      const has =
        typeof pc === "number"
          ? pc > 0
          : Array.isArray((c as any).products)
          ? (c as any).products.length > 0
          : false
      if (!has) return false
    }
    if (hasProductsQuick === "no") {
      const pc = (c as any).product_count
      const has =
        typeof pc === "number"
          ? pc > 0
          : Array.isArray((c as any).products)
          ? (c as any).products.length > 0
          : false
      if (has) return false
    }

    if (createdFromTs) {
      const created = c.created_at ? new Date(c.created_at).getTime() : 0
      if (!created || created < createdFromTs) return false
    }
    if (createdToTs) {
      const created = c.created_at ? new Date(c.created_at).getTime() : 0
      if (!created || created > createdToTs) return false
    }

    if (updatedFromTs) {
      const updated = c.updated_at ? new Date(c.updated_at).getTime() : 0
      if (!updated || updated < updatedFromTs) return false
    }
    if (updatedToTs) {
      const updated = c.updated_at ? new Date(c.updated_at).getTime() : 0
      if (!updated || updated > updatedToTs) return false
    }

    return true
  })

  const effectiveCount = advancedFilterActive ? filteredCategories.length : count

  const nextOffset = offset + limit
  const prevOffset = Math.max(0, offset - limit)
  const hasNext = !advancedFilterActive && nextOffset < effectiveCount
  const hasPrev = !advancedFilterActive && offset > 0

  return (
    <main className="max-w-5xl">
      <div className="bg-white border rounded-lg p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold">Categories</h1>
          <Link href="/products" className="text-cyan-700 hover:underline text-sm">← Back to products</Link>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Suspense fallback={null}>
            <SearchBox placeholder="Search categories" />
          </Suspense>
          <Suspense fallback={null}>
            <CategorySortSelect />
          </Suspense>
          <Suspense fallback={null}>
            <PageSizeSelect values={[10, 20, 50]} />
          </Suspense>
          <form method="GET" className="ml-auto flex items-center gap-1 text-xs">
            <input type="hidden" name="q" value={q} />
            <input type="hidden" name="sort" value={sort} />
            <input type="hidden" name="limit" value={String(limit)} />
            <label className="text-[11px] text-gray-600">Products</label>
            <select
              name="has_products"
              defaultValue={hasProductsQuick}
              className="border border-gray-300 rounded-md px-2 py-1 bg-white"
            >
              <option value="">All</option>
              <option value="yes">Has products</option>
              <option value="no">Empty</option>
            </select>
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-cyan-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-cyan-600"
            >
              Apply
            </button>
          </form>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4 text-xs">
          <div className="rounded-md border bg-slate-50 px-3 py-2">
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
              Total categories
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-900">
              {count}
            </div>
          </div>
          <div className="rounded-md border bg-slate-50 px-3 py-2">
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
              With products
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-900">
              {withProducts.length}
            </div>
          </div>
          <div className="rounded-md border bg-slate-50 px-3 py-2">
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
              Empty categories
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-900">
              {withoutProducts.length}
            </div>
          </div>
          <div className="rounded-md border bg-slate-50 px-3 py-2">
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
              Total products in categories
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-900">
              {totalProductsAcrossCategories}
            </div>
          </div>
        </div>
        {/* Category share donut chart + legend + bars */}
        {shareSlices.length > 0 && totalProductsAcrossCategories > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-xs">
            {/* Donut (left) */}
            <div className="flex items-center justify-center md:justify-start">
              <svg
                width={288}
                height={288}
                viewBox="0 0 220 220"
                className="text-slate-200"
              >
                <circle
                  cx="110"
                  cy="110"
                  r={donutRadius}
                  className="stroke-slate-200"
                  strokeWidth={14}
                  fill="transparent"
                />
                {shareSlices.reduce(
                  (state: { acc: number; els: any[] }, slice, index) => {
                    const value = slice.count
                    const frac = value / totalProductsAcrossCategories || 0
                    const len = donutCircumference * frac
                    const gap = 2
                    const offset = state.acc
                    const dashArray = `${Math.max(len - gap, 0)} ${donutCircumference}`
                    const dashOffset = donutCircumference - offset
                    const color = sliceColors[index] || sliceColors[sliceColors.length - 1]
                    const el = (
                      <circle
                        key={slice.id}
                        cx="110"
                        cy="110"
                        r={donutRadius}
                        className={`${color.stroke}`}
                        strokeWidth={14}
                        fill="transparent"
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        transform="rotate(-90 110 110)"
                      />
                    )
                    return { acc: offset + len, els: [...state.els, el] }
                  },
                  { acc: 0, els: [] as any[] },
                ).els}
                <circle cx="110" cy="110" r={donutRadius - 20} fill="white" />
                <text
                  x="110"
                  y="104"
                  textAnchor="middle"
                  className="fill-slate-900 text-[12px] font-semibold"
                >
                  {totalProductsAcrossCategories}
                </text>
                <text
                  x="110"
                  y="122"
                  textAnchor="middle"
                  className="fill-slate-500 text-[10px]"
                >
                  products
                </text>
              </svg>
            </div>

            {/* Legend (middle) */}
            <div className="space-y-1 text-[11px] text-slate-700 flex flex-col justify-center">
              <div className="font-semibold uppercase tracking-wide text-slate-600">
                Category share
              </div>

              <div className="mt-1 flex items-start gap-2">
                <ol className="space-y-1">
                  {shareSlices.map((slice, index) => {
                    const pct = (slice.count / totalProductsAcrossCategories) * 100 || 0
                    const color = sliceColors[index] || sliceColors[sliceColors.length - 1]
                    return (
                      <li key={slice.id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`inline-block h-2.5 w-2.5 rounded-full ${color.dot}`}
                          />
                          <span className="truncate" title={slice.title}>
                            {slice.title}
                          </span>
                        </div>
                        <span className="ml-2 whitespace-nowrap text-slate-600">
                          {slice.count} · {pct.toFixed(1)}%
                        </span>
                      </li>
                    )
                  })}
                </ol>
              </div>
            </div>

            {/* Vertical bar chart for products per top categories (right) */}
            <div className="flex flex-col items-center text-[11px] text-slate-700">
              <div className="mt-1 mb-1 text-base font-semibold text-slate-600 text-center">
                Products per top category
              </div>
              <div className="flex items-end gap-6 h-64">
                {shareSlices.map((slice, index) => {
                  const pct = (slice.count / totalProductsAcrossCategories) * 100 || 0
                  const color = sliceColors[index] || sliceColors[sliceColors.length - 1]
                  // Map 0–100% to 80–320px for slightly taller bars
                  const barHeightPx = Math.max((pct / 100) * 320, 80)
                  return (
                    <div
                      key={`${slice.id}-vbar`}
                      className="flex flex-col items-center flex-1 min-w-[40px]"
                    >
                      <div
                        className={`w-6 rounded-t-md ${color.dot}`}
                        style={{ height: `${barHeightPx}px` }}
                        title={`${slice.title}: ${pct.toFixed(1)}%`}
                      />
                      <div className="mt-1 text-[10px] text-slate-600 font-medium">
                        {pct.toFixed(0)}%
                      </div>
                      <div
                        className="mt-0.5 max-w-[64px] truncate text-[9px] text-slate-500 text-center"
                        title={slice.title}
                      >
                        {slice.title}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <details
          className="mt-3 rounded-md border bg-slate-50 px-3 py-2 text-xs text-slate-700"
          open={advancedFilterActive}
        >
          <summary className="cursor-pointer select-none text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            Filters
          </summary>

          <form className="mt-3 grid gap-2 md:grid-cols-4 lg:grid-cols-5 text-xs" method="GET">
            <input type="hidden" name="q" value={q} />
            <input type="hidden" name="sort" value={sort} />
            <input type="hidden" name="limit" value={String(limit)} />

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-600">Name contains</label>
              <input
                name="name_contains"
                defaultValue={nameContains}
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
              <label className="text-[11px] text-gray-600">ID contains</label>
              <input
                name="id_contains"
                defaultValue={idContains}
                className="border border-gray-300 rounded-md px-2 py-1"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-600">Internal</label>
              <select
                name="is_internal"
                defaultValue={internal}
                className="border border-gray-300 rounded-md px-2 py-1 bg-white"
              >
                <option value="">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-gray-600">Active</label>
              <select
                name="is_active"
                defaultValue={active}
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

            <div className="flex items-end gap-2 mt-1">
              <button
                type="submit"
                className="inline-flex items-center rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-cyan-600"
              >
                Apply
              </button>
              <a
                href="/categories"
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear
              </a>
            </div>
          </form>
        </details>

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
        <form
          method="POST"
          action="/api/admin/categories"
          style={{ display: "flex", gap: 8, alignItems: "center" }}
        >
          <input
            name="name"
            placeholder="New category name"
            required
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
          <input
            name="handle"
            placeholder="handle (optional)"
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
          <button
            type="submit"
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-2 rounded-md text-sm shadow"
          >
            Create
          </button>
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
              <th className="text-left px-3 py-2 border-b">Products</th>
              <th className="text-left px-3 py-2 border-b">Created</th>
              <th className="text-left px-3 py-2 border-b">Updated</th>
              <th className="text-left px-3 py-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-3 border-t text-center text-gray-500">
                  No categories yet.
                </td>
              </tr>
            ) : (
              filteredCategories.map((c: any, i: number) => (
                <tr key={c.id} className={i % 2 ? "bg-gray-50/40" : "bg-white hover:bg-gray-50"}>
                  <td className="px-3 py-2 border-t align-top">{c.name}</td>
                  <td className="px-3 py-2 border-t align-top">{c.handle}</td>
                  <td className="px-3 py-2 border-t align-top font-mono text-[11px] break-all max-w-[160px] truncate">
                    {c.id}
                  </td>
                  <td className="px-3 py-2 border-t align-top text-xs">{String(c.is_internal ?? false)}</td>
                  <td className="px-3 py-2 border-t align-top text-xs">{String(c.is_active ?? true)}</td>
                  <td className="px-3 py-2 border-t align-top text-xs text-gray-700">
                    {typeof c.product_count === "number"
                      ? c.product_count
                      : Array.isArray(c.products)
                      ? c.products.length
                      : "-"}
                  </td>
                  <td className="px-3 py-2 border-t align-top text-xs text-gray-600">
                    {new Date(c.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 border-t align-top text-xs text-gray-600">
                    {c.updated_at ? new Date(c.updated_at).toLocaleString() : ""}
                  </td>
                  <td className="px-3 py-2 border-t align-top">
                    <div className="flex items-center gap-2">
                      <EditCategoryButton id={c.id} name={c.name} handle={c.handle} />
                      <ConfirmDeleteButton action={`/api/admin/categories/${c.id}`} />
                      <a
                        href={`/products?${new URLSearchParams({ category_id: c.id }).toString()}`}
                        className="inline-flex items-center whitespace-nowrap rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-cyan-600"
                      >
                        View products
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 mt-4">
        <a
          href={`/categories?${new URLSearchParams({ q, offset: String(prevOffset) }).toString()}`}
          className={hasPrev ? "text-gray-700" : "text-gray-400"}
        >
          Prev
        </a>
        <a
          href={`/categories?${new URLSearchParams({ q, offset: String(nextOffset) }).toString()}`}
          className={hasNext ? "text-gray-700" : "text-gray-400"}
        >
          Next
        </a>
        <span className="ml-2 text-gray-600 text-sm">
          {advancedFilterActive
            ? `1-${filteredCategories.length} of ${filteredCategories.length}`
            : `${offset + 1}-${Math.min(offset + limit, effectiveCount)} of ${effectiveCount}`}
        </span>
      </div>
    </main>
  )
}
