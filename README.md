# Swagger JWT Token Extractor

A Chrome extension that automatically captures and decodes JWT tokens from Swagger UI login responses. Perfect for API developers and testers who need quick access to JWT tokens for authentication testing.

## Features

- 🎯 **Automatic Token Capture**: Automatically intercepts JWT tokens from:
  - Authorization headers (Bearer tokens)
  - Login response bodies
  - Swagger UI authentication flows

- 🔍 **JWT Decoding**: 
  - Automatic base64 decoding of JWT payload
  - Clean, readable token information display
  - Copy token to clipboard functionality

- 📊 **Token History**:
  - Stores last 10 captured tokens
  - View previously captured tokens
  - Compare different tokens

- 🎨 **User-Friendly Interface**:
  - Clean popup interface
  - Real-time token updates
  - Options page for configuration

## Installation

### From Chrome Web Store
1. Visit the Chrome Web Store (coming soon)
2. Click "Add to Chrome"
3. Confirm installation

### Manual Installation (Development)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder

## Usage

1. **Automatic Mode**: Simply browse to any Swagger UI page and perform login operations. Tokens will be captured automatically.

2. **View Tokens**: Click the extension icon in your browser toolbar to view captured tokens.

3. **Copy Tokens**: Click the "Copy" button to copy the raw JWT token to your clipboard.

4. **Token History**: Use the history dropdown to view previously captured tokens.

## Supported Sites

The extension works on:
- Any Swagger UI implementation
- Sites with `/swagger/` or `/swagger-ui/` paths
- Sites with `/api-docs/` paths
- Bakalari.cz domains
- Custom domains (configurable in options)

## Privacy & Security

- **Local Storage Only**: All tokens are stored locally in your browser
- **No External Requests**: The extension doesn't send data to any external servers
- **Secure by Design**: Uses Chrome's secure extension APIs
- **Source Available**: Full source code is available for review

## Configuration

### URL Patterns
Configure which pages should have JWT capture scripts automatically injected:

1. Right-click the extension icon → "Options"
2. In the "URL Patterns for Content Scripts" section:
   - Add custom URL patterns using Chrome extension match pattern syntax
   - Examples:
     - `*://*/swagger/*` - Any Swagger path
     - `*://api.example.com/*` - Specific API domain  
     - `*://localhost:*/*` - All localhost pages
     - `*://*/docs/*` - Documentation pages

### API Origins
Configure domains for webRequest monitoring:
1. Right-click the extension icon → "Options"
2. In the "Allowed API Origins" section:
   - Add specific origins where JWT tokens should be captured
   - Grant explicit permissions for each domain

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: Only requests necessary permissions for token capture
- **Content Security Policy**: Strict CSP for enhanced security
- **Architecture**: Service worker + content script design

## Development

### Building
```bash
# Clone the repository
git clone [your-repo-url]
cd chrome-swagger-jwt

# Load unpacked extension in Chrome
# No build process required - load directly
```

### Structure
```
chrome-swagger-jwt/
├── manifest.json       # Extension configuration
├── worker.js          # Service worker (background script)
├── content.js         # Content script
├── popup.html         # Extension popup UI
├── popup.js           # Popup functionality
├── options.html       # Options page
├── icons/             # Extension icons
└── README.md          # This file
```

### Development Installation:

1. **Enable Chrome Developer Mode:**
   - Open Chrome browser
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (top right corner)

2. **Load unpacked extension:**
   - Click "Load unpacked" button
   - Select the project folder (`chrome-swagger-jwt`)
   - Extension will load and appear in the list

3. **Verify installation:**
   - Extension should appear with name "Swagger JWT Token Extractor"
   - Extension icon should appear in Chrome toolbar

### Reload after changes:

1. Go to `chrome://extensions/`
2. Find "Swagger JWT Token Extractor"
3. Click the refresh/reload icon
4. Or use Ctrl+R on the extension card

### Debugging:

- Service worker log: `chrome://extensions/` → "service worker" link for the extension
- Content script: Use Chrome DevTools on the target page

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Changelog

### Version 1.0.0
- Initial release
- JWT token capture from Authorization headers
- JWT token capture from login responses
- Token history functionality
- Popup interface with copy functionality
- Options page for configuration

## Support

If you encounter any issues:
1. Check the Issues page on GitHub
2. Create a new issue with detailed information
3. Include your Chrome version and extension version

## Disclaimer

This extension is designed for development and testing purposes. Always ensure you're authorized to capture and use tokens from the applications you're testing.
- Popup debugging: F12 v otevřeném popup okně
- Background errors se zobrazí na extension detail stránce
