"use client";

import React, { useState } from "react";

interface ProductsTableProps {
  products: any[];
}

interface ColumnDef {
  key: string;
  label: string;
  render: (p: any) => React.ReactNode;
  className?: string;
}

const columns: ColumnDef[] = [
  { key: "id", label: "ID", render: (p) => p.id, className: "font-mono text-[11px] break-all max-w-xs" },
  { key: "title", label: "Title", render: (p) => p.title },
  { key: "subtitle", label: "Subtitle", render: (p) => p.subtitle },
  {
    key: "status",
    label: "Status",
    render: (p) => (
      <span
        className={`text-[11px] px-2 py-0.5 rounded-full ${
          p.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-700"
        }`}
      >
        {p.status}
      </span>
    ),
  },
  { key: "external_id", label: "External ID", render: (p) => p.external_id, className: "font-mono text-[11px] break-all max-w-xs" },
  {
    key: "description",
    label: "Description",
    render: (p) => (
      <span className="max-w-xs truncate" title={p.description}>
        {p.description}
      </span>
    ),
  },
  { key: "handle", label: "Handle", render: (p) => p.handle, className: "font-mono text-[11px] break-all max-w-xs" },
  { key: "is_giftcard", label: "Giftcard", render: (p) => String(p.is_giftcard) },
  { key: "discountable", label: "Discountable", render: (p) => String(p.discountable) },
  { key: "thumbnail", label: "Thumbnail", render: (p) => p.thumbnail, className: "font-mono text-[11px] break-all max-w-xs" },
  { key: "collection_id", label: "Collection ID", render: (p) => p.collection_id, className: "font-mono text-[11px] break-all max-w-xs" },
  { key: "type_id", label: "Type ID", render: (p) => p.type_id, className: "font-mono text-[11px] break-all max-w-xs" },
  { key: "weight", label: "Weight", render: (p) => p.weight },
  { key: "length", label: "Length", render: (p) => p.length },
  { key: "height", label: "Height", render: (p) => p.height },
  { key: "width", label: "Width", render: (p) => p.width },
  { key: "hs_code", label: "HS code", render: (p) => p.hs_code },
  { key: "origin_country", label: "Origin country", render: (p) => p.origin_country },
  { key: "mid_code", label: "Mid code", render: (p) => p.mid_code },
  { key: "material", label: "Material", render: (p) => p.material },
  {
    key: "created_at",
    label: "Created at",
    render: (p) => (p.created_at ? new Date(p.created_at).toLocaleString() : ""),
  },
  {
    key: "updated_at",
    label: "Updated at",
    render: (p) => (p.updated_at ? new Date(p.updated_at).toLocaleString() : ""),
  },
  {
    key: "deleted_at",
    label: "Deleted at",
    render: (p) => (p.deleted_at ? new Date(p.deleted_at).toLocaleString() : ""),
  },
  {
    key: "metadata",
    label: "Metadata",
    render: (p) =>
      p.metadata ? (
        <span className="max-w-xs truncate" title={JSON.stringify(p.metadata ?? {})}>
          {JSON.stringify(p.metadata).slice(0, 80)}
        </span>
      ) : (
        ""
      ),
  },
  {
    key: "type",
    label: "Type",
    render: (p) => p.type?.value || p.type?.id || "",
  },
  {
    key: "collection",
    label: "Collection",
    render: (p) => p.collection?.title || p.collection_id || "",
  },
  {
    key: "options",
    label: "Options",
    render: (p) => (Array.isArray(p.options) ? p.options.length : 0),
  },
  {
    key: "tags",
    label: "Tags",
    render: (p) =>
      Array.isArray(p.tags)
        ? p.tags
            .map((t: any) => t.value || t.id)
            .join(", ")
        : "",
  },
  {
    key: "images",
    label: "Images",
    render: (p) => (Array.isArray(p.images) ? p.images.length : 0),
  },
  {
    key: "variants",
    label: "Variants",
    render: (p) => (Array.isArray(p.variants) ? p.variants.length : 0),
  },
  {
    key: "first_variant_id",
    label: "First variant ID",
    render: (p) =>
      Array.isArray(p.variants) && p.variants.length > 0 ? p.variants[0].id : "",
    className: "font-mono text-[11px] break-all max-w-xs",
  },
  {
    key: "sales_channels",
    label: "Sales channels",
    render: (p) => (Array.isArray(p.sales_channels) ? p.sales_channels.length : 0),
  },
];

export default function ProductsTable({ products }: ProductsTableProps) {
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(
    () => new Set(columns.map((c) => c.key)),
  );
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null);

  const toggleKey = (key: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const visibleColumns = columns.filter((c) => visibleKeys.has(c.key));

  return (
    <div className="w-full space-y-3">
      <details className="rounded-md border bg-slate-50 px-3 py-2 text-xs text-slate-700">
        <summary className="cursor-pointer select-none text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          Toggle columns
        </summary>
        <div className="mt-2 flex flex-wrap gap-3">
          {columns.map((col) => (
            <label key={col.key} className="flex items-center gap-1 text-[11px]">
              <input
                type="checkbox"
                checked={visibleKeys.has(col.key)}
                onChange={() => toggleKey(col.key)}
                className="h-3 w-3"
              />
              <span>{col.label}</span>
            </label>
          ))}
        </div>
      </details>

      <div className="bg-white border rounded-lg shadow-sm overflow-auto max-h-[calc(100vh-14rem)] w-full max-w-none">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className="text-left px-3 py-2.5 border-b whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
              <th className="text-left px-3 py-2.5 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p: any, i: number) => (
              <tr
                key={p.id}
                className={i % 2 ? "bg-gray-50/40" : "bg-white hover:bg-gray-50"}
              >
                {visibleColumns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-2.5 border-t align-top ${col.className || ""}`}
                  >
                    {col.render(p)}
                  </td>
                ))}
                <td className="px-3 py-2.5 border-t">
                  <a
                    href={`/products/${p.id}`}
                    className="text-cyan-700 hover:underline mr-3"
                  >
                    Edit
                  </a>
                  {Array.isArray(p.variants) && p.variants.length > 0 && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(p.variants[0].id);
                          setCopiedProductId(p.id);
                          setTimeout(() => {
                            setCopiedProductId((prev) => (prev === p.id ? null : prev));
                          }, 1500);
                        } catch {
                          // ignore
                        }
                      }}
                      className="text-[11px] text-cyan-700 hover:text-cyan-900 underline-offset-2 hover:underline"
                    >
                      {copiedProductId === p.id ? "Copied" : "Copy first variant ID"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
