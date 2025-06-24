#!/usr/bin/env node

/**
 * Watch script: Tự động sync khi có ảnh mới trong assets/images
 * Usage: node scripts/watch-images.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ASSETS_DIR = 'assets/images';

// Create assets directory if not exists
if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
    console.log('📁 Created directory:', ASSETS_DIR);
}

let isProcessing = false;

function syncImages() {
    if (isProcessing) return;
    
    isProcessing = true;
    console.log('\n🔄 Detected changes, syncing images...');
    
    try {
        execSync('node scripts/sync-images.js', { stdio: 'inherit' });
    } catch (error) {
        console.error('❌ Sync failed:', error.message);
    } finally {
        isProcessing = false;
    }
}

console.log('👀 Watching assets/images for new files...');
console.log('💡 Drop your images into assets/images/ and they will auto-upload to jsDelivr!');
console.log('🛑 Press Ctrl+C to stop watching\n');

// Watch for file changes
fs.watch(ASSETS_DIR, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    
    // Only process image files
    if (!filename.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i)) return;
    
    if (eventType === 'rename') {
        const fullPath = path.join(ASSETS_DIR, filename);
        
        // Check if file was added (exists) or deleted (doesn't exist)
        if (fs.existsSync(fullPath)) {
            console.log(`📸 New image detected: ${filename}`);
            // Debounce - wait a bit for file to be fully written
            setTimeout(syncImages, 1000);
        }
    }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Stopping image watcher...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Stopping image watcher...');
    process.exit(0);
}); 