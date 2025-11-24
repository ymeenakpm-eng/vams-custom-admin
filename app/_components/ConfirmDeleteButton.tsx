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
        style={{ color: "#e11d48" }}
      >
        {label}
      </button>
    </form>
  )
}
