# Voice Input Quick Guide 🎤

**Quick reference for using voice input in Palabra**

---

## How to Use Voice Input

### 1. Navigate to Vocabulary Page
Go to the **Vocabulary** tab in the app.

### 2. Click the Microphone Button
Look for the microphone icon 🎤 inside the search field.

### 3. Grant Microphone Permission
- **First time:** Browser will ask for microphone access
- Click "Allow" to enable voice input
- Permission persists for future use

### 4. Speak Your Word
- Button turns red and pulses when listening
- Speak clearly: "perro", "gato", "casa", etc.
- Works with both Spanish and English words
- Single words work best

### 5. Automatic Actions
- **New word:** Add word modal opens automatically
- **Existing word:** Search filters to show the word
- Word appears in search field as you speak

### 6. Stop Listening
- Click microphone button again to stop
- Or wait - it stops automatically after a short pause

---

## Visual Indicators

### Idle State
- **Gray microphone icon** - Ready to use
- Hover shows "Start voice input"

### Listening State
- **Red pulsing icon** - Recording active
- Status message: "Listening... Speak now"
- Button label: "Stop recording"

### Error State
- **Red error message** below search field
- Common errors and solutions shown

---

## Supported Browsers

✅ **Chrome** (Desktop & Mobile) - Best support  
✅ **Edge** (Desktop & Mobile) - Full support  
✅ **Safari** (iOS 14.5+, MacOS 14.1+) - Good support  
⚠️ **Firefox** - Limited support  
❌ **Other browsers** - Button hidden automatically

---

## Tips for Best Results

### 1. Speak Clearly
- Normal speaking volume
- Clear pronunciation
- Not too fast or too slow

### 2. Reduce Background Noise
- Find a quiet environment
- Minimize ambient sounds
- Pause music/videos

### 3. Single Words
- Say one word at a time
- Avoid full sentences
- Pause between attempts

### 4. Check Microphone
- Ensure microphone is working
- Check browser permissions
- Test in other apps first

---

## Common Issues

### Microphone Button Not Visible
**Problem:** Button doesn't appear  
**Cause:** Browser doesn't support voice input  
**Solution:** Use Chrome, Edge, or Safari  
**Workaround:** Type words normally

### Permission Denied
**Problem:** "Microphone access denied" error  
**Cause:** Browser permissions blocked  
**Solution:**
1. Click lock/info icon in address bar
2. Find microphone permission
3. Change to "Allow"
4. Refresh page

### Poor Recognition
**Problem:** Wrong words recognized  
**Cause:** Unclear speech or background noise  
**Solutions:**
- Speak more clearly
- Reduce background noise
- Check microphone quality
- Try typing instead

### No Speech Detected
**Problem:** "No speech detected" error  
**Cause:** Too quiet or microphone issue  
**Solutions:**
- Speak louder
- Check microphone is unmuted
- Test microphone in settings
- Grant microphone permission

---

## Privacy & Security

### What's Shared
- **Chrome/Edge:** Audio sent to Google for processing
- **Safari:** Processes on-device when possible
- **No storage:** Transcripts discarded after use

### What's Not Shared
- Audio is not saved anywhere
- Transcripts are temporary
- No personal data collected
- All vocabulary stored locally

### How to Disable
1. Revoke microphone permission in browser
2. Button will show permission error
3. Can re-enable anytime
4. Typing still works normally

---

## Keyboard Shortcuts

| Action | Desktop | Mobile |
|--------|---------|--------|
| Start voice input | Click mic button | Tap mic button |
| Stop listening | Click mic again | Tap mic again |
| Focus search | Tab to field | Tap field |
| Submit word | Enter key | Go button |

---

## Technical Details

### Web Speech API
- Browser-native speech recognition
- No external API required
- Supports 100+ languages
- Automatic language detection

### Language Support
- **Spanish (Spain):** es-ES (default)
- **English (US):** en-US
- Auto-detection between Spanish and English

### Requirements
- HTTPS (production) or localhost (development)
- Microphone permission
- Internet connection (most browsers)
- Modern browser (see supported list above)

---

## Examples

### Adding Spanish Words
1. Click microphone 🎤
2. Say: "perro" → Auto-opens add word modal
3. Say: "gato" → Auto-opens add word modal
4. Say: "casa" → Auto-opens add word modal

### Searching Existing Words
1. Click microphone 🎤
2. Say word that's already in your vocabulary
3. Search filters to show that word
4. Click to edit or review

### English Translations
1. Click microphone 🎤
2. Say English word: "dog"
3. Searches for words with that translation
4. Shows matching vocabulary items

---

## Troubleshooting Checklist

- [ ] Using supported browser (Chrome, Edge, Safari)?
- [ ] Microphone permission granted?
- [ ] Microphone working in other apps?
- [ ] Background noise minimized?
- [ ] Speaking clearly and at normal volume?
- [ ] Internet connection active?
- [ ] HTTPS site (not HTTP)?
- [ ] Tried refreshing the page?

---

## Getting Help

### Still Not Working?
1. Check browser console for errors (F12)
2. Try different browser
3. Test microphone in system settings
4. Clear browser cache and cookies
5. Contact support with details

### Alternative Input Methods
- **Keyboard:** Type normally in search field
- **Copy/Paste:** Paste words from elsewhere
- **Import:** Bulk import via CSV file

---

## Feature Comparison

| Method | Speed | Accuracy | Convenience | Best For |
|--------|-------|----------|-------------|----------|
| Voice Input | ⚡⚡⚡ Fast | ⭐⭐⭐ Good | 🎯 High | Mobile, Quick entry |
| Keyboard | ⚡⚡ Medium | ⭐⭐⭐⭐ Excellent | 🎯 Medium | Desktop, Precise entry |
| Copy/Paste | ⚡⚡⚡ Fast | ⭐⭐⭐⭐ Excellent | 🎯 Low | Bulk entry |

---

## Inspiration

Inspired by voice input implementations in:
- **Google Translate** - Seamless voice translation
- **Linguee** - Dictionary voice search
- **Duolingo** - Voice pronunciation practice

---

## Feedback

Have suggestions for improving voice input?
- More languages
- Better accuracy
- Additional features
- UI improvements

Let us know! Your feedback helps make Palabra better.

---

**Last Updated:** February 1, 2026  
**Feature Version:** Phase 14  
**Status:** ✅ Live in production

---

## Quick Links

- [Full Documentation](./PHASE14_VOICE_INPUT.md)
- [Technical Implementation](./lib/hooks/use-voice-input.ts)
- [Web Speech API Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Browser Support](https://caniuse.com/speech-recognition)
