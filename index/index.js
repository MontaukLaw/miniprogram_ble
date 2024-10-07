const app = getApp()
// var heatMapLib = require('../utils/heatmap.js');
var utils = require('../utils/utils.js');
var data_parser = require('../utils/dataparser.js');


const MAX_DISPLAY_RECORD = 100

// let g_log_l1 = ""
// let g_log_l2 = ""

// var sensorDataList =  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

const dataParser = new data_parser.DataParser();  // 创建一个新的 DataReceiver 实例

var tempSensorData = []

var diameters = [50, 60, 70, 20, 40, 50, 60, 20, 30, 20, 20, 40, 30, 40, 50, 33];
var sensorDataList = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
let diametersK = 0.2
var ifStartLog = false

class MyColor {
    // 构造函数，用于初始化对象
    constructor(r, b, g) {
        this.r = r;
        this.b = b;
        this.g = g;
    }
}


function drawCanvasTemperature(res) {
    // Canvas 对象
    const canvas = res[0].node
    // 渲染上下文
    const ctx = canvas.getContext('2d')

    // Canvas 画布的实际绘制宽高
    const screenWidth = res[0].width
    const screenHeight = res[0].height
    // 每行间隔数量
    const gap_x_number = 3
    // 初始化画布大小
    const dpr = wx.getWindowInfo().pixelRatio
    canvas.width = screenWidth * dpr
    canvas.height = screenHeight * dpr
    // 1179
    console.log("canvas width: " + canvas.width)
    console.log("convas height: " + canvas.height)
    console.log("dpr is " + dpr)
    ctx.scale(dpr, dpr)

    const margin_left_right = 50
    let point_size = 2
    let point_padding = 1
    let line_width = 1

    const draw = () => {
        // console.log("draw")
        const sDataList = utils.changeDiameters(diameters, sensorDataList, diametersK)
        let point_number = 16
        // ctx.fillStyle = 'rgb(200, 0, 0)';
        // 定义每个圆的直径（顺序按从左到右，从上到下）
        // const diameters = [50, 60, 70, 80, 40, 50, 60, 70, 90, 100, 110, 120, 30, 40, 50, 60];
        const k = 2
        // 定义网格的起始坐标和间距
        const startX = 50; // 第一列圆心的X坐标
        const startY = 300; // 第一行圆心的Y坐标

        // 每次先全部清理一遍
        ctx.clearRect(0, 0, screenWidth, screenHeight)

        if (tempSensorData.length >= MAX_DISPLAY_RECORD) {
            // console.log("temp sensor data: " + tempSensorData[0])

            // 绘制MAX_DISPLAY_RECORD个点, 从左到右, 点大小为point_size, 间隔为point_padding

            // for (let i = 0; i < MAX_DISPLAY_RECORD; i++) {
            //     let x = startX + i * (point_size + point_padding)
            //     let y = startY - getY(tempSensorData[i])// startY + tempSensorData[i]
            //     ctx.fillStyle = getColorByTemp(tempSensorData[i]);
            //     ctx.beginPath();
            //     ctx.arc(x, y, point_size, 0, 2 * Math.PI);
            //     ctx.fill();
            //     // ctx.fillRect(x, y, point_size, point_size);
            // }

            // 绘制MAX_DISPLAY_RECORD -1条线, 从左到右, 线粗line_width, 间隔为point_padding
            for (let i = 0; i < MAX_DISPLAY_RECORD - 1; i++) {
                let x1 = startX + i * (point_size + point_padding)
                let y1 = startY - getY(tempSensorData[i])// startY + tempSensorData[i]
                let x2 = startX + (i + 1) * (point_size + point_padding)
                let y2 = startY - getY(tempSensorData[i + 1])// startY + tempSensorData[i]
                ctx.strokeStyle = getColorByTemp(tempSensorData[i]);
                ctx.lineWidth = line_width
                ctx.beginPath();
                ctx.moveTo(x1, y1)
                ctx.lineTo(x2, y2)
                ctx.stroke();
            }
        }
        // 绘制16个圆, 加一点点阴影
        // for (let i = 0; i < 4; i++) {
        //     for (let j = 0; j < 4; j++) {
        //         const index = i * 4 + j; // 当前圆的索引
        //         const radius = diameters[index]; // 计算半径

        //         const x = startX + j * gapX; // 当前列的圆心X坐标
        //         const y = startY + i * gapY; // 当前行的圆心Y坐标
        //         // rgbColor = getColor(sDataList, index);
        //         ctx.fillStyle = getColorRGB(sDataList, index, 0.3); // 'rgba(0, 0, 0, 0.8)';
        //         ctx.shadowBlur = 30;
        //         ctx.shadowColor = getColorRGB(sDataList, index, 1); // getColor(sDataList, index); // (0, 0, 50, 'blue')
        //         ctx.beginPath();
        //         ctx.arc(x, y, radius, 0, 2 * Math.PI);
        //         ctx.fill();
        //     }
        // }
        // 注册下一帧渲染
        canvas.requestAnimationFrame(draw)
    }

    draw()
}

Page({
    data: {
        devices: [],
        connected: false,
        chs: [],
        log_l1: "",
        log_l2: "",
        isHiddenScanView: false,
        drawType: [
            { name: 'Heatmap', value: '热力图' },
            { name: 'LineChart', value: '折线图', checked: 'true' },
        ]
        // diameters: [],
        // sensorDataList: [],
    },

    onLoad() {
        wx.createSelectorQuery()
            // .select('#heatmap')
            .select('#myCanvas')
            .fields({
                node: true,
                size: true
            }).exec(res => {
                this.openBluetoothAdapter()
                // console.log(res)
                // var heatmapInstance = heatMapLib.create({
                //     // only container is required, the rest will be defaults
                //     // container: document.getElementById('heatmap'),
                //     container: res[0],
                //     maxOpacity: .5,
                //     radius: 50,
                //     blur: .75
                // });
                // typeof res
                // console.log(res[0].node)
                // console.log("hello")
                drawCanvasTemperature(res)
                // drawCanvas(res)
                // draw()
            })

        // this.querySelector('#heatmap'),
        // const query = this.createSelectorQuery();
        // let hm =query.select('#myCanvas');
        // var heatmapInstance = heatMapLib.create({
        //     // only container is required, the rest will be defaults
        //     // container: document.getElementById('heatmap'),
        //     container: hm,
        //     maxOpacity: .5,
        //     radius: 50,
        //     blur: .75
        // });

        // util.count("hello world")
    },
    onDrawTypeRadioChange: function (e) {
        console.log('radio发生change事件, 携带value值为:', e.detail.value)
    },
    openBluetoothAdapter() {
        wx.openBluetoothAdapter({
            // 打开蓝牙设备成功
            success: (res) => {
                console.log('openBluetoothAdapter success', res)
                // 就进行服务发现
                this.startBluetoothDevicesDiscovery()
            },
            fail: (res) => {
                if (res.errCode === 10001) {
                    wx.onBluetoothAdapterStateChange(function (res) {
                        console.log('onBluetoothAdapterStateChange', res)
                        if (res.available) {
                            this.startBluetoothDevicesDiscovery()
                        }
                    })
                }
            }
        })
    },
    getBluetoothAdapterState() {
        wx.getBluetoothAdapterState({
            success: (res) => {
                console.log('getBluetoothAdapterState', res)
                if (res.discovering) {
                    this.onBluetoothDeviceFound()
                } else if (res.available) {
                    this.startBluetoothDevicesDiscovery()
                }
            }
        })
    },
    startBluetoothDevicesDiscovery() {
        if (this._discoveryStarted) {
            return
        }
        this._discoveryStarted = true
        wx.startBluetoothDevicesDiscovery({
            allowDuplicatesKey: true,
            success: (res) => {
                console.log('startBluetoothDevicesDiscovery success', res)
                // 回调
                this.onBluetoothDeviceFound()
            },
        })
    },

    stopBluetoothDevicesDiscovery() {
        wx.stopBluetoothDevicesDiscovery()
    },

    // 服务发现的回调
    onBluetoothDeviceFound() {
        // 发现了服务
        wx.onBluetoothDeviceFound((res) => {
            // 对device进行遍历
            res.devices.forEach(device => {
                if (!device.name && !device.localName) {
                    // 没有名字的直接扔掉
                    return
                }
                // console.log(device.name)
                // console.log(device.localName)
                // 比较是否我们需要连接的设备的
                if (!device.name.startsWith("XAT v1")) {
                    return
                }
                const foundDevices = this.data.devices
                const idx = utils.inArray(foundDevices, 'deviceId', device.deviceId)
                const data = {}
                if (idx === -1) {
                    data[`devices[${foundDevices.length}]`] = device
                } else {
                    data[`devices[${idx}]`] = device
                }
                this.setData(data)
            })
        })
    },

    // 按下后执行连接
    createBLEConnection(e) {
        const ds = e.currentTarget.dataset
        const deviceId = ds.deviceId
        const name = ds.name
        wx.createBLEConnection({
            deviceId,
            success: (res) => {
                this.setData({
                    connected: true,
                    name,
                    deviceId,
                })

                // 获取
                // const mtu = getMaxBLEMTU(deviceId, 240);
                // 获取服务
                this.getBLEDeviceServices(deviceId)
            }
        })
        // 连接成功后停止设备发现
        this.stopBluetoothDevicesDiscovery()
    },

    closeBLEConnection() {
        wx.closeBLEConnection({
            deviceId: this.data.deviceId
        })
        this.setData({
            connected: false,
            chs: [],
            canWrite: false,
        })
    },
    // 获取service
    getBLEDeviceServices(deviceId) {
        wx.getBLEDeviceServices({
            deviceId,
            success: (res) => {
                for (let i = 0; i < res.services.length; i++) {
                    // 如果是主service
                    if (res.services[i].isPrimary) {
                        // 搜索特征字
                        console.log(res.services[i].uuid)
                        // 0000FE00-0000-1000-8000-00805F9B34FB
                        this.getBLEDeviceCharacteristics(deviceId, res.services[i].uuid)
                        return
                    }
                }
            }
        })
    },
    // 获取特征字
    getBLEDeviceCharacteristics(deviceId, serviceId) {
        wx.getBLEDeviceCharacteristics({
            deviceId,
            serviceId,
            success: (res) => {
                console.log('getBLEDeviceCharacteristics success', res.characteristics)
                for (let i = 0; i < res.characteristics.length; i++) {
                    let item = res.characteristics[i]
                    if (item.properties.read) {
                        console.log('Read CHAR' + res.characteristics[i].uuid)
                        wx.readBLECharacteristicValue({
                            deviceId,
                            serviceId,
                            characteristicId: item.uuid,
                        })
                    }
                    if (item.properties.write) {
                        console.log('Write CHAR' + res.characteristics[i].uuid)

                        this.setData({
                            canWrite: true
                        })
                        this._deviceId = deviceId
                        this._serviceId = serviceId
                        this._characteristicId = item.uuid
                        this.writeBLECharacteristicValueForInit()
                        // this.writeBLECharacteristicValue()
                    }
                    if (item.properties.notify || item.properties.indicate) {
                        console.log('Noty CHAR' + res.characteristics[i].uuid)
                        wx.notifyBLECharacteristicValueChange({
                            deviceId,
                            serviceId,
                            characteristicId: item.uuid,
                            state: true,
                        })
                    }
                }
            },
            fail(res) {
                console.error('getBLEDeviceCharacteristics', res)
            }
        })
        // 操作之前先监听，保证第一时间获取数据
        wx.onBLECharacteristicValueChange((characteristic) => {
            const idx = utils.inArray(this.data.chs, 'uuid', characteristic.characteristicId)
            const data = {}
            if (idx === -1) {
                data[`chs[${this.data.chs.length}]`] = {
                    uuid: characteristic.characteristicId,
                    value: utils.ab2hex(characteristic.value)
                }
            } else {
                var logStr = ""
                // 对数据做处理
                dataParser.parseData(characteristic.value)
                let displayVal = ""
                if (tempSensorData.length >= MAX_DISPLAY_RECORD) {
                    displayVal = tempSensorData[MAX_DISPLAY_RECORD - 1] + ""
                }
                // tempSensorData[0]
                data[`chs[${idx}]`] = {
                    uuid: characteristic.characteristicId,
                    // value: displayVal
                    value: utils.ab2hex(characteristic.value)
                    // value: ab2hex(characteristic.value)
                }

                data[`log_l1`] = dataParser.timeCounter();
                // data[`log_l2`] = g_log_l2

                // const sensorData = dataParser.parseData(characteristic.value)
                // if (tempSensorData != null) {
                // sensorDataList = sensorData
                //}
                // parse_char_value(characteristic.value)
            }
            // data[`chs[${this.data.chs.length}]`] = {
            //   uuid: characteristic.characteristicId,
            //   value: ab2hex(characteristic.value)
            // }
            this.setData(data)
        })
    },
    // 无用
    writeBLECharacteristicValue() {
        // 向蓝牙设备发送一个0x00的16进制数据
        let buffer = new ArrayBuffer(1)
        let dataView = new DataView(buffer)
        dataView.setUint8(0, Math.random() * 255 | 0)
        wx.writeBLECharacteristicValue({
            deviceId: this._deviceId,
            serviceId: this._deviceId,
            characteristicId: this._characteristicId,
            value: buffer,
        })
    },

    // 发送初始化命令
    writeBLECharacteristicValueForInit() {
        // 向蓝牙设备发送一个0x00的16进制数据
        // FF FF 06 09 FF FF FF FF FF FF FF FF FF FF FF FF FF 11
        let buffer = new ArrayBuffer(18)
        // let buffer = new ArrayBuffer([0xff, 0xff, 0x06, 0x09, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x11])
        let dataView = new DataView(buffer)
        // FF FF 06 09 FF FF FF FF FF FF FF FF FF FF FF FF FF 11
        dataView.setUint8(0, 0xff)
        dataView.setUint8(1, 0xff)
        dataView.setUint8(2, 0x06)
        dataView.setUint8(3, 0x09)
        dataView.setUint8(4, 0xFF)
        dataView.setUint8(5, 0xFF)
        dataView.setUint8(6, 0xFF)
        dataView.setUint8(7, 0xFF)
        dataView.setUint8(8, 0xFF)
        dataView.setUint8(9, 0xFF)
        dataView.setUint8(10, 0xFF)
        dataView.setUint8(11, 0xFF)
        dataView.setUint8(12, 0xFF)
        dataView.setUint8(13, 0xFF)
        dataView.setUint8(14, 0xFF)
        dataView.setUint8(15, 0xFF)
        dataView.setUint8(16, 0xFF)
        dataView.setUint8(17, 0x11)

        // dataView.setUint8(0, 0x23)
        // dataView.setUint8(1, 0x24)
        // dataView.setUint8(2, 0x01)

        // dataView.setUint8(0, Math.random() * 255 | 0)
        // 赋值十六进制数组
        // dataView[0] = 0x23;
        // dataView[1] = 0x24;
        // dataView[2] = 0x01;
        console.log("Writing init cmd")
        // console.log(dataView)
        // console.log(this._characteristicId.uuid)
        wx.writeBLECharacteristicValue({
            deviceId: this._deviceId,
            serviceId: this._serviceId,
            characteristicId: this._characteristicId,
            value: buffer,
        })
    },
    closeBluetoothAdapter() {
        wx.closeBluetoothAdapter()
        this._discoveryStarted = false
    },
})