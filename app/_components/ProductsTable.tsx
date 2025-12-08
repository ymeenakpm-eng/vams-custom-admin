"use client";

import React, { useEffect, useState } from "react";
import ConfirmDeleteButton from "./ConfirmDeleteButton";

interface ProductsTableProps {
  products: any[];
}

interface ColumnDef {
  key: string;
  label: string;
  render: (p: any) => React.ReactNode;
  className?: string;
}

interface CsvColumn {
  key: string;
  header: string;
  get: (p: any) => string | number | null | undefined;
}

const columns: ColumnDef[] = [
  {
    key: "id",
    label: "ID",
    render: (p) => p.id,
    className:
      "font-mono text-[11px] break-all max-w-[140px] truncate align-top",
  },
  { key: "title", label: "Title", render: (p) => p.title },
  { key: "subtitle", label: "Subtitle", render: (p) => p.subtitle },
  {
    key: "status",
    label: "Status",
    render: (p) => (
      <span
        className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${
          p.status === "published"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-gray-200 text-gray-700"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            p.status === "published" ? "bg-emerald-500" : "bg-gray-500"
          }`}
        />
        <span className="capitalize">{p.status}</span>
      </span>
    ),
  },
  {
    key: "external_id",
    label: "External ID",
    render: (p) => p.external_id,
    className:
      "font-mono text-[11px] break-all max-w-[160px] truncate align-top",
  },
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
  {
    key: "thumbnail",
    label: "Thumbnail",
    render: (p) => p.thumbnail,
    className:
      "font-mono text-[11px] break-all max-w-[160px] truncate align-top",
  },
  {
    key: "collection_id",
    label: "Collection ID",
    render: (p) => p.collection_id,
    className:
      "font-mono text-[11px] break-all max-w-[140px] truncate align-top",
  },
  {
    key: "type_id",
    label: "Type ID",
    render: (p) => p.type_id,
    className:
      "font-mono text-[11px] break-all max-w-[140px] truncate align-top",
  },
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
    key: "categories",
    label: "Categories",
    render: (p) => {
      const cats = Array.isArray(p.categories) ? p.categories : [];
      if (!cats.length) return "";
      const first = cats[0];
      const name = first.name || first.title || first.id;
      const params = new URLSearchParams({ id_contains: first.id || "" });
      return (
        <a
          href={`/categories?${params.toString()}`}
          className="text-xs text-cyan-700 hover:text-cyan-900 hover:underline"
        >
          {name}
          {cats.length > 1 ? ` +${cats.length - 1}` : ""}
        </a>
      );
    },
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
    className:
      "font-mono text-[11px] break-all max-w-[160px] truncate align-top",
  },
  {
    key: "sales_channels",
    label: "Sales channels",
    render: (p) => (Array.isArray(p.sales_channels) ? p.sales_channels.length : 0),
  },
];

const defaultVisibleKeys = new Set<string>([
  "id",
  "title",
  "subtitle",
  "status",
  "external_id",
  "description",
  "handle",
  "thumbnail",
  "variants",
  "first_variant_id",
  "sales_channels",
]);

const csvColumns: CsvColumn[] = [
  { key: "id", header: "ID", get: (p) => p.id },
  { key: "title", header: "Title", get: (p) => p.title },
  { key: "status", header: "Status", get: (p) => p.status },
  { key: "external_id", header: "External ID", get: (p) => p.external_id },
  { key: "handle", header: "Handle", get: (p) => p.handle },
  {
    key: "first_variant_id",
    header: "First variant ID",
    get: (p) =>
      Array.isArray(p.variants) && p.variants.length > 0 ? p.variants[0].id : "",
  },
  { key: "created_at", header: "Created at", get: (p) => p.created_at },
  { key: "updated_at", header: "Updated at", get: (p) => p.updated_at },
];

export default function ProductsTable({ products }: ProductsTableProps) {
  const [rows, setRows] = useState<any[]>(() => products || []);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(
    () => new Set(defaultVisibleKeys),
  );
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState<null | "publish" | "draft">(
    null,
  );

  // Keep local rows state in sync when the products prop changes
  useEffect(() => {
    setRows(products || []);
    setSelectedIds(new Set());
  }, [products]);

  // Load saved column preferences on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("vams_products_visible_columns");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        setVisibleKeys(new Set<string>(parsed));
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist preferences whenever they change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "vams_products_visible_columns",
        JSON.stringify(Array.from(visibleKeys)),
      );
    } catch {
      // ignore
    }
  }, [visibleKeys]);

  const exportCsv = () => {
    const sourceRows = selectedIds.size
      ? rows.filter((r) => selectedIds.has(r.id))
      : rows;
    if (sourceRows.length === 0) return;

    const escape = (value: any) => {
      if (value == null) return "";
      const s = String(value);
      if (/[",\n]/.test(s)) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };

    const header = csvColumns.map((c) => escape(c.header)).join(",");
    const csvRows = sourceRows.map((p: any) =>
      csvColumns.map((c) => escape(c.get(p))).join(","),
    );
    const csv = [header, ...csvRows].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.download = `products-${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleKey = (key: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const visibleColumns = columns.filter((c) => visibleKeys.has(c.key));

  const toggleStatus = async (p: any) => {
    const current = p.status === "published" ? "published" : "draft";
    const next = current === "published" ? "draft" : "published";
    try {
      setUpdatingId(p.id);
      const res = await fetch(`/api/admin/products/${encodeURIComponent(p.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
        cache: "no-store",
      });
      if (!res.ok) {
        // best-effort surface of error
        const text = await res.text().catch(() => "");
        alert(`Failed to update status (${res.status}). ${text.slice(0, 160)}`);
        return;
      }
      setRows((prev) =>
        prev.map((row) =>
          row.id === p.id
            ? {
                ...row,
                status: next,
              }
            : row,
        ),
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleRowSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const visibleIds = rows.map((r) => r.id);
      const allSelected = visibleIds.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      visibleIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const bulkUpdateStatus = async (nextStatus: "published" | "draft") => {
    if (!selectedIds.size) return;
    const ids = Array.from(selectedIds);
    try {
      setBulkUpdating(nextStatus === "published" ? "publish" : "draft");
      const results = await Promise.all(
        ids.map(async (id) => {
          const res = await fetch(
            `/api/admin/products/${encodeURIComponent(id)}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: nextStatus }),
              cache: "no-store",
            },
          );
          return { id, ok: res.ok, status: res.status };
        }),
      );

      const failed = results.filter((r) => !r.ok);
      if (failed.length) {
        alert(
          `Some products failed to update: ${failed
            .map((f) => `${f.id} (${f.status})`)
            .join(", ")}`,
        );
      }

      const successIds = new Set(results.filter((r) => r.ok).map((r) => r.id));
      if (successIds.size) {
        setRows((prev) =>
          prev.map((row) =>
            successIds.has(row.id)
              ? {
                  ...row,
                  status: nextStatus,
                }
              : row,
          ),
        );
        setSelectedIds((prev) => {
          const next = new Set(prev);
          successIds.forEach((id) => next.delete(id));
          return next;
        });
      }
    } finally {
      setBulkUpdating(null);
    }
  };

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

      <div className="flex items-center justify-between text-xs text-gray-600">
        <div className="flex flex-wrap items-center gap-3">
          {selectedIds.size > 0 && (
            <div className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] text-gray-700">
              <span>
                {selectedIds.size} selected
              </span>
              <button
                type="button"
                onClick={() => bulkUpdateStatus("published")}
                disabled={bulkUpdating !== null}
                className="inline-flex items-center rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-cyan-600 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {bulkUpdating === "publish" ? "Publishing..." : "Publish selected"}
              </button>
              <button
                type="button"
                onClick={() => bulkUpdateStatus("draft")}
                disabled={bulkUpdating !== null}
                className="inline-flex items-center rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-cyan-600 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {bulkUpdating === "draft" ? "Updating..." : "Mark selected draft"}
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-cyan-600"
          >
            Export CSV
          </button>
          <span className="text-[11px] text-gray-500">
            * Export uses selected rows, or all if none selected.
          </span>
        </div>
        <div />
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-auto max-h-[calc(100vh-14rem)] w-full max-w-none mt-2">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2.5 border-b">
                <input
                  type="checkbox"
                  className="h-3 w-3"
                  onChange={toggleSelectAllVisible}
                  checked={
                    rows.length > 0 &&
                    rows.every((r) => selectedIds.has(r.id))
                  }
                  aria-label="Select all products on this page"
                />
              </th>
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
            {rows.map((p: any, i: number) => (
              <tr
                key={p.id}
                className={i % 2 ? "bg-gray-50/40" : "bg-white hover:bg-gray-50"}
              >
                <td className="px-3 py-2.5 border-t align-top">
                  <input
                    type="checkbox"
                    className="h-3 w-3"
                    checked={selectedIds.has(p.id)}
                    onChange={() => toggleRowSelected(p.id)}
                    aria-label={`Select product ${p.title || p.id}`}
                  />
                </td>
                {visibleColumns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-2.5 border-t align-top ${col.className || ""}`}
                  >
                    {col.render(p)}
                  </td>
                ))}
                <td className="px-3 py-2.5 border-t whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <a
                      href={`/products/${p.id}`}
                      className="inline-flex items-center rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-cyan-600"
                    >
                      Edit
                    </a>
                    <button
                      type="button"
                      onClick={() => toggleStatus(p)}
                      disabled={updatingId === p.id}
                      className="inline-flex items-center rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-cyan-600 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {updatingId === p.id
                        ? "Updating..."
                        : p.status === "published"
                        ? "Mark draft"
                        : "Publish"}
                    </button>
                    <ConfirmDeleteButton
                      action={`/api/admin/products/${p.id}`}
                      label="Delete"
                    />
                    {Array.isArray(p.variants) && p.variants.length > 0 && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(p.variants[0].id);
                            setCopiedProductId(p.id);
                            setTimeout(() => {
                              setCopiedProductId((prev) =>
                                prev === p.id ? null : prev,
                              );
                            }, 1500);
                          } catch {
                            // ignore
                          }
                        }}
                        className="inline-flex items-center rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-cyan-600"
                      >
                        {copiedProductId === p.id
                          ? "Copied"
                          : "Copy first variant ID"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
