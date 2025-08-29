# Privacy Policy for Swagger JWT Token Extractor

**Last updated: August 29, 2025**

## Overview

Swagger JWT Token Extractor ("the Extension") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard information when you use our Chrome extension.

## Information We Collect

### Data Collection
The Extension **does not collect any personal information**. All data processing happens locally within your browser.

### Local Storage
The Extension stores the following data locally in your browser:
- JWT tokens captured from web requests
- Token history (last 10 tokens)
- Extension configuration settings
- User preferences

### No External Transmission
- **No data is sent to external servers**
- **No analytics or tracking is performed**
- **No personal information is collected**
- **No user behavior is monitored**

## How We Use Information

The locally stored information is used solely to:
- Display captured JWT tokens in the extension popup
- Maintain a history of recent tokens for user convenience
- Store user configuration preferences
- Provide core extension functionality

## Data Storage and Security

### Local Storage Only
- All data is stored locally using Chrome's secure storage APIs
- Data never leaves your device
- No cloud storage or external databases are used

### Data Retention
- Token history is limited to the last 10 captured tokens
- Older tokens are automatically removed to conserve storage
- Users can manually clear all stored data at any time

### Data Access
- Only you have access to your stored tokens
- The Extension cannot access tokens from other extensions or applications
- Data is isolated within the Extension's storage space

## Permissions

The Extension requests the following permissions:

### Required Permissions
- **activeTab**: To interact with the currently active browser tab
- **storage**: To save tokens and settings locally
- **webRequest**: To intercept network requests for token capture
- **scripting**: To inject scripts for token detection

### Host Permissions
- **All sites access**: Required to detect JWT tokens across different Swagger UI implementations
- This permission is used only for token detection and does not enable data collection

## Third-Party Services

The Extension **does not use any third-party services**, including:
- No analytics services (Google Analytics, etc.)
- No crash reporting services
- No advertising networks
- No social media integrations

## Children's Privacy

The Extension does not knowingly collect information from children under 13 years of age. The Extension is designed for software developers and API testers.

## Changes to This Policy

We may update this Privacy Policy from time to time. Any changes will be reflected in the "Last updated" date above. Continued use of the Extension after changes constitutes acceptance of the updated policy.

## Data Deletion

### User Control
Users can delete all stored data by:
1. Opening the Extension options page
2. Clicking "Clear All Data"
3. Or by uninstalling the Extension

### Automatic Deletion
- Token history is automatically limited to 10 entries
- Uninstalling the Extension removes all stored data

## Contact Information

If you have questions about this Privacy Policy or the Extension's privacy practices, please:
- Create an issue on our GitHub repository
- Contact us through the Chrome Web Store developer contact

## Compliance

This Extension complies with:
- Chrome Web Store privacy requirements
- General Data Protection Regulation (GDPR) principles
- California Consumer Privacy Act (CCPA) principles

## Your Rights

Since no personal data is collected or transmitted:
- There is no data to request, modify, or delete externally
- All data control is in your hands through the Extension interface
- No data portability is needed as everything remains local

## Technical Safeguards

- Uses Chrome's secure extension APIs
- Implements Content Security Policy (CSP)
- Follows Chrome extension security best practices
- Regular security reviews of code

---

**Summary**: This Extension prioritizes your privacy by keeping all data local, collecting no personal information, and transmitting no data to external services. Your JWT tokens and usage patterns remain completely private and under your control.
