"use client";

import React from "react";

interface OrdersExportControlsProps {
  orders: any[];
}

function escapeCsvValue(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function buildCsv(orders: any[]): string {
  const headers = [
    "id",
    "display_id",
    "email",
    "status",
    "fulfillment_status",
    "payment_status",
    "currency_code",
    "total",
    "created_at",
  ];

  const lines = [headers.join(",")];

  for (const o of orders) {
    const total = typeof o.total === "number" ? o.total : o.total ?? "";
    const row = [
      o.id,
      o.display_id,
      o.email,
      o.status,
      o.fulfillment_status,
      o.payment_status,
      o.currency_code,
      total,
      o.created_at,
    ].map(escapeCsvValue);
    lines.push(row.join(","));
  }

  return lines.join("\n");
}

function triggerDownload(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function OrdersExportControls({ orders }: OrdersExportControlsProps) {
  if (!orders || orders.length === 0) return null;

  const handleExportCsv = () => {
    try {
      const csv = buildCsv(orders);
      const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      triggerDownload(`orders-${ts}.csv`, csv, "text/csv;charset=utf-8;");
    } catch {}
  };

  const handleExportPdf = () => {
    try {
      const win = window.open("", "_blank");
      if (!win) return;

      const style = `
        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 16px; }
        h1 { font-size: 18px; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #e5e7eb; padding: 4px 6px; text-align: left; }
        th { background: #f3f4f6; }
      `;

      const rows = orders
        .map((o) => {
          const total = typeof o.total === "number" ? o.total : o.total ?? "";
          const currency = o.currency_code || "";
          const displayTotal =
            typeof total === "number" && currency
              ? `${(total / 100).toFixed(2)} ${currency.toUpperCase()}`
              : total;
          const created = o.created_at ? new Date(o.created_at).toLocaleString() : "";
          const orderLabel = o.display_id ? `#${o.display_id}` : o.id || "";
          return `
            <tr>
              <td>${orderLabel}</td>
              <td>${o.email || ""}</td>
              <td>${o.status || o.fulfillment_status || ""}</td>
              <td>${displayTotal}</td>
              <td>${created}</td>
            </tr>`;
        })
        .join("");

      const html = `
        <html>
          <head>
            <meta charSet="utf-8" />
            <title>Orders export</title>
            <style>${style}</style>
          </head>
          <body>
            <h1>Orders export</h1>
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </body>
        </html>`;

      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    } catch {}
  };

  return (
    <div className="flex items-center gap-2 ml-auto text-xs">
      <button
        type="button"
        onClick={handleExportCsv}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
      >
        Export CSV
      </button>
      <button
        type="button"
        onClick={handleExportPdf}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
      >
        Export PDF
      </button>
    </div>
  );
}
