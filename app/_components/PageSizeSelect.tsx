"use client"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export default function PageSizeSelect({ values = [10, 20, 50] }: { values?: number[] }) {
  const sp = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const current = Number(sp.get("limit") || 20)

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(sp.toString())
    params.set("limit", e.target.value)
    params.delete("offset")
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <select defaultValue={current} onChange={onChange}>
      {values.map((n) => (
        <option key={n} value={n}>{n}/page</option>
      ))}
    </select>
  )
}
