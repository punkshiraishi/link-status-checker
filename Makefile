# LinkStatusChecker Chrome Extension Build Script

# Extension info
EXTENSION_NAME = link-status-checker
VERSION = $(shell grep '"version"' manifest.json | cut -d'"' -f4)
ZIP_NAME = $(EXTENSION_NAME)-v$(VERSION).zip

# Files to include in the Chrome Web Store package
EXTENSION_FILES = \
	manifest.json \
	popup.html \
	popup.js \
	tab.html \
	tab.js \
	content.js

# Build directory
BUILD_DIR = build

.PHONY: all clean zip package install help set-version bump-patch bump-minor bump-major

# Default target
all: package

# Create the extension package for Chrome Web Store
package: clean
	@echo "📦 Building $(EXTENSION_NAME) v$(VERSION)..."
	@mkdir -p $(BUILD_DIR)
	@zip -j $(BUILD_DIR)/$(ZIP_NAME) $(EXTENSION_FILES)
	@echo "✅ Package created: $(BUILD_DIR)/$(ZIP_NAME)"
	@echo "📄 Files included:"
	@for file in $(EXTENSION_FILES); do echo "   - $$file"; done
	@echo "📊 Package size: $$(du -h $(BUILD_DIR)/$(ZIP_NAME) | cut -f1)"

# Alternative target name for convenience
zip: package

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build directory..."
	@rm -rf $(BUILD_DIR)
	@echo "✅ Clean complete"

# Install the extension for development (requires Chrome to be closed)
install: package
	@echo "🔧 To install the extension:"
	@echo "   1. Open Chrome and go to chrome://extensions/"
	@echo "   2. Enable 'Developer mode'"
	@echo "   3. Click 'Load unpacked' and select this directory"
	@echo "   4. Or use 'Pack extension' with $(BUILD_DIR)/$(ZIP_NAME)"

# Show version information
version:
	@echo "Extension: $(EXTENSION_NAME)"
	@echo "Version: $(VERSION)"
	@echo "Package: $(ZIP_NAME)"

# Set specific version (usage: make set-version VERSION=1.2)
set-version:
	@if [ -z "$(VERSION_NEW)" ]; then \
		echo "❌ Usage: make set-version VERSION_NEW=1.2"; \
		exit 1; \
	fi
	@echo "📝 Updating version from $(VERSION) to $(VERSION_NEW)..."
	@sed -i '' 's/"version": "$(VERSION)"/"version": "$(VERSION_NEW)"/' manifest.json
	@echo "✅ Version updated to $(VERSION_NEW)"

# Bump patch version (1.0 -> 1.1)
bump-patch:
	$(eval CURRENT_VERSION := $(shell echo $(VERSION) | cut -d'.' -f1))
	$(eval PATCH_VERSION := $(shell echo $(VERSION) | cut -d'.' -f2))
	$(eval NEW_PATCH := $(shell echo $$(($(PATCH_VERSION) + 1))))
	$(eval NEW_VERSION := $(CURRENT_VERSION).$(NEW_PATCH))
	@echo "📝 Bumping patch version: $(VERSION) -> $(NEW_VERSION)"
	@sed -i '' 's/"version": "$(VERSION)"/"version": "$(NEW_VERSION)"/' manifest.json
	@echo "✅ Version bumped to $(NEW_VERSION)"

# Bump minor version (1.0 -> 2.0)
bump-minor:
	$(eval CURRENT_VERSION := $(shell echo $(VERSION) | cut -d'.' -f1))
	$(eval NEW_MAJOR := $(shell echo $$(($(CURRENT_VERSION) + 1))))
	$(eval NEW_VERSION := $(NEW_MAJOR).0)
	@echo "📝 Bumping minor version: $(VERSION) -> $(NEW_VERSION)"
	@sed -i '' 's/"version": "$(VERSION)"/"version": "$(NEW_VERSION)"/' manifest.json
	@echo "✅ Version bumped to $(NEW_VERSION)"

# Show help
help:
	@echo "LinkStatusChecker Chrome Extension Build Commands:"
	@echo ""
	@echo "Build Commands:"
	@echo "  make package           - Create Chrome Web Store package (default)"
	@echo "  make zip               - Same as 'package'"
	@echo "  make clean             - Remove build artifacts"
	@echo ""
	@echo "Version Commands:"
	@echo "  make version           - Show current version"
	@echo "  make set-version VERSION_NEW=X.Y - Set specific version"
	@echo "  make bump-patch        - Bump patch version (1.0 -> 1.1)"
	@echo "  make bump-minor        - Bump minor version (1.0 -> 2.0)"
	@echo ""
	@echo "Other Commands:"
	@echo "  make install           - Show installation instructions"
	@echo "  make help              - Show this help message"
	@echo ""
	@echo "Examples:"
	@echo "  make set-version VERSION_NEW=1.2"
	@echo "  make bump-patch"
	@echo "  make package"
	@echo ""
	@echo "Output:"
	@echo "  $(BUILD_DIR)/$(ZIP_NAME)"