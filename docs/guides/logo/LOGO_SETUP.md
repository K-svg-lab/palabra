# Logo Setup Guide

## Overview

This guide will help you incorporate your Palabra logo into the application, generating all necessary icon sizes for PWA, iOS, and web use.

## Prerequisites

Your logo has been designed with a vibrant gradient "P" shape, perfect for the Palabra brand. The automated script will generate all required sizes from your source logo file.

## Quick Start

### Step 1: Place Your Logo

Save your logo file to the project root or any accessible location. The recommended format is PNG with transparent background, minimum 512x512 pixels.

### Step 2: Generate Icons

Run the icon generation script:

```bash
cd palabra
node scripts/generate-icons.js /path/to/your/logo.png
```

Example if you place it in the project root:

```bash
cd palabra
node scripts/generate-icons.js ../logo.png
```

### Step 3: Verify Generated Files

The script will create the following files in `palabra/public/`:

- `icon-192.png` - PWA icon (192x192)
- `icon-512.png` - PWA icon (512x512)
- `apple-touch-icon.png` - iOS home screen icon (180x180)
- `favicon-32x32.png` - Browser favicon (32x32)
- `favicon-16x16.png` - Browser favicon (16x16)
- `favicon.ico` - Legacy favicon
- `logo.png` - General purpose logo (512x512)

### Step 4: Test Your Icons

1. **Local Development:**
   ```bash
   npm run dev
   ```
   Check the browser tab for the favicon.

2. **PWA Testing:**
   - Build and run the production version
   - Open DevTools → Application → Manifest
   - Verify icons are loaded correctly

3. **iOS Testing:**
   - Open the app in Safari on iOS
   - Tap "Share" → "Add to Home Screen"
   - Verify the icon appears correctly

## What's Already Configured

The following files have been updated to use your logo:

1. **`app/layout.tsx`** - Added icon metadata for favicons and Apple touch icons
2. **`public/manifest.json`** - Already configured to reference the icon files
3. **`public/logo.svg`** - SVG version created for UI use (scalable)
4. **`components/shared/logo.tsx`** - Logo component for use throughout the app

## Using the Logo Component

You can now use the Logo component anywhere in your app:

```tsx
import { Logo } from '@/components/shared/logo';

// Small logo without text
<Logo size="small" />

// Medium logo with text
<Logo size="medium" showText />

// Large logo with custom size
<Logo size={128} showText />

// Use PNG instead of SVG
<Logo variant="png" />
```

## Logo Design Details

Your logo features:
- **Colors:** Gradient from yellow (#F9A825) → orange/red (#FF6B6B) → red (#E53935)
- **Shape:** Stylized "P" with speech bubble cutout
- **Style:** Modern, vibrant, friendly
- **Format:** Works great on both light and dark backgrounds

## Troubleshooting

### Icons Not Appearing

1. **Clear Cache:** Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
2. **Check File Paths:** Ensure all icon files are in `public/` directory
3. **Rebuild:** Run `npm run build` for production build

### Wrong Icon Size

Re-run the generation script with a higher quality source image (minimum 1024x1024 recommended).

### PWA Not Updating

1. Unregister service worker in DevTools → Application → Service Workers
2. Clear site data
3. Refresh the page

## Next Steps

1. **Add to Navigation:** Consider adding the logo to headers or splash screens
2. **Marketing Materials:** Use `logo.svg` for scalable marketing assets
3. **Social Media:** Create social media preview images using the logo
4. **Documentation:** Update any documentation to include the new branding

## File Locations

```
palabra/
├── public/
│   ├── logo.svg              # SVG version for UI
│   ├── logo.png              # PNG version (512x512)
│   ├── icon-192.png          # PWA icon
│   ├── icon-512.png          # PWA icon
│   ├── apple-touch-icon.png  # iOS icon
│   ├── favicon-32x32.png     # Favicon
│   ├── favicon-16x16.png     # Favicon
│   └── favicon.ico           # Legacy favicon
├── components/shared/
│   └── logo.tsx              # Logo component
├── scripts/
│   └── generate-icons.js     # Icon generation script
└── app/
    └── layout.tsx            # Updated with icon metadata
```

## Support

If you encounter any issues with the logo setup, check:
1. Source image quality (minimum 512x512, preferably 1024x1024)
2. File permissions in the `public/` directory
3. Node.js and npm are up to date
4. Sharp package is installed (`npm list sharp`)
