"use client"
import { useEffect, useState } from "react"

export default function CategoryMultiSelect({ name = "category_ids", defaultSelectedIds = [] as string[] }: { name?: string; defaultSelectedIds?: string[] }) {
  const [cats, setCats] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/categories", { cache: "no-store" })
        const data = await res.json().catch(() => ({ product_categories: [] }))
        setCats(data.product_categories || [])
      } catch {}
    }
    load()
  }, [])

  if (!cats.length) return null

  return (
    <label>
      <div>Categories</div>
      <select name={name} multiple defaultValue={defaultSelectedIds} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" size={Math.min(8, Math.max(3, cats.length))}>
        {cats.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </label>
  )
}
