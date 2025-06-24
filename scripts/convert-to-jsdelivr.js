#!/usr/bin/env node

/**
 * Script để convert tất cả URL ảnh external sang jsDelivr CDN
 * Chạy: node scripts/convert-to-jsdelivr.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const REPO_OWNER = 'kientrinh24-05';
const REPO_NAME = 'weeding-myself';
const BRANCH = 'main';
const ASSETS_PATH = 'assets/images';

// jsDelivr base URL
const JSDELIVR_BASE = `https://cdn.jsdelivr.net/gh/${REPO_OWNER}/${REPO_NAME}@${BRANCH}/${ASSETS_PATH}`;

// Function để extract filename từ URL
function getFilenameFromUrl(url) {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();
    return filename;
}

// Function để convert URL
function convertToJsdelivr(originalUrl, filename) {
    return `${JSDELIVR_BASE}/${filename}`;
}

// Function để process HTML file
function processHtmlFile(filePath) {
    console.log(`Processing ${filePath}...`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Pattern để tìm URLs trong HTML
    const patterns = [
        // background-image: url("...")
        /background-image:\s*url\("([^"]+)"\)/g,
        // src="..."
        /src="([^"]+)"/g,
        // href="..." (cho images)
        /href="([^"]+\.(jpg|jpeg|png|gif|webp|svg))"/gi
    ];
    
    patterns.forEach(pattern => {
        content = content.replace(pattern, (match, url, ext) => {
            // Skip nếu đã là jsDelivr URL
            if (url.includes('cdn.jsdelivr.net')) {
                return match;
            }
            
            // Skip local files
            if (url.startsWith('./') || url.startsWith('../') || url.startsWith('/')) {
                return match;
            }
            
            // Skip data URLs
            if (url.startsWith('data:')) {
                return match;
            }
            
            try {
                const filename = getFilenameFromUrl(url);
                const newUrl = convertToJsdelivr(url, filename);
                
                console.log(`  ${url} -> ${newUrl}`);
                modified = true;
                
                return match.replace(url, newUrl);
            } catch (error) {
                console.warn(`  Skipping invalid URL: ${url}`);
                return match;
            }
        });
    });
    
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Updated ${filePath}`);
    } else {
        console.log(`ℹ️  No changes needed for ${filePath}`);
    }
}

// Main execution
function main() {
    console.log('🚀 Converting URLs to jsDelivr CDN...\n');
    
    // Process index.html
    const indexPath = 'kientrinhwedding/index.html';
    if (fs.existsSync(indexPath)) {
        processHtmlFile(indexPath);
    }
    
    // Process admin.html
    const adminPath = 'kientrinhwedding/admin.html';
    if (fs.existsSync(adminPath)) {
        processHtmlFile(adminPath);
    }
    
    console.log('\n✨ Conversion completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Download ảnh từ URLs cũ và save vào assets/images/');
    console.log('2. Commit và push changes lên GitHub');
    console.log('3. Test website với URLs mới');
    console.log('4. Purge cache nếu cần: https://purge.jsdelivr.net/');
}

main(); 