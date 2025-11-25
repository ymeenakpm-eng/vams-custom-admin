"use client"
import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export default function Toaster() {
  const sp = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [msg, setMsg] = useState<string | null>(null)
  const [variant, setVariant] = useState<"success" | "error">("success")

  const flags = useMemo(() => {
    return {
      created: sp.get("created"),
      saved: sp.get("saved"),
      deleted: sp.get("deleted"),
      error: sp.get("error"),
      msg: sp.get("msg"),
    }
  }, [sp])

  useEffect(() => {
    let m: string | null = null
    let v: "success" | "error" = "success"
    if (flags.error) {
      m = flags.msg || "Something went wrong"
      v = "error"
    } else if (flags.created) m = flags.msg || "Created successfully"
    else if (flags.saved) m = flags.msg || "Saved successfully"
    else if (flags.deleted) m = flags.msg || "Deleted successfully"

    if (m) {
      setMsg(m)
      setVariant(v)
      const params = new URLSearchParams(sp.toString())
      params.delete("created"); params.delete("saved"); params.delete("deleted"); params.delete("error"); params.delete("msg")
      router.replace(`${pathname}?${params.toString()}`)
      const t = setTimeout(() => setMsg(null), 2500)
      return () => clearTimeout(t)
    }
  }, [flags, pathname, router, sp])

  if (!msg) return null

  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 50 }}>
      <div
        style={{
          background: variant === "success" ? "#22c55e" : "#ef4444",
          color: "white",
          padding: "10px 14px",
          borderRadius: 8,
          boxShadow: "0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -4px rgba(0,0,0,.1)",
          minWidth: 220,
          fontSize: 14,
        }}
      >
        {msg}
      </div>
    </div>
  )
}
