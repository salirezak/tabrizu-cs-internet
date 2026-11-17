import NM from 'gi://NM';
import Clutter from 'gi://Clutter';



export function createBlinkingTransition(from = 255, to = 100, duration = 300) {
    const transition = new Clutter.PropertyTransition({property_name: 'opacity',});
    transition.set_from(from);
    transition.set_to(to);
    transition.set_duration(duration);
    transition.set_repeat_count(-1);
    transition.set_auto_reverse(true);
    transition.set_progress_mode(Clutter.AnimationMode.EASE_IN_OUT_CUBIC);
    return transition;
}

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