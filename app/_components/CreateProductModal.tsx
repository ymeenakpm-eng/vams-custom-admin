"use client"
import { useState } from "react"

export default function CreateProductModal() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-2 rounded-md text-sm shadow"
      >
        New Product
      </button>
      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "grid", placeItems: "center", zIndex: 50 }} onClick={() => setOpen(false)}>
          <div style={{ background: "white", padding: 16, borderRadius: 8, width: 420 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 600 }}>Create product</div>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form method="POST" action="/api/admin/products" style={{ display: "grid", gap: 10 }} onSubmit={() => setOpen(false)}>
              <label>
                <div>Title</div>
                <input name="title" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
              </label>
              <label>
                <div>Status</div>
                <select name="status" defaultValue="published" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500">
                  <option value="published">published</option>
                  <option value="draft">draft</option>
                </select>
              </label>
              <label>
                <div>Description</div>
                <textarea name="description" rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
              </label>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setOpen(false)} className="border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-2 rounded-md text-sm">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
