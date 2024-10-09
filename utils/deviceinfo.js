
export class DeviceInfo {
    constructor() {
        this.deviceType = "UNKNOWN";
        this.deviceId = 0;
        this.sensorNumber = 0;
        this.targetId = 0;
    }

    getDeviceType() {
        return this.deviceType;
    }

    setDeviceType(deviceType) {
        this.deviceType = deviceType;
    }

    getDeviceId() {
        return this.deviceId;
    }

    setDeviceId(deviceId) {
        this.deviceId = deviceId;
    }

    getSensorNumber() {
        return this.sensorNumber;
    }

    setSensorNumber(sensorNumber) {
        this.sensorNumber = sensorNumber;
    }

    getTargetId() {
        return this.targetId;
    }

    setTargetId(targetId) {
        this.targetId = targetId;
    }
    
}