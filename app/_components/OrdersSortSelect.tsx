"use client"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

const OPTIONS: { value: string; label: string }[] = [
  { value: "created_desc", label: "Newest" },
  { value: "created_asc", label: "Oldest" },
]

export default function OrdersSortSelect() {
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
    <select defaultValue={current} onChange={onChange}>
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
