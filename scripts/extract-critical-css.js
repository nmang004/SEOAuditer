#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class CriticalCSSExtractor {
  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    this.outputDir = path.join(process.cwd(), 'src', 'styles', 'critical');
    this.pages = [
      { url: '/', name: 'home' },
      { url: '/dashboard', name: 'dashboard' },
      { url: '/projects', name: 'projects' },
      { url: '/analyses', name: 'analyses' },
      { url: '/reports-demo', name: 'reports' }
    ];
  }

  async run() {
    console.log('🎨 Starting critical CSS extraction...');
    
    try {
      await this.ensureOutputDirectory();
      await this.extractCriticalCSS();
      await this.generateCombinedCSS();
      
      console.log('✅ Critical CSS extraction completed!');
    } catch (error) {
      console.error('❌ Critical CSS extraction failed:', error);
      process.exit(1);
    }
  }

  async ensureOutputDirectory() {
    try {
      await fs.access(this.outputDir);
    } catch {
      await fs.mkdir(this.outputDir, { recursive: true });
    }
  }

  async extractCriticalCSS() {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    for (const page of this.pages) {
      console.log(`  📄 Extracting critical CSS for: ${page.url}`);
      
      try {
        const browserPage = await browser.newPage();
        
        // Set viewport to simulate above-the-fold content
        await browserPage.setViewport({ width: 1200, height: 800 });
        
        // Navigate to page
        await browserPage.goto(`${this.baseUrl}${page.url}`, {
          waitUntil: 'networkidle0',
          timeout: 30000
        });

        // Extract critical CSS using coverage API
        await browserPage.coverage.startCSSCoverage();
        
        // Wait for page to be fully rendered
        await browserPage.waitForTimeout(2000);
        
        const cssCoverage = await browserPage.coverage.stopCSSCoverage();
        
        // Extract used CSS rules
        let criticalCSS = '';
        
        for (const entry of cssCoverage) {
          if (entry.url && entry.url.includes('/_next/static/css/')) {
            const usedCSS = this.extractUsedCSS(entry.text, entry.ranges);
            criticalCSS += usedCSS;
          }
        }

        // Also extract inline critical styles
        const inlineStyles = await browserPage.evaluate(() => {
          const styles = [];
          
          // Get all style elements
          const styleElements = document.querySelectorAll('style');
          styleElements.forEach(style => {
            if (style.textContent) {
              styles.push(style.textContent);
            }
          });
          
          return styles.join('\n');
        });

        criticalCSS += '\n' + inlineStyles;

        // Minify CSS
        const minifiedCSS = this.minifyCSS(criticalCSS);
        
        // Save critical CSS
        const outputPath = path.join(this.outputDir, `${page.name}.css`);
        await fs.writeFile(outputPath, minifiedCSS);
        
        console.log(`    ✅ Saved: ${outputPath} (${minifiedCSS.length} bytes)`);
        
        await browserPage.close();
        
      } catch (error) {
        console.error(`    ❌ Failed to extract CSS for ${page.url}:`, error.message);
      }
    }

    await browser.close();
  }

  extractUsedCSS(cssText, ranges) {
    let usedCSS = '';
    
    for (const range of ranges) {
      usedCSS += cssText.substring(range.start, range.end);
    }
    
    return usedCSS;
  }

  minifyCSS(css) {
    return css
      // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove whitespace around selectors and properties
      .replace(/\s*{\s*/g, '{')
      .replace(/;\s*/g, ';')
      .replace(/\s*}\s*/g, '}')
      .replace(/:\s*/g, ':')
      .replace(/,\s*/g, ',')
      // Remove trailing semicolons
      .replace(/;}/g, '}')
      .trim();
  }

  async generateCombinedCSS() {
    console.log('  🔗 Generating combined critical CSS...');
    
    try {
      let combinedCSS = '/* Critical CSS - Generated automatically */\n';
      
      // Read all individual critical CSS files
      const files = await fs.readdir(this.outputDir);
      const cssFiles = files.filter(file => file.endsWith('.css') && file !== 'combined.css');
      
      for (const file of cssFiles) {
        const filePath = path.join(this.outputDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        
        combinedCSS += `\n/* ${file} */\n${content}\n`;
      }
      
      // Remove duplicate rules (basic deduplication)
      combinedCSS = this.deduplicateCSS(combinedCSS);
      
      // Save combined file
      const combinedPath = path.join(this.outputDir, 'combined.css');
      await fs.writeFile(combinedPath, combinedCSS);
      
      console.log(`    ✅ Combined critical CSS saved: ${combinedPath} (${combinedCSS.length} bytes)`);
      
      // Generate usage instructions
      await this.generateUsageInstructions();
      
    } catch (error) {
      console.error('    ❌ Failed to generate combined CSS:', error.message);
    }
  }

  deduplicateCSS(css) {
    const rules = new Set();
    const lines = css.split('\n');
    const deduplicated = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Keep comments and empty lines
      if (trimmed.startsWith('/*') || trimmed === '') {
        deduplicated.push(line);
        continue;
      }
      
      // Deduplicate CSS rules
      if (!rules.has(trimmed)) {
        rules.add(trimmed);
        deduplicated.push(line);
      }
    }
    
    return deduplicated.join('\n');
  }

  async generateUsageInstructions() {
    const instructions = `# Critical CSS Usage Instructions

## Generated Files
- \`home.css\` - Critical CSS for homepage
- \`dashboard.css\` - Critical CSS for dashboard
- \`projects.css\` - Critical CSS for projects page
- \`analyses.css\` - Critical CSS for analyses page
- \`reports.css\` - Critical CSS for reports page
- \`combined.css\` - All critical CSS combined

## Implementation

### 1. In your Next.js pages, add critical CSS inline:

\`\`\`jsx
import Head from 'next/head';
import criticalCSS from '../styles/critical/home.css';

export default function HomePage() {
  return (
    <>
      <Head>
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
      </Head>
      {/* Your page content */}
    </>
  );
}
\`\`\`

### 2. Or use a custom hook:

\`\`\`jsx
import { useEffect } from 'react';

export function useCriticalCSS(pageName) {
  useEffect(() => {
    const link = document.createElement('style');
    link.textContent = require(\`../styles/critical/\${pageName}.css\`);
    document.head.appendChild(link);
    
    return () => document.head.removeChild(link);
  }, [pageName]);
}
\`\`\`

### 3. Load non-critical CSS asynchronously:

\`\`\`jsx
<Head>
  <link
    rel="preload"
    href="/_next/static/css/app.css"
    as="style"
    onLoad="this.onload=null;this.rel='stylesheet'"
  />
  <noscript>
    <link rel="stylesheet" href="/_next/static/css/app.css" />
  </noscript>
</Head>
\`\`\`

## Performance Benefits
- Faster First Contentful Paint (FCP)
- Improved Largest Contentful Paint (LCP)
- Reduced render-blocking resources
- Better Core Web Vitals scores
`;

    const instructionsPath = path.join(this.outputDir, 'README.md');
    await fs.writeFile(instructionsPath, instructions);
    
    console.log(`    📖 Usage instructions saved: ${instructionsPath}`);
  }
}

// Run the extractor
const extractor = new CriticalCSSExtractor();
extractor.run().catch(console.error); 