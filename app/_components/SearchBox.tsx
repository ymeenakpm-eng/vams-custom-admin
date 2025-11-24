"use client"
import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export default function SearchBox({ name = "q", placeholder = "Search", debounceMs = 500 }: { name?: string; placeholder?: string; debounceMs?: number }) {
  const sp = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const initial = useMemo(() => sp.get(name) || "", [sp, name])
  const [value, setValue] = useState(initial)

  useEffect(() => {
    setValue(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial])

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(sp.toString())
      if (value) params.set(name, value)
      else params.delete(name)
      params.delete("offset")
      router.replace(`${pathname}?${params.toString()}`)
    }, debounceMs)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
    />
  )
}
