import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, "../dist");

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getUnit(food) {
  return food.basis_unit === "ml" ? "ml" : "g";
}

function getFullName(food) {
  if (food.display_name && food.display_name.trim()) {
    return food.display_name.trim();
  }
  const qualifier =
    food.qualifier && food.qualifier.length
      ? ` ${food.qualifier.join(" ")}`
      : "";
  return `${food.name}${qualifier}`;
}

function buildHeadTags(food) {
  const unit = getUnit(food);
  const fullName = getFullName(food);
  const title = `${fullName} Besin Değerleri – Selfbesin`;
  const description = `${fullName} besin değerleri: 100${unit} için ${food.calories_per_100g} kcal kalori, ${food.protein_g_per_100g}g protein, ${food.carbs_g_per_100g}g karbonhidrat, ${food.fat_g_per_100g}g yağ.`;
  const ogDescription = `${fullName}: 100${unit} = ${food.calories_per_100g} kcal kalori, ${food.protein_g_per_100g}g protein`;
  const url = `https://selfbesin.com/besin/${food.slug}`;
  const image = food.image_url || "https://selfbesin.com/og-image.png";

  const jsonLdProduct = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: fullName,
    url,
    ...(food.image_url && { image: food.image_url }),
    description: `${fullName} besin değerleri: kalori, protein, karbonhidrat ve yağ bilgileri.`,
    nutrition: {
      "@type": "NutritionInformation",
      servingSize: `100 ${unit}`,
      calories: `${food.calories_per_100g} calories`,
      proteinContent: `${food.protein_g_per_100g} g`,
      carbohydrateContent: `${food.carbs_g_per_100g} g`,
      fatContent: `${food.fat_g_per_100g} g`,
    },
  };

  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: "https://selfbesin.com" },
      { "@type": "ListItem", position: 2, name: fullName, item: url },
    ],
  };

  return [
    `<meta name="description" content="${escapeHtml(description)}">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(ogDescription)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:url" content="${escapeHtml(url)}">`,
    `<meta property="og:image" content="${escapeHtml(image)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:image" content="${escapeHtml(image)}">`,
    `<link rel="canonical" href="${escapeHtml(url)}">`,
    `<script type="application/ld+json">${JSON.stringify(jsonLdProduct)}</script>`,
    `<script type="application/ld+json">${JSON.stringify(jsonLdBreadcrumb)}</script>`,
  ].join("\n    ");
}

async function prerender() {
  console.log("Starting prerender...\n");

  // Read the built index.html as template
  const templatePath = path.join(distDir, "index.html");
  if (!fs.existsSync(templatePath)) {
    console.error("dist/index.html not found. Run 'vite build' first.");
    process.exit(1);
  }
  const template = fs.readFileSync(templatePath, "utf-8");

  // Fetch all foods from Supabase in one request
  const { data: foods, error } = await supabase
    .from("selfbesin_foods")
    .select("slug, display_name, qualifier, calories_per_100g, protein_g_per_100g, carbs_g_per_100g, fat_g_per_100g, basis_unit, image_url");

  if (error) {
    console.error("Error fetching foods:", error);
    process.exit(1);
  }

  console.log(`Found ${foods.length} foods to prerender.\n`);

  let rendered = 0;

  for (const food of foods) {
    const fullName = getFullName(food);
    const title = `${fullName} Besin Değerleri – Selfbesin`;
    const headTags = buildHeadTags(food);

    // Replace title and inject SEO tags before </head>
    let html = template.replace(
      /<title>[^<]*<\/title>/,
      `<title>${escapeHtml(title)}</title>`
    );
    html = html.replace("</head>", `    ${headTags}\n  </head>`);

    // Write to dist/besin/{slug}/index.html
    const outputDir = path.join(distDir, "besin", food.slug);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, "index.html"), html);

    rendered++;
    console.log(`  ✓ /besin/${food.slug} (${rendered}/${foods.length})`);
  }

  console.log(`\nPrerender complete! ${rendered} pages generated.`);
}

prerender();
