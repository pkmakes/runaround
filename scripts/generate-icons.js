// Simple script to generate PWA icons
// Run with: node scripts/generate-icons.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '..', 'public')

// SVG icon template with the app's accent color
const createSvgIcon = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#5fb3b3"/>
  <g transform="translate(${size * 0.15}, ${size * 0.15})">
    <!-- Stylized path/arrow representing "Runaround" -->
    <rect x="${size * 0.05}" y="${size * 0.1}" width="${size * 0.25}" height="${size * 0.2}" rx="${size * 0.02}" fill="white" opacity="0.9"/>
    <rect x="${size * 0.4}" y="${size * 0.35}" width="${size * 0.25}" height="${size * 0.2}" rx="${size * 0.02}" fill="white" opacity="0.9"/>
    <!-- Arrow path -->
    <path d="M${size * 0.18} ${size * 0.3} L${size * 0.18} ${size * 0.45} L${size * 0.4} ${size * 0.45}" 
          stroke="white" stroke-width="${size * 0.04}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <polygon points="${size * 0.52},${size * 0.35} ${size * 0.62},${size * 0.45} ${size * 0.52},${size * 0.55}" fill="white"/>
  </g>
</svg>`

// Write SVG files (browsers can use these, and they can be converted to PNG)
const sizes = [192, 512]

sizes.forEach(size => {
  const svg = createSvgIcon(size)
  const filename = `pwa-${size}x${size}.svg`
  fs.writeFileSync(path.join(publicDir, filename), svg)
  console.log(`Created ${filename}`)
})

// Also create a simple favicon
const faviconSvg = createSvgIcon(32)
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg)
console.log('Created favicon.svg')

console.log('\n✅ Icons created!')
console.log('\nNote: For best PWA support, convert SVGs to PNGs:')
console.log('- pwa-192x192.svg → pwa-192x192.png')
console.log('- pwa-512x512.svg → pwa-512x512.png')
console.log('\nYou can use tools like https://svgtopng.com or Figma to convert.')

