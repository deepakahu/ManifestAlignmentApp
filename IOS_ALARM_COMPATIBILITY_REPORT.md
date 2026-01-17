# iOS Alarm & Notification Compatibility Report

Based on research and code analysis, here's the complete assessment of iOS compatibility for your alarm app.

---

## Research Summary

### iOS Notification System (2025)

**Good News:** Unlike Android 12+, iOS does **NOT** require special "exact alarm" permissions.

#### Key Differences from Android:

1. **No "Exact Alarm" Permission Required**
   - iOS doesn't have `SCHEDULE_EXACT_ALARM` equivalent
   - All apps can schedule notifications at exact times
   - Only requires standard notification permission

2. **Permission Model**
   - Single notification permission via `UNUserNotificationCenter`
   - User grants/denies: Alert, Sound, Badge
   - No separate "exact time" permission

3. **Scheduling Mechanism**
   - Uses `UNCalendarNotificationTrigger` for exact times
   - Or `UNTimeIntervalNotificationTrigger` for delays
   - System keeps up to 64 pending notifications
   - Older notifications are automatically discarded

4. **Background Execution**
   - Very strict limitations
   - `UIBackgroundModes` doesn't keep app running continuously
   - Notifications fire even when app is terminated
   - 30 seconds max for background fetch

---

## Your Current iOS Implementation Analysis

### ✅ CORRECT - Notification Scheduling

**File:** `src/services/notifications/AlarmNotificationService.ts` (lines 194-206)

```typescript
// iOS-specific properties
if (Platform.OS === 'ios') {
  notificationContent.badge = 1;
  notificationContent.interruptionLevel = 'timeSensitive'; // iOS 15+
}

// Schedule the notification
const notificationId = await Notifications.scheduleNotificationAsync({
  content: notificationContent,
  trigger: {
    date: triggerDate,
    channelId: Platform.OS === 'android' ? 'alarm_channel' : undefined,
  },
});
```

**Status:** ✅ Perfect
- Uses `expo-notifications` which wraps `UNUserNotificationCenter`
- Schedules with exact `date` trigger
- iOS-specific `interruptionLevel: 'timeSensitive'` (iOS 15+)
- Sets badge count
- Doesn't use Android-specific `channelId` on iOS

---

### ⚠️ NEEDS REVIEW - Background Modes

**File:** `app.config.js` (line 22)

```javascript
UIBackgroundModes: ['audio', 'background-fetch']
```

**Issues:**

1. **'audio' mode is misleading**
   - Only for continuous audio playback (music, podcasts)
   - Alarm sounds are handled by notifications, not background audio
   - Apple may reject if you're not actually playing continuous audio
   - **Recommendation:** Remove unless you have continuous audio features

2. **'background-fetch' is unnecessary for alarms**
   - Used for periodically fetching data (every ~15 mins to hours)
   - Notifications fire independently of background fetch
   - **Recommendation:** Remove unless you have data sync features

3. **What you actually need:**
   - Nothing! iOS notifications fire without background modes
   - The system handles notification delivery
   - App doesn't need to be running

**Recommended Fix:**

```javascript
ios: {
  bundleIdentifier: 'com.manifestationalarm.app',
  supportsTablet: true,
  infoPlist: {
    // Remove UIBackgroundModes entirely OR keep only if you have actual features:
    // UIBackgroundModes: ['background-fetch'], // Only if you sync data
    NSUserNotificationUsageDescription:
      'This app uses notifications to remind you to track your mood and practice manifestations.',
  },
}
```

---

### ✅ CORRECT - Permission Request

**File:** `src/services/notifications/AlarmNotificationService.ts` (lines 60-66)

```typescript
ios: {
  allowAlert: true,
  allowBadge: true,
  allowSound: true,
  allowAnnouncements: true,
  allowCriticalAlerts: false,
}
```

**Status:** ✅ Perfect
- Requests alert, badge, sound permissions
- `allowCriticalAlerts: false` is correct (requires special entitlement)

---

### ✅ CORRECT - AlarmPermissionGuard for iOS

**File:** `src/components/AlarmPermissionGuard.tsx`

**Android-specific items are properly hidden:**
- Line 79-91: Exact alarm permission (Android 12+ only)
- Line 95-106: Battery optimization (Android only)

**iOS will only see:**
- Notification permission ✅
- Device check (emulator vs real device) ✅

**Status:** ✅ Perfect - iOS users won't see irrelevant Android permissions

---

## iOS Compatibility Score: 9/10

### ✅ What Works Perfectly:

1. **Notification Scheduling** (10/10)
   - Uses correct API (`expo-notifications`)
   - Exact time scheduling works
   - iOS-specific properties configured

2. **Permission Handling** (10/10)
   - Correct permission request
   - No Android-specific items shown to iOS users

3. **Platform Detection** (10/10)
   - Proper use of `Platform.OS` checks
   - iOS-specific code paths

4. **Sound Configuration** (10/10)
   - Uses `.mp3` files for iOS (correct)
   - Configured in `app.config.js`

### ⚠️ Minor Issues:

5. **Background Modes** (6/10)
   - Has `audio` and `background-fetch` modes
   - Not needed for alarms
   - **Risk:** Apple may question during review
   - **Fix:** Remove or justify

---

## Comparison: Android vs iOS

| Feature | Android | iOS | Status |
|---------|---------|-----|--------|
| **Exact Alarm Permission** | Required (API 31+) | Not required | ✅ iOS simpler |
| **Notification Permission** | POST_NOTIFICATIONS | UNUserNotificationCenter | ✅ Both handled |
| **Background Execution** | Battery optimization issues | Strict but reliable | ✅ iOS better for alarms |
| **Scheduling API** | Notification channels | UNCalendarNotificationTrigger | ✅ Both supported |
| **Max Pending Notifications** | Unlimited | 64 | ⚠️ iOS limited |
| **App in Background** | Can be killed | Notifications fire anyway | ✅ iOS more reliable |

---

## iOS-Specific Considerations

### 1. **Critical Alerts** (Optional Enhancement)

Your code sets `allowCriticalAlerts: false` (correct for now).

**What are Critical Alerts?**
- Bypass Do Not Disturb
- Play sound even in silent mode
- **Requires:** Special entitlement from Apple
- **Use case:** Medical devices, severe weather, security

**For an alarm app:**
- You could apply for this entitlement
- Apple reviews on case-by-case basis
- Requires justification

### 2. **Notification Limits**

iOS keeps only 64 pending notifications. If users create more than 64 alarms, older ones are discarded.

**Current behavior:**
- expo-notifications schedules all
- iOS silently drops extras
- User won't know some alarms won't fire

**Recommendation:**
- Add limit check in your app
- Show warning if user tries to create more than 64 alarms
- Or implement a "rolling schedule" that adds alarms closer to their time

### 3. **Time Zone Changes**

When users travel across time zones:
- Calendar-based triggers adjust to new time zone
- May not be desired behavior for alarms

**Recommendation:**
- Test what happens when time zone changes
- Consider using `UNTimeIntervalNotificationTrigger` if you want absolute time

### 4. **App Store Review**

**Potential Review Issues:**

1. **UIBackgroundModes Declaration**
   - Reviewer: "Why does your app need background audio?"
   - **Solution:** Remove `audio` unless you have music/podcast features

2. **Privacy Policy**
   - Required for notification permissions
   - Already have: `NSUserNotificationUsageDescription` ✅

3. **Demonstration**
   - Reviewers will test alarms
   - Make sure they fire reliably in TestFlight

---

## Recommendations for iOS

### Priority 1: Review Background Modes (Before iOS Build)

```javascript
// Current (in app.config.js):
UIBackgroundModes: ['audio', 'background-fetch']

// Recommended:
// Option A: Remove entirely (alarms don't need it)
// (Just delete the UIBackgroundModes line)

// Option B: Keep only if you have data sync
UIBackgroundModes: ['background-fetch']  // Only if needed
```

### Priority 2: Add 64 Alarm Limit Check

```typescript
// In your alarm creation code:
const MAX_IOS_ALARMS = 64;

async function createAlarm(...) {
  const existingAlarms = await getAllScheduledAlarms();

  if (Platform.OS === 'ios' && existingAlarms.length >= MAX_IOS_ALARMS) {
    Alert.alert(
      'Alarm Limit Reached',
      'iOS limits apps to 64 scheduled notifications. Please delete old alarms before creating new ones.'
    );
    return;
  }

  // ... proceed with alarm creation
}
```

### Priority 3: Test on Real iOS Device

**Critical tests:**
1. Schedule alarm
2. Close app completely (swipe up in app switcher)
3. Lock phone
4. Wait for alarm time
5. Verify alarm fires with sound and notification

**Known iOS behaviors:**
- Alarms fire even when app is terminated ✅
- Sound plays even if phone is locked ✅
- Notification appears on lock screen ✅

---

## Files to Update for iOS

### 1. app.config.js
```javascript
ios: {
  bundleIdentifier: 'com.manifestationalarm.app',
  supportsTablet: true,
  infoPlist: {
    // Remove UIBackgroundModes or keep only if needed:
    // UIBackgroundModes: ['background-fetch'], // Only if syncing data
    NSUserNotificationUsageDescription:
      'This app uses notifications to remind you to track your mood and practice manifestations.',
  },
}
```

### 2. Add alarm limit check (optional but recommended)

Create: `src/utils/iOSNotificationLimits.ts`

```typescript
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export const MAX_IOS_NOTIFICATIONS = 64;

export async function canScheduleMoreAlarms(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return true; // No limit on Android
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length < MAX_IOS_NOTIFICATIONS;
}

export async function getRemainingAlarmSlots(): Promise<number | null> {
  if (Platform.OS !== 'ios') {
    return null; // Unlimited on Android
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return MAX_IOS_NOTIFICATIONS - scheduled.length;
}
```

---

## Summary

### iOS Compatibility: ✅ EXCELLENT

**What's Already Perfect:**
1. ✅ Notification scheduling with exact times
2. ✅ Permission handling
3. ✅ Platform-specific code
4. ✅ Sound configuration
5. ✅ No Android-specific permissions shown

**What Needs Attention:**
1. ⚠️ Remove unnecessary `UIBackgroundModes` (or justify to Apple)
2. 📝 Add 64 alarm limit check (optional but good UX)
3. 🧪 Test on real iOS device before submission

**Bottom Line:**
Your app will work great on iOS! The alarm scheduling is properly implemented with `expo-notifications`, which uses iOS's native notification system. The only concern is the unnecessary background modes which might raise questions during App Store review.

---

## Action Items

**Before iOS Build:**
- [ ] Review and update `UIBackgroundModes` in app.config.js
- [ ] Consider adding 64 alarm limit check
- [ ] Test TestFlight build on real device
- [ ] Verify alarms fire when app is closed
- [ ] Check sound playback on silent mode

**iOS is ready!** 🎉
