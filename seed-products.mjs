// seed-products.mjs
// Run with: node seed-products.mjs

const BASE_URL = "https://vams-custom-admin.vercel.app";

// IMPORTANT: Medusa expects amount in the smallest currency unit.
// Here we use INR-style integers directly as demo prices.
// Adjust amounts / currency_code later if your store currency is different.

const products = [
  // --- Base kits ---
  {
    title: "Gut microbiome kit",
    description: "Diagnostic kit for adult gut microbiome (GutX).",
    amount: 11999, // demo: midpoint of 11,999–14,999
  },
  {
    title: "Vaginal microbiome kit",
    description: "VagiX / VAGI-HER Vaginal Microbiome Test.",
    amount: 11999,
  },
  {
    title: "Oral microbiome kit",
    description: "OralX Oral Microbiome Test.",
    amount: 9999, // midpoint of 9,999–11,999
  },
  {
    title: "Skin microbiome kit",
    description: "SkinX Skin Microbiome Test.",
    amount: 10999, // midpoint of 10,999–13,499
  },

  // --- Gut insight packs ---
  {
    title: "Gut–Brain Pack",
    description:
      "SCFA, serotonin, and GABA-related pathways to support mood and cognition.",
    amount: 1499,
  },
  {
    title: "Metabolic Pack",
    description:
      "TMAO, LPS, and obesity-linked signatures for metabolic health.",
    amount: 1499,
  },
  {
    title: "Longevity Pack",
    description: "Aging microbiome indices and S40 longevity score.",
    amount: 1499,
  },
  {
    title: "Inflammation Pack",
    description:
      "LPS, barrier stress, and pathobiont-associated inflammation markers.",
    amount: 999,
  },
  {
    title: "Hormone–Gut Pack",
    description:
      "Estrogen recycling (S22), androgen-linked signatures (S23), and hormone balance.",
    amount: 1499,
  },

  // --- Gut sequencing tiers ---
  {
    title: "Gut Tier 1 — Basic (16S)",
    description: "Gut 16S tier with bacterial profile and basic dysbiosis score.",
    amount: 5999,
  },
  {
    title: "Gut Tier 2 — Advanced (WGS)",
    description: "Gut WGS tier with bacteria, fungi, viruses, and functional pathways.",
    amount: 11999,
  },
  {
    title: "Gut Tier 3 — Premium (MetaT)",
    description:
      "Gut MetaT tier with gene expression, inflammation activity, and highest personalization.",
    amount: 21999,
  },

  // --- Vaginal insight packs ---
  {
    title: "Fertility Pack",
    description:
      "Vaginal microbiome patterns linked to implantation, miscarriage risk, and IVF outcomes.",
    amount: 1999,
  },
  {
    title: "Menopause Pack",
    description:
      "Microbiome shifts across perimenopause and menopause, dryness, and discomfort.",
    amount: 1499,
  },
  {
    title: "Candida / Mycobiome Pack",
    description:
      "Fungal balance, Candida overgrowth signatures, and recurrent infection risk markers.",
    amount: 999,
  },
  {
    title: "Sexual Health Pack",
    description:
      "Patterns linked to recurrent BV, STIs, and post-coital discomfort.",
    amount: 999,
  },

  // --- Vaginal sequencing tiers ---
  {
    title: "Vaginal Tier 1 — Basic (16S)",
    description:
      "VagiX 16S tier with bacterial profile, CST typing and BV risk scores.",
    amount: 5999,
  },
  {
    title: "Vaginal Tier 2 — Advanced (WGS)",
    description:
      "VagiX WGS tier with bacteria, fungi, viruses, and functional pathways.",
    amount: 11999,
  },
  {
    title: "Vaginal Tier 3 — Premium (MetaT)",
    description:
      "VagiX MetaT tier with gene expression, hormone-responsive pathways, and personalization.",
    amount: 21999,
  },

  // --- Oral insight packs ---
  {
    title: "Gum Health Pack",
    description:
      "Focused view on periodontitis, gingivitis, and bleeding risk signatures.",
    amount: 999,
  },
  {
    title: "Oral–Gut Axis Pack",
    description:
      "Links between oral taxa and gut / cardiometabolic risk pathways.",
    amount: 999,
  },

  // --- Oral sequencing tiers ---
  {
    title: "Oral Tier 1 — Basic (16S)",
    description:
      "Oral 16S tier with bacterial profile and basic gum & caries scores.",
    amount: 4999,
  },
  {
    title: "Oral Tier 2 — Advanced (WGS)",
    description:
      "Oral WGS tier with bacteria, fungi, functional pathways, and systemic risk markers.",
    amount: 9999,
  },
  {
    title: "Oral Tier 3 — Premium (MetaT)",
    description:
      "Oral MetaT tier with gene expression, inflammation, and immune activity.",
    amount: 18999,
  },

  // --- Skin insight packs ---
  {
    title: "Acne Pack",
    description:
      "Acne-prone microbe patterns, inflammation risk, and barrier stress.",
    amount: 1499,
  },
  {
    title: "Barrier Function Pack",
    description:
      "Barrier integrity, dryness and sensitivity-linked taxa, and repair potential.",
    amount: 999,
  },
  {
    title: "Fungal Balance Pack",
    description:
      "Malassezia balance, fungal overgrowth risk, and mixed dermatoses patterns.",
    amount: 999,
  },

  // --- Skin sequencing tiers ---
  {
    title: "Skin Tier 1 — Basic (16S)",
    description:
      "Skin 16S tier with bacterial profile and basic dysbiosis & acne risk.",
    amount: 5499,
  },
  {
    title: "Skin Tier 2 — Advanced (WGS)",
    description:
      "Skin WGS tier with bacteria, fungi, functional pathways, and risk markers.",
    amount: 10999,
  },
  {
    title: "Skin Tier 3 — Premium (MetaT)",
    description:
      "Skin MetaT tier with gene expression, inflammation, and immune activity.",
    amount: 19999,
  },
];

async function fetchExistingProductsByTitle(title) {
  const url = new URL(`${BASE_URL}/api/admin/products`);
  url.searchParams.set("q", title);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "content-type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to fetch existing products for", title, res.status, text);
    return [];
  }

  try {
    const data = await res.json();
    // Medusa admin /products returns { products, count, limit, offset }
    if (Array.isArray(data.products)) return data.products;
    return [];
  } catch {
    return [];
  }
}

async function deleteProductById(id) {
  const url = `${BASE_URL}/api/admin/products?id=${encodeURIComponent(id)}`;

  const res = await fetch(url, {
    method: "DELETE",
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("Failed to delete", id, res.status, text);
    throw new Error(`Failed to delete product ${id}`);
  }

  console.log("Deleted existing product", id);
}

async function deleteExistingForSeedProducts() {
  for (const p of products) {
    const existing = await fetchExistingProductsByTitle(p.title);
    if (!existing.length) continue;

    for (const prod of existing) {
      if (prod && prod.id) {
        await deleteProductById(prod.id);
      }
    }
  }
}

async function createProduct(p) {
  const body = {
    title: p.title,
    description: p.description,
    status: "published",
    // Medusa requires at least one product option with values
    options: [
      {
        title: "Title",
        values: [p.title],
      },
    ],
    variants: [
      {
        title: "Default",
        options: { Title: p.title }, // key matches options[0].title
        prices: [
          {
            amount: p.amount,
            currency_code: "inr",
          },
        ],
      },
    ],
  };

  const res = await fetch(`${BASE_URL}/api/admin/products`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("Failed:", p.title, res.status, text);
    throw new Error(`Failed to create ${p.title}`);
  }

  console.log("Created:", p.title);
}

async function main() {
  // First remove any existing products with these titles, so we can reseed safely.
  await deleteExistingForSeedProducts();

  for (const p of products) {
    await createProduct(p);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});