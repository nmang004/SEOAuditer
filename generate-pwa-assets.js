#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// PWA icon sizes required
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Screenshot sizes for PWA
const screenshots = [
  { name: 'screenshot-wide.png', width: 1280, height: 720, description: 'Desktop screenshot' },
  { name: 'screenshot-narrow.png', width: 720, height: 1280, description: 'Mobile screenshot' }
];

// Apple splash screen sizes
const appleSplash = [
  { name: 'apple-splash-2048-2732.png', width: 2048, height: 2732 },
  { name: 'apple-splash-1668-2388.png', width: 1668, height: 2388 },
  { name: 'apple-splash-1536-2048.png', width: 1536, height: 2048 },
  { name: 'apple-splash-1125-2436.png', width: 1125, height: 2436 },
  { name: 'apple-splash-1242-2688.png', width: 1242, height: 2688 },
  { name: 'apple-splash-750-1334.png', width: 750, height: 1334 },
  { name: 'apple-splash-828-1792.png', width: 828, height: 1792 }
];

// Additional assets
const additionalAssets = [
  'shortcut-analysis.png',
  'shortcut-projects.png',
  'action-view.png',
  'action-dismiss.png',
  'og-image.png',
  'twitter-image.png'
];

function createPlaceholderIcon(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0284c7;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.15}"/>
  <text x="50%" y="45%" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${size * 0.15}" font-weight="bold">RO</text>
  <text x="50%" y="65%" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${size * 0.08}">SEO</text>
</svg>`;
}

function createPlaceholderScreenshot(width, height, description) {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
  
  <!-- Header -->
  <rect x="0" y="0" width="${width}" height="${height * 0.1}" fill="#0ea5e9"/>
  <text x="20" y="${height * 0.06}" fill="white" font-family="Arial, sans-serif" font-size="${height * 0.03}" font-weight="bold">Rival Outranker</text>
  
  <!-- Content area -->
  <rect x="${width * 0.05}" y="${height * 0.15}" width="${width * 0.9}" height="${height * 0.2}" fill="#1e293b" rx="8"/>
  <text x="${width * 0.1}" y="${height * 0.22}" fill="#0ea5e9" font-family="Arial, sans-serif" font-size="${height * 0.02}" font-weight="bold">SEO Analysis Dashboard</text>
  <text x="${width * 0.1}" y="${height * 0.27}" fill="#94a3b8" font-family="Arial, sans-serif" font-size="${height * 0.015}">Comprehensive SEO analysis and competitor insights</text>
  
  <!-- Stats cards -->
  <rect x="${width * 0.05}" y="${height * 0.4}" width="${width * 0.4}" height="${height * 0.15}" fill="#1e293b" rx="8"/>
  <text x="${width * 0.25}" y="${height * 0.45}" text-anchor="middle" fill="#10b981" font-family="Arial, sans-serif" font-size="${height * 0.03}" font-weight="bold">85</text>
  <text x="${width * 0.25}" y="${height * 0.5}" text-anchor="middle" fill="#94a3b8" font-family="Arial, sans-serif" font-size="${height * 0.015}">SEO Score</text>
  
  <rect x="${width * 0.55}" y="${height * 0.4}" width="${width * 0.4}" height="${height * 0.15}" fill="#1e293b" rx="8"/>
  <text x="${width * 0.75}" y="${height * 0.45}" text-anchor="middle" fill="#f59e0b" font-family="Arial, sans-serif" font-size="${height * 0.03}" font-weight="bold">12</text>
  <text x="${width * 0.75}" y="${height * 0.5}" text-anchor="middle" fill="#94a3b8" font-family="Arial, sans-serif" font-size="${height * 0.015}">Issues Found</text>
  
  <!-- Footer note -->
  <text x="${width * 0.5}" y="${height * 0.9}" text-anchor="middle" fill="#64748b" font-family="Arial, sans-serif" font-size="${height * 0.02}">${description}</text>
</svg>`;
}

function createDirectories() {
  const dirs = ['public/icons', 'public/images'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
}

function generateIcons() {
  console.log('Generating PWA icons...');
  iconSizes.forEach(size => {
    const svgContent = createPlaceholderIcon(size);
    const filePath = `public/icons/icon-${size}x${size}.png`;
    const svgPath = `public/icons/icon-${size}x${size}.svg`;
    
    // Write SVG version for now
    fs.writeFileSync(svgPath, svgContent);
    console.log(`Created placeholder icon: ${svgPath}`);
  });
}

function generateScreenshots() {
  console.log('Generating PWA screenshots...');
  screenshots.forEach(screenshot => {
    const svgContent = createPlaceholderScreenshot(screenshot.width, screenshot.height, screenshot.description);
    const filePath = `public/images/${screenshot.name}`;
    const svgPath = `public/images/${screenshot.name.replace('.png', '.svg')}`;
    
    // Write SVG version for now
    fs.writeFileSync(svgPath, svgContent);
    console.log(`Created placeholder screenshot: ${svgPath}`);
  });
}

function generateAppleSplashScreens() {
  console.log('Generating Apple splash screens...');
  appleSplash.forEach(splash => {
    const svgContent = createPlaceholderScreenshot(splash.width, splash.height, 'Apple Splash Screen');
    const svgPath = `public/images/${splash.name.replace('.png', '.svg')}`;
    
    fs.writeFileSync(svgPath, svgContent);
    console.log(`Created placeholder splash screen: ${svgPath}`);
  });
}

function generateAdditionalAssets() {
  console.log('Generating additional assets...');
  additionalAssets.forEach(asset => {
    const size = asset.includes('og-') || asset.includes('twitter-') ? 1200 : 96;
    const svgContent = createPlaceholderIcon(size);
    const svgPath = `public/icons/${asset.replace('.png', '.svg')}`;
    
    fs.writeFileSync(svgPath, svgContent);
    console.log(`Created placeholder asset: ${svgPath}`);
  });
}

function generateInstructions() {
  const instructions = `# PWA Assets Generation Complete

## Generated Placeholder Assets

### Icons (public/icons/)
${iconSizes.map(size => `- icon-${size}x${size}.svg (placeholder for icon-${size}x${size}.png)`).join('\n')}

### Screenshots (public/images/)
${screenshots.map(s => `- ${s.name.replace('.png', '.svg')} (placeholder for ${s.name})`).join('\n')}

### Apple Splash Screens (public/images/)
${appleSplash.map(s => `- ${s.name.replace('.png', '.svg')} (placeholder for ${s.name})`).join('\n')}

### Additional Assets (public/icons/)
${additionalAssets.map(a => `- ${a.replace('.png', '.svg')} (placeholder for ${a})`).join('\n')}

## Next Steps

1. **Replace SVG placeholders with actual PNG images:**
   - Use a tool like GIMP, Photoshop, or online converters to convert SVG to PNG
   - Ensure proper dimensions for each icon size
   - Use your actual app branding and colors

2. **Create high-quality screenshots:**
   - Take actual screenshots of your dashboard on desktop (1280x720)
   - Take actual screenshots on mobile (720x1280)
   - Optimize images for fast loading

3. **Generate proper favicons:**
   - Create a favicon.ico file with multiple sizes embedded
   - Consider using a favicon generator tool

4. **Test PWA installation:**
   - Open your app on mobile Chrome/Safari
   - Check for "Add to Home Screen" prompt
   - Verify all icons appear correctly

## Commands to convert SVG to PNG (using ImageMagick):

\`\`\`bash
# Install ImageMagick if not available
# brew install imagemagick (macOS)
# sudo apt-get install imagemagick (Ubuntu)

# Convert all SVG icons to PNG
for size in 72 96 128 144 152 192 384 512; do
  convert public/icons/icon-\${size}x\${size}.svg public/icons/icon-\${size}x\${size}.png
done

# Convert screenshots
convert public/images/screenshot-wide.svg public/images/screenshot-wide.png
convert public/images/screenshot-narrow.svg public/images/screenshot-narrow.png

# Convert Apple splash screens
for file in public/images/apple-splash-*.svg; do
  convert "\$file" "\${file%.svg}.png"
done
\`\`\`

## Online Tools for Icon Generation:
- PWA Builder (https://www.pwabuilder.com/)
- Favicon Generator (https://realfavicongenerator.net/)
- App Icon Generator (https://appicon.co/)
`;

  fs.writeFileSync('PWA_ASSETS_README.md', instructions);
  console.log('Created PWA_ASSETS_README.md with conversion instructions');
}

// Main execution
console.log('Starting PWA assets generation...');
createDirectories();
generateIcons();
generateScreenshots();
generateAppleSplashScreens();
generateAdditionalAssets();
generateInstructions();

console.log('\n✅ PWA assets generation complete!');
console.log('📖 Check PWA_ASSETS_README.md for next steps');
console.log('🎨 Replace the generated SVG files with actual PNG images for production'); 