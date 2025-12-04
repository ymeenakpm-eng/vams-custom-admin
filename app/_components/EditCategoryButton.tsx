"use client";

interface EditCategoryButtonProps {
  id: string;
  name: string;
  handle?: string | null;
}

export default function EditCategoryButton({ id, name, handle }: EditCategoryButtonProps) {
  const onClick = async () => {
    try {
      const nextName = window.prompt("Category name", name ?? "");
      if (nextName == null) return;
      const nextHandle = window.prompt("Handle (optional)", handle ?? "");
      if (nextHandle == null) return;

      const body = new URLSearchParams();
      body.set("intent", "update");
      body.set("name", nextName.trim());
      body.set("handle", nextHandle.trim());

      await fetch(`/api/admin/categories/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });

      window.location.reload();
    } catch {
      // swallow errors for now; server will show toast via query params if needed
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-cyan-600 mr-1"
    >
      Edit
    </button>
  );
}
