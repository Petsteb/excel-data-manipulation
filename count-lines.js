#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // File extensions to count (code files)
  codeExtensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.scss', '.html', '.md'],
  
  // Directories to exclude
  excludeDirs: ['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.vscode', 'tmp'],
  
  // Files to exclude
  excludeFiles: ['package-lock.json', '.gitignore', '.env', 'count-lines.js'],
  
  // Show detailed breakdown by file type
  showDetails: true,
  
  // Show individual files (can be noisy for large codebases)
  showFiles: false
};

class LineCounter {
  constructor() {
    this.stats = {
      totalLines: 0,
      totalFiles: 0,
      byExtension: {},
      byDirectory: {},
      fileList: []
    };
  }

  shouldExcludeDir(dirName) {
    return CONFIG.excludeDirs.includes(dirName) || dirName.startsWith('.');
  }

  shouldExcludeFile(fileName) {
    return CONFIG.excludeFiles.includes(fileName) || 
           fileName.startsWith('.') ||
           !CONFIG.codeExtensions.some(ext => fileName.endsWith(ext));
  }

  countLinesInFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').length;
      
      // Don't count empty files
      if (lines === 1 && content.trim() === '') {
        return 0;
      }
      
      return lines;
    } catch (error) {
      console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
      return 0;
    }
  }

  scanDirectory(dirPath, relativePath = '') {
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const relativeItemPath = path.join(relativePath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          if (!this.shouldExcludeDir(item)) {
            this.scanDirectory(itemPath, relativeItemPath);
          }
        } else if (stat.isFile()) {
          if (!this.shouldExcludeFile(item)) {
            const lines = this.countLinesInFile(itemPath);
            
            if (lines > 0) {
              const ext = path.extname(item) || 'no-extension';
              const dir = relativePath || 'root';
              
              // Update statistics
              this.stats.totalLines += lines;
              this.stats.totalFiles += 1;
              
              // By extension
              this.stats.byExtension[ext] = (this.stats.byExtension[ext] || 0) + lines;
              
              // By directory
              this.stats.byDirectory[dir] = (this.stats.byDirectory[dir] || 0) + lines;
              
              // File list for detailed output
              this.stats.fileList.push({
                path: relativeItemPath,
                lines: lines,
                extension: ext
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${dirPath}: ${error.message}`);
    }
  }

  formatNumber(num) {
    return num.toLocaleString();
  }

  printResults() {
    console.log('\n🔢 CODEBASE LINE COUNT REPORT');
    console.log('=' .repeat(50));
    
    // Summary
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total Lines of Code: ${this.formatNumber(this.stats.totalLines)}`);
    console.log(`   Total Files: ${this.formatNumber(this.stats.totalFiles)}`);
    console.log(`   Average Lines per File: ${Math.round(this.stats.totalLines / this.stats.totalFiles)}`);
    
    if (CONFIG.showDetails) {
      // By file extension
      console.log(`\n📁 BY FILE TYPE:`);
      const sortedExtensions = Object.entries(this.stats.byExtension)
        .sort(([,a], [,b]) => b - a);
      
      for (const [ext, lines] of sortedExtensions) {
        const percentage = ((lines / this.stats.totalLines) * 100).toFixed(1);
        console.log(`   ${ext.padEnd(8)} ${this.formatNumber(lines).padStart(8)} lines (${percentage}%)`);
      }
      
      // By directory (top 10)
      console.log(`\n📂 BY DIRECTORY (Top 10):`);
      const sortedDirs = Object.entries(this.stats.byDirectory)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
      
      for (const [dir, lines] of sortedDirs) {
        const percentage = ((lines / this.stats.totalLines) * 100).toFixed(1);
        const displayDir = dir === 'root' ? '.' : dir;
        console.log(`   ${displayDir.padEnd(25)} ${this.formatNumber(lines).padStart(8)} lines (${percentage}%)`);
      }
    }
    
    if (CONFIG.showFiles) {
      // Individual files (top 20 largest)
      console.log(`\n📄 LARGEST FILES (Top 20):`);
      const sortedFiles = this.stats.fileList
        .sort((a, b) => b.lines - a.lines)
        .slice(0, 20);
      
      for (const file of sortedFiles) {
        console.log(`   ${file.path.padEnd(40)} ${this.formatNumber(file.lines).padStart(6)} lines`);
      }
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ Line counting complete!');
    
    // Show excluded info
    console.log(`\nℹ️  Excluded directories: ${CONFIG.excludeDirs.join(', ')}`);
    console.log(`ℹ️  Included extensions: ${CONFIG.codeExtensions.join(', ')}`);
  }
}

// Main execution
function main() {
  const startTime = Date.now();
  console.log('🚀 Starting line count analysis...');
  
  const counter = new LineCounter();
  const targetDir = process.argv[2] || '.';
  
  if (!fs.existsSync(targetDir)) {
    console.error(`Error: Directory "${targetDir}" does not exist.`);
    process.exit(1);
  }
  
  counter.scanDirectory(path.resolve(targetDir));
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  counter.printResults();
  console.log(`⏱️  Analysis completed in ${duration}s`);
}

if (require.main === module) {
  main();
}

module.exports = LineCounter;