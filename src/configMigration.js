/**
 * Config Migration Utility
 * Migrates from old settings.json to new multi-file config system
 */

import { configManager } from './configManager';

export async function migrateOldSettingsToNewConfig() {
  try {
    // Load old settings
    const oldSettings = await window.electronAPI.loadSettings();

    if (!oldSettings) {
      console.log('No old settings to migrate');
      return false;
    }

    console.log('Starting migration from old settings to new config system...');

    // Migrate to Panels Config
    await migrateToPanelsConfig(oldSettings);

    // Migrate to App Config
    await migrateToAppConfig(oldSettings);

    // Migrate to Accounts Config
    await migrateToAccountsConfig(oldSettings);

    console.log('Migration completed successfully!');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

async function migrateToPanelsConfig(oldSettings) {
  const panelsConfig = {
    version: '1.0.0',
    panels: {},
    buttons: {}
  };

  // Map old panelPositions to new structure
  if (oldSettings.uiSettings?.panelPositions) {
    const oldPositions = oldSettings.uiSettings.panelPositions;

    Object.entries(oldPositions).forEach(([panelId, pos]) => {
      if (panelId === 'generate-summary-button') {
        panelsConfig.buttons[panelId] = {
          position: { x: pos.x, y: pos.y },
          size: { width: pos.width || 240, height: pos.height || 80 },
          visible: true
        };
      } else {
        panelsConfig.panels[panelId] = {
          position: { x: pos.x, y: pos.y },
          size: { width: pos.width || 240, height: pos.height || 180 },
          visible: oldSettings.uiSettings?.panels?.visibility?.[panelId] ?? true,
          settings: getPanelSettings(panelId, oldSettings)
        };
      }
    });
  }

  await configManager.savePanelsConfig(panelsConfig);
  console.log('✓ Migrated panels config');
}

function getPanelSettings(panelId, oldSettings) {
  const settings = {};

  switch (panelId) {
    case 'anaf-header-panel':
      return {
        commonLines: oldSettings.anafHeaderPanel?.commonLines || 1,
        columnNamesRow: oldSettings.anafHeaderPanel?.columnNamesRow || 1,
        selectedDateColumns: oldSettings.anafHeaderPanel?.selectedDateColumns || [],
        dateColumnsWithTime: oldSettings.anafHeaderPanel?.dateColumnsWithTime || []
      };

    case 'account-selection-panel':
      return {
        dateInterval: {
          startDate: oldSettings.accountSelection?.dateInterval?.startDate || '01/01/2001',
          endDate: oldSettings.accountSelection?.dateInterval?.endDate || '05/06/2025'
        },
        selectedAccounts: oldSettings.accountSelection?.selectedAccounts || [],
        selectedAnafAccounts: oldSettings.accountSelection?.selectedAnafAccounts || [],
        accountConfigs: {},
        anafAccountConfigs: {},
        anafSubtractionEnabled: {}
      };

    case 'account-mapping-panel':
      return {
        accountMappings: oldSettings.accountMappings || {}
      };

    case 'worksheet-selection-panel':
      return {
        selectedWorksheets: oldSettings.worksheetSelection?.selectedWorksheets || {
          contaMergedData: true,
          anafMergedData: true,
          relationsSummary: true,
          contaAccountSums: true,
          anafAccountSums: true
        },
        includeEndOfYearTransactions: false
      };

    case 'sums-panel':
      return {
        accountSums: {},
        anafAccountSums: {},
        monthlyAnalysisSums: {}
      };

    default:
      return {
        columnNames: [],
        selectedDateColumns: [],
        autoDetectedDateColumns: [],
        dateColumnsWithTime: []
      };
  }
}

async function migrateToAppConfig(oldSettings) {
  const appConfig = {
    version: '1.0.0',
    theme: {
      current: oldSettings.theme || 'professional',
      customThemes: []
    },
    language: {
      current: oldSettings.language || 'en',
      available: ['en', 'ro', 'de', 'fr', 'es']
    },
    layout: {
      mode: oldSettings.uiSettings?.mode?.current || 'normal',
      layoutMode: {
        enabled: oldSettings.uiSettings?.panels?.layoutMode?.enabled || false,
        onlyPanels: oldSettings.uiSettings?.panels?.layoutMode?.onlyPanels || [
          'anaf-header-panel',
          'anaf-date-panel',
          'sums-panel'
        ],
        showControlPanel: oldSettings.uiSettings?.panels?.layoutMode?.showControlPanel || false
      }
    },
    screens: {
      mode: {
        enabled: oldSettings.uiSettings?.mode?.screenMode?.step !== 'idle',
        step: oldSettings.uiSettings?.mode?.screenMode?.step || 'idle'
      },
      homeScreen: oldSettings.uiSettings?.screens?.homeScreen || null,
      secondaryScreens: oldSettings.uiSettings?.screens?.secondaryScreens || [],
      currentScreen: oldSettings.uiSettings?.screens?.currentScreen || 'home',
      tabPosition: oldSettings.uiSettings?.screens?.tabPosition || 'left',
      creatingScreenRect: null,
      selectedPanelsForCentering: []
    },
    view: {
      panOffset: oldSettings.uiSettings?.view?.panOffset || { x: 0, y: 0 },
      normalModeScreenPosition: { x: 0, y: 0 },
      zoom: oldSettings.uiSettings?.view?.zoom || 1,
      gridVisible: oldSettings.uiSettings?.view?.gridVisible ?? true,
      gridSize: 20,
      snapToGrid: oldSettings.uiSettings?.view?.snapToGrid ?? true,
      isPanningDisabled: true
    },
    window: {
      isFirstLaunch: oldSettings.windowSettings?.isFirstLaunch ?? false,
      width: oldSettings.windowSettings?.width || 1200,
      height: oldSettings.windowSettings?.height || 800,
      x: oldSettings.windowSettings?.x || null,
      y: oldSettings.windowSettings?.y || null,
      isMaximized: oldSettings.windowSettings?.isMaximized || false,
      isFullScreen: oldSettings.windowSettings?.isFullScreen || false
    },
    upperRightButtons: {
      dashboard: { visible: true, enabled: true, order: 1 },
      theme: { visible: true, enabled: true, order: 2 },
      language: { visible: true, enabled: true, order: 3 },
      layoutMode: { visible: true, enabled: true, order: 4 },
      screenMode: { visible: true, enabled: true, order: 5 },
      settings: { visible: true, enabled: true, order: 6 }
    },
    menus: {
      themeMenu: { open: false, position: { x: 0, y: 0 } },
      languageMenu: { open: false, position: { x: 0, y: 0 } },
      layoutControlPanel: { open: false, position: { x: 0, y: 0 } }
    },
    ui: {
      showDashboard: false,
      showSettings: false,
      contextMenus: {
        account: null,
        anafAccount: null,
        mapping: null,
        screen: null
      },
      modals: {
        anafSelection: { open: false, contaAccount: '', selectedAnafAccount: '' },
        contaSelection: { open: false, selectedContaAccount: '' },
        mergedFilesPopup: { open: false },
        screenNamePopup: { open: false, name: '' },
        screenRenameDialog: { open: false, screenId: null, value: '' },
        colorPicker: { open: false, targetId: null }
      },
      dropdowns: {
        filterDropdown: false,
        sumDropdown: false,
        anafFilterDropdown: false,
        anafSumDropdown: false,
        anafSubtractFilterDropdown: false,
        anafSubtractSumDropdown: false,
        anafFilterValueDropdown: false,
        anafSubtractFilterValueDropdown: false
      }
    },
    processing: {
      isProcessing: false,
      status: '',
      summaryGenerated: false
    },
    files: {
      lastUsedPaths: oldSettings.files?.lastUsedPaths || {
        conta: null,
        anaf: null,
        output: null
      },
      recentFiles: oldSettings.files?.recentFiles || {
        conta: [],
        anaf: []
      }
    }
  };

  await configManager.saveAppConfig(appConfig);
  console.log('✓ Migrated app config');
}

async function migrateToAccountsConfig(oldSettings) {
  const accountsConfig = {
    version: '1.0.0',
    conta: {
      defaultAccounts: [
        '4423', '4424', '4315', '4316', '444', '436',
        '4411', '4418', '446.DIV', '446.CHIRII', '446.CV'
      ],
      availableAccounts: [
        '4423', '4424', '4315', '4316', '444', '436',
        '4411', '4418', '446.DIV', '446.CHIRII', '446.CV'
      ],
      customAccounts: [],
      removedDefaultAccounts: [],
      accountFiles: {},
      sumFormulas: oldSettings.sumFormulas?.conta || {},
      headerSettings: {
        commonLines: oldSettings.excel?.commonLines || 1,
        columnNamesRow: oldSettings.excel?.columnNamesRow || 1
      }
    },
    anaf: {
      defaultAccounts: [
        '1/4423', '1/4424', '2', '3', '7', '9', '14', '33',
        '412', '432', '451', '458', '459', '461', '480', '483', '628'
      ],
      availableAccounts: [
        '1/4423', '1/4424', '2', '3', '7', '9', '14', '33',
        '412', '432', '451', '458', '459', '461', '480', '483', '628'
      ],
      customAccounts: [],
      removedDefaultAccounts: [],
      accountFiles: {},
      sumFormulas: oldSettings.sumFormulas?.anaf || {},
      headerSettings: {
        commonLines: oldSettings.anafHeaderPanel?.commonLines || 1,
        columnNamesRow: oldSettings.anafHeaderPanel?.columnNamesRow || 1
      }
    },
    accountInput: {
      showContaInput: false,
      showAnafInput: false,
      newContaAccountInput: '',
      newAnafAccountInput: ''
    }
  };

  await configManager.saveAccountsConfig(accountsConfig);
  console.log('✓ Migrated accounts config');
}

/**
 * Check if migration is needed
 */
export async function checkMigrationNeeded() {
  try {
    // Check if new config files exist
    const panelsConfig = await window.electronAPI.loadPanelsConfig();
    const appConfig = await window.electronAPI.loadAppConfig();
    const accountsConfig = await window.electronAPI.loadAccountsConfig();

    // If any config file has default version and old settings exist, migration is needed
    const hasDefaultConfigs =
      panelsConfig.version === '1.0.0' &&
      appConfig.version === '1.0.0' &&
      accountsConfig.version === '1.0.0';

    const oldSettings = await window.electronAPI.loadSettings();
    const hasOldSettings = oldSettings && Object.keys(oldSettings).length > 0;

    return hasDefaultConfigs && hasOldSettings;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
}
