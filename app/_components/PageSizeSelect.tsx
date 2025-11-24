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
    <select
      defaultValue={current}
      onChange={onChange}
      className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
    >
      {values.map((n) => (
        <option key={n} value={n}>{n}/page</option>
      ))}
    </select>
  )
}
