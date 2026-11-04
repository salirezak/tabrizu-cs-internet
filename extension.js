import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import { TabrizuCsInternetIndicator } from './lib/indicator.js';



export default class TabrizuCsInternetExtension extends Extension {
    enable() {
        this._indicator = new TabrizuCsInternetIndicator(this);
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}