import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateSitemap() {
  console.log("Generating sitemap...");

  const baseUrl = "https://selfbesin.com";

  // Static pages
  const staticPages = ["", "/search", "/meals", "/privacy"];

  // Fetch all food slugs
  const { data: foods, error } = await supabase
    .from("selfbesin_foods")
    .select("slug, created_at");

  if (error) {
    console.error("Error fetching foods:", error);
    process.exit(1);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
    .map(
      (page) => `
  <url>
    <loc>${baseUrl}${page}</loc>
    <changefreq>daily</changefreq>
    <priority>${page === "" ? "1.0" : "0.8"}</priority>
  </url>`,
    )
    .join("")}
  ${foods
    .map(
      (food) => `
  <url>
    <loc>${baseUrl}/besin/${food.slug}</loc>
    <lastmod>${new Date(food.created_at || Date.now()).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`,
    )
    .join("")}
</urlset>`;

  const outputPath = path.join(__dirname, "../public/sitemap.xml");
  fs.writeFileSync(outputPath, sitemap);
  console.log(
    `Sitemap generated successfully at ${outputPath} with ${foods.length} food items.`,
  );
}

generateSitemap();
