# App Icon Design Guide - Palabra

**Last Updated:** February 12, 2026  
**Status:** Design Specification

---

## 🎨 **Icon Design Requirements**

### **Design Philosophy**
The Palabra app icon should embody:
- **Simplicity**: Clean, recognizable design at all sizes
- **Relevance**: Spanish language learning theme
- **Memorability**: Distinctive and easy to remember
- **Scalability**: Looks good from 16px to 1024px
- **Apple Aesthetic**: Follows iOS design language

---

## 📐 **Technical Specifications**

### **Master Icon**
- **Size:** 1024×1024px
- **Format:** PNG (no transparency for iOS)
- **Color Space:** sRGB or Display P3
- **DPI:** 72 (standard for digital)

### **Design Grid**
- **Canvas:** 1024×1024px
- **Safe Zone:** 896×896px (leave 64px margin on all sides)
- **Content Area:** 800×800px (centered, for main visual element)

### **Border Radius**
- **iOS automatically applies:** ~22.37% radius
- **Don't include rounded corners** in your design (iOS adds them)

---

## 🎨 **Design Concept Options**

### **Option 1: Letter P (Palabra) ✨ RECOMMENDED**

**Concept:**
- Large, bold letter "P" (for Palabra)
- Modern, geometric sans-serif font
- Gradient background (Blue → Purple)
- White or cream-colored letter

**Visual Details:**
- **Background:** Linear gradient from iOS Blue (#007AFF) to Purple (#AF52DE)
- **Letter:** White (#FFFFFF), drop shadow for depth
- **Typography:** SF Pro Rounded or similar (bold, friendly)
- **Size:** P fills 70% of safe zone

**Why This Works:**
- Simple and scalable
- Recognizable brand identity
- Follows Apple's "letter + gradient" pattern (Messages, Mail, etc.)
- Easy to spot on home screen

---

### **Option 2: Speech Bubble with Flag**

**Concept:**
- Speech bubble containing Spanish flag colors
- Modern, flat design
- Represents conversation and Spanish learning

**Visual Details:**
- **Background:** Solid color or subtle gradient
- **Speech Bubble:** White with shadow
- **Flag Stripes:** Red-Yellow-Red horizontal bands
- **Style:** Rounded, friendly, modern

**Why This Works:**
- Clearly communicates "Spanish language"
- Familiar symbol (speech bubble)
- Colorful and distinctive

---

### **Option 3: Flashcard Stack**

**Concept:**
- Stack of 3 flashcards in perspective
- Top card shows "Hola" or Spanish word
- Minimalist, educational

**Visual Details:**
- **Background:** Gradient (Blue → Teal)
- **Cards:** White with subtle shadows
- **Text:** Dark text on top card
- **Perspective:** Slight 3D tilt

**Why This Works:**
- Directly represents core functionality (flashcards)
- Educational aesthetic
- Depth creates visual interest

---

### **Option 4: Book + Star (Knowledge)**

**Concept:**
- Open book symbol
- Star or sparkle element (AI/smart features)
- Academic yet modern

**Visual Details:**
- **Background:** Gradient
- **Book:** Simplified icon, 2 pages
- **Star/Sparkle:** Gold or yellow accent
- **Style:** Line art or filled shapes

**Why This Works:**
- Universal education symbol
- Star suggests "smart" features
- Clean and timeless

---

## 🎨 **Color Palette**

### **Primary Colors (iOS-inspired)**

**Gradient Option 1 (Recommended):**
```css
background: linear-gradient(135deg, #007AFF 0%, #AF52DE 100%);
/* iOS Blue → iOS Purple */
```

**Gradient Option 2:**
```css
background: linear-gradient(135deg, #5856D6 0%, #AF52DE 100%);
/* iOS Indigo → iOS Purple */
```

**Gradient Option 3:**
```css
background: linear-gradient(135deg, #FF9500 0%, #FF3B30 100%);
/* iOS Orange → iOS Red (energetic, passion for learning) */
```

### **Foreground Colors**
- **White:** #FFFFFF (for letters/icons)
- **Cream/Off-white:** #FFF9F0 (softer alternative)
- **Dark:** #1C1C1E (for text on light backgrounds)

### **Accent Colors**
- **Gold Star:** #FFD60A (for achievements/sparkle)
- **Spanish Flag Red:** #C8102E
- **Spanish Flag Yellow:** #FFC400

---

## 📏 **Required Sizes**

### **iOS**

**App Store & Universal:**
- 1024×1024px (PNG, no alpha) - **REQUIRED for App Store Connect**

**iPhone:**
- 180×180px (@3x, iPhone 14 Pro, 15 Pro)
- 120×120px (@2x, iPhone SE)
- 87×87px (@3x, notifications)
- 80×80px (@2x, spotlight)
- 60×60px (@2x, notifications)
- 58×58px (@2x, settings)
- 40×40px (@2x, notifications)

**iPad:**
- 167×167px (@2x, iPad Pro)
- 152×152px (@2x, iPad, iPad mini)
- 76×76px (@1x, iPad)

### **Android**

**Google Play Store:**
- 512×512px (PNG, 32-bit with alpha) - **REQUIRED for Play Store**

**Launcher Icons (Adaptive):**
- 432×432px (xxxhdpi, foreground + background)
- 324×324px (xxhdpi)
- 216×216px (xhdpi)
- 162×162px (hdpi)
- 108×108px (mdpi)

**Legacy Launcher:**
- 192×192px (xxxhdpi)
- 144×144px (xxhdpi)
- 96×96px (xhdpi)
- 72×72px (hdpi)
- 48×48px (mdpi)

---

## 🛠️ **Design Tools & Workflow**

### **Recommended Tools**

1. **Figma** (Free, web-based)
   - Great for vector design
   - Built-in iOS icon template
   - Easy export at multiple sizes

2. **Sketch** (Mac, paid)
   - Industry standard for iOS design
   - iOS app icon template included

3. **Adobe Illustrator** (Paid)
   - Professional vector design
   - Precise control over shapes

4. **Inkscape** (Free, open-source)
   - Vector graphics editor
   - Good alternative to Illustrator

### **Export Workflow**

1. **Design at 1024×1024px**
   - Use vector shapes for scalability
   - Keep it simple (looks good when scaled down)

2. **Export Master (1024×1024px)**
   - PNG format
   - No transparency (iOS requirement)
   - Embedded sRGB color profile

3. **Use Icon Generator**
   - **iOS:** Use Xcode's asset catalog (auto-generates sizes)
   - **Android:** Use Android Studio's Image Asset Studio
   - **Or use online tools:**
     - [App Icon Generator](https://appicon.co/) (free)
     - [MakeAppIcon](https://makeappicon.com/) (free)

4. **Test on Devices**
   - View on actual iPhone/iPad home screens
   - Check at different sizes (app, spotlight, settings)
   - Test in light and dark mode

---

## ✅ **Design Checklist**

### **Before Finalizing**

- [ ] **Visibility**: Recognizable at 40×40px (notifications)?
- [ ] **Simplicity**: Not too detailed or cluttered?
- [ ] **Uniqueness**: Stands out from other language apps?
- [ ] **On-Brand**: Represents Palabra's identity?
- [ ] **Scalability**: Looks good at all sizes?
- [ ] **No Text** (except single letter): Avoid small text (illegible at small sizes)
- [ ] **No Gradients on Small Elements**: Gradients should be large/simple
- [ ] **High Contrast**: Works in light and dark mode?
- [ ] **Safe Zone**: Critical elements within safe zone?

### **Technical Requirements**

- [ ] 1024×1024px master file
- [ ] PNG format (no transparency for iOS)
- [ ] sRGB or Display P3 color space
- [ ] No rounded corners (iOS applies automatically)
- [ ] No transparency (required for iOS App Store)
- [ ] Android version has transparency (optional but recommended)

### **Testing**

- [ ] View on iPhone home screen (light mode)
- [ ] View on iPhone home screen (dark mode)
- [ ] View in Settings app (small size)
- [ ] View in App Store listing
- [ ] View on iPad
- [ ] View on Android device
- [ ] Export all required sizes

---

## 🎨 **Design Best Practices**

### **DO:**
- ✅ Use bold, simple shapes
- ✅ Use high contrast colors
- ✅ Use flat design or subtle depth (drop shadow)
- ✅ Test at multiple sizes early
- ✅ Use iOS system colors for familiarity
- ✅ Keep design centered (safe zone)
- ✅ Use single visual metaphor

### **DON'T:**
- ❌ Use photos or complex imagery
- ❌ Include small text (except single letter)
- ❌ Use too many colors (3-4 max)
- ❌ Include rounded corners (iOS adds them)
- ❌ Use transparency (iOS requirement)
- ❌ Copy other apps' icons
- ❌ Use gradients on small elements

---

## 📱 **Icon Placement Examples**

### **iOS Home Screen Context**
Your icon will appear alongside:
- **Duolingo:** Green owl (high recognition)
- **Quizlet:** Blue "Q" (simple letter)
- **Anki:** Blue/white (minimal)
- **Babbel:** Red speech bubble (clear metaphor)

**Strategy:** Stand out with unique color combo (Blue→Purple gradient not common in language apps)

### **Accessibility Considerations**
- Ensure sufficient contrast for color-blind users
- Test in grayscale (Settings → Accessibility → Display)
- Avoid red-green combinations (common color blindness)

---

## 🚀 **Next Steps**

1. **Choose Design Concept** (Option 1 "Letter P" recommended)
2. **Create 1024×1024px Master** in Figma/Sketch/Illustrator
3. **Export PNG** (no transparency)
4. **Generate All Sizes** using icon generator tool
5. **Test on Device** (iPhone + Android)
6. **Iterate Based on Feedback** (ensure visibility at small sizes)
7. **Submit to App Stores** (upload 1024px master)

---

## 📚 **Resources**

### **Design Inspiration**
- [iOS Human Interface Guidelines - App Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Material Design - Product Icons](https://material.io/design/iconography/product-icons.html)
- [Dribbble - App Icon Designs](https://dribbble.com/search/app-icon)

### **Icon Generators**
- [AppIcon.co](https://appicon.co/) - Generate all sizes from 1024px master
- [MakeAppIcon](https://makeappicon.com/) - iOS + Android exports
- [Ape Tools](https://apetools.webprofusion.com/app/#/tools/imagegorilla) - Advanced options

### **Color Palette Tools**
- [Coolors.co](https://coolors.co/) - Gradient generator
- [iOS Colors](https://developer.apple.com/design/human-interface-guidelines/color) - System colors

---

**Status:** Ready for design phase  
**Recommended Next Action:** Design Option 1 (Letter P with gradient)  
**Timeline:** 2-4 hours for design + export
