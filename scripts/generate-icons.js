#!/usr/bin/env node

/**
 * Generate PWA icons from source logo
 * Usage: node scripts/generate-icons.js <source-image-path>
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Icon sizes needed for PWA
const ICON_SIZES = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-touch-icon.png' }, // Apple touch icon
  { size: 32, name: 'favicon-32x32.png' },
  { size: 16, name: 'favicon-16x16.png' },
];

async function generateIcons(sourcePath) {
  try {
    // Verify source file exists
    if (!fs.existsSync(sourcePath)) {
      console.error(`❌ Source file not found: ${sourcePath}`);
      process.exit(1);
    }

    console.log(`📷 Processing logo from: ${sourcePath}`);

    // Get image metadata
    const metadata = await sharp(sourcePath).metadata();
    console.log(`   Original size: ${metadata.width}x${metadata.height}`);

    // Generate each icon size
    for (const { size, name } of ICON_SIZES) {
      const outputPath = path.join(PUBLIC_DIR, name);
      
      await sharp(sourcePath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated: ${name} (${size}x${size})`);
    }

    // Generate favicon.ico (multi-size)
    console.log('🎨 Generating favicon.ico...');
    await sharp(sourcePath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(path.join(PUBLIC_DIR, 'favicon.ico'));
    
    console.log('✅ Generated: favicon.ico');

    // Copy original as logo.png
    const logoDest = path.join(PUBLIC_DIR, 'logo.png');
    await sharp(sourcePath)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(logoDest);
    
    console.log('✅ Generated: logo.png (for general use)');

    console.log('\n🎉 All icons generated successfully!');
    console.log('\nGenerated files:');
    console.log('  - icon-192.png (PWA)');
    console.log('  - icon-512.png (PWA)');
    console.log('  - apple-touch-icon.png (iOS)');
    console.log('  - favicon-32x32.png');
    console.log('  - favicon-16x16.png');
    console.log('  - favicon.ico');
    console.log('  - logo.png (general use)');
    
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

// Get source path from command line argument
const sourcePath = process.argv[2];

if (!sourcePath) {
  console.error('❌ Please provide a source image path');
  console.log('\nUsage:');
  console.log('  node scripts/generate-icons.js <path-to-logo.png>');
  console.log('\nExample:');
  console.log('  node scripts/generate-icons.js ./logo.png');
  process.exit(1);
}

generateIcons(path.resolve(sourcePath));
