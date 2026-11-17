import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import { TabrizuCsInternetIndicator } from './lib/indicator.js';
import { SettingsManager } from './lib/settings.js';
import { NetworkMonitor } from './lib/network.js';



export default class TabrizuCsInternetExtension extends Extension {
    enable() {
        this._settingsManager = new SettingsManager(this);
        this._networkMonitor = new NetworkMonitor(this._settingsManager);
        this._indicator = new TabrizuCsInternetIndicator(this, this._settingsManager, this._networkMonitor);

        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
        if (this._settingsManager) {
            this._settingsManager.destroy();
            this._settingsManager = null;
        }
        if (this._networkMonitor) {
            this._networkMonitor.destroy();
            this._networkMonitor = null;
        }
    }
}