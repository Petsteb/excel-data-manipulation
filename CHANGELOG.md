# Changelog

All notable changes to Excel File Merger will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-04

### Added
- Initial release of Excel File Merger
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

- **Developer Experience**:
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

## [Unreleased]

### Planned
- Additional export formats
- Batch processing improvements
- Custom date format options
- Advanced filtering capabilities