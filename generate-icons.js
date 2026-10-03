const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateIcons() {
  const assetsDir = path.join(__dirname, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const svgPath = path.join(assetsDir, 'icon.svg');
  if (!fs.existsSync(svgPath)) {
    console.error('icon.svg not found!');
    return;
  }

  const svgBuffer = fs.readFileSync(svgPath);

  const sizes = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'favicon.png', size: 64 },
    { name: 'icon-maskable-192.png', size: 192 },
    { name: 'icon-maskable-512.png', size: 512 }
  ];

  for (const { name, size } of sizes) {
    const outPath = path.join(assetsDir, name);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Generated ${name} (${size}x${size})`);
  }
  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
