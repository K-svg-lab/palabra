# SegmentedControl Alignment - Dev Tools Verification Guide

**Date**: February 6, 2026  
**Issue**: Tab content not perfectly centered within sliding background  
**Status**: Fix deployed, awaiting verification

---

## 🔍 **How to Inspect in Browser Dev Tools**

### **Step 1: Open Dev Tools**
1. Go to https://palabra-nu.vercel.app/settings
2. Press `F12` (or `Cmd+Option+I` on Mac)
3. Click "Elements" tab

### **Step 2: Locate SegmentedControl**
1. Use Element Picker (top-left icon in dev tools)
2. Click on any tab (Account, Notif, Tags, Data, Sync)
3. You should see HTML structure like:

```html
<div class="relative flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
  <!-- Sliding background -->
  <div class="absolute ... bg-white dark:bg-gray-900 rounded-lg"></div>
  
  <!-- Tab buttons -->
  <button class="relative z-10 flex items-center justify-center ...">
    <span class="flex items-center justify-center gap-1.5">
      <span>🔔</span> <!-- icon -->
      <span class="whitespace-nowrap">Notif</span>
    </span>
  </button>
</div>
```

### **Step 3: Check Computed Styles**

**For Each Tab Button:**
1. Click on a `<button>` element
2. Go to "Computed" tab (right side of dev tools)
3. Check these values:

```
✅ display: flex
✅ align-items: center
✅ justify-content: center
✅ flex: 1 1 0% (equal width)
✅ padding: 10px 12px (0.625rem 0.75rem)
```

**For Sliding Background (motion.div):**
1. Click on the background `<div>` (with `position: absolute`)
2. Check "Computed" tab:

```
✅ position: absolute
✅ left: [should match tab position]
✅ width: calc(20% - 0.5rem) [for 5 tabs]
✅ top: 0.25rem
✅ bottom: 0.25rem
```

### **Step 4: Measure Alignment Visually**

**Use Browser Measurement Tools:**

**Chrome:**
1. Press `Ctrl+Shift+C` (Element Picker)
2. Hover over a tab button
3. You'll see:
   - Blue box: Content area
   - Green box: Padding
   - Orange box: Margin

**Visual Check:**
- Icon + text should be **perfectly centered** in blue box
- Sliding background should **exactly align** with button edges

**Firefox:**
- Similar to Chrome
- Use Layout tab to see box model diagram

---

## 📊 **What to Look For**

### **✅ GOOD Alignment**

```
┌────────────────────────┐
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │ ← Background
│  │    🔔 Notif    │  │ ← Content centered
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
└────────────────────────┘
   ↑                  ↑
   Equal padding left/right
```

### **❌ BAD Alignment**

```
┌────────────────────────┐
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │ ← Background
│  │  🔔 Notif      │  │ ← Content off-center!
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
└────────────────────────┘
   ↑                    ↑
   Unequal spacing
```

---

## 🎯 **Specific Checks**

### **Tab Width Equality**

**All 5 tabs should have identical computed width:**

```javascript
// In browser console:
document.querySelectorAll('[role="tab"]').forEach(tab => {
  console.log(tab.textContent, tab.offsetWidth);
});

// Expected output (example):
// Account 123.2px
// Notif   123.2px
// Tags    123.2px
// Data    123.2px
// Sync    123.2px
```

### **Background Position Alignment**

**Background left position should match tab boundaries:**

```javascript
// Get active tab index and check background position
const activeTab = document.querySelector('[aria-selected="true"]');
const background = document.querySelector('.absolute.bg-white.dark\\:bg-gray-900');
const tabWidth = activeTab.offsetWidth;
const bgLeft = background.getBoundingClientRect().left;
const tabLeft = activeTab.getBoundingClientRect().left;

console.log('Tab left:', tabLeft);
console.log('Background left:', bgLeft);
console.log('Difference:', Math.abs(tabLeft - bgLeft), 'px');

// Expected: Difference should be < 1px
```

### **Content Centering**

**Icon + text should be centered within each button:**

```javascript
// Check if content is centered
const tab = document.querySelector('[role="tab"]');
const content = tab.querySelector('span span'); // nested span
const tabRect = tab.getBoundingClientRect();
const contentRect = content.getBoundingClientRect();

const tabCenter = tabRect.left + (tabRect.width / 2);
const contentCenter = contentRect.left + (contentRect.width / 2);

console.log('Tab center:', tabCenter);
console.log('Content center:', contentCenter);
console.log('Difference:', Math.abs(tabCenter - contentCenter), 'px');

// Expected: Difference should be < 2px
```

---

## 📸 **Screenshot Guide**

**Please capture these views:**

1. **Full SegmentedControl** - All tabs visible
2. **With "Account" selected** - Show background alignment
3. **With "Data" selected** - Show background alignment
4. **Dev Tools "Elements" tab** - Show HTML structure
5. **Dev Tools "Computed" tab** - Show flex properties
6. **Dev Tools "Layout" tab** (if available) - Show box model

---

## 🐛 **Common Issues to Check**

### **Issue 1: Unequal Tab Widths**
**Symptom**: Tabs have different widths  
**Check**: All tabs should have `flex: 1 1 0%`  
**Fix**: Ensure no `min-width` or `max-width` constraints

### **Issue 2: Background Doesn't Match Tabs**
**Symptom**: Sliding background misaligned  
**Check**: Background `left` calculation  
**Fix**: Verify `calc(${activeIndex * 20}% + 0.25rem)`

### **Issue 3: Content Not Centered**
**Symptom**: Icon/text appears off-center  
**Check**: Button has `justify-content: center`  
**Fix**: Ensure nested span has proper flex centering

### **Issue 4: Different Padding**
**Symptom**: Inconsistent spacing  
**Check**: All tabs have same `px-3 sm:px-4 py-2.5`  
**Fix**: Verify Tailwind classes applied correctly

---

## ✅ **Success Criteria**

**The fix is successful if:**

1. ✅ All 5 tabs have **identical width** (within 0.1px)
2. ✅ Sliding background **perfectly aligns** with active tab edges
3. ✅ Icon + text **centered** within each tab (within 2px)
4. ✅ Background **smoothly animates** between tabs
5. ✅ No **visual misalignment** when switching tabs
6. ✅ Works on **mobile and desktop** breakpoints

---

## 📝 **Expected Computed Values**

### **Tab Button**
```css
display: flex;
align-items: center;
justify-content: center;
flex: 1 1 0%;
position: relative;
z-index: 10;
padding: 10px 12px; /* py-2.5 px-3 on mobile */
font-size: 0.75rem; /* text-xs on mobile */
```

### **Content Wrapper (nested span)**
```css
display: flex;
align-items: center;
justify-content: center;
gap: 0.375rem; /* gap-1.5 */
```

### **Sliding Background**
```css
position: absolute;
top: 0.25rem;
bottom: 0.25rem;
left: calc(0% + 0.25rem); /* for first tab */
width: calc(20% - 0.5rem); /* 100% / 5 tabs */
border-radius: 0.5rem;
background: white;
box-shadow: 0 1px 2px rgba(0,0,0,0.05);
```

---

## 🔧 **If Still Misaligned**

**Try these advanced checks:**

1. **Sub-pixel rendering**: Check if browser is rounding differently
   ```javascript
   getComputedStyle(tab).width // Might show .5px values
   ```

2. **Font metrics**: Different fonts can affect centering
   ```javascript
   getComputedStyle(tab).fontFamily
   getComputedStyle(tab).lineHeight
   ```

3. **Icon size**: Verify icon is exactly 16px × 16px
   ```javascript
   const icon = tab.querySelector('span:first-child');
   console.log(icon.offsetWidth, icon.offsetHeight);
   ```

4. **Zoom level**: Ensure browser zoom is 100%
   ```javascript
   window.devicePixelRatio // Should be 1 at 100% zoom
   ```

---

## 🚀 **Next Steps After Verification**

**If aligned correctly:**
- ✅ Mark as complete
- ✅ Update Settings page score to 9.9/10
- ✅ Move to next page assessment

**If still misaligned:**
- Share screenshots with measurements
- Share computed style values
- I'll provide targeted fix based on data

---

## 📚 **Resources**

**Browser Dev Tools Guides:**
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Firefox Developer Tools](https://firefox-source-docs.mozilla.org/devtools-user/)
- [Safari Web Inspector](https://developer.apple.com/safari/tools/)

**Flexbox Debugging:**
- [CSS Tricks Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- [MDN Flexbox](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout)

---

**Ready to inspect after Vercel deployment!** 🔍
