import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

export const TabrizuCsInternetIndicator = GObject.registerClass(
class TabrizuCsInternetIndicator extends PanelMenu.Button {
  _init(extension) {
    super._init(0.0, 'Tabrizu CS Internet Indicator');
    this._extension = extension;

    this._setupIcon();
    this._setupMenu();
  }

  _setupIcon() {
    this._icon = new St.Icon({icon_name: 'network-wireless-symbolic', style_class: 'system-status-icon'});
    this.add_child(this._icon);
  }

  _setupMenu() {
    this._testItem = new PopupMenu.PopupMenuItem('TEST');
    this.menu.addMenuItem(this._testItem);
    this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
    this._createBottomButtons();
  }

  _createBottomButtons() {
    const bottomButtonsItem = new PopupMenu.PopupBaseMenuItem({reactive: false, can_focus: false});
    const buttonsBox = new St.BoxLayout({vertical: false, x_expand: true, style: 'spacing: 6px;'});

    const settingsBtn = new St.Button({label: 'Preferences', style_class: 'button', x_expand: true, y_expand: true, x_align: Clutter.ActorAlign.FILL, y_align: Clutter.ActorAlign.FILL});
    const portalBtn = new St.Button({label: 'Open Portal', style_class: 'button', x_expand: true, y_expand: true, x_align: Clutter.ActorAlign.FILL, y_align: Clutter.ActorAlign.FILL});

    settingsBtn.connect('clicked', () => {this.menu.close(); this._extension.openPreferences()});
    portalBtn.connect('clicked', () => {this.menu.close(); Gio.AppInfo.launch_default_for_uri('https://internet.tabrizu.ac.ir', null)});

    buttonsBox.add_child(settingsBtn);
    buttonsBox.add_child(portalBtn);
    bottomButtonsItem.add_child(buttonsBox);
    this.menu.addMenuItem(bottomButtonsItem);
  }
});