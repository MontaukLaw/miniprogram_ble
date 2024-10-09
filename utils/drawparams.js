const DRAW_TYPE_LINECHART = 1 
const DRAW_TYPE_HEATMAP = 2 
const MAX_DISPLAY_RECORD = 100
const DRAW_NOTHING = -1
const DISPLAY_ALL = 0

class DrawParams {
    constructor() {
        this.drawType = DRAW_TYPE_LINECHART;
        this.displaySensorIdx = DISPLAY_ALL;
    }

    setDrawType(drawType) {
        this.drawType = drawType;
    }

    getDrawType() {
        return this.drawType;
    }

    setDisplaySensorIdx(displaySensorIdx) {
        this.displaySensorIdx = displaySensorIdx;
    }

    getDisplaySensorIdx() {
        return this.displaySensorIdx;
    }
}

module.exports = {
    DRAW_TYPE_HEATMAP: DRAW_TYPE_HEATMAP,
    DRAW_TYPE_LINECHART: DRAW_TYPE_LINECHART,
    MAX_DISPLAY_RECORD: MAX_DISPLAY_RECORD,
    DRAW_NOTHING: DRAW_NOTHING,
    DISPLAY_ALL: DISPLAY_ALL,
    DrawParams: DrawParams
}