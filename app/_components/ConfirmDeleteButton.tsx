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
        className="border border-red-300 text-red-600 px-2 py-1 rounded text-sm hover:bg-red-50"
      >
        {label}
      </button>
    </form>
  )
}
