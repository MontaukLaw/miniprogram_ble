
export function writeBLECMD(cmd, _deviceId, _serviceId, _characteristicId) {
    let buffer = new ArrayBuffer(cmd.length)
    let dataView = new DataView(buffer)
    
    // 循环遍历整个cmd数组
    for (let i = 0; i < cmd.length; i++) {
        dataView.setUint8(i, cmd[i])
    }

    wx.writeBLECharacteristicValue({
        deviceId: _deviceId,
        serviceId: _serviceId,
        characteristicId: _characteristicId,
        value: buffer,
    })
}
