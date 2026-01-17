# Exact Alarm Permission Fix

## The Problem

Your app "Manifestation Alarm" is **not appearing in the "Alarms & reminders" settings list** on Android 12+.

### Root Cause

While the permissions are declared in `app.config.js`, the issue is that:

1. ✅ **Manifest has the permission** - Confirmed at line 8 of AndroidManifest.xml
2. ❌ **App can't check permission status** - React Native/Expo doesn't expose `alarmManager.canScheduleExactAlarms()`
3. ⚠️ **Might need clean rebuild** - The installed APK might not have the latest manifest

## What Gemini Was Right About

### 1. Manifest Permission ✅ (Already Fixed)
```xml
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />
```
Both are in your AndroidManifest.xml

### 2. Runtime Permission Check ⚠️ (Partially Implemented)
Gemini suggested:
```kotlin
if (!alarmManager.canScheduleExactAlarms()) {
    // Open settings
}
```

**What I Did:**
- Created `AndroidAlarmPermissions.ts` to detect Android 12+
- Used the correct intent: `android.settings.REQUEST_SCHEDULE_EXACT_ALARM`
- Opens the exact alarm settings page directly

**What's Still Missing:**
- Can't actually check `canScheduleExactAlarms()` from JavaScript
- Currently assumes permission is NOT granted on Android 12+

### 3. Correct Intent ✅ (Fixed)
Changed from:
- ❌ `Linking.openSettings()` (opens general app settings)
- ✅ `'android.settings.REQUEST_SCHEDULE_EXACT_ALARM'` (opens exact alarm settings)

## What I Implemented

### Files Created/Modified:

1. **`src/utils/AndroidAlarmPermissions.ts`**
   - Detects Android 12+ (API 31+)
   - Opens correct settings page
   - Handles battery optimization settings

2. **`src/components/AlarmPermissionGuard.tsx`**
   - Uses the new utility
   - Only shows exact alarm permission on Android 12+
   - Opens correct settings page when clicked

3. **`plugins/withExactAlarmPermission.js`**
   - Ensures permissions are in manifest
   - Config plugin for Expo prebuild

4. **Installed `expo-intent-launcher`**
   - Required to open Android-specific settings

## Why App Doesn't Show in List

There are 3 possible reasons:

### Reason 1: App Not Rebuilt After Permission Added
**Solution:**
```bash
# Clean and regenerate native files
npx expo prebuild --clean

# Build new version
eas build --platform android --profile production
```

### Reason 2: Need to Uninstall Old Version
**Solution:**
```bash
# Completely uninstall the old app
# Then install the new APK/AAB
```

### Reason 3: Android Hasn't Recognized the Permission Yet
**Solution:**
- After installing the new version, open the app
- Try to create an alarm
- Android should then recognize the app needs this permission

## Next Steps (DO NOT BUILD YET - User Requested)

When you're ready to build:

1. **Clean Prebuild:**
   ```bash
   npx expo prebuild --clean
   ```

2. **Verify Manifest:**
   ```bash
   grep "SCHEDULE_EXACT_ALARM" android/app/src/main/AndroidManifest.xml
   ```
   Should show both SCHEDULE_EXACT_ALARM and USE_EXACT_ALARM

3. **Build New Version:**
   ```bash
   eas build --platform android --profile production
   ```

4. **Install and Test:**
   - Completely uninstall old version
   - Install new APK/AAB
   - Open app and go through alarm setup
   - Click "Open Settings" for "Alarms & Reminders"
   - Should take you directly to the exact alarm page
   - Enable the permission
   - Your app should now appear in the list

## Expected Behavior After Fix

### Before Fix:
- "Open Settings" → General app settings (screenshot 3)
- App not in "Alarms & reminders" list (screenshot 4-5)

### After Fix:
- "Open Settings" → "Alarms & reminders" page directly (screenshot 4-5)
- "Manifestation Alarm" appears in the list with toggle
- User can enable/disable exact alarm permission

## Comparison: Gemini vs Implementation

| Item | Gemini Suggested | What I Implemented | Status |
|------|-----------------|-------------------|--------|
| Manifest Permission | Add `SCHEDULE_EXACT_ALARM` | Already in manifest + added config plugin | ✅ Done |
| Android 13 Permission | Add `USE_EXACT_ALARM` | Already in manifest + added to plugin | ✅ Done |
| Runtime Check | Check `canScheduleExactAlarms()` | Can't do from React Native - assume false on Android 12+ | ⚠️ Workaround |
| Correct Intent | Use `ACTION_REQUEST_SCHEDULE_EXACT_ALARM` | Used string `'android.settings.REQUEST_SCHEDULE_EXACT_ALARM'` | ✅ Done |

## Files Changed

- ✅ `src/utils/AndroidAlarmPermissions.ts` (Created)
- ✅ `src/components/AlarmPermissionGuard.tsx` (Updated)
- ✅ `plugins/withExactAlarmPermission.js` (Created)
- ✅ `app.config.js` (Added plugin, updated version)
- ✅ `package.json` (Added expo-intent-launcher)

## Version Updates

- Version: 1.0.10 → 1.0.11
- Version Code: 11 → 12

---

**Ready to build when you say the word!** Just say "build now" and I'll trigger the EAS build.
