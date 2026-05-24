import sharp from "sharp";
import { mkdir } from "fs/promises";

await mkdir("public/icons", { recursive: true });

// SVG base — gradiente de marca + letra "S" en blanco
// Diseñado con safe zone para maskable (contenido en el 80% central)
function makeSvg(size, maskable = false) {
  const padding = maskable ? size * 0.1 : size * 0.18;
  const logoSize = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  const r = maskable ? size / 2 : size * 0.16; // border radius
  const fontSize = logoSize * 0.62;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="brand" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#1A3CFF"/>
      <stop offset="50%"  stop-color="#4B6CFF"/>
      <stop offset="100%" stop-color="#FF6B2B"/>
    </linearGradient>
  </defs>
  <!-- Fondo -->
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="url(#brand)"/>
  <!-- Letra S centrada -->
  <text
    x="${cx}"
    y="${cy + fontSize * 0.36}"
    font-family="system-ui, Arial, sans-serif"
    font-size="${fontSize}"
    font-weight="800"
    fill="white"
    text-anchor="middle"
    letter-spacing="-2"
  >S</text>
  <!-- Punto naranja — acento de marca -->
  <circle cx="${cx + fontSize * 0.28}" cy="${cy + fontSize * 0.36 - fontSize * 0.05}" r="${fontSize * 0.08}" fill="#FF6B2B"/>
</svg>`;
}

const icons = [
  { file: "icon-192x192.png",        size: 192, maskable: false },
  { file: "icon-512x512.png",        size: 512, maskable: false },
  { file: "icon-512x512-maskable.png", size: 512, maskable: true },
  { file: "apple-touch-icon.png",    size: 180, maskable: false },
];

for (const { file, size, maskable } of icons) {
  const svg = Buffer.from(makeSvg(size, maskable));
  await sharp(svg)
    .png({ compressionLevel: 9 })
    .toFile(`public/icons/${file}`);
  console.log(`✓ public/icons/${file} (${size}×${size})`);
}

console.log("\nÍconos generados correctamente.");
