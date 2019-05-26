(function () {
  const MAX_STORING_POINTS_COUNT = 100000
  const AGGREGATE_MODE = {
    AVERAGE: 'AVERAGE',
    MIN_MAX: "MIN_MAX",
    FIRST: 'FIRST',
  }

  /**
  * Main purpose of this class is encapsulating data calculation 
  * and providing friendly interface for data receiving.
  * Main idea is that maximum count of points what can be displayed 
  * is user's screen width in pixels. This class does all compression logic,
  * if there are more points than user's screen width and returns points, labels,
  * colors, and names
  * 
  * This class is not directly used in chart, so users can create their own
  * implementation of data source, with same interface, and pass it for the chart
  */
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
        series = {},
        colors = {},
        names = {},
        labels = []
      } = data

      this._colors = colors
      this._names = names

      Object.keys(series || {}).forEach(code => {
        const points = series[code]
        this._series.push(code)
        this._points[code] = this._aggregatePoints(points, MAX_STORING_POINTS_COUNT, AGGREGATE_MODE.AVERAGE)
      })

      this._labels = this._aggregatePoints(labels, MAX_STORING_POINTS_COUNT, AGGREGATE_MODE.FIRST)

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

      return this._aggregatePoints(points, maxCount, AGGREGATE_MODE.MIN_MAX)
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

    _aggregatePoints(points, maxCount, mode) {
      const pointsCount = points.length
      const pointsPerGroup = Math.ceil(pointsCount / maxCount)
      if (pointsPerGroup <= 1) {
        return points
      }

      switch (mode) {
        case AGGREGATE_MODE.MIN_MAX:
          return this._aggregateWithMinMaxValue(points, pointsPerGroup, pointsCount)
        case AGGREGATE_MODE.AVERAGE:
          return this._aggregateWithAverageValue(points, pointsPerGroup, pointsCount)
        case AGGREGATE_MODE.FIRST:
          return this._aggregateWithFirstValue(points, pointsPerGroup, pointsCount)
        default:
          return this._aggregateWithAverageValue(points, pointsPerGroup, pointsCount)
      }
    }

    _aggregateWithMinMaxValue(points, pointsPerGroup, pointsCount) {
      const aggregatedPoints = []
      let min = Number.MAX_VALUE, max = Number.MIN_VALUE, count = 0
      for (let idx = 0; idx < pointsCount; idx++) {
        if(points[idx] > max) {
          max = points[idx]
        }
        if(points[idx] < min) {
          min = points[idx]
        }
        count++
        if (count === pointsPerGroup || idx === pointsCount - 1) {
          aggregatedPoints.push({min, max})
          min = Number.MAX_VALUE
          max = Number.MIN_VALUE
          count = 0
        }
      }
      return aggregatedPoints
    }

    _aggregateWithAverageValue(points, pointsPerGroup, pointsCount) {
      const aggregatedPoints = []
      let sum = 0, count = 0
      for (let idx = 0; idx < pointsCount; idx++) {
        sum += points[idx]
        count++
        if (count === pointsPerGroup || idx === pointsCount - 1) {
          aggregatedPoints.push(sum / count)
          sum = count = 0
        }
      }
      return aggregatedPoints
    }

    _aggregateWithFirstValue(points, pointsPerGroup, pointsCount) {
      const aggregatedPoints = []
      for (let idx = 0; idx < pointsCount; idx += pointsPerGroup) {
        aggregatedPoints.push(points[idx])
      }
      return aggregatedPoints
    }

  }

  window.DataSource = DataSource
})()