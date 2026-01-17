# Alarm Permission Guard - Implementation Guide

## What It Does

The `AlarmPermissionGuard` component automatically checks all required permissions every time the app launches. If any critical permissions are missing, it displays a full-screen setup modal that guides users through the configuration process.

## Permissions Checked

### 1. **Notifications Permission** ✅ Auto-grantable
- **What**: Basic notification permission
- **Why**: Required to show any alarm notifications
- **Action**: In-app "Grant" button requests permission
- **Status**: Can be granted directly from the app

### 2. **Alarm Notification Channel** (Android) ✅ Auto-configurable
- **What**: High-priority notification channel for alarms
- **Why**: Ensures alarms make sound and bypass DND
- **Action**: "Open Settings" to verify importance is "Urgent/High"
- **Status**: Channel is auto-created, user should verify settings

### 3. **Alarms & Reminders Permission** (Android 12+) ⚠️ Manual
- **What**: SCHEDULE_EXACT_ALARM permission
- **Why**: Required for alarms to fire at exact times
- **Action**: "Open Settings" → Alarms & reminders → Allow
- **Status**: Must be manually granted in system settings
- **Note**: This is the #1 reason alarms don't ring!

### 4. **Battery Optimization** ⚠️ Manual
- **What**: Unrestricted battery usage
- **Why**: Prevents Android from killing alarm notifications
- **Action**: "Open Settings" → Battery → Unrestricted
- **Status**: Must be manually disabled in system settings

### 5. **Physical Device Check** ℹ️ Informational
- **What**: Detects if running on real device vs emulator
- **Why**: Alarms don't work reliably on emulators
- **Status**: Non-blocking warning

## User Flow

### First App Launch (Missing Permissions)

```
1. App starts
   ↓
2. AlarmPermissionGuard checks all permissions
   ↓
3. Full-screen modal appears showing checklist
   ↓
4. User sees which permissions are missing
   ↓
5. User taps action buttons:
   - "Grant" → Requests notification permission (in-app)
   - "Open Settings" → Deep links to system settings
   ↓
6. User configures permissions in settings
   ↓
7. User returns to app
   ↓
8. User taps "Done" button
   ↓
9. Guard rechecks all permissions
   ↓
10. If all granted → Modal closes, app loads
    If still missing → Warning dialog, option to skip or continue setup
```

### Subsequent Launches (All Permissions Granted)

```
1. App starts
   ↓
2. AlarmPermissionGuard checks permissions
   ↓
3. All permissions granted ✓
   ↓
4. App loads normally (no modal shown)
```

### Skip Option

Users can tap "Skip for Now" but will see a warning:
- "Alarms may not work properly without correct permissions"
- "You can access setup later from Settings → Alarm Diagnostics"

## Technical Implementation

### Component Structure

```typescript
<AlarmPermissionGuard>
  <AppProvider>
    <AppNavigator />
    <StatusBar />
  </AppProvider>
</AlarmPermissionGuard>
```

The guard wraps the entire app and renders:
- `{children}` - Normal app content
- `<Modal>` - Permission setup screen (shown conditionally)

### Permission Checking Logic

```typescript
useEffect(() => {
  checkPermissions(); // Runs on mount
}, []);

const checkPermissions = async () => {
  // 1. Check notification permission
  const { status } = await Notifications.getPermissionsAsync();

  // 2. Check alarm channel configuration (Android)
  const channels = await Notifications.getNotificationChannelsAsync();
  const alarmChannel = channels.find(c => c.id === 'alarm_channel');

  // 3. Check if physical device
  const isRealDevice = Device.isDevice;

  // 4. Show modal if any required permission not granted
  const needsSetup = permissionList.some(p => p.isRequired && !p.isGranted);
  setShowSetup(needsSetup);
};
```

### UI Features

**Visual Indicators:**
- ✅ Green checkmark icon + "Configured" badge when granted
- ⚠️ Color-coded icons when missing
- 🔴 "Required" badge for critical permissions

**Action Buttons:**
- Notification permission: "Grant" → Calls `requestNotificationPermissions()`
- Alarm channel: "Open Settings" → Calls `configureAlarmChannel()` + `Linking.openSettings()`
- Other permissions: "Open Settings" → Calls `Linking.openSettings()`

**Footer Controls:**
- "Skip for Now" → Shows warning, allows bypass
- "Done" → Rechecks permissions before closing

## Integration Points

### 1. App Entry Point
**File:** `App.tsx`
```typescript
import { AlarmPermissionGuard } from './src/components/AlarmPermissionGuard';

export default function App() {
  return (
    <AlarmPermissionGuard>
      {/* App content */}
    </AlarmPermissionGuard>
  );
}
```

### 2. Settings Screen
**File:** `src/screens/Settings/SettingsScreen.tsx`

Users can access diagnostics later via:
- Settings → "Run Alarm Diagnostics"
- Settings → "Quick Alarm Test"
- Settings → "Auto-Fix Alarms"

The diagnostics screen mentions: "You can access setup later from Settings → Alarm Diagnostics"

## Testing

### Test Scenario 1: Fresh Install
1. Install app on Android device
2. Launch app
3. Verify permission modal appears
4. Test granting notification permission (should work in-app)
5. Test "Open Settings" buttons (should deep link to settings)
6. Verify "Done" rechecks permissions
7. Verify modal closes when all permissions granted

### Test Scenario 2: Partial Permissions
1. Grant notification permission only
2. Close and relaunch app
3. Verify modal still appears (showing other missing permissions)
4. Complete remaining setup
5. Verify modal doesn't appear on next launch

### Test Scenario 3: Skip Flow
1. Launch app with missing permissions
2. Tap "Skip for Now"
3. Verify warning dialog appears
4. Tap "Skip Anyway"
5. Verify app loads normally
6. Verify can access diagnostics later from Settings

### Test Scenario 4: All Permissions Granted
1. Grant all permissions
2. Relaunch app
3. Verify modal does NOT appear
4. Verify app loads directly

## Maintenance

### Adding New Permission Checks

To add a new permission to the checklist:

```typescript
// In AlarmPermissionGuard.tsx, inside checkPermissions():

permissionList.push({
  id: 'new_permission',
  title: 'New Permission Name',
  description: 'Why this permission is needed',
  isGranted: false, // Your check logic here
  isRequired: true,  // or false
  settingsPath: 'Settings → Path → To → Permission',
  icon: 'icon-name', // From Ionicons
  color: '#color-code',
});
```

### Customizing UI

**Colors:**
- Modify `styles` object at bottom of file
- Main theme color: `#6366f1` (indigo)
- Success color: `#10b981` (green)
- Warning color: `#ef4444` (red)

**Text:**
- Update `modalTitle` and `modalSubtitle` (lines 272-275)
- Update `infoText` (lines 285-287)

## Known Limitations

1. **Cannot detect exact alarm permission status from JS**
   - Android 12+ SCHEDULE_EXACT_ALARM can't be checked programmatically
   - Always shows as "not granted" to be safe
   - User must verify manually in settings

2. **Cannot detect battery optimization status**
   - No JS API to check if battery optimization is disabled
   - Always shows as "not granted" to be safe
   - User must verify manually in settings

3. **Settings deep links are manufacturer-specific**
   - Different Android manufacturers have different settings paths
   - `Linking.openSettings()` goes to main app settings page
   - User may need to navigate to specific permission

## Troubleshooting

### Modal doesn't appear
- Check if all permissions are already granted
- Check console for errors in permission checking logic

### "Open Settings" doesn't work
- Verify `Linking.openSettings()` is called
- Test on real device (may not work on emulator)

### Modal appears every launch even after granting
- Check that permission check logic correctly detects granted state
- Look for console errors during permission verification

### User can't find permission in settings
- Provide device-specific instructions
- Update `settingsPath` descriptions for clarity
- Consider adding screenshots to in-app help

## Related Files

- **Permission Guard Component:** `src/components/AlarmPermissionGuard.tsx`
- **Notification Service:** `src/services/notifications/AlarmNotificationService.ts`
- **Diagnostics Tool:** `src/utils/alarmDiagnostics.ts`
- **Settings Screen:** `src/screens/Settings/SettingsScreen.tsx`
- **App Entry Point:** `App.tsx`

## User Documentation

See these guides for end-user help:
- **Quick Fix Guide:** `WHY_ALARMS_DONT_RING.md`
- **Technical Troubleshooting:** `ALARM_TROUBLESHOOTING.md`
- **Google Play Compliance:** `GOOGLE_PLAY_COMPLIANCE_FIX.md`
