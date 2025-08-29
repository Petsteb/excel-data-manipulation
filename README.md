# Data Manipulation branch AnaConta

A powerful desktop application for merging multiple Excel files with intelligent source tracking and date column detection.

## Features

- **Multi-file Support**: Merge multiple Excel files (.xlsx, .xls) into a single consolidated file
- **Source Tracking**: Automatically adds source file names to track data origin
- **Intelligent Date Detection**: Automatically detects and formats date columns
- **Flexible Header Management**: Configure how many header rows to preserve
- **Column Name Detection**: Specify which row contains column names
- **Date Column Selection**: Choose which detected date columns to format
- **Real-time Preview**: See detected columns and settings before merging
- **Cross-platform**: Works on Windows, macOS, and Linux

## Version History

### v1.0.0 (Current)
- Initial release with core functionality
- Excel file reading and merging
- Source tracking and date detection
- Configurable header settings
- Interactive column management
- Theme support and settings persistence

## Installation

1. Clone this repository
2. Install dependencies: `npm install`
3. Run the application: `npm run dev`

## Usage

1. **Select Files**: Choose multiple Excel files to merge
2. **Configure Settings**: 
   - Set number of common header lines (x)
   - Set row number for column names (y)
3. **Review Columns**: View detected date columns and other columns
4. **Merge**: Process files and create merged output
5. **Open Result**: View the merged Excel file

## Development

- `npm run dev` - Run in development mode
- `npm run build` - Build for production
- `npm run dist` - Create distribution package

## Versioning

This project uses semantic versioning (semver):
- `npm run version:patch` - Bug fixes (1.0.0 → 1.0.1)
- `npm run version:minor` - New features (1.0.0 → 1.1.0)
- `npm run version:major` - Breaking changes (1.0.0 → 2.0.0)

## Technologies

- **Electron** - Desktop app framework
- **React** - User interface
- **ExcelJS** - Excel file processing
- **XLSX** - Legacy Excel support
- **Node.js** - Backend processing

## License

Private project - All rights reserved