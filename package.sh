#!/bin/bash

# Chrome Extension Packaging Script
# This script creates a clean ZIP file for Chrome Web Store submission

echo "🚀 Packaging Chrome Extension for Web Store..."

# Define the extension directory and output
EXTENSION_DIR="."
OUTPUT_FILE="swagger-jwt-extractor-v1.0.0.zip"

# Files to include in the package
INCLUDE_FILES=(
    "manifest.json"
    "worker.js"
    "content.js"
    "popup.html"
    "popup.js"
    "options.html"
    "options.js"
    "icons/"
)

# Files/directories to exclude
EXCLUDE_PATTERNS=(
    "*.md"
    "*.txt"
    "*.log"
    ".git*"
    ".DS_Store"
    "Thumbs.db"
    "node_modules/"
    "package*.json"
    "*.sh"
    "STORE_LISTING.md"
    "PRIVACY.md"
    "LICENSE"
)

# Remove old package if exists
if [ -f "$OUTPUT_FILE" ]; then
    echo "🗑️  Removing old package..."
    rm "$OUTPUT_FILE"
fi

echo "📦 Creating package..."

# Create the ZIP file directly
zip -r "$OUTPUT_FILE" \
    manifest.json \
    worker.js \
    content.js \
    popup.html \
    popup.js \
    options.html \
    options.js \
    icons/ \
    -x "*.md" "*.txt" "*.log" ".git*" ".DS_Store" "Thumbs.db" "node_modules/*" "package*.json" "*.sh" "STORE_LISTING.md" "PRIVACY.md" "LICENSE"

# Check result
if [ -f "$EXTENSION_DIR/$OUTPUT_FILE" ]; then
    echo "✨ Package created successfully: $OUTPUT_FILE"
    echo "📏 File size: $(du -h "$EXTENSION_DIR/$OUTPUT_FILE" | cut -f1)"
    echo ""
    echo "📋 Package contents:"
    unzip -l "$EXTENSION_DIR/$OUTPUT_FILE"
    echo ""
    echo "🎯 Ready for Chrome Web Store submission!"
    echo ""
    echo "Next steps:"
    echo "1. Create the required icon files in icons/ folder"
    echo "2. Test the extension thoroughly"
    echo "3. Upload to Chrome Web Store Developer Dashboard"
else
    echo "❌ Failed to create package"
    exit 1
fi
