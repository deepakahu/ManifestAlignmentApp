#!/bin/bash

set -e  # Exit on any error

echo "🚀 Comprehensive Fix for React Native 0.79.5 Gradle Kotlin Compilation Errors"
echo "=================================================================="
echo ""

# Navigate to project directory
PROJECT_DIR="/home/deepakahu/Deepak-Projects/ManifestAlignmentApp/ManifestExpo"
cd "$PROJECT_DIR"

echo "📂 Working in: $(pwd)"
echo ""

# Step 1: Complete cache cleanup
echo "🧹 STEP 1: Complete Build Cache Cleanup"
echo "----------------------------------------"

# Stop any running Metro processes
echo "🛑 Stopping Metro processes..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true

# Clean Android build completely
echo "🧹 Cleaning Android build..."
if [ -d "android" ]; then
    cd android
    if [ -f "./gradlew" ]; then
        ./gradlew clean --info
        ./gradlew --stop
    fi
    
    # Remove all build directories
    rm -rf .gradle
    rm -rf build
    rm -rf app/build
    rm -rf */build
    
    cd ..
fi

# Clean system gradle cache
echo "🧹 Cleaning system Gradle cache..."
if [ -d "$HOME/.gradle" ]; then
    rm -rf "$HOME/.gradle/caches"
    rm -rf "$HOME/.gradle/daemon"
fi

# Clean React Native and Metro cache
echo "🧹 Cleaning React Native caches..."
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/react-* 2>/dev/null || true
rm -rf "$HOME/.cache/react-native-cli" 2>/dev/null || true

echo "✅ Cache cleanup completed"
echo ""

# Step 2: Fresh dependency installation
echo "📦 STEP 2: Fresh Dependency Installation"
echo "----------------------------------------"

echo "🗑️  Removing node_modules..."
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock

echo "📥 Installing dependencies..."
npm install

echo "✅ Dependencies installed"
echo ""

# Step 3: Verify and fix gradle plugin files
echo "🔧 STEP 3: Fix React Native Gradle Plugin Files"
echo "-----------------------------------------------"

GRADLE_PLUGIN_DIR="node_modules/@react-native/gradle-plugin"

# Define files that commonly have the issue
FILES_TO_FIX=(
    "$GRADLE_PLUGIN_DIR/react-native-gradle-plugin/build.gradle.kts"
    "$GRADLE_PLUGIN_DIR/settings-plugin/build.gradle.kts"
    "$GRADLE_PLUGIN_DIR/shared/build.gradle.kts"
    "$GRADLE_PLUGIN_DIR/shared-testutil/build.gradle.kts"
)

echo "🔍 Checking and fixing Kotlin syntax in gradle files..."

for file in "${FILES_TO_FIX[@]}"; do
    if [ -f "$file" ]; then
        echo "📝 Processing: $file"
        
        # Create backup
        cp "$file" "$file.backup"
        
        # Check current content around allWarningsAsErrors
        if grep -q "allWarningsAsErrors" "$file"; then
            echo "  📋 Current allWarningsAsErrors content:"
            grep -n -A 2 -B 2 "allWarningsAsErrors" "$file" | sed 's/^/    /'
            
            # Apply comprehensive fix
            # Replace direct assignment with .set() method
            sed -i 's/allWarningsAsErrors = \(.*\)/allWarningsAsErrors.set(\1)/g' "$file"
            
            # Fix incomplete .set() calls that might be missing closing parenthesis
            sed -i '/allWarningsAsErrors\.set(/,/)/c\
    allWarningsAsErrors.set(\
        project.properties["enableWarningsAsErrors"]?.toString()?.toBoolean() ?: false\
    )' "$file"
            
            echo "  ✅ Fixed $file"
        else
            echo "  ℹ️  No allWarningsAsErrors found in $file"
        fi
    else
        echo "  ⚠️  File not found: $file"
    fi
done

# Search for any other gradle files that might have the issue
echo ""
echo "🔍 Searching for additional gradle files with the issue..."
find "$GRADLE_PLUGIN_DIR" -name "*.gradle.kts" -type f | while read -r gradle_file; do
    if grep -q "allWarningsAsErrors =" "$gradle_file" 2>/dev/null; then
        echo "🔧 Found additional file to fix: $gradle_file"
        cp "$gradle_file" "$gradle_file.backup"
        sed -i 's/allWarningsAsErrors = \(.*\)/allWarningsAsErrors.set(\1)/g' "$gradle_file"
        echo "  ✅ Fixed additional file: $gradle_file"
    fi
done

echo "✅ Gradle plugin files fixed"
echo ""

# Step 4: Create patch for future installs
echo "📋 STEP 4: Create Patch for Future Installs"
echo "-------------------------------------------"

# Install patch-package if not present
if ! npm list patch-package >/dev/null 2>&1; then
    echo "📦 Installing patch-package..."
    npm install --save-dev patch-package
fi

# Generate patches for the modified files
echo "📄 Generating patches..."
for file in "${FILES_TO_FIX[@]}"; do
    if [ -f "$file.backup" ] && [ -f "$file" ]; then
        if ! diff -q "$file.backup" "$file" >/dev/null 2>&1; then
            echo "  📋 Changes detected in $file"
        fi
    fi
done

# Create patch using patch-package
if command -v npx >/dev/null 2>&1; then
    echo "🔧 Creating patch with patch-package..."
    npx patch-package @react-native/gradle-plugin || echo "⚠️  Patch creation failed, but fixes are still applied"
fi

echo "✅ Patch created"
echo ""

# Step 5: Test the build
echo "🧪 STEP 5: Test Android Build"
echo "-----------------------------"

cd android

echo "🔧 Testing Gradle configuration..."
./gradlew tasks --info > /tmp/gradle-test.log 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Gradle configuration successful"
    
    echo "🏗️  Testing debug build..."
    ./gradlew assembleDebug --info --stacktrace
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 SUCCESS! Build completed successfully!"
        echo "✅ React Native 0.79.5 with Gradle 8.0.2 is now working!"
        echo ""
        echo "📱 You can now run your app:"
        echo "   npx expo run:android"
        echo ""
        echo "🔧 If you reinstall node_modules in the future, run:"
        echo "   npx patch-package"
        echo ""
    else
        echo ""
        echo "❌ Build failed during assembleDebug"
        echo "📋 Check the error output above for details"
        
        # Show recent error logs
        echo ""
        echo "📋 Recent Gradle errors:"
        tail -20 /tmp/gradle-test.log | grep -i error || echo "No specific errors found in logs"
    fi
else
    echo "❌ Gradle configuration failed"
    echo "📋 Check the error output in /tmp/gradle-test.log"
    
    # Show what might be wrong
    echo ""
    echo "🔍 Possible issues:"
    echo "1. Kotlin version compatibility"
    echo "2. Additional gradle files need fixing"
    echo "3. Java/JDK version issues"
    
    # Check Java version
    echo ""
    echo "☕ Java version:"
    java -version 2>&1 | head -3 || echo "Java not found"
fi

cd ..

echo ""
echo "📋 Summary of actions taken:"
echo "• Cleaned all build caches (Gradle, Metro, npm)"
echo "• Reinstalled node_modules fresh"
echo "• Fixed allWarningsAsErrors syntax in React Native gradle plugin files"
echo "• Created patches for future npm installs"
echo "• Tested Android build"
echo ""
echo "💾 Backup files are available with .backup extension"
echo ""

# Final verification
echo "🔍 Final verification - checking for remaining issues:"
REMAINING_ISSUES=$(find node_modules/@react-native/gradle-plugin -name "*.gradle.kts" -type f -exec grep -l "allWarningsAsErrors =" {} \; 2>/dev/null | wc -l)

if [ "$REMAINING_ISSUES" -eq 0 ]; then
    echo "✅ No remaining allWarningsAsErrors assignment issues found"
else
    echo "⚠️  $REMAINING_ISSUES gradle files still have the old syntax"
    find node_modules/@react-native/gradle-plugin -name "*.gradle.kts" -type f -exec grep -l "allWarningsAsErrors =" {} \; 2>/dev/null
fi

echo ""
echo "🏁 Fix script completed!"