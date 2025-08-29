# Store Assets for Chrome Web Store

## Required Assets for Chrome Web Store Submission:

### 1. Store Icon (128x128px)
- **File**: `store-icon.svg` 
- **Size**: 128x128 pixels
- **Format**: SVG (convert to PNG for submission)
- **Usage**: Main icon displayed in Chrome Web Store

### 2. Screenshots (1280x800px recommended)
- **Template**: `screenshot-template.html`
- **Size**: 1280x800 pixels (or 640x400px minimum)
- **Format**: PNG or JPEG
- **Usage**: Product screenshots in store listing

## How to Create Screenshots:

### Method 1: Browser Screenshot
1. Open `screenshot-template.html` in Chrome
2. Set browser window to exactly 1280x800 pixels
3. Take screenshot (Cmd+Shift+4 on Mac, Windows+Shift+S on Windows)
4. Save as PNG

### Method 2: Developer Tools
1. Open `screenshot-template.html` in Chrome
2. Press F12 to open Developer Tools
3. Click device toolbar icon (📱)
4. Set custom resolution: 1280x800
5. Take screenshot using DevTools screenshot feature

### Method 3: Online Tools
1. Upload `screenshot-template.html` to a web server
2. Use online screenshot tools like:
   - screenshot.guru
   - web-capture.net
   - htmlcsstoimage.com

## Store Icon Conversion:

Convert SVG to PNG using:
- **Online**: svgtopng.com, convertio.co
- **Command line**: `inkscape store-icon.svg -w 128 -h 128 -o store-icon.png`
- **Design tools**: Figma, Sketch, Adobe Illustrator

## Store Listing Requirements:

1. **Icon**: 128x128px PNG
2. **Screenshots**: 1-5 images, 1280x800px or 640x400px
3. **Small tile**: 440x280px (optional)
4. **Marquee**: 1400x560px (for featured listings)

## Tips for Good Screenshots:

- Show the extension in action
- Highlight key features
- Use realistic browser environment
- Include Swagger UI context
- Show before/after scenarios
- Keep text readable at thumbnail size

## Current Assets Status:

- ✅ Store icon SVG created
- ✅ Screenshot template created
- ⏳ Need to capture actual screenshots
- ⏳ Need to convert SVG to PNG
