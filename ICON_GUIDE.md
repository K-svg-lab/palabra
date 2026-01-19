# PWA Icon Creation Guide

## Required Icons

Palabra requires two PNG icon files for proper PWA functionality:

1. **icon-192.png** - 192x192 pixels
2. **icon-512.png** - 512x512 pixels

## Icon Specifications

### Design Requirements

- **Format**: PNG (24-bit or 32-bit with transparency)
- **Background**: Should work on both light and dark backgrounds
- **Maskable Safe Zone**: Keep important content within center 80% of canvas
- **Purpose**: Represents Palabra vocabulary learning app

### Recommended Design

**Option 1: Simple Letter Mark**
- Background: Blue (#007aff)
- Foreground: White "P" letter
- Font: Bold, sans-serif
- Padding: 15-20% from edges

**Option 2: Icon with Symbol**
- Background: Blue (#007aff)
- Icon: Book or speech bubble
- Text: "P" or "Palabra"
- Style: Flat, modern

**Option 3: Gradient Design**
- Background: Blue gradient
- Symbol: Stylized vocabulary card
- Text: Optional "P" overlay

### Maskable Icons

Modern PWAs support "maskable" icons that can be shaped by the OS (rounded, circular, squircle, etc.). To ensure your icon works as maskable:

1. Keep critical content within the safe zone (center 80%)
2. Use full-bleed background
3. Avoid putting text or logos near edges
4. Test with different mask shapes

## Creation Tools

### Online Tools (Free)

1. **Figma** - https://figma.com
   - Create 512x512 frame
   - Design icon
   - Export as PNG

2. **Canva** - https://canva.com
   - Custom size: 512x512
   - Design with elements
   - Download as PNG

3. **PWA Asset Generator** - https://www.pwabuilder.com/imageGenerator
   - Upload single image
   - Automatically generates all sizes
   - Ensures maskable compatibility

### Design Software

1. **Adobe Illustrator/Photoshop**
   - Create artboard: 512x512
   - Design at high resolution
   - Export as PNG

2. **Affinity Designer**
   - Vector-based design
   - Export persona for PNG
   - Multiple size exports

3. **Sketch**
   - Create symbol
   - Export multiple sizes
   - Use artboards for variants

## Quick Creation Steps

### Using Figma (Recommended)

1. Create new Figma file
2. Create frame: 512x512
3. Add rectangle background (512x512, #007aff)
4. Add text layer: "P" (centered, white, bold)
5. Adjust size to fill ~60% of canvas
6. Export as PNG (2x for 512px)
7. Resize to 192x192 for smaller version

### Using PWA Asset Generator

1. Create a simple 512x512 PNG with your design
2. Upload to https://www.pwabuilder.com/imageGenerator
3. Check "Maskable" option
4. Download generated icons
5. Rename to `icon-192.png` and `icon-512.png`
6. Place in `public/` folder

## File Structure

```
palabra/public/
├── icon-192.png    # 192x192px for app shortcuts and notifications
├── icon-512.png    # 512x512px for splash screens and app launcher
└── manifest.json   # Already configured to reference these icons
```

## Validation

After creating icons, validate them:

1. **Visual Check**
   - View at actual size
   - Check on light/dark backgrounds
   - Verify legibility at small sizes

2. **Maskable Preview**
   - Use https://maskable.app/editor
   - Upload your icon
   - Test different mask shapes
   - Adjust if content is cut off

3. **PWA Validation**
   - Use Chrome DevTools > Application > Manifest
   - Check for warnings about icons
   - Verify icons load correctly

## Quick SVG to PNG Conversion

If you have an SVG design:

```bash
# Using ImageMagick
convert -background none icon.svg -resize 192x192 icon-192.png
convert -background none icon.svg -resize 512x512 icon-512.png

# Using Inkscape
inkscape icon.svg --export-width=192 --export-filename=icon-192.png
inkscape icon.svg --export-width=512 --export-filename=icon-512.png
```

## Example Icon Prompt (for AI Generation)

If using AI image generation:

```
Create a simple, modern app icon for a Spanish vocabulary learning app called "Palabra". 
The icon should be 512x512 pixels, PNG format, with a solid blue background (#007aff). 
Feature a white, bold letter "P" or a simple book/card symbol in the center. 
The design should be flat, minimal, and legible at small sizes. 
Keep important elements within the center 80% for maskable icon compatibility.
```

## Temporary Placeholder

Until proper icons are created, the browser will use a default icon. This won't break functionality but will affect branding and user experience.

## Testing Checklist

After adding icons:

- [ ] Icons appear in browser tab (favicon)
- [ ] Icons show in app install prompt
- [ ] Icons display on home screen after install
- [ ] Icons appear in app switcher
- [ ] Icons show in notification badges
- [ ] Icons work on both light and dark themes
- [ ] Maskable icons don't have content cut off

## Resources

- [PWA Icon Best Practices](https://web.dev/add-manifest/#icons)
- [Maskable Icons Guide](https://web.dev/maskable-icon/)
- [Icon Generator Tools](https://www.pwabuilder.com/)
- [Test Your Icons](https://maskable.app/editor)

---

**Note**: The manifest.json is already properly configured. You only need to create the PNG files and place them in the `public/` folder.

