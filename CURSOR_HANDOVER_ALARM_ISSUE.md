# URGENT: Alarm + 16KB Issues Not Fixed - Handover to Cursor

## Critical Issues (BOTH UNFIXED)

### Issue 1: Alarms Not Ringing ⚠️ CRITICAL
**Alarms are not ringing on scheduled time despite all configurations being in place.**

Evidence from User Screenshots:
1. **Alarm scheduled for 11:00 AM did not ring** - Shows "Overdue" in app
2. **App NOT appearing in Android "Alarms and reminders" settings**
   - Only shows "Manifest Goals - Using T..." (enabled)
   - "Money Manifestation" app appears but our app should be there too
3. **App shows "Deep sleeping" status** - Android is putting app to sleep and killing alarms

### Issue 2: 16 KB Page Size Support STILL FAILING ⚠️ CRITICAL
**Build 1.0.20 FAILED alignment verification - 28 out of 30 libraries have align 2**12**

Verification Results:
```
❌ FAIL: 28 libraries with align 2**12 (NOT 16 KB compatible)
✅ PASS: 2 libraries with align 2**14 (only libandroidx.graphics.path.so)
```

**This means Google Play will REJECT this build again.**

## Current Build Status
- **Version:** 1.0.20 (versionCode 21)
- **Build Status:** ✅ COMPLETED (Build ID: 2529e110-45d3-447e-ad74-d83a259d2cf9)
- **AAB:** https://expo.dev/artifacts/eas/5AaN77Dr784uCBi8sQzHXp.aab
- **16KB Verification:** ❌ FAILED
- **Platform:** Android (React Native + Expo)

---

## What Claude Attempted to Fix (16KB STILL BROKEN)

### 1. Attempted 16 KB Page Size Support (FAILED)
**Problem:** Build 1.0.17 failed Google Play validation with "Your app does not support 16 KB memory page sizes"

**Root Cause (Initially Identified):** EAS Build was using old NDK, all .so files had `align 2**12` instead of `align 2**14`

**Fixes Applied (DID NOT WORK):**
- ❌ Added `ANDROID_NDK_VERSION: "28.0.12433566"` to [eas.json:35](eas.json#L35) - **EAS confirmed loading but didn't fix alignment**
- ❌ Added `abiFilters "arm64-v8a", "x86_64"` to [android/app/build.gradle:98-100](android/app/build.gradle#L98-L100) - **Didn't help**
- ❌ Set AGP 8.7.3 explicitly in [android/build.gradle:18](android/build.gradle#L18) - **Didn't help**
- ❌ Confirmed `useLegacyPackaging = false` in [android/gradle.properties:56](android/gradle.properties#L56) - **Didn't help**
- ❌ Added `noCompress 'so'` to [android/app/build.gradle:126](android/app/build.gradle#L126) - **Didn't help**
- ✅ Created alignment verification script at `/tmp/check_elf_alignment.sh` - **This works and confirmed the problem**

**Why It Failed:**
Build 1.0.20 output shows:
```
Environment variables loaded: GRADLE_OPTS, ANDROID_NDK_VERSION
```
So EAS IS using NDK r28, but the libraries are STILL misaligned.

**Real Root Cause:** The pre-compiled native libraries in `node_modules` from React Native, Expo, and Hermes are compiled with old NDK and have wrong alignment. Setting ANDROID_NDK_VERSION only affects NEW native code compilation, not pre-built dependencies.

**Failed Libraries (align 2**12):**
- `libreactnative.so` - React Native core
- `libhermes.so` - Hermes JS engine
- `libexpo-modules-core.so` - Expo framework
- `libjsi.so` - JavaScript Interface
- `libfbjni.so` - Facebook JNI
- `librnscreens.so` - React Navigation
- All Fresco image libraries
- libc++_shared.so - C++ standard library

### 2. Fixed RevenueCat Production API Key
**Problem:** App was using test API key `test_1yp6hdIBqgZUsvkvIcZTTfcewhI` instead of production key

**Root Cause:** `process.env` doesn't work in React Native production builds

**Fixes Applied:**
- ✅ Added API key to [app.config.js:101-102](app.config.js#L101-L102) in `extra` section
- ✅ Updated [src/config/revenuecat.config.ts:25](src/config/revenuecat.config.ts#L25) to use `Constants.expoConfig.extra.revenueCatAndroidApiKey`
- ✅ Production key from `.env`: `goog_xOYaIIZxNkhfUlWxFzydGV5CAHT`

---

## CRITICAL ALARM ISSUE (NOT FIXED - NEEDS CURSOR)

### Problem Description
Despite all alarm configurations, notifications, and permissions being set up:
1. **Alarms don't ring at scheduled time**
2. **App doesn't appear in Android "Alarms & reminders" settings**
3. **Android is deep sleeping the app** (killing background processes)

### What's Been Implemented (But Not Working)

#### Permissions in [app.config.js:34-41](app.config.js#L34-L41):
```javascript
permissions: [
  "android.permission.VIBRATE",
  "android.permission.WAKE_LOCK",
  "android.permission.RECEIVE_BOOT_COMPLETED",
  "android.permission.SCHEDULE_EXACT_ALARM",
  "android.permission.USE_EXACT_ALARM",
  "android.permission.POST_NOTIFICATIONS",
  "android.permission.USE_FULL_SCREEN_INTENT"
]
```

#### Manifest Properties Added:
1. **16KB Support:** [plugins/withAndroid16KBSupport.js](plugins/withAndroid16KBSupport.js)
2. **Exact Alarm Permission:** [plugins/withExactAlarmPermission.js](plugins/withExactAlarmPermission.js)
3. **Window Flags for Alarms:** [plugins/withAlarmWindowFlags.js](plugins/withAlarmWindowFlags.js)

#### Alarm Service Implementation:
- **AlarmService:** [src/services/AlarmService.ts](src/services/AlarmService.ts)
- **AlarmNotificationService:** [src/services/notifications/AlarmNotificationService.ts](src/services/notifications/AlarmNotificationService.ts)
  - High-priority channel configured (lines 94-136)
  - `importance: MAX`
  - `bypassDnd: true`
  - Proper notification scheduling

#### Permission Utilities:
- **AndroidAlarmPermissions:** [src/utils/AndroidAlarmPermissions.ts](src/utils/AndroidAlarmPermissions.ts)
  - Methods to check and request exact alarm permissions
  - `openExactAlarmSettings()` - Opens Android settings
  - `openBatteryOptimizationSettings()` - Prevents deep sleep

#### Diagnostics Tools:
- **AlarmDiagnostics:** [src/utils/alarmDiagnostics.ts](src/utils/alarmDiagnostics.ts)
  - Comprehensive permission checks
  - Channel verification
  - Quick test alarm (10 seconds)
  - Auto-fix functionality

### User Experience Issues

From the screenshots:
1. **Alarm shows "Overdue" but never rang** - Scheduled for 11:00 AM
2. **App in "Deep sleeping" mode** - Android is killing background processes
3. **Not in "Alarms & reminders" list** - App doesn't have proper alarm capability declaration

---

## What Cursor Needs to Investigate

### Priority 1: Why App Isn't in "Alarms & reminders" Settings

**Expected:** App should appear in Android Settings > Apps that can set alarms and schedule actions

**Actual:** App doesn't appear in this list

**Possible Root Causes:**
1. Missing AndroidManifest.xml declaration for `SCHEDULE_EXACT_ALARM`
2. Not using `AlarmManager` properly (using expo-notifications instead?)
3. Need to use native Android `AlarmManager.setExactAndAllowWhileIdle()` API
4. Expo limitations - may need custom native module

**Investigation Steps:**
```bash
# Check what's in the built AndroidManifest.xml
cd android
./gradlew assembleRelease
# Then inspect android/app/build/outputs/apk/release/AndroidManifest.xml
```

### Priority 2: Deep Sleeping Issue

**Problem:** Android is putting app in "Deep sleeping" mode

**Solutions to Verify:**
1. Check if battery optimization is being requested in code
2. Ensure `WAKE_LOCK` permission is properly declared in manifest
3. May need to use `AlarmManager.setAlarmClock()` instead of notifications
4. Check if using proper WorkManager for background tasks

### Priority 3: expo-notifications vs AlarmManager

**Hypothesis:** `expo-notifications` may not be reliable for exact alarms

**Current Implementation:** Uses `expo-notifications` for scheduling
- File: [src/services/notifications/AlarmNotificationService.ts:141-148](src/services/notifications/AlarmNotificationService.ts#L141-L148)
- Method: `Notifications.scheduleNotificationAsync()`

**Alternative Approach:** Use native Android `AlarmManager`
- Requires custom native module or library like `@notifee/react-native`
- Use `AlarmManager.setExactAndAllowWhileIdle()` for guaranteed wake-up
- Use `AlarmManager.setAlarmClock()` for showing in system alarm list

**Recommended Libraries:**
1. `@notifee/react-native` - Full-featured notifications with AlarmManager support
2. `react-native-android-alarm-manager` - Direct AlarmManager access
3. Custom Expo config plugin with native AlarmManager implementation

---

## Files Modified by Claude

### Configuration Files:
- `app.config.js` - Version 1.0.20, RevenueCat keys in extra
- `eas.json` - NDK r28, ANDROID_NDK_VERSION env var
- `android/build.gradle` - AGP 8.7.3, NDK r28
- `android/app/build.gradle` - abiFilters, noCompress, version 1.0.20
- `android/gradle.properties` - useLegacyPackaging=false
- `.env` - RevenueCat production API key

### Source Files:
- `src/config/revenuecat.config.ts` - Use Constants instead of process.env
- `src/services/AlarmService.ts` - Alarm scheduling logic
- `src/services/notifications/AlarmNotificationService.ts` - Notification channel setup
- `src/utils/AndroidAlarmPermissions.ts` - Permission utilities
- `src/utils/alarmDiagnostics.ts` - Diagnostic tools
- `src/screens/Settings/SettingsScreen.tsx` - Settings UI

### Plugin Files (Config Plugins):
- `plugins/withAndroid16KBSupport.js`
- `plugins/withExactAlarmPermission.js`
- `plugins/withAlarmWindowFlags.js`

---

## Verification Script for Cursor

```bash
# 1. Check if expo prebuild includes all permissions
cd /home/deepakahu/Deepak-Projects/ManifestAlignmentApp/ManifestExpo
npx expo prebuild --clean --platform android
cat android/app/src/main/AndroidManifest.xml | grep -A5 "permission"

# 2. Verify alarm scheduling in native code
# Look for AlarmManager usage (should exist but doesn't)
grep -r "AlarmManager" android/

# 3. Check expo-notifications implementation
grep -r "scheduleNotificationAsync" src/

# 4. Build and inspect AAB
eas build --platform android --profile production
# Download AAB and check AndroidManifest.xml inside
```

---

## Recommended Next Steps for Cursor

### Immediate Actions:
1. **Verify AndroidManifest.xml** after expo prebuild
   - Check all alarm permissions are present
   - Verify no duplicate or conflicting permissions
   - Ensure proper uses-permission declarations

2. **Replace expo-notifications with AlarmManager**
   - Install `@notifee/react-native` or create custom module
   - Implement `AlarmManager.setExactAndAllowWhileIdle()`
   - Use `AlarmManager.setAlarmClock()` for system alarm list appearance

3. **Test on Physical Device**
   - Build debug APK
   - Check if app appears in "Alarms & reminders" settings
   - Verify alarm rings even when app is closed
   - Test with different battery optimization settings

4. **Add Native Code if Needed**
   - Create Expo config plugin for AlarmManager
   - Or use bare workflow for direct native access

### Long-term Solution:
The fundamental issue is likely that **expo-notifications is NOT designed for alarm clocks**. It's for push notifications. We need to use Android's native `AlarmManager` API directly.

---

---

## Critical: How to Fix 16 KB Issue for Cursor

### The Problem
Pre-compiled native libraries in `node_modules` are built with old NDK (align 2**12). Setting `ANDROID_NDK_VERSION` only affects NEW code we compile, not dependencies.

### Solution Options

#### Option 1: Wait for Expo SDK Update (RECOMMENDED)
Expo is working on 16 KB support. Check https://github.com/expo/expo/issues for updates.

**Pros:**
- Official support
- No custom modifications needed
- Will work with managed workflow

**Cons:**
- May take weeks/months
- No control over timeline

**Action:** Check if Expo SDK 53 or newer has 16 KB support and upgrade

#### Option 2: Patch Pre-compiled Libraries (RISKY)
Use `patchelf` or `objcopy` to realign existing .so files after build.

```bash
# Example script to patch alignment
find android/app/build/intermediates -name "*.so" -type f | while read lib; do
  patchelf --page-size 16384 "$lib" || true
done
```

**Pros:**
- Quick workaround
- Doesn't require source changes

**Cons:**
- Very risky - may break libraries
- Need to patch after every build
- Not officially supported

**Action:** Only if desperate and for testing only

#### Option 3: Switch to Bare Workflow and Rebuild Dependencies
Eject from Expo managed workflow and compile React Native + dependencies from source with NDK r28.

**Pros:**
- Full control over native build
- Can ensure all libraries use correct NDK

**Cons:**
- Lose Expo managed workflow benefits
- Need to manage native Android/iOS code
- Complex setup and maintenance

**Action:**
1. Run `npx expo prebuild` to generate native projects
2. Modify gradle files to use NDK r28
3. Rebuild all native dependencies from source
4. This may not be feasible as some deps don't publish source

#### Option 4: Use Expo Custom Development Client (BEST FOR NOW)
Build a custom development client that compiles native code with NDK r28.

**Pros:**
- Keep Expo benefits
- More control than managed workflow
- Can add custom native modules

**Cons:**
- More complex than managed workflow
- Still may have pre-compiled dependency issues

**Action:**
1. Add `"developmentClient": true` to eas.json build profile
2. Configure custom native modules
3. May still face same issue with pre-compiled deps

#### Option 5: Wait for Android 16 Release Timeline (TEMPORARY WORKAROUND)
Google Play's 16 KB requirement deadline depends on target SDK level and new app vs update.

**Current Situation:**
- targetSdkVersion 35 (Android 15)
- Requirement started phasing in Nov 2024
- Full enforcement varies by app type

**Action:**
1. Check Google Play Console for exact deadline
2. File for extension if needed
3. Continue working on alarm functionality while waiting

---

## Build Status
- **Current build:** 1.0.20 (COMPLETED)
- **AAB:** https://expo.dev/artifacts/eas/5AaN77Dr784uCBi8sQzHXp.aab
- **16KB Verification:** ❌ FAILED (28/30 libraries misaligned)
- **RevenueCat:** ✅ FIXED (production key properly configured)
- **Alarm functionality:** ❌ NOT WORKING (needs AlarmManager implementation)
- **Google Play Status:** ⚠️ WILL BE REJECTED for 16 KB issue

---

## User's Request
> "I want you to handover to Cursor as issue related to alarm is still not fixed. Even after latest deployment alarms didn't ring on the scheduled time. Manifestation Alarm was supposed to show up in Alarms and reminders Android Setting but it didn't."

**Summary:** All infrastructure is in place (permissions, channels, diagnostics) but alarms don't actually ring because we're using `expo-notifications` instead of native Android `AlarmManager`. Cursor needs to implement proper AlarmManager integration.

---

## Contact Points
- User: Deepak
- Project: Manifestation Alarm App
- Package: com.manifestationalarm.app
- EAS Project: maximus-consult/manifestation-alarm
