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

function inArray(arr, key, val) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i][key] === val) {
            return i;
        }
    }
    return -1;
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

function getCenterVal(xy, imageSize) {
    let center = xy - Math.floor(imageSize / 2);
    if (center < 0) {
        center = 0
    }
    return center
}

function drawImageWithPosition(ctx, image, x, y, idx, diameters) {

    let imageSize = diameters[idx]
    let topLeftX = getCenterVal(x, imageSize)
    let topLeftY = getCenterVal(y, imageSize)
    if (ifStartLog && idx == 1) {
        console.log("topLeftx:" + topLeftX + " " + topLeftY + " " + imageSize)
    }

    if (topLeftX == 0 && topLeftY == 0) {
        return
    }

    ctx.drawImage(image, topLeftX, topLeftY, imageSize, imageSize)
}

function getY(sensorVal) {
    if (sensorVal > 500) {
        sensorVal = 500
    }
    // console.log(sensorVal)
    return sensorVal
}

function getColorByTemp(tempVal) {
    // from 30-300
    // green to red
    // 24,255,0 to 255,0,0
    let r = 0
    let g = 0
    let b = 0

    if (tempVal < 30) {
        tempVal = 30
    }
    if (tempVal > 300) {
        tempVal = 300
    }

    if (tempVal < 165) {
        r = 24 + Math.floor((255 - 24) * (tempVal - 30) / 135)
        g = 255
        b = 0
    } else {
        r = 255
        g = 255 - Math.floor((255 - 0) * (tempVal - 165) / 135)
        b = 0
    }

    return getDynamicColorRGB(r, g, b)
}

// 0-15 16个颜色
function getColorByIdx(idx) {

    let r = 0
    let g = 0
    let b = 0

    switch (idx) {
        case 0:
            r = 0
            g = 0
            b = 0
            break

        case 1:
            r = 128
            g = 0
            b = 0
            break

        case 2:
            r = 255
            g = 0
            b = 0
            break

        case 3:
            r = 255
            g = 128
            b = 0
            break

        case 4:
            r = 255
            g = 255
            b = 0
            break

        case 5:
            r = 128
            g = 255
            b = 0
            break


        case 6:
            r = 0
            g = 255
            b = 0
            break

        case 7:
            r = 0
            g = 255
            b = 128
            break

        case 8:
            r = 0
            g = 255
            b = 255
            break

        case 9:
            r = 0
            g = 128
            b = 255
            break

        case 10:
            r = 0
            g = 0
            b = 255
            break

        case 11:
            r = 128
            g = 0
            b = 255
            break

        case 12:
            r = 255
            g = 0
            b = 255
            break

        case 13:
            r = 255
            g = 0
            b = 128
            break

        case 14:
            r = 255
            g = 0
            b = 0
            break

        case 15:
            r = 128
            g = 128
            b = 128
            break

    }


    return getDynamicColorRGB(r, g, b)
}

function changeDiameters(diameters, sensorDataList, diametersK) {
    let pointNumber = 16
    let normalDia = 10
    let maxDia = 60
    for (let i = 0; i < pointNumber; i++) {
        // diameters[i] = diameters[i] + 1
        // if (diameters[i] > 30) {
        //     diameters[i] = 1
        // }
        // console.log(sensorDataList[i])
        diameters[i] = normalDia + Math.floor(sensorDataList[i] * diametersK)

        if (diameters[i] > maxDia) {
            diameters[i] = maxDia
        } else if (diameters[i] < normalDia) {
            diameters[i] = normalDia
        }
        // console.log(diameters[i])
    }
    // console.log(diameters[0])
    return sensorDataList
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

function parseCharValue(new_data) {

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

function changeCircleRad(diameters, sensorDataList) {
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

function drawCanvas16CH(res) {
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

    // const blueImage = canvas.createImage()
    // blueImage.src = '../resource/blue_circle.png'

    // const yellowImage = canvas.createImage()
    // yellowImage.src = '../resource/yellow_circle.png'

    // const redImage = canvas.createImage()
    // redImage.src = '../resource/red_circle.png'

    // const greenImage = canvas.createImage()
    // greenImage.src = '../resource/green_circle.png'

    const draw = () => {
        // console.log("draw")
        const sDataList = utils.changeDiameters()
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
        // for (let i = 0; i < 4; i++) {
        //     for (let j = 0; j < 4; j++) {
        //         const index = i * 4 + j;
        //         const x = startX + j * gapX; // 当前列的圆心X坐标
        //         const y = startY + i * gapY; // 当前行的圆心Y坐标

        //         drawImageWithPosition(ctx, blueImage, x, y, index)
        //     }
        // }
        // ctx.drawImage(image, 0, 0, 100, 100)

        // 绘制16个圆, 加一点点阴影
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const index = i * 4 + j; // 当前圆的索引
                const radius = diameters[index]; // 计算半径

                const x = startX + j * gapX; // 当前列的圆心X坐标
                const y = startY + i * gapY; // 当前行的圆心Y坐标
                // rgbColor = getColor(sDataList, index);
                ctx.fillStyle = getColorRGB(sDataList, index, 0.3); // 'rgba(0, 0, 0, 0.8)';
                ctx.shadowBlur = 30;
                ctx.shadowColor = getColorRGB(sDataList, index, 1); // getColor(sDataList, index); // (0, 0, 50, 'blue')
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
        // 注册下一帧渲染
        canvas.requestAnimationFrame(draw)
    }

    draw()

}

module.exports = {
    ab2hex: ab2hex,
    inArray: inArray,
    ab2ascii: ab2ascii,
    countCharacter: countCharacter,
    getColorRGB: getColorRGB,
    getDynamicColorRGB: getDynamicColorRGB,
    getDynamicColorRGBA: getDynamicColorRGBA,
    getRandomColor: getRandomColor,
    getCenterVal: getCenterVal,
    drawImageWithPosition: drawImageWithPosition,
    getY: getY,
    getColorByTemp: getColorByTemp,
    changeDiameters: changeDiameters,
    getMaxBLEMTU: getMaxBLEMTU,
    parseCharValue: parseCharValue,
    changeCircleRad: changeCircleRad,
    drawCanvas16CH: drawCanvas16CH,
    getColorByIdx: getColorByIdx
}