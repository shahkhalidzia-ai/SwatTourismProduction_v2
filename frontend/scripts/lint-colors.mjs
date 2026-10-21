#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '../src');
const THEMES_DIR = path.resolve(SRC_DIR, 'themes');

const args = process.argv.slice(2);
const isStrict = args.includes('--strict');
const isCssOnly = args.includes('--css') || !args.includes('--all');

// Patterns for bare colors: #HEX, rgb(), rgba(), hsl(), hsla()
const HEX_PATTERN = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const RGB_PATTERN = /\b(?:rgb|rgba|hsl|hsla)\s*\([^)]*\)/g;

let totalViolations = 0;
const report = [];

function checkFile(filePath) {
  // Allow all files inside src/themes/
  if (filePath.startsWith(THEMES_DIR)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Skip comment-only lines or URL paths / data URLs
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      return;
    }
    if (line.includes('data:image') || line.includes('url(')) {
      return;
    }

    const hexMatches = line.match(HEX_PATTERN) || [];
    const rgbMatches = line.match(RGB_PATTERN) || [];

    // Filter out CSS variable fallbacks inside var(--name, #fallback) if allowed, or count them
    const matches = [...hexMatches, ...rgbMatches];
    if (matches.length > 0) {
      matches.forEach((m) => {
        totalViolations++;
        report.push({
          file: path.relative(SRC_DIR, filePath),
          line: index + 1,
          color: m,
          snippet: line.trim(),
        });
      });
    }
  });
}

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== 'tests') {
        scanDir(fullPath);
      }
    } else if (entry.isFile()) {
      if (isCssOnly && entry.name.endsWith('.css')) {
        checkFile(fullPath);
      } else if (!isCssOnly && /\.(css|tsx|ts|jsx|js)$/.test(entry.name)) {
        checkFile(fullPath);
      }
    }
  }
}

scanDir(SRC_DIR);

console.log('='.repeat(65));
console.log('  Swat Tourism Theme Color Audit & Token Compliance Linter');
console.log('='.repeat(65));
console.log(`Scan Mode: ${isCssOnly ? 'CSS Stylesheets' : 'All Source Files (CSS + TSX)'}`);
console.log(`Allowed Tokens Root: src/themes/`);
console.log(`Violations Found: ${totalViolations}`);
console.log('-'.repeat(65));

if (totalViolations > 0) {
  report.slice(0, 20).forEach((item) => {
    console.log(`  ${item.file}:${item.line} -> ${item.color}`);
  });
  if (report.length > 20) {
    console.log(`  ... and ${report.length - 20} more bare color occurrences.`);
  }
  console.log('='.repeat(65));

  if (isStrict || isCssOnly) {
    console.error(`\n❌ Error: Bare colors detected outside src/themes/!`);
    console.error(`Please replace them with semantic theme variables (e.g., var(--pri), var(--card), var(--line)).\n`);
    process.exit(1);
  }
} else {
  console.log(`\n✅ Success: All checked files strictly use semantic theme tokens! No bare colors found outside src/themes/.\n`);
  process.exit(0);
}
