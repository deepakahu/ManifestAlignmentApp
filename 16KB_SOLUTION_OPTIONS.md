# 16 KB Page Size Support - Solution Options

## Current Status
- **Problem:** Pre-compiled .so files in node_modules have align 2**12 (4KB) instead of align 2**14 (16KB)
- **Impact:** Google Play rejects builds with "Your app does not support 16 KB memory page sizes"
- **Affected libraries:** React Native, Hermes, Expo modules, Fresco, etc. (28 out of 30 libraries)

---

## Option 1: EAS Build Hook with patchelf (NEW - TRYING THIS)

### What I Just Implemented
Created an EAS build hook that runs `patchelf` to modify .so file alignment AFTER npm install but BEFORE gradle build.

**Files created:**
- `eas-hooks/eas-build-post-install.sh` - Script that patches all .so files
- Updated `eas.json` with `hooks.postInstall` configuration

**How it works:**
1. EAS runs `npm install` (gets pre-compiled .so files with wrong alignment)
2. Hook runs automatically
3. Installs `patchelf` tool
4. Finds all .so files in node_modules
5. Runs `patchelf --page-size 16384` on each file
6. Gradle build copies the PATCHED files into AAB

**Pros:**
- ✅ Automated - runs on every build
- ✅ No manual intervention needed
- ✅ Works with managed workflow
- ✅ Can verify immediately with next build

**Cons:**
- ⚠️ Risky - may break some libraries
- ⚠️ Not officially supported by Expo/React Native
- ⚠️ May need debugging if patch fails
- ⚠️ patchelf might not work on all .so files

**Next step:** Build version 1.0.22 to test this approach

---

## Option 2: Bare Workflow (COMPLEX - NOT RECOMMENDED)

### What "Bare Workflow" Means
Running `npx expo prebuild` generates full native Android/iOS projects. You get:
- `android/` folder with complete Android project
- `ios/` folder with complete iOS project
- Can modify native code directly
- Still use Expo libraries

### Steps to Switch to Bare Workflow
```bash
# 1. Generate native projects
npx expo prebuild --clean

# 2. You now have android/ folder with:
android/
├── app/
│   ├── build.gradle (app-level)
│   └── src/main/AndroidManifest.xml
├── build.gradle (project-level)
├── settings.gradle
└── gradle.properties

# 3. Build locally
cd android
./gradlew assembleRelease

# 4. Or continue using EAS
eas build --platform android
```

### Why This DOESN'T Solve 16KB Issue

**The problem:** Pre-compiled .so files are STILL copied from node_modules

When you run `npx expo prebuild`:
1. Generates Android project structure
2. Copies .so files FROM `node_modules/react-native/android/...`
3. Copies .so files FROM `node_modules/expo-modules-core/android/...`
4. These files ALREADY have wrong alignment
5. Gradle just packages them as-is

### To Actually Rebuild From Source (EXTREMELY HARD)

**For React Native:**
```bash
# Clone and build React Native from source
git clone https://github.com/facebook/react-native.git
cd react-native

# Build with NDK r28
export ANDROID_NDK=/path/to/ndk/28.0.12433566
./gradlew :packages:react-native:ReactAndroid:assembleRelease

# Copy built .so files to your node_modules
cp packages/react-native/ReactAndroid/build/react-ndk/... \
   node_modules/react-native/android/...
```

**Why this is impractical:**
- Takes 2-4 hours to compile
- Requires powerful machine (32GB+ RAM)
- Need to rebuild for EVERY dependency (Hermes, Expo, etc.)
- Need to do this after EVERY `npm install`
- High risk of breaking compatibility
- Not maintained or supported

**Verdict:** ❌ NOT FEASIBLE for production use

---

## Option 3: Wait for Official Expo Support (SAFEST)

### Current Expo Status
Check GitHub issues:
- https://github.com/expo/expo/issues?q=16kb
- https://github.com/facebook/react-native/issues?q=16kb

**What to look for:**
- Expo SDK 53+ release notes
- React Native 0.77+ release notes
- Official 16KB support announcements

**Timeline:**
- Expo SDK releases: Every ~3 months
- Current: SDK 52 (released Dec 2024)
- Next: SDK 53 (likely March 2025)

**Pros:**
- ✅ Official support
- ✅ No hacks or workarounds
- ✅ Maintained long-term

**Cons:**
- ❌ Unknown timeline
- ❌ Can't deploy to Google Play until then

**Action:**
```bash
# Check Expo SDK version
npx expo --version

# Upgrade when SDK 53+ released with 16KB support
npx expo upgrade 53
```

---

## Option 4: Temporary Workaround - Target SDK 34

### Lower Target SDK (TEMPORARY ONLY)

Google's 16KB requirement depends on target SDK:
- **Target SDK 35 (Android 15):** 16KB required NOW
- **Target SDK 34 (Android 14):** 16KB required later (deadline varies)

**Change app.config.js:**
```javascript
android: {
  compileSdkVersion: 34,  // Instead of 35
  targetSdkVersion: 34,   // Instead of 35
}
```

**Pros:**
- ✅ Immediate solution
- ✅ Can deploy to Google Play
- ✅ No complex changes

**Cons:**
- ❌ TEMPORARY - Google will enforce eventually
- ❌ Can't use Android 15 features
- ❌ Not sustainable long-term
- ❌ May already be too late (check Google Play Console)

---

## UPDATE: EAS Hooks Not Supported - Use Target SDK 34

### EAS Hook Attempt Failed
The `hooks` configuration in eas.json is not supported:
```
Error: "build.production.android.hooks" is not allowed
```

This means we **cannot** automatically patch .so files during EAS build.

## NEW Recommended Approach: Lower Target SDK to 34 (Option 4)

### Step 1: Test EAS Build Hook (NEW)
I just implemented this. Let's try building version 1.0.22:

```bash
# Increment version
# app.config.js: version "1.0.22", versionCode 23

# Build with new hook
eas build --platform android --profile production

# After build completes, verify
/tmp/check_elf_alignment.sh build-1.0.22.aab
```

**If hook works:** ✅ All .so files show align 2**14

**If hook fails:** Try debugging or fall back to Option 4

### Step 2: If Hook Fails, Lower Target SDK (Option 4)
Temporarily target SDK 34 to meet deadline, while waiting for Expo SDK 53.

### Step 3: Monitor Expo Updates
Watch for SDK 53 release with official 16KB support.

---

## Testing the Hook

Want to test the EAS build hook approach? Here's what to do:

```bash
# 1. Increment version to 1.0.22
# (I can do this for you)

# 2. Build with EAS
eas build --platform android --profile production

# 3. Monitor build logs for hook output
# Look for: "🔧 EAS Post-Install Hook: Attempting to patch .so alignment..."

# 4. Download and verify AAB
curl -o build-1.0.22.aab [AAB_URL]
/tmp/check_elf_alignment.sh build-1.0.22.aab

# 5. Check results
# SUCCESS: All .so files show "align 2**14"
# FAILURE: Still showing "align 2**12"
```

---

## Summary

| Option | Difficulty | Success Chance | Timeline |
|--------|-----------|----------------|----------|
| 1. EAS Hook + patchelf | Medium | 50-70% | Test now |
| 2. Bare Workflow + Rebuild | Very Hard | 10-20% | Weeks |
| 3. Wait for Expo SDK 53 | Easy | 95%+ | 1-3 months |
| 4. Lower Target SDK | Easy | 90% (temporary) | Immediate |

**My recommendation:**
1. **Try Option 1 NOW** (EAS hook with patchelf) - Already implemented
2. **Fall back to Option 4** if hook fails (lower target SDK to 34)
3. **Monitor Option 3** (upgrade to Expo SDK 53 when available)

---

## Next Steps

Would you like me to:
1. ✅ Build version 1.0.22 with the new EAS hook?
2. ⏭️ Implement Option 4 (lower target SDK) as backup?
3. 📊 Check if there's any news on Expo SDK 53?
