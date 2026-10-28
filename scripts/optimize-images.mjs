import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const images = path.join(root, "public", "images");
const screens = path.join(images, "screens");

async function writeWebp(input, output, width, quality = 78) {
  await sharp(input)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: 6 })
    .toFile(output);
  const { size } = fs.statSync(output);
  console.log(`wrote ${path.relative(root, output)} (${Math.round(size / 1024)} KB)`);
}

async function compressPng(input, width) {
  const tmp = `${input}.tmp.png`;
  await sharp(input)
    .resize({ width, withoutEnlargement: true })
    .png({ compressionLevel: 9, quality: 80, palette: true })
    .toFile(tmp);
  fs.renameSync(tmp, input);
  const { size } = fs.statSync(input);
  console.log(`compressed ${path.relative(root, input)} (${Math.round(size / 1024)} KB)`);
}

const screenFiles = fs.readdirSync(screens).filter((name) => name.endsWith(".png"));
for (const name of screenFiles) {
  const input = path.join(screens, name);
  const webp = path.join(screens, name.replace(/\.png$/i, ".webp"));
  await writeWebp(input, webp, 720, 76);
  await compressPng(input, 720);
}

await writeWebp(path.join(images, "splash.png"), path.join(images, "splash-64.webp"), 64, 82);
await writeWebp(path.join(images, "splash.png"), path.join(images, "splash-128.webp"), 128, 82);
await writeWebp(path.join(images, "logo.png"), path.join(images, "logo-64.webp"), 64, 82);
await writeWebp(path.join(images, "chat-avatar.png"), path.join(images, "chat-avatar.webp"), 80, 80);

const ogWidth = 1200;
const ogHeight = 630;
const droplet = await sharp(path.join(images, "splash.png"))
  .resize({ width: 220 })
  .png()
  .toBuffer();

const svg = `
  <svg width="${ogWidth}" height="${ogHeight}" viewBox="0 0 ${ogWidth} ${ogHeight}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${ogWidth}" height="${ogHeight}" fill="#07101F"/>
    <circle cx="980" cy="90" r="220" fill="#FFD447" fill-opacity="0.12"/>
    <circle cx="160" cy="560" r="180" fill="#4A90E2" fill-opacity="0.12"/>
    <text x="430" y="270" fill="#FFFFFF" font-size="72" font-weight="800" font-family="Arial, Helvetica, sans-serif">GoodFat</text>
    <text x="430" y="340" fill="#A9B4CC" font-size="32" font-family="Arial, Helvetica, sans-serif">Eat fats that help you feel better.</text>
    <text x="430" y="400" fill="#FFD447" font-size="22" font-weight="700" font-family="Arial, Helvetica, sans-serif">Scan your plate. Choose calmer fats.</text>
  </svg>
`;

await sharp({
  create: {
    width: ogWidth,
    height: ogHeight,
    channels: 3,
    background: { r: 7, g: 16, b: 31 },
  },
})
  .composite([
    { input: Buffer.from(svg), top: 0, left: 0 },
    { input: droplet, left: 150, top: 205 },
  ])
  .png({ compressionLevel: 9 })
  .toFile(path.join(images, "og-image.png"));

const ogStat = fs.statSync(path.join(images, "og-image.png"));
console.log(`wrote public/images/og-image.png (${Math.round(ogStat.size / 1024)} KB)`);
