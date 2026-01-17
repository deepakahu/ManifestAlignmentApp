# Alarm Not Ringing - Troubleshooting Guide

## Common Causes & Solutions

### 1. **Android 12+ Exact Alarm Permissions** (Most Common)

**Problem:** Android 12+ requires special permission for exact alarms.

**Solution:**
```typescript
// Already added to app.json, but user must grant it manually
"android.permission.SCHEDULE_EXACT_ALARM"
"android.permission.USE_EXACT_ALARM"
```

**User Action Required:**
1. Go to Settings → Apps → Manifestation Alarm
2. Look for "Alarms & reminders" permission
3. Enable "Allow setting alarms and reminders"

---

### 2. **Battery Optimization Killing Background Tasks**

**Problem:** Android kills app in background to save battery, preventing alarms.

**Solution:**
1. Settings → Apps → Manifestation Alarm → Battery
2. Select "Unrestricted" or "Don't optimize"
3. This allows alarms to fire even when app is closed

---

### 3. **Notification Permission Not Granted**

**Problem:** App can't send notifications without permission.

**Check:**
```bash
# In app, open Settings screen
# You should see a "Run Diagnostics" button
# This will show if permissions are granted
```

**Solution:**
1. Settings → Apps → Manifestation Alarm → Notifications
2. Enable "Show notifications"
3. Ensure "Alarm Notifications" channel is enabled and set to "Urgent/High"

---

### 4. **Notification Channel Importance Too Low**

**Problem:** Alarm channel set to low importance won't make sound.

**Check:**
The alarm channel should be:
- **Importance:** MAX (level 5)
- **Bypass DND:** Enabled
- **Sound:** Enabled
- **Vibration:** Enabled

**Solution:**
Run the auto-fix function in the diagnostics tool, which recreates the channel with correct settings.

---

### 5. **Do Not Disturb (DND) Mode**

**Problem:** DND blocks notifications even with bypass enabled (Samsung/MIUI).

**Solution:**
1. Add app to DND exceptions
2. Or disable DND
3. Or ensure "Bypass DND" is enabled for alarm channel

---

### 6. **No Alarms Actually Scheduled**

**Problem:** Alarm created in app but notifications never scheduled.

**Check:**
```typescript
// Run diagnostics to see:
// - How many alarms are enabled in settings
// - How many notifications are actually scheduled
// - These numbers should match!
```

**Common Causes:**
- Alarm disabled after creation
- All active days unchecked
- Next trigger time is in the past
- App didn't have permissions when alarm was created

---

### 7. **Time Window Issues**

**Problem:** Current time is outside alarm's active window.

**Check:**
- Day start time: 09:00
- Day end time: 21:00
- If current time is 22:00, alarm won't fire until tomorrow 09:00

---

### 8. **Active Days Not Selected**

**Problem:** No days of week are enabled for the alarm.

**Check:** At least one day (Sun-Sat) must be checked.

---

## Testing Alarms

### Quick Test (10 seconds):
```typescript
import { AlarmDiagnostics } from './src/utils/alarmDiagnostics';

// In your app, call:
AlarmDiagnostics.quickTest();
```

This schedules a test alarm for 10 seconds from now. If it doesn't fire:
- Check notification permissions
- Check battery optimization
- Check DND settings

---

## Debugging Steps

### Step 1: Run Full Diagnostics

Add this to your Settings screen:

```typescript
import { AlarmDiagnostics } from '../utils/alarmDiagnostics';

// In your component:
<Button onPress={() => AlarmDiagnostics.runDiagnostics()}>
  Run Alarm Diagnostics
</Button>
```

This will show:
- ✅ What's working
- ❌ What's broken
- 🔧 How to fix it

### Step 2: Check Logs

Look for these in console:
```
✅ Alarm channel configured successfully
✅ Alarm scheduled: [Name] at [Time]
📅 Updated next trigger for [Name]: [Time]
```

If you see errors:
```
❌ Notification permissions not granted
❌ Failed to schedule alarm notification
❌ Alarm channel not found
```

### Step 3: Manual Verification

Check scheduled notifications:
```typescript
const scheduled = await Notifications.getAllScheduledNotificationsAsync();
console.log('Scheduled:', scheduled.length);
scheduled.forEach(n => {
  console.log(n.content.title, n.trigger);
});
```

You should see your alarms listed with future trigger times.

---

## Auto-Fix

If diagnostics show issues, run auto-fix:

```typescript
import { AlarmDiagnostics } from '../utils/alarmDiagnostics';

AlarmDiagnostics.autoFix();
```

This will:
1. Re-request permissions
2. Recreate notification channel with correct settings
3. Reschedule all active alarms
4. Clear any stuck notifications

---

## Platform-Specific Issues

### Android 13+
- **Exact Alarm Permission:** Must be manually granted in Settings
- **Notification Permission:** Required for all notifications
- **Battery:** Must disable optimization

### Android 12+
- **Alarm & Reminders:** New permission category
- **Background Restrictions:** More aggressive than Android 11

### Samsung/MIUI/Custom ROMs
- Often have **extra** battery optimization layers
- Need to:
  1. Disable system battery optimization
  2. Disable manufacturer battery optimization
  3. Add to autostart list
  4. Add to DND exceptions

---

## Expected Behavior

When alarm is properly configured:

1. **Notification appears** at scheduled time
2. **Sound plays** (custom sound if selected)
3. **Phone vibrates** (with pattern)
4. **Screen lights up** (if phone is locked)
5. **Bypasses DND** (if enabled in channel)

If ANY of these don't happen, check the corresponding setting.

---

## Critical Checklist

Before releasing to users, verify:

- [ ] SCHEDULE_EXACT_ALARM permission in manifest
- [ ] Notification permission requested on app launch
- [ ] Alarm channel configured with MAX importance
- [ ] Battery optimization disabled in documentation
- [ ] Test alarm fires when app is:
  - [ ] In foreground
  - [ ] In background
  - [ ] Completely closed
  - [ ] Phone is locked
  - [ ] DND is enabled

---

## Current Implementation Status

**Configured in app.json:**
```json
"permissions": [
  "android.permission.SCHEDULE_EXACT_ALARM",
  "android.permission.USE_EXACT_ALARM",
  "android.permission.POST_NOTIFICATIONS",
  "android.permission.WAKE_LOCK",
  "android.permission.VIBRATE"
]
```

**Notification Channel Config:**
- Channel ID: `alarm_channel`
- Importance: `MAX`
- Bypass DND: `true`
- Vibration: `[0, 500, 250, 500, 250, 500]`
- Priority: `MAX`

**Potential Issues:**
1. User must manually grant exact alarm permission on Android 12+
2. Battery optimization not automatically disabled
3. No in-app prompt to guide users through permission setup

---

## Recommended Improvements

1. **Add Permission Setup Screen:**
   - Show checklist of required permissions
   - Deep link to settings for each permission
   - Visual indicators for granted/denied

2. **Add Onboarding:**
   - Guide users through permission setup
   - Explain why each permission is needed
   - Test alarm at end of onboarding

3. **Add Persistent Debugging:**
   - Settings screen with diagnostics button
   - Show alarm status indicator in UI
   - Alert user if critical permissions missing

4. **Add Alarm Test Button:**
   - In alarm creation screen
   - "Test this alarm in 10 seconds"
   - Confirms alarm system is working

---

## Quick Fix for Users

Tell users to:

1. **Enable Permissions:**
   - Settings → Apps → Manifestation Alarm
   - Enable all permissions (especially "Alarms & reminders")

2. **Disable Battery Optimization:**
   - Settings → Apps → Manifestation Alarm → Battery
   - Select "Unrestricted" or "Don't optimize"

3. **Check Notification Settings:**
   - Settings → Apps → Manifestation Alarm → Notifications
   - Enable notifications
   - Ensure "Alarm Notifications" is set to highest importance

4. **Create Test Alarm:**
   - Create alarm for 2 minutes from now
   - If it doesn't fire, run diagnostics in app