"use client"

export default function ConfirmDeleteButton({ action, label = "Delete" }: { action: string; label?: string }) {
  return (
    <form method="POST" action={action} style={{ display: "inline" }}>
      <input type="hidden" name="intent" value="delete" />
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm("Delete this item?")) {
            e.preventDefault()
          }
        }}
        className="inline-flex items-center rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-cyan-600"
      >
        {label}
      </button>
    </form>
  )
}
