const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// Function to process a single file
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace motion import and usages
    const updatedContent = content
      .replace(/import\s*{\s*motion\s*(?:,\s*([^}]+))?\s*}\s*from\s*['"]framer-motion['"]/g, (match, rest) => {
        const otherImports = rest ? `, ${rest}` : '';
        return `import { m${otherImports} } from 'framer-motion'`;
      })
      .replace(/\bmotion\./g, 'm.')
      .replace(/<motion\./g, '<m.')
      .replace(/<\/motion\./g, '</m.')
      .replace(/<motion(\s|>)/g, '<m$1')
      .replace(/<\/motion>/g, '</m>');

    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`Updated: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Recursively process all files in a directory
function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  let updatedCount = 0;

  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      updatedCount += processDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.js')) {
      if (processFile(filePath)) {
        updatedCount++;
      }
    }
  });

  return updatedCount;
}

console.log('Starting to update Framer Motion imports and usages...');
const updatedFiles = processDirectory(srcDir);
console.log(`\nUpdated ${updatedFiles} files.`);
