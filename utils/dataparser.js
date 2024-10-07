var utils = require('../utils/utils.js');
const COMPLET_HEX_PACK_LEN = 116
const PACKET_HEX_PACK_LEN_16_CH = 108
const SENSOR_DATA_LEN = 6
const BYTES_PER_MSG = 250;
const HEX_PACK_LEN = 128
const PAYLOAD_HEAD_LEN = 12 // 包含目标id4, 设备id4, 命令2, 状态2
const HEAD_DATA_LEN = 8  // 包含包头4, 帧序列号2, 帧长2

export class MyClass {
    constructor(name) {
        this.name = name;
    }

    sayHello() {
        console.log(`Hello, ${this.name}!`);
    }
}

export class DataParser {
    constructor() {
        this.totalBytesReceived = 0;  // 每个实例都会有自己的 totalBytesReceived 属性
        this.startTime = 0;  // 记录实例化时的时间
        this.lastSec = this.startTime
        this.ble_data_buff = [];
        this.ble_data_buff_str = "";
        this.biggestS0 = 0;
        this.buffer_size = 0;
        this.wrongLenCounter = 0;
        this.packetCounter = 0;
        this.totalIterval = 0;
        this.packetCounterLong = 0;
        this.lastTimeMS = 0;
        this.logStr = "";
        this.lastPackId = 0;
        this.tagetID = 305419896;
        this.deviceID = 858787584;
        this.sensorNumber = 16;

    }
}

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


DataParser.prototype.countAverage = function (timeDiff) {
    this.packetCounterLong++;
    this.totalIterval += timeDiff;

    return this.totalIterval / this.packetCounter;

}

DataParser.prototype.timeCounter = function () {
    let timeNow = Date.now()
    this.packetCounter++;

    if (this.totalBytesReceived > 0 && this.startTime === 0) {
        this.startTime = Date.now();  // 记录实例化时的时间
    }

    if (timeNow - this.lastSec > 1000) {
        const elapsedTimeInSeconds = (timeNow - this.startTime) / 1000
        // console.log("elapsedTimeInSeconds " + elapsedTimeInSeconds)
        const averageBytesPerSecond = this.totalBytesReceived / elapsedTimeInSeconds
        // const averageLost = this.wrongLenCounter / elapsedTimeInSeconds
        // const averagePack = this.packetCounter / elapsedTimeInSeconds
        this.logStr = `共接收 ${this.totalBytesReceived} 字节 \n`
        this.logStr += `平均 ${averageBytesPerSecond.toFixed(2)} 字节/秒 \n`
        // log += `Lost packets per second: ${averageLost.toFixed(2)}\n`
        const packetDiffPerSecond = Math.floor(1000 / this.packetCounter)
        this.logStr += `平均 ${packetDiffPerSecond} ms`
        // console.log(`Total bytes received: ${this.totalBytesReceived}`)
        // console.log(`Average bytes per second: ${averageBytesPerSecond.toFixed(2)}`)
        // console.log(`Lost packets per second: ${averageLost.toFixed(2)}`)
        // console.log(`Average packets per second: ${averagePack.toFixed(2)}`)
        // console.log(`Lost/Total: ${this.wrongLenCounter}/${this.packetCounter}`)

        this.packetCounter = 0;
        this.wrongLenCounter = 0;
        this.lastSec = timeNow;

        // this.packetCounterLong = 0
        this.totalIterval = 0;
    }

    // 计算每个包之间的间隔
    if (this.lastTimeMS !== 0 && this.packetCounter > 0) {
        const timeDiff = timeNow - this.lastTimeMS
        const averageTimeDiff = Math.floor(this.countAverage(timeDiff))
        // this.logStr += ` 包间隔 ${averageTimeDiff} ms`
        // console.log(`包间隔 ${averageTimeDiff} ms`)
    }

    this.lastTimeMS = timeNow

    return this.logStr
}

DataParser.prototype.getSensorData = function (solidMsg) {

    if (solidMsg.length > BYTES_PER_MSG) {
        // console.log("solid msg too big " + solidMsg + " len: " + solidMsg.length)
        return null;
    }
    if (utils.countCharacter(solidMsg, 'c') !== 16) {
        // console.log("solid msg short of c" + solidMsg + " len: " + solidMsg.length)
        // console.log("Short c: " + solidMsg)
        return null;
    }
    if (utils.countCharacter(solidMsg, ':') !== 16) {
        // console.log("solid msg short of :" + solidMsg + " len: " + solidMsg.length)
        return null;
    }
    if (utils.countCharacter(solidMsg, ',') !== 15) {
        // console.log("solid msg short of ," + solidMsg + " len: " + solidMsg.length)
        return null;
    }
    if (utils.countCharacter(solidMsg, ' ') !== 15) {
        // console.log("solid msg short of space " + solidMsg + " len: " + solidMsg.length)
        return null;
    }

    console.log("solid msg " + solidMsg + " len: " + solidMsg.length)

    let sensorDataL = []
    // 分割字符串为列表，以逗号和空格分隔
    let sensorData = solidMsg.split(/, /);
    // console.log(sensorData)

    // 从列表中提取数据
    // let sensorDataDict = {}

    for (let i = 0; i < sensorData.length; i++) {
        let data = sensorData[i].split(":")
        let sensorVal = Math.floor(parseFloat(data[1]))
        // sensorDataDict[data[0]] = data[1]
        sensorDataL.push(sensorVal)
    }

    if (this.biggestS0 < sensorDataL[0]) {
        console.log(sensorDataL[0])
        this.biggestS0 = sensorDataL[0]
    }
    ifStartLog = true
    return sensorDataL
    // console.log(sensorDataList)

}


// 获取C0的数据
DataParser.prototype.getTempSensorData = function (solidMsg) {
    // console.log(solidMsg)

    if (utils.countCharacter(solidMsg, ',') !== 3) {
        console.log("solid msg short of ," + solidMsg + " len: " + solidMsg.length)
        return
    }

    // 分割字符串为列表，以逗号和空格分隔
    let sensorData = solidMsg.split(/, /);
    if (sensorData.length !== 4) {
        console.log("solid msg short of ," + solidMsg + " len: " + solidMsg.length)
        return
    }
    // console.log(sensorData[0])

    let c0Data = sensorData[0].split(":")

    // console.log("c0 data: " + c0Data[1])

    if (tempSensorData.length > MAX_DISPLAY_RECORD) {
        tempSensorData.shift()
    }

    tempSensorData.push(Math.floor(parseFloat(c0Data[1])))

    // console.log("temp sensor data: " + tempSensorData)
}

DataParser.prototype.handleDataStrMultiTimes = function () {

    // 如果缓冲区数据超过56字节，那么就开始处理
    while (this.ble_data_buff_str.length > 56) {

        let header = 'c0'

        let first_position = this.ble_data_buff_str.search(header);

        if (first_position === -1) {
            // console.log("first header not found")
            return null
        }

        // 去掉头部之后再search
        let rest_str = this.ble_data_buff_str.slice(first_position + 2, this.ble_data_buff_str.length);
        let next_position = rest_str.search(header);

        if (next_position === -1) {
            // console.log("next header not found ")
            return null
        }

        // console.log("first position: " + first_position + " next position: " + next_position)

        // 如果还能找到下一个头部，那么就是找到了一个完整的数据包
        let solidMsg = this.ble_data_buff_str.slice(first_position, next_position + first_position + 2);

        DataParser.prototype.getTempSensorData(solidMsg);
        // rtn = null
        // rtn = this.getSensorData(solidMsg)

        // 删除这部分数据
        this.ble_data_buff_str = this.ble_data_buff_str.slice(next_position + first_position + 2, this.ble_data_buff_str.length);

    }

    // console.log("buf_str len: " + this.ble_data_buff_str.length)
    // return tempSensorData
}

// 4通道专属
DataParser.prototype.handleDataStr4CH = function (new_data) {

    // 先加入缓存
    this.extendStrBuffer(new_data);
    this.handleDataStrMultiTimes();

    // console.log("buf_str len: " + this.ble_data_buff_str.length)
}

DataParser.prototype.handleDataStr = function (new_data) {

    // 先加入缓存
    this.extendStrBuffer(new_data);

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

    console.log("first position: " + first_position + " next position: " + next_position)

    // 如果还能找到下一个头部，那么就是找到了一个完整的数据包
    let solidMsg = this.ble_data_buff_str.slice(first_position, next_position + first_position + 2);
    console.log("solid msg " + solidMsg + " len: " + solidMsg.length)
    rtn = null
    // rtn = this.getSensorData(solidMsg)

    // 删除这部分数据
    this.ble_data_buff_str = this.ble_data_buff_str.slice(next_position + first_position + 2, this.ble_data_buff_str.length);
    // console.log("buf_str len: " + this.ble_data_buff_str.length)
    return rtn
}

function uint8ArrayToString(uint8Array) {
    return String.fromCharCode.apply(null, uint8Array);
}

DataParser.prototype.extendStrBuffer = function (new_data) {
    var data_view = new Uint8Array(new_data);
    // 将数据push到缓冲中var
    this.totalBytesReceived += data_view.length;
    // this.ble_data_buff.push(...data_view);
    // var str = ""
    // 将数据转换为字符串
    // data_view = new Uint8Array(this.ble_data_buff);
    // for (let i = 0; i < data_view.length; i++) {
    //     let temp = String.fromCharCode(data_view[i]);
    //     // 去掉无用的换行符
    //     if (temp === '\r' || temp === '\n') {
    //         continue;
    //     }
    //     str += temp;
    // }

    const str = uint8ArrayToString(data_view).replace('\r', '').replace('\n', '');
    // console.log(str)
    // 加入新数据
    this.ble_data_buff_str += str;
    // console.log("buf_str len: " + this.ble_data_buff_str.length)
}

DataParser.prototype.getSensorInfoFromHex = function (solidHex) {
    if (solidHex.length != COMPLET_HEX_PACK_LEN) {
        console.log("Wrong len " + solidHex.length)
        this.wrongLenCounter++;
        return;
    }

    // 获取packetid data_buffer[4] << 8 | data_buffer[5]
    let packetId = solidHex[4] << 8 | solidHex[5]
    if (packetId - this.lastPackId !== 1 && this.lastPackId !== 0) {
        console.log("Lost packet id: " + packetId)
    }
    this.lastPackId = packetId;
    // console.log("packet id: " + packetId)

}

DataParser.prototype.parseHexMsg = function () {

    if (this.ble_data_buff.length < COMPLET_HEX_PACK_LEN) {
        return
    }

    // 找到包头 FFFF0609
    let head = [0xff, 0xff, 0x06, 0x09]

    // 在ble_data_buff中寻找两个包头
    let headIndex = -1
    for (let i = 0; i < this.ble_data_buff.length; i++) {
        if (this.ble_data_buff[i] === head[0] && this.ble_data_buff[i + 1] === head[1] &&
            this.ble_data_buff[i + 2] === head[2] && this.ble_data_buff[i + 3] === head[3]) {
            headIndex = i
            break
        }
    }

    if (headIndex === -1) {
        console.log("first head not found")
        return
    }

    let secondHeadIndex = -1
    for (let i = headIndex + 1; i < this.ble_data_buff.length; i++) {
        if (this.ble_data_buff[i] === head[0] && this.ble_data_buff[i + 1] === head[1] &&
            this.ble_data_buff[i + 2] === head[2] && this.ble_data_buff[i + 3] === head[3]) {
            secondHeadIndex = i
            break
        }
    }

    if (secondHeadIndex === -1) {
        console.log("second head not found")
        return
    }

    // (96+12+8)16通道就是116字节
    let wholePackLen = this.sensorNumber * SENSOR_DATA_LEN + PAYLOAD_HEAD_LEN + HEAD_DATA_LEN

    if (secondHeadIndex != wholePackLen) {
        console.error("Wrong len " + secondHeadIndex)
        this.wrongLenCounter++;
        this.ble_data_buff = this.ble_data_buff.slice(secondHeadIndex)
        this.buffer_size = this.ble_data_buff.length
        return
    }

    let packetId = this.ble_data_buff[headIndex + 4] << 8 | this.ble_data_buff[headIndex + 5]
    if (packetId - this.lastPackId !== 1 && this.lastPackId !== 0) {
        console.log("Lost packet id: " + packetId)
    }

    let packetLen = this.ble_data_buff[headIndex + 6] << 8 | this.ble_data_buff[headIndex + 7]
    // console.log("packet id: " + packetId + " packet len: " + packetLen)

    // 8 9 10 11
    let deviceID = this.ble_data_buff[headIndex + 8] << 24 | this.ble_data_buff[headIndex + 9] << 16 | this.ble_data_buff[headIndex + 10] << 8 | this.ble_data_buff[headIndex + 11]
    // console.log("device id: " + deviceID)

    // 12 13 14 15
    let targetID = this.ble_data_buff[headIndex + 12] << 24 | this.ble_data_buff[headIndex + 13] << 16 | this.ble_data_buff[headIndex + 14] << 8 | this.ble_data_buff[headIndex + 15]
    // console.log("target id: " + targetID)

    // 16 17
    let cmd = this.ble_data_buff[headIndex + 16] << 8 | this.ble_data_buff[headIndex + 17]
    // console.log("cmd: " + cmd)

    // 18 19
    let status = this.ble_data_buff[headIndex + 18] << 8 | this.ble_data_buff[headIndex + 19]
    // console.log("status: " + status)

    if (this.sensorNumber == status && deviceID == this.deviceID &&
        targetID == this.tagetID && packetLen == PACKET_HEX_PACK_LEN_16_CH &&
        cmd == 0x0012
    ) {
        // console.log("Parse success")
    } else {
        console.error("Parse error")
    }

    this.lastPackId = packetId;
    // console.log(">>>>" + utils.ab2hex(this.ble_data_buff))
    this.ble_data_buff = this.ble_data_buff.slice(secondHeadIndex)
    // console.log("<<<<" + utils.ab2hex(this.ble_data_buff))
    this.buffer_size = this.ble_data_buff.length
}

DataParser.prototype.parseHexMsgNice = function () {

    // 找到包头 FFFF0609
    let head = [0xff, 0xff, 0x06, 0x09]
    // 在ble_data_buff中寻找两个包头
    let headIndex = -1
    for (let i = 0; i < this.ble_data_buff.length; i++) {
        if (this.ble_data_buff[i] === head[0] && this.ble_data_buff[i + 1] === head[1] && this.ble_data_buff[i + 2] === head[2] && this.ble_data_buff[i + 3] === head[3]) {
            headIndex = i
            break
        }
    }

    if (headIndex === -1) {
        console.log("first head not found")
        return
    }

    // 大部分时候是0
    // console.log("head index: " + headIndex)

    // 找到第二个包头
    let nextHeadIndex = -1
    for (let i = headIndex + 1; i < this.ble_data_buff.length; i++) {
        if (this.ble_data_buff[i] === head[0] && this.ble_data_buff[i + 1] === head[1] && this.ble_data_buff[i + 2] === head[2] && this.ble_data_buff[i + 3] === head[3]) {
            nextHeadIndex = i
            break
        }
    }

    if (nextHeadIndex === -1) {
        // console.log("second head not found")
        return
    }

    // 大部分时候是116
    // console.log("next head index: " + nextHeadIndex)

    // 找到两个包头之间的数据
    let solidHex = this.ble_data_buff.slice(headIndex, nextHeadIndex)
    // console.log(ab2hex(data))

    // 从数据中提取有效数据
    this.getSensorInfoFromHex(solidHex)

    // 把nextHeadIndex之前的数据全部清除
    this.ble_data_buff = this.ble_data_buff.slice(nextHeadIndex, this.ble_data_buff.length)
    this.buffer_size = this.ble_data_buff.length
    // console.log("ble_data_buff length now: " + this.ble_data_buff.length)
}

// 对16进制数据进行处理
DataParser.prototype.handleDataHex = function (new_data) {
    let data_view = new Uint8Array(new_data);
    this.buffer_size = this.buffer_size + data_view.length
    this.ble_data_buff.push(...data_view);
    this.packetCounter++;
    // console.log("new msg handleDataHex")

    if (this.buffer_size < COMPLET_HEX_PACK_LEN) {
        return
    }

    // console.log("-----------start------------")
    // console.log("ble_data_buff length: " + this.ble_data_buff.length)

    this.parseHexMsg();

    // 如果缓冲区中还有数据，继续解析
    if (this.ble_data_buff.length > COMPLET_HEX_PACK_LEN) {
        // console.log("Double buffer, try again this.ble_data_buff.length " + this.ble_data_buff.length)
        this.parseHexMsg();
    }

    // console.log("-----------end------------")

}

DataParser.prototype.parseData = function (new_data) {

    // 加入新数据
    // this.extendStrBuffer(new_data);
    var data_view = new Uint8Array(new_data);
    // 将数据push到缓冲中var
    this.totalBytesReceived += data_view.length;
    // console.log("data view len: " + data_view.length)
    // console.log("data buf len :" + this.ble_data_buff.length)
    // this.timeCounter();

    // if (this.ble_data_buff_str.length < BYTES_PER_MSG) {
    // return null

    this.handleDataHex(new_data);
    // this.handleDataStr4CH(new_data)

    // return null
    // 基于字符串格式的数据进行处理
    // return this.handleData()

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
