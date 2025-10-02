# Setting Up the App on a New PC

## Prerequisites

Install these on the new PC:

1. **Node.js** (v14 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

2. **Git**
   - Download from: https://git-scm.com/
   - Verify: `git --version`

3. **Git Configuration** (set your credentials)
   ```bash
   git config --global user.name "Petsteb"
   git config --global user.email "petsteb@gmail.com"
   ```

## Step 1: Clone the Repository

```bash
# Navigate to where you want the project
cd C:\Info\Projects  # or your preferred location

# Clone from GitHub
git clone https://github.com/Petsteb/excel-data-manipulation.git

# Enter the project directory
cd excel-data-manipulation
```

## Step 2: Install Dependencies

```bash
# Install all npm packages
npm install
```

This will install:
- Electron
- React
- ExcelJS
- XLSX
- All other dependencies listed in package.json

## Step 3: Run the App

### Development Mode (with hot reload)

```bash
npm run dev
```

This starts:
- React development server on http://localhost:3000
- Electron app with developer tools

### Production Mode (build first)

```bash
# Build React app
npm run build-react

# Run production app
npm start
```

## Step 4: Build Executable (Optional)

To create a distributable .exe file:

```bash
# For Windows
npm run dist
```

The executable will be in the `dist/` folder.

## Troubleshooting

### Issue: "npm install" fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Electron app won't start

**Solution:**
1. Make sure React dev server is running (for dev mode)
2. Make sure you've built React app (for production mode)
3. Check Node.js version: `node --version` (should be v14+)

### Issue: Config files not working

**Solution:**
Config files are created automatically on first run at:
- `%APPDATA%/excel-file-merger/config/`

They'll be created with defaults from `config-templates/`

## What Gets Transferred

### ✅ Included (from Git)
- All source code
- Configuration templates
- Documentation
- Package dependencies (via npm install)

### ❌ NOT Included (not in Git)
- `node_modules/` (reinstalled via npm)
- `dist/` (rebuilt on new PC)
- `build/` (rebuilt on new PC)
- User config files from `%APPDATA%` (created fresh)

## File Structure After Setup

```
excel-data-manipulation/
├── node_modules/          # Installed by npm
├── src/                   # Source code (from Git)
├── config-templates/      # Config templates (from Git)
├── dist/                  # Created by npm run dist
├── build/                 # Created by npm run build-react
├── main.js               # Main Electron process (from Git)
├── preload.js            # Preload script (from Git)
├── package.json          # Dependencies list (from Git)
└── README.md             # Documentation (from Git)
```

## Quick Commands Reference

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Run in development | `npm run dev` |
| Build React app | `npm run build-react` |
| Run production app | `npm start` |
| Create .exe | `npm run dist` |
| Update version | `npm version minor/major/patch` |

## App Data Location

User settings and config files are stored at:
```
Windows: C:\Users\<username>\AppData\Roaming\excel-file-merger\config\
```

These files:
- `panels-config.json` - Panel positions and settings
- `app-config.json` - App settings (theme, language, etc.)
- `accounts-config.json` - Account configurations

## Transferring User Settings (Optional)

If you want to keep your settings from the old PC:

1. **On old PC**, copy this folder:
   ```
   C:\Users\<username>\AppData\Roaming\excel-file-merger\
   ```

2. **On new PC**, paste it to:
   ```
   C:\Users\<username>\AppData\Roaming\excel-file-merger\
   ```

Otherwise, the app will create fresh configs with defaults on first run.

---

## Summary

**Minimal setup (just to run the app):**
```bash
git clone https://github.com/Petsteb/excel-data-manipulation.git
cd excel-data-manipulation
npm install
npm run dev
```

**Full setup (including build):**
```bash
git clone https://github.com/Petsteb/excel-data-manipulation.git
cd excel-data-manipulation
npm install
npm run build-react
npm run dist
```

That's it! The app is now ready on your new PC. 🚀
