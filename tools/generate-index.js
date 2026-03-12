const fs = require('fs');
const path = require('path');

/**
 * generate-index.js
 * Scans the assets/templates folder for .json files and updates index.json
 * Usage: node tools/generate-index.js
 */

const templatesDir = path.join(__dirname, '..', 'assets', 'templates');
const indexPath = path.join(templatesDir, 'index.json');

try {
    console.log('🔍 Scanning for templates in:', templatesDir);

    // Read all files in the directory
    const files = fs.readdirSync(templatesDir);

    // Filter for .json files, excluding index.json itself
    const templateFiles = files.filter(file => {
        return file.endsWith('.json') && file !== 'index.json';
    });

    // Write the new index.json
    fs.writeFileSync(indexPath, JSON.stringify(templateFiles, null, 4));

    console.log('✅ Success! Found', templateFiles.length, 'templates.');
    console.log('📁 Updated index.json with:', templateFiles.join(', '));
} catch (err) {
    console.error('❌ Error generating template index:', err.message);
    process.exit(1);
}
