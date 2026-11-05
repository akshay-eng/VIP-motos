// Pulls freely licensed car photos from Wikimedia Commons into public/cars,
// resizes them with macOS `sips`, and writes src/data/image-manifest.json
// with credit + licence for every file.
//
//   node scripts/fetch-images.mjs            fetch anything missing
//   node scripts/fetch-images.mjs --force    refetch everything
//   node scripts/fetch-images.mjs <car-id>   refetch one car

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const queries = JSON.parse(readFileSync(join(root, "scripts/image-queries.json"), "utf8"));
const manifestPath = join(root, "src/data/image-manifest.json");
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : { cars: {}, misc: {} };

const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.find((a) => !a.startsWith("--"));

const API = "https://commons.wikimedia.org/w/api.php";
const UA = "VIPMotorsDemo/0.1 (frontend demo build; images credited per licence)";
const EXTERIOR_COUNT = 4;

// Titles with these words are close-ups, toys or wrecks rather than the car.
const REJECT = /\b(engine|motor|badge|logo|emblem|wheel|rim|brake|light|lamp|detail|steering|seat|key|toy|scale|model car|lego|diecast|crash|wreck|accident|police|taxi|rally|race|racing|drawing|sketch|patent|plate|tyre|tire|exhaust|grille|boot|trunk|museum|sign)\b/i;
const INTERIOR = /\b(interior|cockpit|dashboard|innenraum|inside|cabin)\b/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stripHtml = (s = "") => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

async function search(q, limit = 40) {
  const url = new URL(API);
  Object.entries({
    action: "query",
    format: "json",
    generator: "search",
    gsrnamespace: "6",
    gsrsearch: `${q} filetype:bitmap`,
    gsrlimit: String(limit),
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: "1920",
  }).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`search ${q}: ${res.status}`);
  const data = await res.json();
  const pages = Object.values(data.query?.pages ?? {});
  return pages
    .sort((a, b) => a.index - b.index)
    .map((p) => ({ title: p.title, info: p.imageinfo?.[0] }))
    .filter((p) => p.info && p.info.mime === "image/jpeg");
}

function usable({ title, info }, wantInterior, exclude) {
  if (exclude && new RegExp(exclude, "i").test(title)) return false;
  const ratio = info.width / info.height;
  if (info.width < (wantInterior ? 1200 : 1600) || ratio < 1.25 || ratio > 2.1) return false;
  if (wantInterior) return INTERIOR.test(title);
  return !INTERIOR.test(title) && !REJECT.test(title);
}

async function download(item, outFile) {
  const res = await fetch(item.info.thumburl ?? item.info.url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`download ${item.title}: ${res.status}`);
  const tmp = `${outFile}.src`;
  writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
  execFileSync("sips", ["-Z", "1600", "-s", "format", "jpeg", "-s", "formatOptions", "70", tmp, "--out", outFile], { stdio: "ignore" });
  // Card-sized copy alongside the full-size one.
  execFileSync("sips", ["-Z", "800", "-s", "format", "jpeg", "-s", "formatOptions", "70", tmp, "--out", outFile.replace(/\.jpg$/, "-sm.jpg")], { stdio: "ignore" });
  rmSync(tmp);
  const meta = item.info.extmetadata ?? {};
  return {
    title: item.title.replace(/^File:/, ""),
    credit: stripHtml(meta.Artist?.value) || "Unknown author",
    license: stripHtml(meta.LicenseShortName?.value) || "See source",
    source: item.info.descriptionurl,
  };
}

async function fetchSet(key, query, count, wantInterior, dir, prefix, exclude) {
  const results = (await search(query)).filter((r) => usable(r, wantInterior, exclude));
  const out = [];
  for (const item of results.slice(0, count)) {
    const file = join(dir, `${prefix}${out.length + 1}.jpg`);
    try {
      const meta = await download(item, file);
      out.push({ src: "/" + file.slice(join(root, "public").length + 1), ...meta });
    } catch (err) {
      console.warn(`  ! ${key}: ${err.message}`);
    }
    await sleep(400);
  }
  return out;
}

async function run() {
  for (const [id, q] of Object.entries(queries.cars)) {
    if (only && only !== id) continue;
    if (!force && !only && manifest.cars[id]?.length) continue;
    const dir = join(root, "public/cars", id);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const ext = await fetchSet(id, q.ext, EXTERIOR_COUNT, false, dir, "", q.exclude);
    const int = await fetchSet(id, q.int, 1, true, dir, "interior-", q.exclude);
    manifest.cars[id] = [...ext, ...int];
    console.log(`${id}: ${ext.length} exterior, ${int.length} interior`);
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    await sleep(600);
  }

  if (!only) {
    for (const [key, q] of Object.entries(queries.misc)) {
      if (!force && manifest.misc[key]?.length) continue;
      const dir = join(root, "public/misc");
      mkdirSync(dir, { recursive: true });
      manifest.misc[key] = await fetchSet(key, q, 2, false, dir, `${key}-`);
      console.log(`misc/${key}: ${manifest.misc[key].length}`);
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    }
  }
}

mkdirSync(dirname(manifestPath), { recursive: true });
run().catch((err) => {
  console.error(err);
  process.exit(1);
});
