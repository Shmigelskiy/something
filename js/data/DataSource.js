// (function () {
  const MAX_STORING_POINTS_COUNT = 100000
  const LINE_TYPE = 'line'
  const AGGREGATE_MODE = {
    AVERAGE: 'AVERAGE',
    FIRST: 'FIRST',
  }

  class DataSource {

    constructor() {
      this._series = []
      this._labels = []
      this._points = {}
      this._colors = {}
      this._names = {}
    }

    updateData(data = {}) {
      const {
        columns = [],
        colors = {},
        names = {},
        types = {},
      } = data
      
      this._colors = colors
      this._names = names

      columns.forEach(columnData => {
        const [code, ...points] = columnData
        if(types[code] === LINE_TYPE) {
          this._series.push(code)
          this._points[code] = this._aggregatePoints(points, MAX_STORING_POINTS_COUNT, AGGREGATE_MODE.AVERAGE)
          // this._points[code] = []
          // for(let i = 0; i < 10000;i++) {
          //   this._points[code].push(Math.round(Math.random() * 1000))
          // }
        } else {
          this._labels = this._aggregatePoints(points, MAX_STORING_POINTS_COUNT, AGGREGATE_MODE.FIRST)
          
        }
      })

    }

    getSeries() {
      return this._series
    }

    getSeriesName(code) {
      return this._names[code]
    }

    getSeriesColor(code) {
      return this._colors[code]
    }

    getSeriesPoints(seriesCode, maxCount, startPercent, endPercent) {
      let points = this._points[seriesCode]
      if (startPercent || endPercent) {
        const pointsLength = points.length
        const startIdx = startPercent && Math.round(startPercent * pointsLength / 100)
        const endIdx = endPercent && Math.round(endPercent * pointsLength / 100)
     
        points = points.slice(startIdx || 0, endIdx)
      }
      
      return this._aggregatePoints(points, maxCount, AGGREGATE_MODE.AVERAGE)
    }

    getLegendLabels(maxCount, startPercent, endPercent) {
      let labels = this._labels
      if (startPercent || endPercent) {
        const labelsLength = labels.length
        const startIdx = startPercent && Math.round(startPercent * labelsLength / 100)
        const endIdx = endPercent && Math.round(endPercent * labelsLength / 100)
     
        labels = labels.slice(startIdx || 0, endIdx)
      }
      
      return this._aggregatePoints(labels, maxCount, AGGREGATE_MODE.FIRST)
    }

    _aggregatePoints(points, maxCount, mode){
      const pointsCount = points.length
      const pointsPerGroup = Math.ceil(pointsCount / maxCount)
      if (pointsPerGroup <= 1) {
        return points
      }

      switch(mode) {
        case AGGREGATE_MODE.AVERAGE: 
          return this._aggregateWithAverageValue(points, pointsPerGroup, pointsCount)
        case AGGREGATE_MODE.FIRST: 
          return this._aggregateWithFirstValue(points, pointsPerGroup, pointsCount)
        default: 
          return this._aggregateWithAverageValue(points, pointsPerGroup, pointsCount)
      }
    }

    _aggregateWithAverageValue(points, pointsPerGroup, pointsCount){
      const aggregatedPoints = []
      let sum = 0, count = 0
      for (let idx = 0; idx < pointsCount; idx++) {
        sum += points[idx]
        count++
        if(count === pointsPerGroup || idx === pointsCount - 1) {
          aggregatedPoints.push(sum / count)
          sum = count = 0
        }
      }
      return aggregatedPoints
    }

    _aggregateWithFirstValue(points, pointsPerGroup, pointsCount){
      const aggregatedPoints = []     
      for (let idx = 0; idx < pointsCount; idx+= pointsPerGroup) {
        aggregatedPoints.push(points[idx])
      }
      return aggregatedPoints
    }

  }

  window.DataSource = DataSource
// })()