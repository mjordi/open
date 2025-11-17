/**
 * Build script for frontend deployment
 * Copies necessary files from frontend/public and frontend/src to frontend/dist
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_PUBLIC = path.join(__dirname, '../frontend/public');
const SRC_DIR = path.join(__dirname, '../frontend/src');
const DIST_DIR = path.join(__dirname, '../frontend/dist');

// Remove existing dist directory
if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
}

// Create dist directory structure
fs.mkdirSync(DIST_DIR, { recursive: true });
fs.mkdirSync(path.join(DIST_DIR, 'assets/images'), { recursive: true });
fs.mkdirSync(path.join(DIST_DIR, 'assets/icons'), { recursive: true });
fs.mkdirSync(path.join(DIST_DIR, 'js'), { recursive: true });
fs.mkdirSync(path.join(DIST_DIR, 'css'), { recursive: true });

// Copy files
console.log('Building frontend...');

// Copy HTML
fs.copyFileSync(
    path.join(SRC_PUBLIC, 'index.html'),
    path.join(DIST_DIR, 'index.html')
);
console.log('✓ Copied index.html');

// Copy assets
fs.copyFileSync(
    path.join(SRC_PUBLIC, 'assets/images/logo_open_header.png'),
    path.join(DIST_DIR, 'assets/images/logo_open_header.png')
);
console.log('✓ Copied logo');

fs.copyFileSync(
    path.join(SRC_PUBLIC, 'assets/icons/favicon.ico'),
    path.join(DIST_DIR, 'assets/icons/favicon.ico')
);
console.log('✓ Copied favicon');

// Copy JS files
fs.copyFileSync(
    path.join(SRC_DIR, 'js/app.js'),
    path.join(DIST_DIR, 'js/app.js')
);
console.log('✓ Copied app.js');

fs.copyFileSync(
    path.join(SRC_DIR, 'generated/abi.js'),
    path.join(DIST_DIR, 'js/abi.js')
);
console.log('✓ Copied abi.js');

fs.copyFileSync(
    path.join(SRC_DIR, 'generated/bytecode.js'),
    path.join(DIST_DIR, 'js/bytecode.js')
);
console.log('✓ Copied bytecode.js');

// Copy CSS
fs.copyFileSync(
    path.join(SRC_DIR, 'css/styles.css'),
    path.join(DIST_DIR, 'css/styles.css')
);
console.log('✓ Copied styles.css');

// Update paths in index.html for dist
let htmlContent = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf8');
htmlContent = htmlContent
    .replace('../src/css/styles.css', 'css/styles.css')
    .replace('../src/js/app.js', 'js/app.js')
    .replace('../src/generated/abi.js', 'js/abi.js')
    .replace('../src/generated/bytecode.js', 'js/bytecode.js');
fs.writeFileSync(path.join(DIST_DIR, 'index.html'), htmlContent);
console.log('✓ Updated paths in index.html');

console.log('\n✓ Frontend built successfully in frontend/dist/');
