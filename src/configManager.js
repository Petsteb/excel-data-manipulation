/**
 * Config Manager Utility
 * Manages loading and saving of app configuration across multiple config files
 */

class ConfigManager {
  constructor() {
    this.panelsConfig = null;
    this.appConfig = null;
    this.accountsConfig = null;
  }

  /**
   * Load all config files
   */
  async loadAll() {
    try {
      this.panelsConfig = await window.electronAPI.loadPanelsConfig();
      this.appConfig = await window.electronAPI.loadAppConfig();
      this.accountsConfig = await window.electronAPI.loadAccountsConfig();

      return {
        panels: this.panelsConfig,
        app: this.appConfig,
        accounts: this.accountsConfig
      };
    } catch (error) {
      console.error('Error loading configs:', error);
      throw error;
    }
  }

  /**
   * Save panels configuration
   */
  async savePanelsConfig(config) {
    try {
      this.panelsConfig = config;
      return await window.electronAPI.savePanelsConfig(config);
    } catch (error) {
      console.error('Error saving panels config:', error);
      return false;
    }
  }

  /**
   * Save app configuration
   */
  async saveAppConfig(config) {
    try {
      this.appConfig = config;
      return await window.electronAPI.saveAppConfig(config);
    } catch (error) {
      console.error('Error saving app config:', error);
      return false;
    }
  }

  /**
   * Save accounts configuration
   */
  async saveAccountsConfig(config) {
    try {
      this.accountsConfig = config;
      return await window.electronAPI.saveAccountsConfig(config);
    } catch (error) {
      console.error('Error saving accounts config:', error);
      return false;
    }
  }

  /**
   * Update and save a specific panel's configuration
   */
  async updatePanelConfig(panelId, updates) {
    if (!this.panelsConfig) {
      await this.loadAll();
    }

    if (!this.panelsConfig.panels[panelId]) {
      console.warn(`Panel ${panelId} not found in config`);
      return false;
    }

    // Deep merge the updates
    this.panelsConfig.panels[panelId] = {
      ...this.panelsConfig.panels[panelId],
      ...updates,
      settings: {
        ...this.panelsConfig.panels[panelId].settings,
        ...(updates.settings || {})
      }
    };

    return await this.savePanelsConfig(this.panelsConfig);
  }

  /**
   * Update and save a panel's position
   */
  async updatePanelPosition(panelId, position) {
    return await this.updatePanelConfig(panelId, { position });
  }

  /**
   * Update and save a panel's size
   */
  async updatePanelSize(panelId, size) {
    return await this.updatePanelConfig(panelId, { size });
  }

  /**
   * Update and save a panel's visibility
   */
  async updatePanelVisibility(panelId, visible) {
    return await this.updatePanelConfig(panelId, { visible });
  }

  /**
   * Update and save a panel's settings
   */
  async updatePanelSettings(panelId, settings) {
    return await this.updatePanelConfig(panelId, { settings });
  }

  /**
   * Update and save theme
   */
  async updateTheme(theme) {
    if (!this.appConfig) {
      await this.loadAll();
    }

    this.appConfig.theme.current = theme;
    return await this.saveAppConfig(this.appConfig);
  }

  /**
   * Update and save language
   */
  async updateLanguage(language) {
    if (!this.appConfig) {
      await this.loadAll();
    }

    this.appConfig.language.current = language;
    return await this.saveAppConfig(this.appConfig);
  }

  /**
   * Update and save layout mode
   */
  async updateLayoutMode(layoutMode) {
    if (!this.appConfig) {
      await this.loadAll();
    }

    this.appConfig.layout.layoutMode = {
      ...this.appConfig.layout.layoutMode,
      ...layoutMode
    };
    return await this.saveAppConfig(this.appConfig);
  }

  /**
   * Update and save screens configuration
   */
  async updateScreens(screens) {
    if (!this.appConfig) {
      await this.loadAll();
    }

    this.appConfig.screens = {
      ...this.appConfig.screens,
      ...screens
    };
    return await this.saveAppConfig(this.appConfig);
  }

  /**
   * Update and save view settings
   */
  async updateView(view) {
    if (!this.appConfig) {
      await this.loadAll();
    }

    this.appConfig.view = {
      ...this.appConfig.view,
      ...view
    };
    return await this.saveAppConfig(this.appConfig);
  }

  /**
   * Update and save conta accounts
   */
  async updateContaAccounts(updates) {
    if (!this.accountsConfig) {
      await this.loadAll();
    }

    this.accountsConfig.conta = {
      ...this.accountsConfig.conta,
      ...updates
    };
    return await this.saveAccountsConfig(this.accountsConfig);
  }

  /**
   * Update and save anaf accounts
   */
  async updateAnafAccounts(updates) {
    if (!this.accountsConfig) {
      await this.loadAll();
    }

    this.accountsConfig.anaf = {
      ...this.accountsConfig.anaf,
      ...updates
    };
    return await this.saveAccountsConfig(this.accountsConfig);
  }

  /**
   * Get current panels config
   */
  getPanelsConfig() {
    return this.panelsConfig;
  }

  /**
   * Get current app config
   */
  getAppConfig() {
    return this.appConfig;
  }

  /**
   * Get current accounts config
   */
  getAccountsConfig() {
    return this.accountsConfig;
  }
}

// Export singleton instance
export const configManager = new ConfigManager();
