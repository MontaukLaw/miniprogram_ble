const app = getApp()
// var heatMapLib = require('../utils/heatmap.js');
// var util = require('../utils/test.js');

const BYTES_PER_MSG = 250;

function inArray(arr, key, val) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i][key] === val) {
            return i;
        }
    }
    return -1;
}

// ArrayBuffer转16进度字符串示例
function ab2hex(buffer) {
    var hexArr = Array.prototype.map.call(
        new Uint8Array(buffer),
        function (bit) {
            return ('00' + bit.toString(16)).slice(-2)
        }
    )
    return hexArr.join('');
}

function ab2ascii(buffer) {
    let asciiStr = '';
    let view = new Uint8Array(buffer);

    for (let i = 0; i < view.length; i++) {
        asciiStr += String.fromCharCode(view[i]);
    }

    return asciiStr;
}

function countCharacter(str, char) {
    let count = 0;
    for (let i = 0; i < str.length; i++) {
        if (str[i] === char) {
            count++;
        }
    }
    return count;
}


// var sensorDataList =  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

function change_circle_rad(diameters, sensorDataList) {
    const point_number = 16
    const diametersK = 2
    for (let i = 0; i < point_number; i++) {
        diameters[i] = diameters[i] + 1
        if (diameters[i] > 30) {
            diameters[i] = 1
        }
        // diameters[i] = sensorDataList[i] * diametersK
    }
    // console.log(diameters)
}

function DataParser() {
    this.totalBytesReceived = 0;  // 每个实例都会有自己的 totalBytesReceived 属性
    this.startTime = Date.now();  // 记录实例化时的时间
    this.lastSec = this.startTime
    this.ble_data_buff = [];
    this.ble_data_buff_str = "";
    this.biggestS0 = 0
}

const dataParser = new DataParser();  // 创建一个新的 DataReceiver 实例

DataParser.prototype.extractBetweenC0 = function () {
    let data_view = new Uint8Array(this.ble_data_buff);
    var str = ""
    for (let i = 0; i < data_view.length; i++) {
        str += String.fromCharCode(data_view[i]);
    }
    // 使用正则表达式来查找两个 'c0' 之间的字符
    const regex = /c0(.*?)c0/;
    const result = str.match(regex);

    if (result) {
        // result[1] 是两个 'c0' 之间的内容
        return result[1];
    } else {
        console.log("no match")
        // 如果没有匹配到两个 'c0'，返回 null 或其他提示信息
        return null;
    }
}


DataParser.prototype.timeCounter = function () {
    let timeNow = Date.now()
    if (timeNow - this.lastSec > 1000) {
        const elapsedTimeInSeconds = (timeNow - this.startTime) / 1000
        console.log("elapsedTimeInSeconds " + elapsedTimeInSeconds)
        const averageBytesPerSecond = this.totalBytesReceived / elapsedTimeInSeconds
        console.log(`Total bytes received: ${this.totalBytesReceived}`)
        console.log(`Average bytes per second: ${averageBytesPerSecond.toFixed(2)}`)
        this.lastSec = timeNow
    }

}

DataParser.prototype.getSensorData = function (solidMsg) {

    if (solidMsg.length > BYTES_PER_MSG) {
        // console.log("solid msg too big " + solidMsg + " len: " + solidMsg.length)
        return null;
    }
    if (countCharacter(solidMsg, 'c') !== 16) {
        // console.log("solid msg short of c" + solidMsg + " len: " + solidMsg.length)
        console.log("Short c")
        return null;
    }
    if (countCharacter(solidMsg, ':') !== 16) {
        // console.log("solid msg short of :" + solidMsg + " len: " + solidMsg.length)
        return null;
    }
    if (countCharacter(solidMsg, ',') !== 15) {
        // console.log("solid msg short of ," + solidMsg + " len: " + solidMsg.length)
        return null;
    }
    if (countCharacter(solidMsg, ' ') !== 15) {
        // console.log("solid msg short of space " + solidMsg + " len: " + solidMsg.length)
        return null;
    }

    let sensorDataL = []
    // 分割字符串为列表，以逗号和空格分隔
    let sensorData = solidMsg.split(/, /);
    // console.log(sensorData)

    // 从列表中提取数据
    // let sensorDataDict = {}

    for (let i = 0; i < sensorData.length; i++) {
        let data = sensorData[i].split(":")
        // sensorDataDict[data[0]] = data[1]
        sensorDataL.push(data[1])
    }

    if (this.biggestS0 < sensorDataL[0]) {
        console.log(sensorDataL[0])
        this.biggestS0 = sensorDataL[0]
    }
    ifStartLog = true
    return sensorDataL
    // console.log(sensorDataList)

}


DataParser.prototype.handleData = function () {
    let header = 'c0'

    let first_position = this.ble_data_buff_str.search(header);

    if (first_position === -1) {
        console.log("first header not found")
        return null
    }

    // 去掉头部之后再search
    let rest_str = this.ble_data_buff_str.slice(first_position + 2, this.ble_data_buff_str.length);
    let next_position = rest_str.search(header);

    if (next_position === -1) {
        console.log("next header not found ")
        return null
    }

    // 如果还能找到下一个头部，那么就是找到了一个完整的数据包
    let solidMsg = this.ble_data_buff_str.slice(first_position, next_position + first_position + 2);
    // console.log("solid msg " + solid_msg + " len: " + solid_msg.length)
    rtn = this.getSensorData(solidMsg)
    // 删除这部分数据
    this.ble_data_buff_str = this.ble_data_buff_str.slice(next_position + first_position + 2, this.ble_data_buff_str.length);
    // console.log("buf_str len: " + this.ble_data_buff_str.length)
    return rtn
}

DataParser.prototype.extendStrBuffer = function (new_data) {
    var data_view = new Uint8Array(new_data);
    // 将数据push到缓冲中var
    // this.totalBytesReceived += data_view.length;
    // this.ble_data_buff.push(...data_view);
    var str = ""
    // 将数据转换为字符串
    // data_view = new Uint8Array(this.ble_data_buff);
    for (let i = 0; i < data_view.length; i++) {
        let temp = String.fromCharCode(data_view[i]);

        if (temp === '\r' || temp === '\n') {
            continue;
        }
        str += temp;
    }

    // console.log(str)

    this.ble_data_buff_str += str;
}

DataParser.prototype.parseData = function (new_data) {
    // 加入新数据
    this.extendStrBuffer(new_data);

    // console.log("data buf len :" + this.ble_data_buff.length)
    // this.timeCounter();
    if (this.ble_data_buff_str.length < BYTES_PER_MSG) {
        return null
    }
    return this.handleData()
    // this.handleData();
    // // 寻找头部
    // let headerIndex = this.findHeader();
    // if (headerIndex === -1) {
    //     console.log("header not found reset buff")
    //     this.ble_data_buff = [];
    //     return
    // }

    // console.log("header index: " + headerIndex);

    // if (match)

    //     let data = this.ble_data_buff.slice(headerIndex, this.ble_data_buff.length);
    // data_view = new Uint8Array(data);
    // console.log(data_view);
    // if (data_view.length < BYTES_PER_MSG) {
    //     return
    // }
    // console.log("data view len: " + data_view.length);

};

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

function changeD() {
    let pointNumber = 16
    let normalDia = 20
    for (let i = 0; i < pointNumber; i++) {
        // diameters[i] = diameters[i] + 1
        // if (diameters[i] > 30) {
        //     diameters[i] = 1
        // }
        // console.log(sensorDataList[i])
        diameters[i] = normalDia + sensorDataList[i] * diametersK
        // console.log(diameters[i])
    }
    return sensorDataList
}


function getColorRGB(dataList, dataIdx, alpha) {
    let steps = 250
    // console.log(sensorIdx)
    // 以1000为准
    if (dataList[dataIdx] > 1000) {
        dataList[dataIdx] = 1000
    }
    // 'rgb(200, 0, 0)'

    var sensorVal = Math.floor(dataList[dataIdx])
    // console.log(sensorVal)
    var r = 0
    var b = 0
    var g = 0
    // 从蓝到青
    if (sensorVal < steps) {
        r = 0
        g = sensorVal
        b = steps
        // 青到绿色
    } else if (sensorVal >= steps && sensorVal < steps * 2) {
        r = 0
        g = steps
        b = steps * 2 - sensorVal
        // 绿色到黄
    } else if (sensorVal >= steps * 2 && sensorVal < steps * 3) {
        r = sensorVal - steps * 2
        g = steps
        b = 0
    } else if (sensorVal >= steps * 3) {
        r = steps
        g = steps * 3 - sensorVal
        b = 0
    }
    if (ifStartLog) {
        // console.log("r: " + r + " g: " + g + " b: " + b)
    }
    // let color = getColorRGB(dataList, dataIdx)
    if (alpha === 1) {
        return getDynamicColorRGB(r, g, b)
    } else {
        return getDynamicColorRGBA(r, g, b, alpha)
    }
    // return getDynamicColor(color.r, color.g, color.b, alpha)
    // return 'rgb(0, 250, 0)'
}

function getDynamicColorRGB(r, g, b) {
    return `rgb(${r}, ${g}, ${b}`;
}

function getDynamicColorRGBA(r, g, b, a) {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function getRandomColor() {
    let r = Math.floor(Math.random() * 256);
    let g = Math.floor(Math.random() * 256);
    let b = Math.floor(Math.random() * 256);
    let a = Math.random();
    return getDynamicColor(r, g, b, a);
}

function drawImageWithPosition(ctx, image, x, y, idx) {

    let imageSize = diameters[idx]
    ctx.drawImage(image, x, y, imageSize, imageSize)
}

// function drawCanvas(res) {
// }
function drawCanvas(res) {
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
    // 乘以2是两边都有
    const circle_center_gap = Math.floor((canvas.width / dpr - margin_left_right * 2) / gap_x_number)
    console.info(circle_center_gap)

    const blueImage = canvas.createImage()
    blueImage.src = '../resource/blue_circle.png'

    const yellowImage = canvas.createImage()
    yellowImage.src = '../resource/yellow_circle.png'

    const redImage = canvas.createImage()
    redImage.src = '../resource/red_circle.png'

    const greenImage = canvas.createImage()
    greenImage.src = '../resource/green_circle.png'

    const draw = () => {
        // console.log("draw")
        sDataList = changeD()
        let point_number = 16
        // ctx.fillStyle = 'rgb(200, 0, 0)';
        // 定义每个圆的直径（顺序按从左到右，从上到下）
        // const diameters = [50, 60, 70, 80, 40, 50, 60, 70, 90, 100, 110, 120, 30, 40, 50, 60];
        const k = 2
        // 定义网格的起始坐标和间距
        const startX = margin_left_right; // 第一列圆心的X坐标
        const startY = margin_left_right; // 第一行圆心的Y坐标
        const gapX = circle_center_gap; // 列间距
        const gapY = circle_center_gap; // 行间距

        // const gapY = 100; // 行间距
        // 先全部清理一遍
        ctx.clearRect(0, 0, screenWidth, screenHeight)
        // ctx.fillStyle = 'rgb(0, 0, 50)';
        // ctx.fillRect(0, 0, screenWidth, screenHeight);

        // 绘制16个图片
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const index = i * 4 + j;
                const x = startX + j * gapX; // 当前列的圆心X坐标
                const y = startY + i * gapY; // 当前行的圆心Y坐标

                drawImageWithPosition(ctx, blueImage, x, y, index)
            }
        }
        // ctx.drawImage(image, 0, 0, 100, 100)

        // 绘制16个圆
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

function parse_char_value(new_data) {

    const bytesPerCall = 128;
    this.totalBytesReceived += bytesPerCall;
    console.log(ab2ascii(new_data))
    // let data_view = new Uint8Array(new_data);
    // // console.log(data_view);
    // for (let i = 0; i < data_view.length; i++) {
    //     console.log(`Byte ${i}: ${data_view[i]}`);
    // }
    // console.log(typeof new_data); 
    // ble_data_buff = ble_data_buff + new_data
    // console.log(new_data)
    // console.log("new data len:" + new_data.length)
    // console.log(ble_data_buff.length)
}

const getMaxBLEMTU = async (deviceId, mtu, type) => {
    try {
        await wx.setBLEMTU({
            deviceId: deviceId,
            mtu: mtu,
        });
        // 如果上一次错误，获取成功后直接返回结果
        if (type === 'error') {
            return mtu;
        } else {
            return getMaxBLEMTU(deviceId, mtu + 20, 'success');
        }
    } catch (error) {
        // 如果是 success 则返回上次成功沟通的值
        if (type === 'success') {
            return mtu - 20;
        } else if (mtu <= 20) {
            return 20;
        }
        return getMaxBLEMTU(deviceId, mtu - 20, 'error');
    }
};

Page({
    data: {
        devices: [],
        connected: false,
        chs: [],
        // diameters: [],
        // sensorDataList: [],
    },
    onLoad() {
        this.createSelectorQuery()
            // .select('#heatmap')
            .select('#myCanvas')
            .fields({
                node: true,
                size: true
            }).exec(res => {
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
                drawCanvas(res)
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
                const idx = inArray(foundDevices, 'deviceId', device.deviceId)
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
            const idx = inArray(this.data.chs, 'uuid', characteristic.characteristicId)
            const data = {}
            if (idx === -1) {
                data[`chs[${this.data.chs.length}]`] = {
                    uuid: characteristic.characteristicId,
                    value: ab2hex(characteristic.value)
                }
            } else {
                data[`chs[${idx}]`] = {
                    uuid: characteristic.characteristicId,
                    value: ab2hex(characteristic.value)
                    // value: ab2hex(characteristic.value)
                }

                // 对数据做处理
                sensorData = dataParser.parseData(characteristic.value)
                if (sensorData) {
                    // console.log(sensorData)
                    sensorDataList = sensorData
                    // this.data.sensorDataList = sensorData
                }
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
        let buffer = new ArrayBuffer(3)
        let dataView = new DataView(buffer)
        dataView.setUint8(0, 0x23)
        dataView.setUint8(1, 0x24)
        dataView.setUint8(2, 0x01)

        // dataView.setUint8(0, Math.random() * 255 | 0)
        // 赋值十六进制数组
        // dataView[0] = 0x23;
        // dataView[1] = 0x24;
        // dataView[2] = 0x01;
        console.log("Writing init cmd")
        console.log(dataView)
        console.log(this._characteristicId.uuid)
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