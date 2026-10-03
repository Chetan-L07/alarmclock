const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const resDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');
const svgPath = path.join(__dirname, 'assets', 'icon.svg');

const densities = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 }
];

async function updateAndroidIcons() {
  if (!fs.existsSync(svgPath)) {
    console.error('icon.svg not found');
    return;
  }
  const svgBuffer = fs.readFileSync(svgPath);

  for (const { folder, size } of densities) {
    const targetDir = path.join(resDir, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // ic_launcher.png
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // ic_launcher_round.png
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    // ic_launcher_foreground.png
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    console.log(`Updated icons for Android ${folder} (${size}x${size})`);
  }

  console.log('All Android launcher icons updated successfully!');
}

updateAndroidIcons().catch(console.error);
