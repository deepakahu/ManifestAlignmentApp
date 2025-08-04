#!/bin/bash

echo "🔍 Searching for all allWarningsAsErrors patterns in React Native gradle plugins..."

cd /home/deepakahu/Deepak-Projects/ManifestAlignmentApp/ManifestExpo

# Search for all files containing allWarningsAsErrors
echo "📋 Files containing allWarningsAsErrors:"
find node_modules/@react-native/gradle-plugin -name "*.gradle.kts" -type f -exec grep -l "allWarningsAsErrors" {} \;

echo ""
echo "🔍 Detailed search for problematic patterns:"

# Search for the problematic assignment pattern
echo "❌ Files with problematic 'allWarningsAsErrors =' pattern:"
find node_modules/@react-native/gradle-plugin -name "*.gradle.kts" -type f -exec grep -l "allWarningsAsErrors =" {} \;

echo ""
echo "✅ Files with correct 'allWarningsAsErrors.set(' pattern:"
find node_modules/@react-native/gradle-plugin -name "*.gradle.kts" -type f -exec grep -l "allWarningsAsErrors\.set(" {} \;

echo ""
echo "📝 Checking specific line content in key files:"

FILES_TO_CHECK=(
    "node_modules/@react-native/gradle-plugin/react-native-gradle-plugin/build.gradle.kts"
    "node_modules/@react-native/gradle-plugin/settings-plugin/build.gradle.kts"
    "node_modules/@react-native/gradle-plugin/shared/build.gradle.kts"
    "node_modules/@react-native/gradle-plugin/shared-testutil/build.gradle.kts"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo ""
        echo "📄 Content around allWarningsAsErrors in $file:"
        grep -n -A 3 -B 3 "allWarningsAsErrors" "$file" || echo "No allWarningsAsErrors found"
    else
        echo "⚠️  File not found: $file"
    fi
done

echo ""
echo "🔧 Searching in entire project for Kotlin compilation issues..."

# Check if there are any cached .class files with the old pattern
echo "📦 Checking for compiled .class files that might contain old bytecode:"
find . -name "*.class" -type f 2>/dev/null | head -10

echo ""
echo "🗂️  Checking gradle daemon logs for specific error patterns:"
GRADLE_USER_HOME=${GRADLE_USER_HOME:-$HOME/.gradle}
if [ -d "$GRADLE_USER_HOME/daemon" ]; then
    echo "📋 Recent gradle daemon errors:"
    find "$GRADLE_USER_HOME/daemon" -name "*.log" -type f -exec grep -l "allWarningsAsErrors" {} \; 2>/dev/null | head -5
fi

echo ""
echo "🔍 Final verification - checking for any remaining problematic patterns:"
find node_modules/@react-native/gradle-plugin -name "*.kts" -o -name "*.kt" -type f | xargs grep -n "allWarningsAsErrors.*=" 2>/dev/null | grep -v "\.set(" || echo "✅ No problematic patterns found"