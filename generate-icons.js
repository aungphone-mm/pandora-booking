const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const svgPath = path.join(__dirname, 'public', 'icon.svg');
const iconsDir = path.join(__dirname, 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');

  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);

    try {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated ${size}x${size} icon`);
    } catch (error) {
      console.error(`❌ Error generating ${size}x${size} icon:`, error.message);
    }
  }

  // Generate favicon
  const faviconPath = path.join(__dirname, 'public', 'favicon.ico');
  try {
    await sharp(svgPath)
      .resize(32, 32)
      .png()
      .toFile(faviconPath.replace('.ico', '.png'));

    console.log('✅ Generated favicon.png (rename to favicon.ico if needed)');
  } catch (error) {
    console.error('❌ Error generating favicon:', error.message);
  }

  console.log('\n🎉 All icons generated successfully!');
}

generateIcons().catch(console.error);
