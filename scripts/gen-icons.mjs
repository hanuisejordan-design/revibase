// Génère les icônes PWA à partir d'un SVG, avec sharp.
// Usage : node scripts/gen-icons.mjs
// Icône provisoire (monogramme « R ») — à remplacer par un vrai visuel plus tard.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
await mkdir(outDir, { recursive: true });

const BG = "#18181b"; // zinc-900
const FG = "#fafafa"; // zinc-50

/** Carré plein avec un « R » centré. `pad` = marge relative (zone de sécurité maskable). */
function iconSvg(size, pad = 0) {
  const inset = Math.round(size * pad);
  const r = Math.round(size * 0.18);
  const fontSize = Math.round((size - inset * 2) * 0.62);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <rect x="${inset}" y="${inset}" width="${size - inset * 2}" height="${size - inset * 2}" rx="${r}" fill="${BG}"/>
  <text x="50%" y="50%" dy="0.34em" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="700"
        font-size="${fontSize}" fill="${FG}">R</text>
</svg>`;
}

/** Badge de notification Android : glyphe blanc sur fond transparent. */
function badgeSvg(size) {
  const fontSize = Math.round(size * 0.7);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <text x="50%" y="50%" dy="0.34em" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="700"
        font-size="${fontSize}" fill="#ffffff">R</text>
</svg>`;
}

const jobs = [
  ["icon-192.png", iconSvg(192)],
  ["icon-512.png", iconSvg(512)],
  ["icon-maskable-512.png", iconSvg(512, 0.14)],
  ["apple-icon.png", iconSvg(180)],
  ["badge-72.png", badgeSvg(72)],
];

for (const [name, svg] of jobs) {
  await sharp(Buffer.from(svg)).png().toFile(join(outDir, name));
  console.log("wrote public/" + name);
}
