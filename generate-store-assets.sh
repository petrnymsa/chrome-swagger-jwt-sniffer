#!/bin/bash

# Store Assets Generation Script
# Converts SVG to PNG and provides instructions for screenshots

echo "🎨 Generating Chrome Web Store Assets..."

ASSETS_DIR="store-assets"
SVG_FILE="$ASSETS_DIR/store-icon.svg"
PNG_FILE="$ASSETS_DIR/store-icon-128x128.png"

# Check if SVG exists
if [ ! -f "$SVG_FILE" ]; then
    echo "❌ SVG file not found: $SVG_FILE"
    exit 1
fi

# Try different methods to convert SVG to PNG
echo "🔄 Converting SVG to PNG..."

# Method 1: Try with rsvg-convert (librsvg)
if command -v rsvg-convert &> /dev/null; then
    echo "Using rsvg-convert..."
    rsvg-convert -w 128 -h 128 "$SVG_FILE" -o "$PNG_FILE"
    echo "✅ PNG created: $PNG_FILE"

# Method 2: Try with inkscape
elif command -v inkscape &> /dev/null; then
    echo "Using inkscape..."
    inkscape "$SVG_FILE" -w 128 -h 128 -o "$PNG_FILE"
    echo "✅ PNG created: $PNG_FILE"

# Method 3: Try with ImageMagick
elif command -v convert &> /dev/null; then
    echo "Using ImageMagick..."
    convert -background none -size 128x128 "$SVG_FILE" "$PNG_FILE"
    echo "✅ PNG created: $PNG_FILE"

else
    echo "⚠️  No SVG conversion tool found."
    echo "Please install one of the following:"
    echo "  - librsvg: brew install librsvg"
    echo "  - inkscape: brew install inkscape"
    echo "  - imagemagick: brew install imagemagick"
    echo ""
    echo "Or convert manually using online tools:"
    echo "  - https://svgtopng.com/"
    echo "  - https://convertio.co/svg-png/"
    exit 1
fi

echo ""
echo "📸 Screenshot Instructions:"
echo "1. Open screenshot template in browser:"
echo "   file://$PWD/$ASSETS_DIR/screenshot-template.html"
echo ""
echo "2. Set browser window to 1280x800 pixels"
echo "3. Take screenshot (Cmd+Shift+4 on Mac)"
echo "4. Save as: $ASSETS_DIR/screenshot-1280x800.png"
echo ""
echo "🏪 Chrome Web Store Requirements:"
echo "  ✅ Store icon: 128x128px PNG"
echo "  📸 Screenshots: 1280x800px PNG (1-5 images)"
echo "  📝 Description and details in manifest.json"
echo ""
echo "🎯 Ready for Chrome Web Store submission!"
