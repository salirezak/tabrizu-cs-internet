import Adw from 'gi://Adw';
import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';



export default class TabrizuCsInternetLoginPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const connectionDescription = 'Configure request timeouts and the interval for keeping the session alive.';

    this._settings = this.getSettings();
    const page = new Adw.PreferencesPage({title: 'General', icon_name: 'preferences-system-symbolic'});

    const connectionGroup = new Adw.PreferencesGroup({title: 'Connection settings', description: connectionDescription});
    const resetGroup = new Adw.PreferencesGroup({title: 'Reset settings'});
    const networkGroup = this._createNetworkGroup();
    const profilesGroup = this._createProfileGroup();

    const timeoutRow = this._createScaleRow('request-timeout', 'Request timeout', 'Maximum time to wait for a response, in seconds.', 1, 120);
    const intervalRow = this._createScaleRow('keepalive-interval', 'Keepalive interval', 'Interval in minutes between requests that keep the internet session alive.', 0, 30);
    connectionGroup.add(timeoutRow);
    connectionGroup.add(intervalRow);

    const resetRow = this._createResetButtonRow();
    resetGroup.add(resetRow);

    page.add(networkGroup);
    page.add(profilesGroup);
    page.add(connectionGroup);
    page.add(resetGroup);
    window.add(page);
  }

  _showMessageDialog(title, body, row) {
    const dialog = new Adw.MessageDialog({heading: title, body: body, modal: true, transient_for: row.get_root(), destroy_with_parent: true});
    dialog.add_response('ok', 'OK');
    dialog.set_response_appearance('ok', Adw.ResponseAppearance.SUGGESTED);
    dialog.set_default_response('ok');
    dialog.present();
  }

  _setProfilesSetting(profiles) {
    const settings = this.getSettings();
    const variantBuilder = new GLib.VariantBuilder(new GLib.VariantType('a(sss)'));
    for (const [pName, pUser, pPass] of profiles) {
      variantBuilder.add_value(
        GLib.Variant.new_tuple(
          [new GLib.Variant('s', pName),
          new GLib.Variant('s', pUser),
          new GLib.Variant('s', pPass)]
        )
      );
    }
    settings.set_value('profiles', variantBuilder.end());
  }

  _validateProfileEntries(name, username, password, row, oldName=null) {
    const settings = this.getSettings();
    const isNew = (oldName == null);

    if (!name || !username || !password) {
      const dialog_title = 'Incomplete Information';
      const dialog_body = 'Please fill in all fields ';
      const dialog_body_postfix = isNew ? 'before adding a new profile.' : 'before saving changes.';
      this._showMessageDialog(dialog_title, dialog_body+dialog_body_postfix, row);
      return false;
    }

    const profiles = settings.get_value('profiles').deepUnpack();
    if ((isNew || name !== oldName ) && profiles.some(p => p[0] === name)) {
      const dialog_title = 'Duplicate Profile Name';
      const dialog_body = `A profile with the name "${name}" already exists.`;
      this._showMessageDialog(dialog_title, dialog_body, row);
      return false;
    }
    return true;
  }

  _createProfileEntryRow(icon_name, name=null, username=null, password=null) {
    const row = new Adw.PreferencesRow();
    const box = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 6, margin_top: 6, margin_bottom: 6, margin_start: 6, margin_end: 6});
    const nameEntry = new Gtk.Entry({placeholder_text: 'Profile Name', hexpand: true});
    const userEntry = new Gtk.Entry({placeholder_text: 'Username', hexpand: true});
    const passEntry = new Gtk.PasswordEntry({placeholder_text: 'Password', show_peek_icon: true, hexpand: true});
    const button = new Gtk.Button({icon_name: icon_name, css_classes: ['suggested-action'], valign: Gtk.Align.CENTER});

    if (name) nameEntry.set_text(name);
    if (username) userEntry.set_text(username);
    if (password) passEntry.set_text(password);

    box.append(nameEntry);
    box.append(userEntry);
    box.append(passEntry);
    box.append(button);
    row.set_child(box);

    return { row, nameEntry, userEntry, passEntry, button };
  }

  _createProfileRow(name, username, password) {
    const isActive = (name === this._settings.get_string('active-profile-name'));

    const row = new Adw.ExpanderRow({title: name, subtitle: username, icon_name: 'avatar-default-symbolic'});
    const { row: entryRow, nameEntry, userEntry, passEntry, button: editButton } = this._createProfileEntryRow('emblem-ok-symbolic', name, username, password);

    const buttonBox = new Gtk.Box({spacing: 4, orientation: Gtk.Orientation.HORIZONTAL, valign: Gtk.Align.CENTER});
    const deleteButton = new Gtk.Button({icon_name: 'user-trash-symbolic', css_classes: ['flat'], valign: Gtk.Align.CENTER});
    const activateCheck = new Gtk.CheckButton({valign: Gtk.Align.CENTER, active: isActive, sensitive: !isActive});

    deleteButton.connect('clicked', () => {
      let profiles = this._settings.get_value('profiles').deepUnpack();
      profiles = profiles.filter(p => p[0] !== name);
      this._setProfilesSetting(profiles);

      if (isActive) {
        const newActiveProfile = profiles.length > 0 ? profiles[0][0] : '';
        this._settings.set_string('active-profile-name', newActiveProfile);
      }
    });

    activateCheck.connect('toggled', () => {
      if (activateCheck.get_active()) {
        this._settings.set_string('active-profile-name', name);
      }
    });

    editButton.connect('clicked', () => {
      const newName = nameEntry.get_text().trim();
      const newUsername = userEntry.get_text().trim();
      const newPassword = passEntry.get_text();
      if (!this._validateProfileEntries(newName, newUsername, newPassword, row, name)) return;

      let profiles = this._settings.get_value('profiles').deepUnpack();
      const index = profiles.findIndex(p => p[0] === name);
      if (index !== -1) profiles[index] = [newName, newUsername, newPassword];
      this._setProfilesSetting(profiles);

      if (isActive && newName !== name) this._settings.set_string('active-profile-name', newName);
      row.set_expanded(false);
    });

    row.add_row(entryRow);
    buttonBox.append(activateCheck);
    buttonBox.append(deleteButton);
    row.add_suffix(buttonBox);
    return row;
  }

  _createAddNetworkRow() {
    const row = new Adw.ExpanderRow({title: 'Add Network', icon_name: 'list-add-symbolic'});
    const boxRow = new Adw.PreferencesRow();
    const box = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 6, margin_top: 6, margin_bottom: 6, margin_start: 6, margin_end: 6});

    const ssidEntry = new Gtk.Entry({placeholder_text: 'Enter Wi-Fi SSID', hexpand: true});
    const addButton = new Gtk.Button({icon_name: 'list-add-symbolic', css_classes: ['suggested-action'], valign: Gtk.Align.CENTER});

    addButton.connect('clicked', () => {
      const newSsid = ssidEntry.get_text().trim();
      if (!newSsid) return;
      let ssids = this._settings.get_value('wifi-ssids').deepUnpack();

      if (ssids.includes(newSsid)) {
        this._showMessageDialog('Duplicate Network', `The network "${newSsid}" is already in the list.`, row);
        return;
      }

      ssids.push(newSsid);
      this._settings.set_value('wifi-ssids', new GLib.Variant('as', ssids));

      ssidEntry.set_text('');
      row.set_expanded(false);
    });

    box.append(ssidEntry);
    box.append(addButton);
    boxRow.set_child(box);
    row.add_row(boxRow);

    return row;
  }

  _createAddProfileRow() {
    const row = new Adw.ExpanderRow({title: 'Create New Profile', icon_name: 'list-add-symbolic'});
    const { row: entryRow, nameEntry, userEntry, passEntry, button: addButton } = this._createProfileEntryRow('list-add-symbolic');

    addButton.connect('clicked', () => {
      const name = nameEntry.get_text().trim();
      const username = userEntry.get_text().trim();
      const password = passEntry.get_text();
      if (!this._validateProfileEntries(name, username, password, row)) return;

      let profiles = this._settings.get_value('profiles').deepUnpack()
      profiles.push([name, username, password]);
      this._setProfilesSetting(profiles);

      if (profiles.length === 1) this._settings.set_string('active-profile-name', name);
      if (this._settings.get_string('active-profile-name') === '') this._settings.set_string('active-profile-name', name);

      nameEntry.set_text('');
      userEntry.set_text('');
      passEntry.set_text('');
      row.set_expanded(false);
    });

    row.add_row(entryRow);
    return row;
  }

  _createNetworkRow(ssid) {
    const row = new Adw.ActionRow({title: ssid, icon_name: 'network-wireless-symbolic'});

    const deleteButton = new Gtk.Button({icon_name: 'user-trash-symbolic', css_classes: ['flat'], valign: Gtk.Align.CENTER});
    deleteButton.connect('clicked', () => {
      let ssids = this._settings.get_value('wifi-ssids').deepUnpack();
      ssids = ssids.filter(s => s !== ssid);
      this._settings.set_value('wifi-ssids', new GLib.Variant('as', ssids));
    });

    row.add_suffix(deleteButton);
    return row;
  }

  _refreshNetworkList(group, addRow, networkRows) {
    for (const row of networkRows) group.remove(row);
    try { group.remove(addRow); } catch (e) {}

    const newNetworkRows = [];
    const ssids = this._settings.get_value('wifi-ssids').deepUnpack();
    for (const ssid of ssids) {
      const ssidRow = this._createNetworkRow(ssid);
      group.add(ssidRow);
      newNetworkRows.push(ssidRow);
    }
    group.add(addRow);
    return newNetworkRows;
  }

  _createNetworkGroup() {
    const description = 'Specify the networks where the extension should manage the session.';
    const group = new Adw.PreferencesGroup({title: 'Wi-Fi networks', description: description});

    const addNetworkRow = this._createAddNetworkRow();
    let networkRows = this._refreshNetworkList(group, addNetworkRow, []);

    this._settings.connect('changed::wifi-ssids', () => {
      networkRows = this._refreshNetworkList(group, addNetworkRow, networkRows);
    });

    return group;
  }

  _refreshProfileList(group, addRow, profileRows) {
    for (const profileRow of profileRows) group.remove(profileRow);
    try { group.remove(addRow); } catch (e) {}

    const newProfileRows = [];
    const profiles = this._settings.get_value('profiles').deepUnpack();
    for (const [pName, pUser, pPass] of profiles) {
      const profileRow = this._createProfileRow(pName, pUser, pPass);
      newProfileRows.push(profileRow);
      group.add(profileRow);
    }
    group.add(addRow);
    return newProfileRows;
  }

  _createProfileGroup() {
    const description = 'Manage your portal accounts and select the active credentials.';
    const group = new Adw.PreferencesGroup({title: 'Profiles', description: description});

    const addProfileRow = this._createAddProfileRow();
    let profileRows = this._refreshProfileList(group, addProfileRow, []);

    this._settings.connect('changed::profiles', () => {
      profileRows = this._refreshProfileList(group, addProfileRow, profileRows);
    });

    this._settings.connect('changed::active-profile-name', () => {
      profileRows = this._refreshProfileList(group, addProfileRow, profileRows);
    });

    return group
  }

  _createScaleRow(key, title, subtitle, min, max) {
    const value = this._settings.get_uint(key);
    const defaultValue = this._settings.get_default_value(key).unpack();

    const row = new Adw.ActionRow({title, subtitle});
    const adjustment = new Gtk.Adjustment({lower: min, upper: max, step_increment: 1, page_increment: 4, value: value});
    const scale = new Gtk.Scale({orientation: Gtk.Orientation.HORIZONTAL, adjustment, digits: 0, draw_value: true, width_request: 200, valign: Gtk.Align.CENTER, hexpand: false});

    scale.add_mark(defaultValue, Gtk.PositionType.BOTTOM, null);
    scale.set_value_pos(Gtk.PositionType.RIGHT);

    scale.connect('value-changed', () => {
      const value = Math.round(scale.get_value());
      if (value !== this._settings.get_uint(key)) {
        this._settings.set_uint(key, value);
      }
    })

    this._settings.connect(`changed::${key}`, () => {
      const value = this._settings.get_uint(key);
      if (value !== Math.round(scale.get_value())) {
        scale.set_value(value);
      }
    });

    row.add_suffix(scale);
    row.set_activatable_widget(scale);
    return row;
  }

  _createResetButtonRow() {
    const title = 'Reset All Settings';
    const subtitle = 'Restore all settings to their default values.';

    const row = new Adw.ActionRow({title, subtitle});
    const button = new Gtk.Button({label: 'Reset', valign: Gtk.Align.CENTER});

    row.add_suffix(button);
    row.set_activatable_widget(button);

    button.connect('clicked', () => {
        this._settings.reset('wifi-ssids');
        this._settings.reset('profiles');
        this._settings.reset('active-profile-name');
        this._settings.reset('keepalive-interval');
        this._settings.reset('request-timeout');
    });
    return row;
  }
}
