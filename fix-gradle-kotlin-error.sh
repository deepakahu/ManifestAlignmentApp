#!/bin/bash

echo "🔧 Fixing React Native 0.79.5 Gradle Kotlin compilation errors..."

# Navigate to project directory
cd /home/deepakahu/Deepak-Projects/ManifestAlignmentApp/ManifestExpo

echo "📂 Current directory: $(pwd)"

# Step 1: Clean all build caches
echo "🧹 Cleaning all build caches..."

# Clean Android build
cd android
./gradlew clean
cd ..

# Clean Metro cache
echo "🧹 Cleaning Metro cache..."
npx expo start --clear
pkill -f "expo start" 2>/dev/null || true

# Clean npm/yarn cache
echo "🧹 Cleaning npm cache..."
npm cache clean --force

# Clean React Native cache
echo "🧹 Cleaning React Native cache..."
npx react-native clean-project-auto 2>/dev/null || true

# Remove node_modules and reinstall
echo "🧹 Removing node_modules and reinstalling..."
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock

# Step 2: Reinstall dependencies
echo "📦 Reinstalling dependencies..."
npm install

# Step 3: Verify and fix gradle plugin files
echo "🔍 Verifying React Native gradle plugin files..."

# Check if the problematic files still have the old syntax
GRADLE_PLUGIN_DIR="node_modules/@react-native/gradle-plugin"

FILES_TO_CHECK=(
    "$GRADLE_PLUGIN_DIR/react-native-gradle-plugin/build.gradle.kts"
    "$GRADLE_PLUGIN_DIR/settings-plugin/build.gradle.kts"
    "$GRADLE_PLUGIN_DIR/shared/build.gradle.kts"
    "$GRADLE_PLUGIN_DIR/shared-testutil/build.gradle.kts"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ Checking $file"
        
        # Check if the old problematic syntax exists
        if grep -q "allWarningsAsErrors =" "$file"; then
            echo "⚠️  Found old syntax in $file, applying fix..."
            
            # Create backup
            cp "$file" "$file.backup"
            
            # Apply fix using sed
            sed -i 's/allWarningsAsErrors = /allWarningsAsErrors.set(/g' "$file"
            sed -i 's/project\.properties\["enableWarningsAsErrors"\]?.toString()?.toBoolean() ?: false/project.properties["enableWarningsAsErrors"]?.toString()?.toBoolean() ?: false)/g' "$file"
            
            echo "✅ Fixed $file"
        else
            echo "✅ $file already has correct syntax"
        fi
    else
        echo "⚠️  File not found: $file"
    fi
done

# Step 4: Additional fixes for common patterns
echo "🔧 Applying additional Kotlin compatibility fixes..."

# Fix any remaining allWarningsAsErrors issues in all gradle files
find node_modules/@react-native/gradle-plugin -name "*.gradle.kts" -type f -exec grep -l "allWarningsAsErrors" {} \; | while read -r file; do
    if grep -q "allWarningsAsErrors =" "$file"; then
        echo "🔧 Fixing additional file: $file"
        cp "$file" "$file.backup"
        sed -i 's/allWarningsAsErrors = /allWarningsAsErrors.set(/g' "$file"
        
        # Fix the closing parenthesis for the set() call
        if grep -q "allWarningsAsErrors\.set.*false$" "$file"; then
            sed -i 's/allWarningsAsErrors\.set(\(.*\)false$/allWarningsAsErrors.set(\1false)/g' "$file"
        fi
    fi
done

# Step 5: Clean Android build cache again
echo "🧹 Final Android build cache cleanup..."
cd android
./gradlew clean
rm -rf .gradle
rm -rf build
rm -rf app/build
cd ..

# Step 6: Test the build
echo "🧪 Testing Android build..."
cd android
echo "Running: ./gradlew assembleDebug --info"
./gradlew assembleDebug --info

if [ $? -eq 0 ]; then
    echo "✅ Build successful! The Kotlin compilation errors have been fixed."
    echo ""
    echo "🎉 Your React Native 0.79.5 app with Gradle 8.0.2 is now ready!"
    echo ""
    echo "You can now run:"
    echo "  cd android && ./gradlew assembleDebug    # Build APK"
    echo "  npx expo run:android                     # Run on device/emulator"
else
    echo "❌ Build failed. Please check the error messages above."
    echo ""
    echo "If the issue persists, try:"
    echo "1. Check if there are other gradle files that need patching"
    echo "2. Consider using Gradle 7.x temporarily"
    echo "3. Wait for React Native 0.79.6+ which should include official fixes"
    
    # Show recent error logs
    echo ""
    echo "📋 Recent build errors:"
    tail -50 ~/.gradle/daemon/*/daemon-*.out.log 2>/dev/null | grep -i error | tail -10
fi

cd ..

echo ""
echo "🔍 Summary of changes made:"
echo "- Cleaned all build caches (Gradle, Metro, npm)"
echo "- Reinstalled node_modules"
echo "- Fixed allWarningsAsErrors syntax in React Native gradle plugin files"
echo "- Applied Kotlin 1.8+ compatibility fixes"
echo ""
echo "📁 Backup files created with .backup extension in case rollback is needed"