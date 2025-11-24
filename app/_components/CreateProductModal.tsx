"use client"
import { useState } from "react"

export default function CreateProductModal() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>New Product</button>
      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "grid", placeItems: "center", zIndex: 50 }} onClick={() => setOpen(false)}>
          <div style={{ background: "white", padding: 16, borderRadius: 8, width: 420 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 600 }}>Create product</div>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>
            <form method="POST" action="/api/admin/products" style={{ display: "grid", gap: 10 }} onSubmit={() => setOpen(false)}>
              <label>
                <div>Title</div>
                <input name="title" required />
              </label>
              <label>
                <div>Status</div>
                <select name="status" defaultValue="published">
                  <option value="published">published</option>
                  <option value="draft">draft</option>
                </select>
              </label>
              <label>
                <div>Description</div>
                <textarea name="description" rows={3} />
              </label>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
