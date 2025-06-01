#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

class ImageOptimizer {
  constructor() {
    this.inputDir = path.join(process.cwd(), 'public');
    this.outputDir = path.join(process.cwd(), 'public', 'optimized');
    this.stats = {
      processed: 0,
      saved: 0,
      errors: 0
    };
  }

  async run() {
    console.log('🖼️  Starting image optimization...');
    
    try {
      await this.ensureOutputDirectory();
      await this.optimizeImages(this.inputDir);
      await this.generateReport();
      
      console.log('✅ Image optimization completed!');
    } catch (error) {
      console.error('❌ Image optimization failed:', error);
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

  async optimizeImages(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && entry.name !== 'optimized') {
        await this.optimizeImages(fullPath);
      } else if (entry.isFile() && this.isImageFile(entry.name)) {
        await this.optimizeImage(fullPath);
      }
    }
  }

  isImageFile(filename) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  async optimizeImage(imagePath) {
    try {
      const relativePath = path.relative(this.inputDir, imagePath);
      const outputPath = path.join(this.outputDir, relativePath);
      const outputDir = path.dirname(outputPath);
      
      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });
      
      const originalStats = await fs.stat(imagePath);
      const originalSize = originalStats.size;
      
      // Skip SVG files (just copy them)
      if (imagePath.toLowerCase().endsWith('.svg')) {
        await fs.copyFile(imagePath, outputPath);
        console.log(`  📄 Copied SVG: ${relativePath}`);
        return;
      }
      
      // Optimize image
      const image = sharp(imagePath);
      const metadata = await image.metadata();
      
      // Generate WebP version
      const webpPath = outputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      await image
        .webp({ quality: 85, effort: 6 })
        .toFile(webpPath);
      
      // Generate optimized original format
      if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
        await image
          .jpeg({ quality: 85, progressive: true, mozjpeg: true })
          .toFile(outputPath);
      } else if (metadata.format === 'png') {
        await image
          .png({ quality: 85, compressionLevel: 9, progressive: true })
          .toFile(outputPath);
      } else {
        // For other formats, just copy
        await fs.copyFile(imagePath, outputPath);
      }
      
      const optimizedStats = await fs.stat(outputPath);
      const optimizedSize = optimizedStats.size;
      const savings = originalSize - optimizedSize;
      const savingsPercent = ((savings / originalSize) * 100).toFixed(1);
      
      this.stats.processed++;
      this.stats.saved += savings;
      
      console.log(`  ✅ ${relativePath}: ${this.formatBytes(originalSize)} → ${this.formatBytes(optimizedSize)} (${savingsPercent}% saved)`);
      
    } catch (error) {
      this.stats.errors++;
      console.error(`  ❌ Failed to optimize ${imagePath}:`, error.message);
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async generateReport() {
    console.log('\n📊 Image Optimization Report:');
    console.log('================================');
    console.log(`📸 Images processed: ${this.stats.processed}`);
    console.log(`💾 Total space saved: ${this.formatBytes(this.stats.saved)}`);
    console.log(`❌ Errors: ${this.stats.errors}`);
    
    if (this.stats.processed > 0) {
      const avgSavings = this.stats.saved / this.stats.processed;
      console.log(`📈 Average savings per image: ${this.formatBytes(avgSavings)}`);
    }
  }
}

// Run the optimizer
const optimizer = new ImageOptimizer();
optimizer.run().catch(console.error); 