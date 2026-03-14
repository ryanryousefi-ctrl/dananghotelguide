#!/usr/bin/env node
/**
 * sitemap-kr.js — Append Korean URLs to sitemap.xml
 * Run after localize-kr.js: node sitemap-kr.js
 */

const fs = require("fs");
const path = require("path");

const ROOT_DIR = process.env.SITE_ROOT || ".";
const BASE_URL = "https://dananghotelguide.com";
const SITEMAP_PATH = path.join(ROOT_DIR, "sitemap.xml");
const KR_DIR = path.join(ROOT_DIR, "kr");

function getKrFiles() {
  if (!fs.existsSync(KR_DIR)) return [];
  return fs
    .readdirSync(KR_DIR)
    .filter((f) => f.endsWith(".html"))
    .sort();
}

function buildSitemap() {
  // Read existing sitemap
  let existing = "";
  if (fs.existsSync(SITEMAP_PATH)) {
    existing = fs.readFileSync(SITEMAP_PATH, "utf8");
  }

  const krFiles = getKrFiles();
  if (!krFiles.length) {
    console.log("No /kr files found. Run localize-kr.js first.");
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  // Build Korean URL entries
  const krEntries = krFiles
    .map(
      (f) => `
  <url>
    <loc>${BASE_URL}/kr/${f}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join("");

  if (existing.includes("</urlset>")) {
    // Inject before closing tag, removing any existing /kr entries first
    const cleaned = existing
      .replace(/<url>\s*<loc>[^<]*\/kr\/[^<]*<\/loc>[\s\S]*?<\/url>/g, "")
      .replace(/\s+<\/urlset>/, "");
    const updated = cleaned + krEntries + "\n</urlset>";
    fs.writeFileSync(SITEMAP_PATH, updated, "utf8");
    console.log(`✅ Updated sitemap.xml with ${krFiles.length} Korean URLs`);
  } else {
    // Create new sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${krEntries}
</urlset>`;
    fs.writeFileSync(SITEMAP_PATH, sitemap, "utf8");
    console.log(`✅ Created new sitemap.xml with ${krFiles.length} Korean URLs`);
  }

  krFiles.forEach((f) => console.log(`   ${BASE_URL}/kr/${f}`));
}

buildSitemap();
