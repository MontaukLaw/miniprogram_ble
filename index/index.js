const app = getApp()
// var heatMapLib = require('../utils/heatmap.js');
var utils = require('../utils/utils.js');
var canvas_draw = require('../utils/canvasdraw.js');
var data_parser = require('../utils/dataparser.js');
var blecmd = require('../utils/blecmd.js');
var draw_param = require('../utils/drawparams.js');

// const DRAW_TYPE_HEATMAP = 0
// const DRAW_TYPE_LINECHART = 1

// let g_log_l1 = ""
// let g_log_l2 = ""

// var sensorDataList =  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

const dataParser = new data_parser.DataParser();  // 创建一个新的 DataReceiver 实例
const drawParam = new draw_param.DrawParams();
const SENSOR_IDX_STR_16_CH = ['All', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'];
const SENSOR_IDX_STR_4_CH = ['All', '1', '2', '3', '4'];
// var tempSensorData = []

// var diameters = [50, 60, 70, 20, 40, 50, 60, 20, 30, 20, 20, 40, 30, 40, 50, 33];
// var sensorDataList = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
// let diametersK = 0.2
// var ifStartLog = false

// var nowDrawType = DRAW_TYPE_LINECHART // DRAW_TYPE_LINECHART

// var displaySensorIdx = draw_param.DISPLAY_ALL
// var drawType = 1

class MyColor {
    // 构造函数，用于初始化对象
    constructor(r, b, g) {
        this.r = r;
        this.b = b;
        this.g = g;
    }
}

Page({
    data: {
        devices: [],
        connected: false,
        chs: [],
        log_l1: "",
        log_l2: "",
        isHiddenScanView: false,
        drawingType: [
            { name: 'Heatmap', value: '热力图' },
            { name: 'LineChart', value: '折线图', checked: 'true' },
        ],
        sensorNumber: 0,
        deviceType: "UNKNOWN",
        deviceId: 0,
        sensorIdx: ['All'],
        // ['All', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'],
        // years: ,
        // diameters: [],
        // sensorDataList: [],
    },

    aboutTap: function (event) {
        wx.showModal({
            title: '关于',
            content: '待定',
            success(res) {
                if (res.confirm) {
                    // console.log('用户点击确定')
                } else if (res.cancel) {
                    // console.log('用户点击取消')
                }
            }
        })
    },

    disconnectTap: function (event) {
        this.closeBLEConnection()
    },

    bindSensoIdxChange: function (e) {
        console.log('bindSensoIdxChange to:', e.detail.value)
        var displaySensorIdx = e.detail.value
        drawParam.setDisplaySensorIdx(displaySensorIdx)

        // displaySensorIdx = e.detail.value
        console.log("sensorIdx is " + displaySensorIdx)
    },

    onDrawTypeRadioChange: function (e) {
        // console.log('onDrawTypeRadioChange, 携带value值为:', e.detail.value)
        if (e.detail.value == 'Heatmap') {
            console.log("draw heatmap")
            drawParam.setDrawType(draw_param.DRAW_TYPE_HEATMAP)
        } else {
            console.log("draw line chart")
            drawParam.setDrawType(draw_param.DRAW_TYPE_LINECHART)
        }
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
                canvas_draw.canvasDrawing(res, drawParam, dataParser)
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
            console.log("already started")
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
        drawParam.setDrawType(draw_param.DRAW_NOTHING)

        wx.closeBLEConnection({
            deviceId: this.data.deviceId
        })

        this.closeBluetoothAdapter();

        this.setData({
            connected: false,
            chs: [],
            canWrite: false,
            devices: [],
            log_l1: "",
            log_l2: "",
            sensorNumber: 0,
            deviceType: "UNKNOWN",
            deviceId: 0,
        })

        dataParser.resetDataParser()
        // dataParser = new data_parser.DataParser();
        // drawParam = new draw_param.DrawParams();
        drawParam.setDrawType(draw_param.DRAW_TYPE_LINECHART)

        this.openBluetoothAdapter()

        // wx.startBluetoothDevicesDiscovery()

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
                        this.writeBLECharToStopTrans()
                        setTimeout(() => {
                            this.writeBLECharToQueryDeviceType()
                            setTimeout(() => {
                                this.writeBLECharToQuerySensorNumber()
                            }, 200)
                        }, 2000)

                        //this.writeBLECharacteristicValueForInit()
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
                // let displayVal = ""
                // if (tempSensorData.length >= draw_param.MAX_DISPLAY_RECORD) {
                //     displayVal = tempSensorData[draw_param.MAX_DISPLAY_RECORD - 1] + ""
                // }
                // tempSensorData[0]
                data[`chs[${idx}]`] = {
                    uuid: characteristic.characteristicId,
                    // value: displayVal
                    value: utils.ab2hex(characteristic.value)
                    // value: ab2hex(characteristic.value)
                }

                data[`log_l1`] = dataParser.timeCounter();

                // 发现设备信息更新了
                if (dataParser.isDeviceInfoChanged()) {
                    let sNumber = dataParser.getDeviceInfo().getSensorNumber();
                    if (sNumber > 0 && dataParser.getDeviceInfo().getDeviceType() != "UNKNOWN") {
                        this.setData({
                            sensorNumber: sNumber,
                            deviceType: dataParser.getDeviceInfo().getDeviceType(),
                            deviceId: dataParser.getDeviceInfo().getDeviceId()
                        });

                        if (sNumber == 4) {
                            this.setData({ sensorIdx: SENSOR_IDX_STR_4_CH })
                        } else {
                            this.setData({ sensorIdx: SENSOR_IDX_STR_16_CH })
                        }

                        // 开启传输parseData 
                        this.writeBLECharToStartTrans()
                        // this.setData(`deviceType`, dataParser.getDeviceInfo().getDeviceType());
                        // this.setData(`deviceId`, dataParser.getDeviceInfo().getDeviceId());
                    }

                    dataParser.setDeviceInfoChanged(false);
                }
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
    writeBLECharToStopTrans() {
        let buffer = [0xff, 0xff, 0x06, 0x09,
            0xff, 0xff, 0xff, 0xff,
            0xff, 0xff, 0xff, 0xff,
            0xff, 0xff, 0xff, 0xff,
            0xff, 0x13
        ]
        blecmd.writeBLECMD(buffer, this._deviceId, this._serviceId, this._characteristicId)
    },

    writeBLECharToQueryDeviceType() {
        let buffer = [0xff, 0xff, 0x06, 0x09,
            0xff, 0xff, 0xff, 0xff,
            0xff, 0xff, 0xff, 0xff,
            0xff, 0xff, 0xff, 0xff,
            0xff, 0x01
        ]
        blecmd.writeBLECMD(buffer, this._deviceId, this._serviceId, this._characteristicId)
    },

    writeBLECharToQuerySensorNumber() {
        let buffer = [0xff, 0xff, 0x06, 0x09,
            0xff, 0xff, 0xff, 0xff,
            0xff, 0xff, 0xff, 0xff,
            0xff, 0xff, 0xff, 0xff,
            0xff, 0x03
        ]
        blecmd.writeBLECMD(buffer, this._deviceId, this._serviceId, this._characteristicId)
    },
    // 发送初始化命令
    writeBLECharToStartTrans() {
        let buffer = [0xff, 0xff, 0x06, 0x09,
            0xff, 0xff, 0xff, 0xff,
            0xff, 0xff, 0xff, 0xff,
            0xff, 0xff, 0xff, 0xff,
            0xff, 0x11
        ]

        blecmd.writeBLECMD(buffer, this._deviceId, this._serviceId, this._characteristicId)

        // 向蓝牙设备发送一个0x00的16进制数据
        // FF FF 06 09 FF FF FF FF FF FF FF FF FF FF FF FF FF 11
        // let buffer = new ArrayBuffer(18)
        // let buffer = new ArrayBuffer([0xff, 0xff, 0x06, 0x09, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x11])
        // let dataView = new DataView(buffer)
        // FF FF 06 09 FF FF FF FF FF FF FF FF FF FF FF FF FF 11
        // dataView.setUint8(0, 0xff)
        // dataView.setUint8(1, 0xff)
        // dataView.setUint8(2, 0x06)
        // dataView.setUint8(3, 0x09)
        // dataView.setUint8(4, 0xFF)
        // dataView.setUint8(5, 0xFF)
        // dataView.setUint8(6, 0xFF)
        // dataView.setUint8(7, 0xFF)
        // dataView.setUint8(8, 0xFF)
        // dataView.setUint8(9, 0xFF)
        // dataView.setUint8(10, 0xFF)
        // dataView.setUint8(11, 0xFF)
        // dataView.setUint8(12, 0xFF)
        // dataView.setUint8(13, 0xFF)
        // dataView.setUint8(14, 0xFF)
        // dataView.setUint8(15, 0xFF)
        // dataView.setUint8(16, 0xFF)
        // dataView.setUint8(17, 0x11)

        // dataView.setUint8(0, 0x23)
        // dataView.setUint8(1, 0x24)
        // dataView.setUint8(2, 0x01)

        // dataView.setUint8(0, Math.random() * 255 | 0)
        // 赋值十六进制数组
        // dataView[0] = 0x23;
        // dataView[1] = 0x24;
        // dataView[2] = 0x01;
        // console.log("Writing init cmd")
        // // console.log(dataView)
        // // console.log(this._characteristicId.uuid)
        // wx.writeBLECharacteristicValue({
        //     deviceId: this._deviceId,
        //     serviceId: this._serviceId,
        //     characteristicId: this._characteristicId,
        //     value: buffer,
        // })
    },
    closeBluetoothAdapter() {
        wx.closeBluetoothAdapter()
        this._discoveryStarted = false
    },
})