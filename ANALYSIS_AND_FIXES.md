# Analysis: Alarm and 16KB Issues - Verification and Fixes

## Executive Summary

After reviewing Claude's handover document and the codebase, I've identified the root causes and will implement proper fixes.

## Issue 1: Alarms Not Ringing - ROOT CAUSE IDENTIFIED ✅

### Problem
- Alarms don't ring at scheduled times
- App doesn't appear in Android "Alarms & reminders" settings
- App is being deep-slept by Android

### Root Cause
**`expo-notifications` is NOT designed for alarm clocks.** It's designed for push notifications and uses:
- `WorkManager` for background scheduling (unreliable for exact alarms)
- `AlarmManager.set()` instead of `AlarmManager.setExactAndAllowWhileIdle()`
- Does NOT use `AlarmManager.setAlarmClock()` which is required to show in system alarm settings

### Evidence
1. **AndroidManifest.xml** ✅ Has all permissions correctly declared
2. **AlarmNotificationService.ts** ❌ Uses `Notifications.scheduleNotificationAsync()` from expo-notifications
3. **No native AlarmManager code** ❌ No Java/Kotlin code using AlarmManager API
4. **Missing alarm capability declaration** ❌ App doesn't declare it can schedule alarms

### Solution
Replace `expo-notifications` alarm scheduling with `@notifee/react-native` which:
- Uses native `AlarmManager.setExactAndAllowWhileIdle()` for reliable alarms
- Supports `AlarmManager.setAlarmClock()` to show in system alarm settings
- Bypasses Doze mode and battery optimization
- Works even when app is closed

---

## Issue 2: 16KB Page Size Support - ROOT CAUSE IDENTIFIED ✅

### Problem
Build 1.0.20 failed: 28 out of 30 libraries have `align 2**12` instead of `align 2**14`

### Root Cause
**Pre-compiled native libraries in `node_modules` are compiled with old NDK versions:**
- `libreactnative.so` - React Native core (pre-built)
- `libhermes.so` - Hermes JS engine (pre-built)
- `libexpo-modules-core.so` - Expo framework (pre-built)
- All Fresco image libraries (pre-built)
- `libc++_shared.so` - C++ standard library (pre-built)

Setting `ANDROID_NDK_VERSION: "28.0.12433566"` only affects:
- ✅ New native code compilation
- ❌ Does NOT affect pre-built libraries from npm packages

### Solution Options

#### Option 1: Wait for Library Updates (Recommended)
- React Native 0.76.9 may not have 16KB-compatible pre-built libraries
- Wait for React Native 0.77+ or Expo SDK 52+ updates
- Check if newer versions have 16KB-compatible libraries

#### Option 2: Rebuild Native Libraries (Complex)
- Requires building React Native from source with NDK r28
- Very complex and time-consuming
- May break Expo compatibility

#### Option 3: Use Alignment Tool (Workaround)
- Use `zipalign` or similar tools to repack libraries
- May not work for all libraries
- Google Play may still reject if alignment is wrong

#### Option 4: Check if Google Play Actually Rejects
- Sometimes Google Play accepts apps with `align 2**12` if they work
- Test submission to see if it's actually rejected
- May be a false positive in verification script

### Recommended Action
1. **First**: Check if Google Play actually rejects the build (may be false positive)
2. **Second**: Upgrade to latest React Native/Expo if available
3. **Third**: If still failing, consider Option 2 (rebuild from source)

---

## Files That Need Changes

### For Alarm Fix:
1. ✅ `package.json` - Add `@notifee/react-native` dependency
2. ✅ `src/services/notifications/AlarmNotificationService.ts` - Replace expo-notifications with @notifee
3. ✅ `app.config.js` - Add @notifee plugin if needed
4. ✅ Create native AlarmManager service (if @notifee doesn't support setAlarmClock)

### For 16KB Fix:
1. ⚠️ `package.json` - Check for React Native/Expo updates
2. ⚠️ `android/build.gradle` - Already has NDK r28 (correct)
3. ⚠️ May need to wait for library updates

---

## Implementation Plan

### Phase 1: Fix Alarm Functionality (HIGH PRIORITY)
1. Install `@notifee/react-native`
2. Update `AlarmNotificationService` to use @notifee
3. Implement `setAlarmClock()` for system alarm list appearance
4. Test on physical device

### Phase 2: Verify 16KB Issue (MEDIUM PRIORITY)
1. Check if Google Play actually rejects the build
2. Check for React Native/Expo updates
3. If needed, implement workaround or wait for updates

---

## Verification Checklist

### Alarm Functionality:
- [ ] App appears in Android "Alarms & reminders" settings
- [ ] Alarms ring at exact scheduled time
- [ ] Alarms work when app is closed
- [ ] Alarms work when device is in Doze mode
- [ ] Alarms bypass battery optimization

### 16KB Support:
- [ ] Verify if Google Play actually rejects (may be false positive)
- [ ] Check alignment of built AAB
- [ ] Test on 16KB page size device if available
- [ ] Monitor for React Native/Expo updates
