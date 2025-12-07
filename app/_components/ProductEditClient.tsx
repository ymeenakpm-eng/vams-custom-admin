"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import CategoryMultiSelect from "./CategoryMultiSelect"
import UploadImage from "./UploadImage"

interface ProductEditClientProps {
  id: string
}

export default function ProductEditClient({ id }: ProductEditClientProps) {
  const [product, setProduct] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const effectiveId =
    typeof id === "string" && id && id !== "undefined"
      ? id
      : typeof window !== "undefined"
        ? window.location.pathname.split("/").filter(Boolean).pop() || ""
        : ""

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)

        if (!effectiveId) {
          if (!cancelled) {
            setError("Missing product id in URL")
            setProduct(null)
          }
          return
        }

        const pRes = await fetch(
          `/api/admin/products/${encodeURIComponent(effectiveId)}`,
        )

        if (!pRes.ok) {
          const text = await pRes.text().catch(() => "")
          if (cancelled) return
          setError(
            `Failed to load product (${pRes.status}). ${text.slice(0, 200)}`,
          )
          setProduct(null)
          return
        }
        const pJson = await pRes.json().catch(() => null as any)
        const prod = pJson?.product ?? null

        if (!cancelled) setProduct(prod)
      } catch (e: any) {
        if (!cancelled)
          setError(e?.message || "Unexpected error while loading product")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [effectiveId])

  if (loading) {
    return (
      <main style={{ padding: 32 }}>
        <p>Loading product…</p>
      </main>
    )
  }

  if (error) {
    return (
      <main style={{ padding: 32 }}>
        <p style={{ marginBottom: 8 }}>Error loading product.</p>
        <p style={{ fontSize: 12, color: "#6b7280", maxWidth: 600 }}>{error}</p>
        <p style={{ marginTop: 16 }}>
          <Link href="/products">Back to products</Link>
        </p>
      </main>
    )
  }

  if (!product) {
    return (
      <main style={{ padding: 32 }}>
        <p>Product not found.</p>
        <p>
          <Link href="/products">Back to products</Link>
        </p>
      </main>
    )
  }

  const selectedCats = new Set<string>((product.categories || []).map((c: any) => c.id))
  const existingImages: string[] = (product.images || [])
    .map((im: any) => (typeof im === "string" ? im : im?.url))
    .filter(Boolean)

  return (
    <main className="max-w-3xl px-4 py-6">
      <div className="mb-3">
        <Link className="text-cyan-700 hover:underline" href="/products">
          ← Back to products
        </Link>
      </div>
      <h1 className="text-lg font-semibold mb-4">Edit Product</h1>

      <form
        method="POST"
        action={`/api/admin/products/${product.id}`}
        className="grid gap-4 max-w-2xl"
      >
        <label className="block">
          <div>Title</div>
          <input
            name="title"
            defaultValue={product.title}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
        </label>

        <label className="block">
          <div>Status</div>
          <select
            name="status"
            defaultValue={product.status}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          >
            <option value="published">published</option>
            <option value="draft">draft</option>
          </select>
        </label>

        <label className="block">
          <div>Description</div>
          <textarea
            name="description"
            defaultValue={product.description || ""}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
        </label>

        <label className="block">
          <div>Handle</div>
          <input
            name="handle"
            defaultValue={product.handle || ""}
            placeholder="Optional URL handle"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
        </label>

        <label className="block">
          <div>Thumbnail URL (optional)</div>
          <input
            name="thumbnail"
            defaultValue={product.thumbnail || ""}
            placeholder="https://..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
        </label>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <label className="block">
            <div>Weight</div>
            <input
              name="weight"
              type="number"
              step="0.01"
              defaultValue={product.weight ?? ""}
              placeholder="g"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </label>
          <label className="block">
            <div>Length</div>
            <input
              name="length"
              type="number"
              step="0.01"
              defaultValue={product.length ?? ""}
              placeholder="cm"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </label>
          <label className="block">
            <div>Height</div>
            <input
              name="height"
              type="number"
              step="0.01"
              defaultValue={product.height ?? ""}
              placeholder="cm"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </label>
          <label className="block">
            <div>Width</div>
            <input
              name="width"
              type="number"
              step="0.01"
              defaultValue={product.width ?? ""}
              placeholder="cm"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <label className="block">
            <div>HS code</div>
            <input
              name="hs_code"
              defaultValue={product.hs_code || ""}
              placeholder="Optional"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </label>
          <label className="block">
            <div>Origin country</div>
            <input
              name="origin_country"
              defaultValue={product.origin_country || ""}
              placeholder="e.g. US, IN"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </label>
        </div>

        <CategoryMultiSelect defaultSelectedIds={[...selectedCats]} />

        {existingImages.length > 0 && (
          <div>
            <div className="mb-1">Existing images</div>
            <div className="flex flex-wrap gap-2">
              {existingImages.map((u) => (
                <div key={u} className="w-16 h-16 rounded overflow-hidden border">
                  <img src={u} alt="product" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        <label className="block">
          <div>Images (URLs)</div>
          <textarea
            name="image_urls"
            rows={3}
            placeholder={"One per line or comma-separated"}
            defaultValue={existingImages.join("\n")}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
        </label>

        <UploadImage />

        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-2 rounded-md text-sm"
          >
            Save
          </button>
        </div>
      </form>

      <form
        method="POST"
        action={`/api/admin/products/${product.id}`}
        className="mt-4"
      >
        <input type="hidden" name="intent" value="delete" />
        <button
          type="submit"
          className="border border-red-300 text-red-600 px-3 py-2 rounded-md text-sm hover:bg-red-50"
        >
          Delete
        </button>
      </form>
    </main>
  )
}
