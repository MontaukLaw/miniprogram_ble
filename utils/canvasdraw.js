var c_draw_param = require('../utils/drawparams.js');
var utils = require('../utils/utils.js');

function drawHeatmapBaseRec(ctx, lastSensorData, x, y) {
    let color = utils.getColorByTemp(lastSensorData)
    let diameter = 40 * lastSensorData / 1000
    if (diameter < 10) {
        diameter = 10
    }
    ctx.fillStyle = color
    // ctx.shadowBlur = 30
    // ctx.shadowColor = color
    ctx.beginPath()
    ctx.arc(x, y, diameter, 0, 2 * Math.PI)
    ctx.fill()
}

function drawHeatMap(ctx, dparam, dataParser) {

    var startX = 50;
    var startY = 80;

    if (dataParser.getDeviceInfo().getSensorNumber() == 0) {
        return;
    }
    // canvas width: 1179
    // convas height: 1950
    if (dparam.getDisplaySensorIdx() == c_draw_param.DISPLAY_ALL) {
        let sensorNumber = dataParser.getDeviceInfo().getSensorNumber()
        // 依次画sensorNumber个圆
        // 如果是16个, 就组成4x4, 如果是4个, 就是2x2

        let xyGap = 0;
        if (sensorNumber == 4) {
            startX = 80;
            startY = 80
            xyGap = 200
        } else if (sensorNumber == 16) {
            startX = 50;
            startY = 50;
            xyGap = 100
        }

        for (let i = 0; i < sensorNumber; i++) {
            let lastSensorData = dataParser.getSensorDataArray()[i].getLastSensorData()
            let x = startX + (i % 2) * xyGap
            let y = startY + Math.floor(i / 2) * xyGap
            drawHeatmapBaseRec(ctx, lastSensorData, x, y)
        }

    } else {

        let sensorData = dataParser.getSensorDataArray()[dparam.getDisplaySensorIdx() - 1]
        let lastSensorData = sensorData.getLastSensorData()
        // canvas width: 1179
        // 1200/2/3=200
        drawHeatmapBaseRec(ctx, lastSensorData, 200, 200)

        // let color = utils.getColorByTemp(lastSensorData)
        // let x = 300
        // let y = 300
        // ctx.fillStyle = color
        // ctx.shadowBlur = 30
        // ctx.shadowColor = color
        // ctx.beginPath()
        // let diameter = 40 * lastSensorData / 1000
        // ctx.arc(x, y, diameter, 0, 2 * Math.PI)
        // ctx.fille()
    }

}

function drawLineBaseRecord(ctx, dataRec, index) {
    // console.log("dataRec.length is " + dataRec.length)
    let point_size = 2
    let point_padding = 1

    let line_width = 1
    const startX = 50;
    const startY = 400;

    for (let i = 0; i < c_draw_param.MAX_DISPLAY_RECORD - 1; i++) {
        let val = dataRec[i]
        // console.log("val is " + val)
        let x1 = startX + i * (point_size + point_padding)
        let y1 = startY - utils.getY(dataRec[i])// startY + tempSensorData[i]
        let x2 = startX + (i + 1) * (point_size + point_padding)
        let y2 = startY - utils.getY(dataRec[i + 1])// startY + tempSensorData[i]
        ctx.strokeStyle = utils.getColorByIdx(index);
        ctx.lineWidth = line_width
        // ctx.shadowBlur = 0
        // ctx.shadowColor = `rgb(0, 0, 0`
        ctx.beginPath();
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke();
    }
}

function drawLineChart(ctx, dparam, dataParser) {
    // const startY = 300;

    if (dataParser.getDeviceInfo().getSensorNumber() == 0) {
        return;
    }

    if (dparam.getDisplaySensorIdx() == c_draw_param.DISPLAY_ALL) {

        dataParser.getSensorDataArray().forEach((sensorData, index) => {
            // console.info("sensorVal.length is " + sensorVal.length)
            // console.info(sensorVal)
            let dataRec = sensorData.getSensorDataRecord()
            // console.info("dataRec.length is " + dataRec.length)
            if (dataRec.length >= c_draw_param.MAX_DISPLAY_RECORD) {
                drawLineBaseRecord(ctx, dataRec, index)
            }
        });
    } else {
        let arrIdx = dparam.getDisplaySensorIdx() - 1
        let sensorData = dataParser.getSensorDataArray()[arrIdx]
        if (sensorData.getSensorDataRecord().length >= c_draw_param.MAX_DISPLAY_RECORD) {
            let dataRec = sensorData.getSensorDataRecord()
            drawLineBaseRecord(ctx, dataRec, arrIdx)
        };
    }
    // console.log("dataParser.getSensorDataArray()[0].length is " + dataParser.getSensorDataArray().length)
}

// Canvas 对象
// 渲染上下文


function clearCanvas() {
    // ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function canvasDrawing(res, drawParam, dataParser) {
    const canvas = res[0].node
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

    // const margin_left_right = 50

    const draw = () => {
        // console.log("draw")
        // const sDataList = utils.changeDiameters(diameters, sensorDataList, diametersK)
        // let point_number = 16
        // ctx.fillStyle = 'rgb(200, 0, 0)';
        // 定义每个圆的直径（顺序按从左到右，从上到下）
        // const diameters = [50, 60, 70, 80, 40, 50, 60, 70, 90, 100, 110, 120, 30, 40, 50, 60];
        // const k = 2
        // 定义网格的起始坐标和间距

        // 每次先全部清理一遍
        ctx.clearRect(0, 0, screenWidth, screenHeight)

        // console.info("draw type is " + drawParam.getDrawType())
        // console.info("draw type is " + drawType)

        if (drawParam.getDrawType() == c_draw_param.DRAW_TYPE_LINECHART) {
            // console.info("draw line chart")
            drawLineChart(ctx, drawParam, dataParser)
        } else if (drawParam.getDrawType() == c_draw_param.DRAW_TYPE_HEATMAP) {
            // console.info("draw heatmap")
            drawHeatMap(ctx, drawParam, dataParser)
        }

        // if (dataParser.getDeviceInfo().getSensorNumber() > 0 && dataParser.getSensorDataArray()[0].length >= drawParam.MAX_DISPLAY_RECORD) {
        //     // console.info("data[0].last is " + dataParser.getSensorDataArray()[0].getLastSensorData())
        //     let sensorVal = dataParser.getSensorDataArray()[0]

        //     for (let i = 0; i < drawParam.MAX_DISPLAY_RECORD - 1; i++) {
        //         console.log("sensorVal[" + i + "] is " + sensorVal[i])
        //         let x1 = startX + i * (point_size + point_padding)
        //         let y1 = startY - utils.getY(sensorVal[i])// startY + tempSensorData[i]
        //         let x2 = startX + (i + 1) * (point_size + point_padding)
        //         let y2 = startY - utils.getY(sensorVal[i + 1])// startY + tempSensorData[i]
        //         ctx.strokeStyle = utils.getColorByTemp(sensorVal[i]);
        //         ctx.lineWidth = line_width
        //         ctx.beginPath();
        //         ctx.moveTo(x1, y1)
        //         ctx.lineTo(x2, y2)
        //         ctx.stroke();
        //     }
        // }
        // if (tempSensorData.length >= drawParam.MAX_DISPLAY_RECORD) {
        //     // console.log("temp sensor data: " + tempSensorData[0])

        //     // 绘制drawParam.MAX_DISPLAY_RECORD个点, 从左到右, 点大小为point_size, 间隔为point_padding

        //     // for (let i = 0; i < drawParam.MAX_DISPLAY_RECORD; i++) {
        //     //     let x = startX + i * (point_size + point_padding)
        //     //     let y = startY - getY(tempSensorData[i])// startY + tempSensorData[i]
        //     //     ctx.fillStyle = getColorByTemp(tempSensorData[i]);
        //     //     ctx.beginPath();
        //     //     ctx.arc(x, y, point_size, 0, 2 * Math.PI);
        //     //     ctx.fill();
        //     //     // ctx.fillRect(x, y, point_size, point_size);
        //     // }

        //     // 绘制drawParam.MAX_DISPLAY_RECORD -1条线, 从左到右, 线粗line_width, 间隔为point_padding
        //     for (let i = 0; i < drawParam.MAX_DISPLAY_RECORD - 1; i++) {
        //         let x1 = startX + i * (point_size + point_padding)
        //         let y1 = startY - getY(tempSensorData[i])// startY + tempSensorData[i]
        //         let x2 = startX + (i + 1) * (point_size + point_padding)
        //         let y2 = startY - getY(tempSensorData[i + 1])// startY + tempSensorData[i]
        //         ctx.strokeStyle = getColorByTemp(tempSensorData[i]);
        //         ctx.lineWidth = line_width
        //         ctx.beginPath();
        //         ctx.moveTo(x1, y1)
        //         ctx.lineTo(x2, y2)
        //         ctx.stroke();
        //     }
        // }
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


module.exports = {
    drawHeatMap: drawHeatMap,
    drawLineChart: drawLineChart,
    canvasDrawing: canvasDrawing,
    drawLineBaseRecord: drawLineBaseRecord,
    drawHeatmapBaseRec: drawHeatmapBaseRec,
    clearCanvas: clearCanvas
}
