# Privacy Policy for Swagger JWT Token Extractor

**Effective Date:** August 29, 2025

## Single Purpose Description

**Swagger JWT Token Extractor** is designed for a single purpose: to automatically capture and decode JWT authentication tokens from Swagger UI API documentation pages during development and testing workflows.

The extension helps developers by:
- Monitoring configured Swagger documentation pages for JWT tokens
- Extracting tokens from API login responses  
- Displaying decoded token information for debugging
- Storing user configuration locally for URL patterns

## Data Collection and Usage

### What Data We Collect
- **Configuration Data**: User-defined URL patterns and login endpoints (stored locally)
- **JWT Tokens**: Captured tokens from API requests (processed locally, not transmitted)
- **Page Content**: Limited access to configured Swagger pages to detect tokens

### How We Use Data
- All data processing occurs locally within your browser
- No data is transmitted to external servers or third parties
- JWT tokens are captured, decoded, and displayed only for your development purposes
- Configuration settings are stored in Chrome's local storage

### Data Storage
- All data is stored locally using Chrome's storage API
- No remote servers or databases are used
- Data persists only in your browser and can be cleared via extension options

## Permissions Justification

### Host Permissions (`*://*/*`)
- **Purpose**: Access user-configured Swagger documentation websites
- **Usage**: Only activates on URLs matching user-defined patterns
- **Limitation**: Users explicitly configure which sites the extension monitors

### ActiveTab Permission
- **Purpose**: Interact with the currently active tab containing Swagger UI
- **Usage**: Capture JWT tokens from API requests on configured pages

### Storage Permission  
- **Purpose**: Save user configuration settings locally
- **Usage**: Store URL patterns and login endpoints in Chrome's local storage

### Scripting Permission
- **Purpose**: Inject content scripts to monitor API requests
- **Usage**: Dynamically inject scripts only on user-configured Swagger pages

## Data Security

- No data transmission to external services
- All processing occurs locally in your browser
- JWT tokens are displayed temporarily and not permanently stored
- User configuration can be cleared at any time

## Third-Party Services

This extension does not use any third-party services, analytics, or external APIs.

## Data Deletion

Users can delete all extension data by:
1. Opening the extension options page
2. Clearing URL patterns and login endpoints
3. Uninstalling the extension (removes all local data)

## Contact Information

For privacy concerns or questions, please contact: [YOUR_EMAIL_HERE]

## Changes to Privacy Policy

Any changes to this privacy policy will be reflected in extension updates with appropriate version numbering.

---

**Compliance Statement**: This extension complies with Chrome Web Store Developer Program Policies regarding data usage, user privacy, and single-purpose functionality.
