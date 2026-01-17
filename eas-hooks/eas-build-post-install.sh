#!/bin/bash
# EAS Build Hook: Post-install script to patch .so file alignment
# This runs after npm install but before gradle build

set -e

echo "🔧 EAS Post-Install Hook: Attempting to patch .so alignment..."

# Install patchelf if not available (on EAS build servers)
if ! command -v patchelf &> /dev/null; then
    echo "Installing patchelf..."
    # EAS build servers are Debian-based
    sudo apt-get update -qq
    sudo apt-get install -y patchelf
fi

# Find all .so files in node_modules
echo "Finding .so files in node_modules..."
SO_FILES=$(find node_modules -name "*.so" -type f 2>/dev/null || true)

if [ -z "$SO_FILES" ]; then
    echo "⚠️  No .so files found in node_modules"
    exit 0
fi

PATCHED=0
FAILED=0

# Attempt to patch each .so file
while IFS= read -r so_file; do
    echo "Checking: $so_file"

    # Try to set 16KB page size alignment
    if patchelf --page-size 16384 "$so_file" 2>/dev/null; then
        echo "  ✅ Patched: $so_file"
        PATCHED=$((PATCHED + 1))
    else
        echo "  ❌ Failed to patch: $so_file"
        FAILED=$((FAILED + 1))
    fi
done <<< "$SO_FILES"

echo ""
echo "📊 Patch Summary:"
echo "  Patched: $PATCHED files"
echo "  Failed: $FAILED files"
echo ""

if [ $PATCHED -gt 0 ]; then
    echo "✅ Successfully patched $PATCHED .so files for 16KB alignment"
else
    echo "⚠️  Warning: No files were successfully patched"
fi

exit 0
