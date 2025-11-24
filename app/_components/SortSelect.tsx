"use client"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

const OPTIONS: { value: string; label: string }[] = [
  { value: "created_desc", label: "Newest" },
  { value: "created_asc", label: "Oldest" },
  { value: "title_asc", label: "Title A→Z" },
  { value: "title_desc", label: "Title Z→A" },
]

export default function SortSelect() {
  const sp = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const current = sp.get("sort") || "created_desc"

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(sp.toString())
    params.set("sort", e.target.value)
    params.delete("offset")
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <select
      defaultValue={current}
      onChange={onChange}
      className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
