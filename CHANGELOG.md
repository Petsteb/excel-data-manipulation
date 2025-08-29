# Changelog

All notable changes to Data Manipulation branch AnaConta will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-04

### Added
- Initial release of Data Manipulation branch AnaConta
- Multi-file Excel merging capability (.xlsx and .xls support)
- Intelligent source file tracking
- Automatic date column detection and formatting
- Configurable header row settings
- Interactive column management interface
- Real-time column preview
- Settings persistence across sessions
- Theme support with multiple color schemes
- Collapsible interface sections
- File selection with multi-select support
- Processing summary and statistics
- Error handling and validation
- Cross-platform Electron desktop app

### Features
- **Core Functionality**:
  - Merge multiple Excel files into single output
  - Preserve configurable number of header rows
  - Add source file column for data tracking
  - Support both .xlsx (ExcelJS) and .xls (XLSX library) formats

- **Smart Column Detection**:
  - Auto-detect date columns from data
  - Distinguish between date-only and datetime columns
  - Manual selection/deselection of date columns
  - Display all other columns in expandable list

- **User Interface**:
  - Step-by-step workflow interface
  - Collapsible sections for organized view
  - File list with selection management
  - Real-time settings updates
  - Status messages and progress indication

- **Settings & Configuration**:
  - Persistent settings storage
  - Theme customization
  - Automatic y=x default behavior
  - Input validation and error handling

- **ID Experience**:
  - Comprehensive debugging and logging
  - Proper error boundaries
  - Type safety and validation
  - Clean code architecture

### Technical Details
- Built with Electron 28.x + React 18.x
- ExcelJS for modern Excel file processing
- XLSX library for legacy Excel support
- Cross-platform compatibility
- No external dependencies for core functionality

## [1.1.0] - 2025-01-04

### Added
- **Dark Theme Support**: Complete dark mode variants for all existing themes
- **6 New Dark Themes**: Purple Dark, Ocean Blue Dark, Forest Green Dark, Rose Pink Dark, Sunset Orange Dark, Teal Dark
- **Enhanced Theme Menu**: Organized light and dark themes with visual icons (☀️/🌙)
- **Smart Theme System**: Automatic CSS variable switching for optimal dark mode experience
- **Improved Theme Organization**: Expandable sections with better visual hierarchy

### Enhanced
- **Theme Dropdown**: Larger, more organized interface with theme sections
- **CSS Variables**: Complete dark theme compatibility with dynamic text colors
- **Visual Feedback**: Better contrast and readability across all themes
- **Accessibility**: Proper contrast ratios for all theme combinations

### Technical
- Added automatic dark theme class application
- Enhanced CSS variable system for theme switching
- Improved theme menu layout and organization
- Added RGB color variables for all themes

## [Unreleased]

### Planned
- Additional export formats
- Batch processing improvements
- Custom date format options
- Advanced filtering capabilities