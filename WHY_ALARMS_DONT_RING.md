# Why Alarms Don't Ring - Quick Fix Guide

## Most Likely Causes (in order):

### 1. ⚡ **EXACT ALARM PERMISSION NOT GRANTED** (Android 12+)

**This is the #1 reason alarms don't fire!**

**Problem:** Android 12+ requires users to manually grant "Alarms & reminders" permission.

**How to Fix:**
```
Settings → Apps → Manifestation Alarm →
Look for "Alarms & reminders" or "Set alarms and reminders"
→ Enable it
```

**Check if this is the issue:**
- Open your app
- Go to Settings → Alarm Diagnostics
- Look for "Exact Alarm Permission" status

---

### 2. 🔋 **BATTERY OPTIMIZATION KILLING THE APP**

**Problem:** Android aggressively kills apps in background to save battery, preventing scheduled notifications from firing.

**How to Fix:**
```
Settings → Apps → Manifestation Alarm → Battery
→ Select "Unrestricted" or "Don't optimize"
```

**Manufacturers with extra battery optimization:**
- **Samsung:** Settings → Device care → Battery → App power management
- **Xiaomi/MIUI:** Security → Battery → Power → App battery saver
- **Huawei/EMUI:** Battery → App launch → Manual manage
- **Oppo/ColorOS:** Settings → Battery → Power Saving Mode

---

### 3. 🔕 **DO NOT DISTURB MODE**

**Problem:** DND mode blocks alarm notifications even with "bypass" enabled (depends on manufacturer).

**How to Fix:**
```
Settings → Sound & vibration → Do Not Disturb
→ Add "Manifestation Alarm" to exceptions
OR disable DND temporarily to test
```

---

### 4. 🔔 **NOTIFICATION PERMISSION NOT GRANTED**

**Problem:** App can't send ANY notifications without this permission.

**How to Fix:**
```
Settings → Apps → Manifestation Alarm → Permissions
→ Notifications → Allow
```

---

### 5. 📢 **NOTIFICATION CHANNEL IMPORTANCE TOO LOW**

**Problem:** Android notification channels can have their importance level changed by users, preventing alarms from making sound.

**How to Fix:**
```
Settings → Apps → Manifestation Alarm → Notifications
→ "Alarm Notifications" channel
→ Set importance to "Urgent" or highest level
→ Ensure sound is enabled
```

---

##Quick Test

To determine which issue you have:

1. **Open the app**
2. **Go to Settings**
3. **Tap "Alarm Diagnostics"**
4. **Tap "Quick Alarm Test"**

This will:
- Schedule a test alarm for 10 seconds from now
- Show you exactly what's preventing it from firing
- Tell you which permissions/settings to fix

---

## Expected Results After Fixing

When working correctly, alarms should:

✅ Fire at the exact scheduled time (within 1-2 seconds)
✅ Make sound (with chosen notification sound)
✅ Vibrate (with pattern)
✅ Show notification on lock screen
✅ Work even when:
   - App is completely closed
   - Phone is locked
   - DND mode is enabled (if bypass configured)
   - Screen is off

---

## Still Not Working?

### Try Auto-Fix:
1. Open app → Settings
2. Tap "Auto-Fix Alarms"
3. This will:
   - Reset all notification channels
   - Request permissions again
   - Reschedule all alarms
   - Clear any stuck notifications

### Check Debug Logs:
After creating/enabling an alarm, check logs for:
```
✅ Alarm scheduled: [Name] at [Time]
✅ Alarm channel configured successfully
✅ Updated next trigger for [Name]: [Time]
```

If you see errors like:
```
❌ Notification permissions not granted
❌ Failed to schedule alarm notification
```

Then you need to grant the specific permission mentioned.

---

## Common Mistakes

❌ **Creating alarm but forgetting to enable it**
   - Check the toggle switch is ON

❌ **No active days selected**
   - Must select at least one day (Mon-Sun)

❌ **Time window excludes current time**
   - If alarm is 9 AM - 9 PM, it won't fire at 10 PM

❌ **Past trigger time**
   - If you create alarm at 3 PM for 2 PM, it won't fire until tomorrow

❌ **Emulator vs Real Device**
   - Notifications don't work reliably on emulators
   - Always test on a real Android phone

---

## For Developers

### Debug Checklist:

```typescript
// 1. Check if AlarmNotificationService is initialized
await AlarmNotificationService.initialize();

// 2. Check permissions
const status = await Notifications.getPermissionsAsync();
console.log('Permission status:', status);

// 3. Check alarm channel
const channels = await Notifications.getNotificationChannelsAsync();
const alarmChannel = channels.find(c => c.id === 'alarm_channel');
console.log('Alarm channel:', alarmChannel);

// 4. Check scheduled notifications
const scheduled = await Notifications.getAllScheduledNotificationsAsync();
console.log('Scheduled notifications:', scheduled.length);

// 5. Test immediate notification
await AlarmNotificationService.testAlarmNotification();
```

### Required Permissions (already in app.json):
```json
"android.permission.SCHEDULE_EXACT_ALARM"
"android.permission.USE_EXACT_ALARM"
"android.permission.POST_NOTIFICATIONS"
"android.permission.WAKE_LOCK"
"android.permission.VIBRATE"
```

---

## Bottom Line

**90% of alarm issues are caused by:**
1. Missing "Alarms & reminders" permission (Android 12+)
2. Battery optimization killing the app
3. Do Not Disturb mode

**Use the diagnostic tools in the app to identify exactly which one!**
