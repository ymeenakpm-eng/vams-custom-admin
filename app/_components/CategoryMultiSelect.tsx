"use client"
import { useEffect, useState } from "react"

interface CategoryMultiSelectProps {
  name?: string
  defaultSelectedIds?: string[]
  initialCategories?: any[]
}

export default function CategoryMultiSelect({
  name = "category_ids",
  defaultSelectedIds = [] as string[],
  initialCategories,
}: CategoryMultiSelectProps) {
  const [cats, setCats] = useState<any[]>(() => initialCategories || [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch("/api/admin/categories", { cache: "no-store" })
        const data = await res.json().catch(() => ({}))

        const pc = (data as any).product_categories
        const nested = pc && (pc as any).product_categories

        const fromProductCategories = Array.isArray(pc)
          ? pc
          : Array.isArray(nested)
          ? nested
          : undefined

        const fromCategories = Array.isArray((data as any).categories)
          ? (data as any).categories
          : undefined

        const fetched = fromProductCategories ?? fromCategories ?? []

        if (cancelled) return

        if (Array.isArray(initialCategories) && initialCategories.length) {
          const byId = new Map<string, any>()
          for (const c of initialCategories) {
            if (c && c.id) byId.set(c.id, c)
          }
          for (const c of fetched) {
            if (c && c.id && !byId.has(c.id)) byId.set(c.id, c)
          }
          setCats(Array.from(byId.values()))
        } else {
          setCats(fetched)
        }
      } catch {
        if (!cancelled && Array.isArray(initialCategories) && initialCategories.length) {
          setCats(initialCategories)
        }
      }
    }

    // Always try to load the full category list so user can change
    // categories beyond the ones currently attached.
    load()

    return () => {
      cancelled = true
    }
  }, [initialCategories])

  const hasCats = cats.length > 0

  return (
    <label>
      <div>Categories</div>
      <select
        name={name}
        multiple
        defaultValue={defaultSelectedIds}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
        size={Math.min(8, Math.max(3, cats.length || 3))}
        disabled={!hasCats}
      >
        {hasCats ? (
          cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))
        ) : (
          <option value="" disabled>
            No categories available yet
          </option>
        )}
      </select>
    </label>
  )
}
