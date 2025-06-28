# Link Status Checker

A Chrome extension that extracts article links from web pages and checks their HTTP status codes.

## Features

- Extract links from the current web page
- Check HTTP status codes for extracted links
- Simple popup interface with tab functionality

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

1. Navigate to any web page
2. Click the Link Status Checker extension icon
3. Click "Open Tab" to start analyzing links on the current page

## Files

- `manifest.json` - Extension configuration
- `popup.html` - Extension popup interface
- `popup.js` - Popup functionality
- `content.js` - Content script for link extraction
- `tab.html` - Analysis tab interface
- `tab.js` - Tab functionality for link checking

## Development

Use the included Makefile for building:

```bash
make
```

## Support

If you find this extension helpful, consider supporting development:

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/yourusername)