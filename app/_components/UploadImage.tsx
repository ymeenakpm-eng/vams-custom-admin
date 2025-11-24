"use client"
import { useState } from "react"

export default function UploadImage({ name = "image_urls", onUploaded }: { name?: string; onUploaded?: (urls: string[]) => void }) {
  const [urls, setUrls] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setBusy(true)
    setErr(null)
    const uploaded: string[] = []
    try {
      for (const file of files) {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        if (!res.ok) {
          const t = await res.text().catch(() => "")
          throw new Error(t || `Upload failed: ${res.status}`)
        }
        const data = await res.json()
        const url = data?.url || data?.secure_url || data?.result?.url
        if (url) uploaded.push(url)
      }
      if (onUploaded) {
        onUploaded(uploaded)
      } else {
        setUrls((prev) => [...prev, ...uploaded])
      }
    } catch (e: any) {
      setErr(e?.message || "Upload failed")
    } finally {
      setBusy(false)
      e.target.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <label className="block">
        <div>Upload images</div>
        <input type="file" accept="image/*" multiple onChange={onFiles} className="block text-sm" />
      </label>
      {err && <div className="text-sm text-red-600">{err}</div>}
      {busy && <div className="text-sm text-gray-600">Uploading…</div>}
      {!onUploaded && urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((u) => (
            <div key={u} className="w-16 h-16 rounded overflow-hidden border">
              <img src={u} alt="uploaded" className="w-full h-full object-cover" />
              <input type="hidden" name={name} value={u} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
