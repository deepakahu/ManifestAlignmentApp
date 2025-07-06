# Manifestation Alarm - Asset Guidelines

## 📱 App Icon Requirements

### iOS App Store
- **Size**: 1024x1024px
- **Format**: PNG (no transparency)
- **File**: `assets/images/icons/app-icon-1024.png`
- **Requirements**: 
  - No rounded corners (iOS handles this)
  - No text overlays
  - High contrast and clear at small sizes

### Google Play Store
- **Size**: 512x512px
- **Format**: PNG (32-bit with transparency support)
- **File**: `assets/images/icons/app-icon-512.png`
- **Requirements**:
  - Can include transparency
  - Should work well on various backgrounds

### Android Adaptive Icon
- **Size**: 192x192px (foreground layer)
- **Format**: PNG with transparency
- **File**: `assets/images/icons/app-icon-192.png`
- **Requirements**:
  - Foreground should be centered in 72x72dp safe zone
  - Background will be handled by adaptive-icon.png
  - Must work with various mask shapes (circle, square, rounded square)

### iOS Device Icons
- **Size**: 180x180px (iPhone)
- **Format**: PNG
- **File**: `assets/images/icons/app-icon-180.png`
- **Requirements**:
  - Used for home screen display
  - Should be crisp and recognizable at small sizes

### Web Favicon
- **Size**: 32x32px or 64x64px
- **Format**: PNG or ICO
- **File**: `assets/images/icons/favicon.png`
- **Requirements**:
  - Simple, recognizable design
  - Works well in browser tabs

## 📺 Splash Screen Requirements

### iPhone (Portrait)
- **Size**: 1242x2688px (iPhone Pro Max)
- **Format**: PNG
- **File**: `assets/images/splash/splash-1242x2688.png`
- **Requirements**:
  - Center-focused design
  - Works across different iPhone screen sizes
  - App logo/branding prominently displayed

### Android (Portrait)
- **Size**: 1080x1920px (Full HD)
- **Format**: PNG
- **File**: `assets/images/splash/splash-1080x1920.png`
- **Requirements**:
  - Adaptable to various Android screen densities
  - Center-safe design that works on different aspect ratios

## 📸 Store Screenshots Directory

### Structure
```
assets/images/screenshots/
├── ios/
│   ├── iphone-6.5/     # iPhone Pro Max screenshots
│   ├── iphone-5.5/     # iPhone Plus screenshots
│   └── ipad-12.9/      # iPad Pro screenshots
└── android/
    ├── phone/          # Android phone screenshots
    └── tablet/         # Android tablet screenshots
```

### Requirements
- **iOS**: Minimum 3 screenshots, maximum 10
- **Android**: Minimum 2 screenshots, maximum 8
- **Formats**: PNG or JPEG
- **Content**: Show key app features and functionality

## 🎨 Design Guidelines

### Color Palette
- **Primary**: #6366f1 (Indigo) - Used for main branding
- **Background**: #ffffff (White) - Clean, minimal background
- **Accent**: #10b981 (Emerald) - Success states, positive actions
- **Text**: #1f2937 (Dark Gray) - Primary text color

### Typography
- **App Name**: Clean, modern sans-serif font
- **Tagline**: "Mindful Alarms for Manifestation & Mood Tracking"
- **Style**: Minimalist, wellness-focused aesthetic

### Icon Design Principles
1. **Simplicity**: Clean, uncluttered design that's recognizable at small sizes
2. **Relevance**: Incorporates alarm/notification and mindfulness/wellness elements
3. **Uniqueness**: Stands out in app stores while fitting wellness category
4. **Scalability**: Works well from 16x16px to 1024x1024px
5. **Platform Consistency**: Follows iOS and Android design guidelines

### Suggested Icon Elements
- **Alarm/Time**: Clock, bell, or notification symbols
- **Mindfulness**: Meditation symbols, zen circles, or calm imagery
- **Manifestation**: Stars, sparkles, or growth symbols
- **Color Harmony**: Use the app's primary color palette

## 🔧 Technical Specifications

### File Naming Convention
- Use descriptive, consistent naming
- Include size in filename for clarity
- Use lowercase with hyphens: `app-icon-1024.png`

### Optimization
- **Compression**: Optimize PNG files for size without quality loss
- **Color Space**: Use sRGB color space for consistency
- **Transparency**: Only use where supported (Android adaptive, web favicon)

### Testing
- Test icons on various device sizes and backgrounds
- Verify splash screens display correctly on different screen ratios
- Check icon clarity at small sizes (notification bar, settings)

## 📝 Asset Checklist

### Required for Store Submission
- [ ] App icon 1024x1024 (iOS App Store)
- [ ] App icon 512x512 (Google Play Store)
- [ ] Adaptive icon 192x192 (Android)
- [ ] iPhone splash screen
- [ ] Android splash screen
- [ ] Store screenshots (minimum required)

### Recommended Additional Assets
- [ ] Various iOS device icons (60x60, 120x120, 180x180)
- [ ] Android launcher icons (48x48, 72x72, 96x96, 144x144, 192x192)
- [ ] Notification icons (Android)
- [ ] Web favicon variations

### Quality Assurance
- [ ] Icons display correctly in development
- [ ] Splash screens show properly on target devices
- [ ] All assets follow platform guidelines
- [ ] Colors are consistent across all assets
- [ ] File sizes are optimized for app bundle

## 🚀 Implementation Steps

1. **Create Design Assets**: Use the specifications above
2. **Place in Correct Directories**: Follow the established folder structure
3. **Update Configuration**: Ensure app.json and app.config.js reference correct paths
4. **Test on Devices**: Verify display across iOS and Android
5. **Optimize Bundle**: Compress images appropriately
6. **Store Submission**: Use assets for app store listings

---

**Note**: This guide ensures your Manifestation Alarm app meets all platform requirements for successful app store submission and provides an excellent user experience across all devices.