import sharp from 'sharp';
import { readFile, copyFile } from 'node:fs/promises';

const logo = await readFile('public/zombie-logo.svg');
for (const [name, size] of [
  ['logo.png', 512],
  ['logo-dark.png', 512],
  ['favicon-16x16.png', 16],
  ['favicon-32x32.png', 32],
  ['apple-touch-icon.png', 180],
  ['android-chrome-192x192.png', 192],
  ['android-chrome-512x512.png', 512],
]) {
  await sharp(logo).resize(size, size).png().toFile(`public/${name}`);
}
await copyFile('public/zombie-logo.svg', 'public/favicon.svg');
const poster =
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<rect width="1200" height="630" fill="#060e15"/>
<rect x="64" y="78" width="130" height="130" rx="28" fill="#1e7729"/>
<circle cx="108" cy="126" r="12" fill="#f1eee7"/><circle cx="153" cy="126" r="12" fill="#f1eee7"/>
<path d="M102 165 Q129 153 160 165" stroke="#f1eee7" stroke-width="8" fill="none"/>
<text x="64" y="314" fill="#f1eee7" font-family="Arial,sans-serif" font-size="76" font-weight="bold">AI ZOMBIE VIDEO</text>
<text x="64" y="398" fill="#e48e00" font-family="Arial,sans-serif" font-size="40">Two photos. A zombie story.</text>
<text x="64" y="524" fill="#bac6cd" font-family="Arial,sans-serif" font-size="30">Pre-launch preview · Generation coming soon</text></svg>`);
await sharp(poster).png().toFile('public/og.png');
console.log('Generated project logo, icons and 1200×630 preview share image.');
