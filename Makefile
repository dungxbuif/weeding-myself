.PHONY: commit-assets test-cdn purge-cache help

# Commit và push assets
commit-assets:
	@echo "📤 Committing assets..."
	@git add assets/
	@git add kientrinhwedding/
	@git commit -m "✨ Update wedding assets"
	@git push

# Add new image manually
add-image:
	@echo "📸 Adding new image to jsDelivr..."
	@echo "Steps:"
	@echo "1. Copy your image to assets/images/"
	@echo "2. Run: make commit-assets"
	@echo "3. Your jsDelivr URL will be:"
	@echo "   https://cdn.jsdelivr.net/gh/kientrinh24-05/weeding-myself@develop/assets/images/YOUR_IMAGE.jpg"

# Quick sync - commit any new files in assets
sync:
	@echo "🔄 Syncing assets to GitHub..."
	@git add assets/
	@git commit -m "✨ Add new wedding assets" || echo "No new assets to commit"
	@git push
	@echo "✅ Done! Files uploaded to jsDelivr CDN"

# Test jsDelivr URLs
test-cdn:
	@echo "🧪 Testing CDN connection..."
	@curl -I "https://cdn.jsdelivr.net/gh/kientrinh24-05/weeding-myself@develop/assets/README.md"

# Purge cache nếu cần
purge-cache:
	@echo "🗑️  Purging jsDelivr cache..."
	@echo "Visit: https://purge.jsdelivr.net/gh/kientrinh24-05/weeding-myself@develop/assets/images/"
	@open "https://purge.jsdelivr.net/gh/kientrinh24-05/weeding-myself@develop/assets/images/"

# Show jsDelivr URL pattern
url-pattern:
	@echo "🔗 jsDelivr URL Pattern:"
	@echo "https://cdn.jsdelivr.net/gh/kientrinh24-05/weeding-myself@develop/assets/images/YOUR_IMAGE.jpg"
	@echo ""
	@echo "Example usage:"
	@echo "📁 Copy: cp ~/Desktop/photo.jpg assets/images/"
	@echo "📤 Sync: make sync"
	@echo "🔗 URL:  https://cdn.jsdelivr.net/gh/kientrinh24-05/weeding-myself@develop/assets/images/photo.jpg"

# Help
help:
	@echo "🛠️  Available commands:"
	@echo "  make add-image         - 📸 Instructions to add new image"
	@echo "  make sync              - 🔄 Sync assets to jsDelivr CDN"
	@echo "  make commit-assets     - 📤 Commit và push changes"
	@echo "  make test-cdn          - 🧪 Test jsDelivr connection"
	@echo "  make purge-cache       - 🗑️  Open purge cache page"
	@echo "  make url-pattern       - 🔗 Show URL pattern và usage"
	@echo ""
	@echo "🚀 Quick workflow:"
	@echo "  cp your-image.jpg assets/images/"
	@echo "  make sync" 