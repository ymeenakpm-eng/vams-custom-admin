"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function ProductsSavedBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const created = searchParams.get("created");
    const saved = searchParams.get("saved");

    if (created === "1" || saved === "1") {
      // Decide which message to show. Prefer "saved" if both somehow exist.
      if (saved === "1") {
        setMessage("Product saved successfully.");
      } else if (created === "1") {
        setMessage("Product added successfully.");
      }

      const params = new URLSearchParams(searchParams.toString());
      params.delete("created");
      params.delete("saved");
      const query = params.toString();
      const next = query ? `${pathname}?${query}` : pathname;
      router.replace(next);
    } else {
      // No flash flags present in the URL anymore; ensure we clear any
      // previous message so the banner does not stick around.
      if (message !== null) {
        setMessage(null);
      }
    }
  }, [searchParams, router, pathname, message]);

  if (!message) return null;

  return (
    <div className="mt-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
      {message}
    </div>
  );
}
