import NM from 'gi://NM';
import GObject from 'gi://GObject';
import { checkIsTargetNetwork } from './utils.js';


export const NetworkMonitor = GObject.registerClass({
    Signals: {
        'connection-status-changed': { param_types: [GObject.TYPE_BOOLEAN] }
    }
}, class NetworkMonitor extends GObject.Object {
    _init(settingsManager) {
        super._init();
        this._settingsManager = settingsManager;

        this._client = NM.Client.new(null);
        this._isConnectedToTarget = false;

        this._activeConnsId = this._client.connect('notify::active-connections', () => {this._checkConnection()});
        this._settingsId = this._settingsManager.connect('network-settings-changed', () => {this._checkConnection()});
        this._checkConnection();
    }

    _checkConnection() {
        const activeConnections = this._client.get_active_connections() || [];
        const targetSSIDs = this._settingsManager.getWifiSSIDs();
        const isTarget = checkIsTargetNetwork(activeConnections, targetSSIDs);

        if (this._isConnectedToTarget !== isTarget) {
            this._isConnectedToTarget = isTarget;
            this.emit('connection-status-changed', this._isConnectedToTarget);
        }
    }

    get isConnectedToTarget() {
        return this._isConnectedToTarget;
    }

    destroy() {
        if (this._activeConnsId) this._client.disconnect(this._activeConnsId);
        if (this._settingsId) this._settingsManager.disconnect(this._settingsId);
        this._client = null;
    }
});