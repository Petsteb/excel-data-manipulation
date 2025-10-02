# Building Portable Executable

## Quick Start

```bash
npm run dist
```

This creates a **portable .exe** in the `dist/` folder that works on any Windows PC without installation.

## What You Get

**File:** `dist/Excel File Merger [version].exe`
**Size:** ~70 MB
**Type:** Standalone portable executable

### Features:
- ✅ No installation required
- ✅ Works on any Windows PC (Windows 7+)
- ✅ Contains all dependencies (Node.js, Electron, React, etc.)
- ✅ Single file - easy to distribute
- ✅ Can be run from USB drive
- ✅ User settings stored separately in `%APPDATA%`

## How to Use the Portable .exe

### On Your PC:
1. Build the exe: `npm run dist`
2. Find it in `dist/` folder
3. Copy to USB drive or share via network/cloud

### On Another PC:
1. Copy the `.exe` file anywhere
2. Double-click to run
3. No installation or setup needed!

## User Data Location

The portable .exe stores user config files at:
```
%APPDATA%/excel-file-merger/config/
```

This includes:
- `panels-config.json` - Panel positions and settings
- `app-config.json` - Theme, language, screen layout
- `accounts-config.json` - Account configurations

**These files are created automatically on first run.**

## Distribution Methods

### Method 1: USB Drive
```
1. npm run dist
2. Copy dist/Excel File Merger [version].exe to USB
3. Give USB to user
4. User runs .exe from USB (or copies to their PC first)
```

### Method 2: File Sharing
```
1. npm run dist
2. Upload dist/Excel File Merger [version].exe to:
   - OneDrive/Google Drive
   - File sharing service
   - Company network share
3. Share download link
4. User downloads and runs
```

### Method 3: GitHub Release
```
1. npm run dist
2. Create GitHub release
3. Upload dist/Excel File Merger [version].exe as asset
4. Users download from releases page
```

## Build Process Details

### What Happens During Build:

1. **React Build** (`npm run build-react`)
   - Compiles React app to static files
   - Output: `build/` folder
   - Creates optimized production bundle

2. **Electron Builder** (`electron-builder --publish=never`)
   - Packages Electron app with built React files
   - Includes all Node.js dependencies
   - Creates portable .exe
   - Output: `dist/Excel File Merger [version].exe`

### Build Configuration (package.json):

```json
"build": {
  "appId": "com.excelmerger.app",
  "productName": "Excel File Merger",
  "win": {
    "target": "portable",
    "signAndEditExecutable": false
  }
}
```

- **`target: "portable"`** - Creates standalone .exe (not installer)
- **`signAndEditExecutable: false`** - Skips code signing (no certificate needed)

## Troubleshooting

### Build Fails with Permission Errors

**Error:** "Cannot create symbolic link: A required privilege is not held"

**Solution:** Already fixed! The `signAndEditExecutable: false` setting prevents this.

If you still see errors:
```bash
# Clear cache and rebuild
rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache"
npm run dist
```

### .exe Too Large

The .exe is ~70MB because it includes:
- Electron runtime (~50MB)
- Node.js modules (~15MB)
- Your React app (~5MB)

This is normal for Electron apps. To reduce size:
- Run in production mode (already done)
- Remove unused dependencies
- Use `asar` compression (already enabled by default)

### .exe Won't Run on Another PC

**Check:**
1. Windows version (requires Windows 7+)
2. Antivirus blocking unsigned .exe
3. Windows SmartScreen warning (click "More info" → "Run anyway")

**Solution for SmartScreen:**
- The app is unsigned (no code signing certificate)
- Users need to click "More info" → "Run anyway" on first run
- Or: Purchase code signing certificate and sign the .exe

## Version Management

### Build New Version:

```bash
# 1. Update version
npm version patch  # or minor/major

# 2. Build new exe
npm run dist

# 3. Commit and push
git add .
git commit -m "Version bump"
git push origin master
git push --tags
```

The .exe filename includes version number automatically.

## Alternative: Installer .exe

If you want an installer instead of portable .exe:

**Update package.json:**
```json
"win": {
  "target": "nsis",  // Changed from "portable"
  "signAndEditExecutable": false
}
```

Then `npm run dist` creates an installer that:
- Installs to Program Files
- Creates Start Menu shortcuts
- Has uninstaller

## Quick Reference

| Command | What It Does |
|---------|-------------|
| `npm run dist` | Build portable .exe |
| `npm run build-react` | Build React only (for testing) |
| `npm start` | Run production mode locally |
| `npm run dev` | Run development mode |

## File Locations

| File/Folder | Purpose |
|-------------|---------|
| `dist/Excel File Merger [version].exe` | The portable executable |
| `dist/win-unpacked/` | Unpacked app files (for testing) |
| `build/` | Built React files |
| `config-templates/` | Default config templates |

---

## Summary

**To distribute your app to another PC:**

1. **Build:** `npm run dist`
2. **Locate:** `dist/Excel File Merger 2.5.0.exe`
3. **Distribute:** Copy to USB/cloud/network
4. **Run:** Double-click, no setup needed!

That's it! The portable .exe is completely self-contained. 🚀
