import NM from 'gi://NM';



export function checkIsTargetNetwork(activeConnections, targetSSIDs) {
    if (!activeConnections || !targetSSIDs || targetSSIDs.length === 0) {
        return false;
    }

    for (const connection of activeConnections) {
        const devices = connection.get_devices() || [];

        for (const device of devices) {
            if (device instanceof NM.DeviceWifi) {
                const activeAp = device.get_active_access_point();
                if (activeAp) {
                    const ssidBytes = activeAp.get_ssid();
                    if (ssidBytes) {
                        const ssidString = NM.utils_ssid_to_utf8(ssidBytes.get_data());
                        if (targetSSIDs.includes(ssidString)) {
                            return true;
                        }
                    }
                }
            }
        }
    }

    return false;
}