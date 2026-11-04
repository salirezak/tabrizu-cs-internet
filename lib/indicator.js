import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';



export const TabrizuCsInternetIndicator = GObject.registerClass(
class TabrizuCsInternetIndicator extends PanelMenu.Button {
  _init(extension, settingsManager){
    super._init(0.0, 'Tabrizu CS Internet Indicator');
    this._extension = extension;
    this._settingsManager = settingsManager;

    this._setupIcon();
    this._setupMenu();
    this._syncProfileData();

    this._profileChangedId = this._settingsManager.connect('active-profile-changed', () => {this._syncProfileData()});
  }

  destroy() {
      if (this._profileChangedId) {
          this._settingsManager.disconnect(this._profileChangedId);
      }
      super.destroy();
  }

  _syncProfileData() {
    const activeProfile = this._settingsManager.getActiveProfile();
    if (activeProfile) {
      this._profileLabel.set_text(activeProfile.name);
      this._usernameLabel.set_text(activeProfile.username);
    } else {
      this._profileLabel.set_text('No Profile Selected');
      this._usernameLabel.set_text('Configure in settings');
    }
  }

  _setupIcon() {
    this._iconContainer = new St.Widget({layout_manager: new Clutter.BinLayout(), x_expand: true, y_expand: true});
    this._icon = new St.Icon({icon_name: 'network-wireless-symbolic', style_class: 'system-status-icon', y_expand: true, y_align: Clutter.ActorAlign.CENTER});
    this._processingDot = new St.Widget({width: 5, height: 5, x_expand: true, y_expand: true, x_align: Clutter.ActorAlign.END, y_align: Clutter.ActorAlign.START, style: 'background-color: #3584e4; border-radius: 99px; margin-right: 4px; margin-top: 4px;', opacity: 0});

    this._iconContainer.add_child(this._icon);
    this._iconContainer.add_child(this._processingDot);
    this.add_child(this._iconContainer);
  }

  _setupMenu() {
    const sepStyle = 'padding-top: 2px; padding-bottom: 2px; margin-top: 2px; margin-bottom: 2px;';
    const sep1 = new PopupMenu.PopupSeparatorMenuItem();
    const sep2 = new PopupMenu.PopupSeparatorMenuItem();
    const sep3 = new PopupMenu.PopupSeparatorMenuItem();
    sep1.style = sepStyle;
    sep2.style = sepStyle;
    sep3.style = sepStyle;

    this._createStatusRow();
    this.menu.addMenuItem(sep1);
    this._createProfileRow();
    this.menu.addMenuItem(sep2);
    this._createKeepAliveRow();
    this.menu.addMenuItem(sep3);
    this._createBottomButtons();
  }

  _createStatusRow() {
    const statusItem = new PopupMenu.PopupBaseMenuItem({reactive: false, can_focus: false});
    const statusBox = new St.BoxLayout({vertical: false, x_expand: true, y_align: Clutter.ActorAlign.CENTER});
    const prefixLabel = new St.Label({text: 'Status:', y_align: Clutter.ActorAlign.CENTER, style: 'opacity: 1.0;'});
    this._statusLabel = new St.Label({text: 'Disconnected', y_align: Clutter.ActorAlign.CENTER, x_expand: true, x_align: Clutter.ActorAlign.END, style: 'font-weight: bold; opacity: 1.0'});

    statusBox.add_child(prefixLabel);
    statusBox.add_child(this._statusLabel);
    statusItem.add_child(statusBox);
    this.menu.addMenuItem(statusItem);
  }

  _createBottomButtons() {
    const bottomButtonsItem = new PopupMenu.PopupBaseMenuItem({reactive: false, can_focus: false});
    const buttonsBox = new St.BoxLayout({vertical: false, x_expand: true, style: 'spacing: 6px;'});
    const settingsBtn = new St.Button({label: 'Preferences', style_class: 'button', x_expand: true, y_expand: true, x_align: Clutter.ActorAlign.FILL, y_align: Clutter.ActorAlign.FILL, style: 'min-height: 36px;'});
    const portalBtn = new St.Button({label: 'Open Portal', style_class: 'button', x_expand: true, y_expand: true, x_align: Clutter.ActorAlign.FILL, y_align: Clutter.ActorAlign.FILL, style: 'min-height: 36px;'});

    settingsBtn.connect('clicked', () => this._onSettingsClicked());
    portalBtn.connect('clicked', () => this._onPortalClicked());

    buttonsBox.add_child(portalBtn);
    buttonsBox.add_child(settingsBtn);
    bottomButtonsItem.add_child(buttonsBox);
    this.menu.addMenuItem(bottomButtonsItem);
  }

  _createProfileRow() {
    const profileItem = new PopupMenu.PopupBaseMenuItem({reactive: false, can_focus: false});

    const labelsBox = new St.BoxLayout({vertical: true, x_expand: true, y_align: Clutter.ActorAlign.CENTER, style: 'spacing: 0px;'});
    this._profileLabel = new St.Label({text: 'Profile Name'});
    this._usernameLabel = new St.Label({text: 'username', style: 'font-size: 0.8em; opacity: 0.65;'});

    const buttonsBox = new St.BoxLayout({vertical: false, style: 'spacing: 6px;', y_align: Clutter.ActorAlign.CENTER});
    const loginBtn = new St.Button({label: 'Login', style_class: 'button', y_expand: true, y_align: Clutter.ActorAlign.FILL, style: 'padding: 4px 10px;'});
    const logoutBtn = new St.Button({style_class: 'button', y_expand: true, y_align: Clutter.ActorAlign.FILL, style: 'padding: 4px 8px;'});
    logoutBtn.set_child(new St.Icon({icon_name: 'system-log-out-symbolic', icon_size: 16}));

    loginBtn.connect('clicked', () => this._onLoginClicked());
    logoutBtn.connect('clicked', () => this._onLogoutClicked());

    labelsBox.add_child(this._profileLabel);
    labelsBox.add_child(this._usernameLabel);
    buttonsBox.add_child(loginBtn);
    buttonsBox.add_child(logoutBtn);
    profileItem.add_child(labelsBox);
    profileItem.add_child(buttonsBox);
    this.menu.addMenuItem(profileItem);
  }

  _createKeepAliveRow() {
    const keepAliveItem = new PopupMenu.PopupBaseMenuItem({reactive: false, can_focus: false});
    const labelsBox = new St.BoxLayout({vertical: true, x_expand: true, y_align: Clutter.ActorAlign.CENTER, style: 'spacing: 0px;'});

    this._keepAliveLabel = new St.Label({text: 'at --:--'});
    this._keepAliveDescLabel = new St.Label({text: 'A keep-alive request will be sent',  style: 'font-size: 0.8em; opacity: 0.65;'});
    const keepAliveBtn = new St.Button({style_class: 'button', y_expand: true, y_align: Clutter.ActorAlign.FILL, style: 'padding: 4px 8px;'});
    keepAliveBtn.set_child(new St.Icon({icon_name: 'view-refresh-symbolic', icon_size: 16}));

    keepAliveBtn.connect('clicked', () => this._onKeepAliveClicked());

    labelsBox.add_child(this._keepAliveLabel);
    labelsBox.add_child(this._keepAliveDescLabel);
    keepAliveItem.add_child(labelsBox);
    keepAliveItem.add_child(keepAliveBtn);
    this.menu.addMenuItem(keepAliveItem);
  }

  _onKeepAliveClicked() {
    this.menu.close();
  }

  _onSettingsClicked() {
    this.menu.close();
    this._extension.openPreferences();
  }

  _onPortalClicked() {
    this.menu.close();
    Gio.AppInfo.launch_default_for_uri('https://internet.tabrizu.ac.ir', null);
  }

  _onLoginClicked() {
    this.menu.close();
  }

  _onLogoutClicked() {
    this.menu.close();
  }


  setProcessing(isProcessing) {
    this._processingDot.remove_transition('processing');

    if (!isProcessing) {
      this._processingDot.opacity = 0;
      return
    }

    this._processingDot.opacity = 255;
    const transition = new Clutter.PropertyTransition({property_name: 'opacity',});
    transition.set_from(255);
    transition.set_to(100);
    transition.set_duration(300);
    transition.set_repeat_count(-1);
    transition.set_auto_reverse(true);
    transition.set_progress_mode(Clutter.AnimationMode.EASE_IN_OUT_CUBIC);
    this._processingDot.add_transition('processing', transition);
  }

  setUIState(state) {
    switch (state) {
      case 'gray':
        this._icon.style = 'color: #8c8c8c;';
        break;
      case 'green':
        this._icon.style = 'color: #2ec27e;';
        break;
      case 'red':
        this._icon.style = 'color: #e01b24;';
        break;
      default:
        this._icon.style = '';
    }
  }
});