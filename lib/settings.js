import GObject from 'gi://GObject';



export const SettingsManager = GObject.registerClass({
    Signals: {
        'active-profile-changed': {},
        'network-settings-changed': {}
    }
}, class SettingsManager extends GObject.Object {
    _init(extension) {
        super._init();
        this._settings = extension.getSettings();

        this._settings.connect('changed::active-profile-name', () => this.emit('active-profile-changed'));
        this._settings.connect('changed::profiles', () => this.emit('active-profile-changed'));

        this._settings.connect('changed::wifi-ssids', () => this.emit('network-settings-changed'));
        this._settings.connect('changed::keepalive-interval', () => this.emit('network-settings-changed'));
    }

    getActiveProfile() {
        const activeName = this._settings.get_string('active-profile-name');
        const profiles = this._settings.get_value('profiles').deepUnpack();
        const profile = profiles.find(p => p[0] === activeName);
        if (profile) { return { name: profile[0], username: profile[1], password: profile[2] }}
        return null;
    }

    getWifiSSIDs() {
        return this._settings.get_value('wifi-ssids').deepUnpack();
    }

    getKeepAliveInterval() {
        return this._settings.get_uint('keepalive-interval');
    }

    getRequestTimeout() {
        return this._settings.get_uint('request-timeout');
    }

    destroy() {
        this._settings = null;
    }
});