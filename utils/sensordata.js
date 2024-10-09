let MAX_REC_LEN = 100;

export class SensorData {
    constructor(sensorIdx) {
        this.sensorIdx = sensorIdx;
        // 历史记录
        this.sensorDataRecord = [];
        this.minValue = 10000.0;
        this.maxValue = 0.0;
    }

    updateMinMaxValue() {
        this.minValue = Math.min(...this.sensorDataRecord);
        this.maxValue = Math.max(...this.sensorDataRecord);
    }

    getMinValue() {
        return this.minValue;
    }

    getMaxValue() {
        return this.maxValue;
    }

    setSensorDataRecord(sensorData) {
        this.sensorDataRecord = sensorData;
        this.updateMinMaxValue();
    }

    getSensorDataRecord() {
        return this.sensorDataRecord;
    }

    getLastSensorData() {
        return this.sensorDataRecord[this.sensorDataRecord.length - 1];
    }

    addNewdata(newData) {
        if (this.sensorDataRecord.length >= MAX_REC_LEN) {
            this.sensorDataRecord.shift();
        }
        this.sensorDataRecord.push(newData);
        this.updateMinMaxValue();
    }

}