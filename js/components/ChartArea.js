(function () {
  const DEFAULT_OPTIONS = {
    height: 400,
    isLegendShown: false,
    isBordered: false,
    isTooltipShown: false
  }
  const ANIMATION_DURATION = 150
  const HORIZONTAL_SECTIONS_COUNT = 5
  const HORIZONTAL_SECTION_LABEL_OFFSET = 5
  const BOTTOM_LEGEND_HEIGHT = 25
  const BOTTOM_LEGEND_OFFSET = 10
  const TOOLTIP_CIRCLE_RADIUS = 3

  const BILLION = 1000000000
  const MILLION = 1000000
  const THOUSAND = 1000

  /**
   * ChartArea is a class for rendering points. It have 
   * all rendering, animating, and position calculating
   * logic.
   */
  class ChartArea {

    /**
     * Create a ChartArea.
     * @param {DataSource} dataSource - data source of displayed data.
     * @param {ChartState} state - current chart state object.
     * @param {any} options - options to customize point rendering .
     */
    constructor(dataSource, state, options = {}) {
      this._dataSource = dataSource
      this._state = state

      const {
        height,
        isBordered,
        isLegendShown,
        isTooltipShown
      } = options
      this._canvasHeight = height || DEFAULT_OPTIONS.height
      this._isChartBordered = isBordered || DEFAULT_OPTIONS.isBordered
      this._isLegendShown = isLegendShown || DEFAULT_OPTIONS.isLegendShown
      this._isTooltipShown = isTooltipShown || DEFAULT_OPTIONS.isTooltipShown

      this._startPercent = this._state.startPercent
      this._endPercent = this._state.endPercent

      this._pointsCache = {}
      this._labelsCache = []

      this._isAnimating = false

      this._startXOffsetPx = 0
      this._pointsCount = 0
      this._xStepPx = 0
      this._minPointValue = 0;
      this._maxPointValue = 0;
      this._horizontalSectionStep = 0;

      this._initDom()
      this._drawChart()
    }

    getElement() {
      return this._element
    }

    resize() {
      this._resize()
      this._drawChart()
    }

    _drawChart() {
      let scaleValues
      if (this._isChartBordered) {
        scaleValues = this._getScaleValues(
          this._state.startPercent,
          this._state.endPercent
        )
      } else {
        scaleValues = this._getScaleValues()
      }
      this._minPointValue = scaleValues.minPointValue
      this._maxPointValue = scaleValues.maxPointValue
      this._xStepPx = scaleValues.xStepPx
      this._pointsCount = scaleValues.pointsCount
      this._horizontalSectionStep = scaleValues.horizontalSectionStep
      this._startXOffsetPx = 0

      this._loadChartPoints()
      this._render()
    }

    _getChartHeight() {
      if (!this._isLegendShown) {
        return this._canvasHeight
      }
      return this._canvasHeight - BOTTOM_LEGEND_HEIGHT
    }

    _getScaleValues(startPercent, endPercent) {
      let pointsCount = 0;
      let seriesMinPoint = null;
      let seriesMaxPoint = null;

      this._state.visibleSeriesCodes.forEach(code => {
        const points = this._dataSource.getSeriesPoints(code, this._canvasWidth, startPercent, endPercent)

        const pointsLength = points.length
        if (pointsLength > pointsCount) {
          pointsCount = pointsLength
        }

        points.forEach(point => {
          if (!seriesMaxPoint || (point.max || point) > seriesMaxPoint) {
            seriesMaxPoint = point.max || point
          }
          if (!seriesMinPoint || (point.min || point) < seriesMinPoint) {
            seriesMinPoint = point.min || point
          }
        })
      })

      const xStepPx = this._canvasWidth / (pointsCount - 1)

      const seriesValuesDelta = seriesMaxPoint - seriesMinPoint
      const stepPrettier = this._getHorizontalStepPrettier(seriesValuesDelta)

      let horizontalSectionStep = Math.ceil(
        seriesValuesDelta / HORIZONTAL_SECTIONS_COUNT / stepPrettier
      ) * stepPrettier

      let minPointValue = Math.floor(seriesMinPoint / horizontalSectionStep) * horizontalSectionStep
      let maxPointValue = Math.ceil(seriesMaxPoint / horizontalSectionStep) * horizontalSectionStep

      while (HORIZONTAL_SECTIONS_COUNT * horizontalSectionStep < maxPointValue - minPointValue) {
        horizontalSectionStep += stepPrettier
        minPointValue = Math.floor(seriesMinPoint / horizontalSectionStep) * horizontalSectionStep
        maxPointValue = Math.ceil(seriesMaxPoint / horizontalSectionStep) * horizontalSectionStep
      }

      return {
        pointsCount,
        xStepPx,
        minPointValue,
        maxPointValue,
        horizontalSectionStep
      }
    }

    _getHorizontalStepPrettier(delta) {
      const prettierBase = Math.floor(Math.abs(delta) / 4 / HORIZONTAL_SECTIONS_COUNT) || 1

      switch (true) {
        case prettierBase < 5: {
          return prettierBase
        }
        case prettierBase < 10: {
          return 5
        }
        case prettierBase < 20: {
          return 10
        }
        case prettierBase < 25: {
          return 20
        }
        case prettierBase < 50: {
          return 25
        }
        case prettierBase < 100: {
          return 50
        }
        default: {
          const signsQty = String(prettierBase).length
          return Math.pow(10, signsQty - 1)
        }
      }
    }

    _loadChartPoints() {
      this._pointsCache = {}
      this._state.visibleSeriesCodes.forEach(code => {
        this._pointsCache[code] = this._getSeriesPoints(code)
      })
      this._labelsCache = this._getLegendLabels()
    }

    _clearCanvas() {
      this._canvasContext.clearRect(0, 0, this._canvasWidth, this._canvasHeight)
    }

    _clearTooltipCanvas() {
      this._tooltipCanvasContext.clearRect(0, 0, this._canvasWidth, this._canvasHeight)
    }

    _getSeriesPoints(code) {
      const dataSourceArgs = [code, this._canvasWidth]
      if (this._isChartBordered) {
        dataSourceArgs.push(this._startPercent, this._endPercent)
      }
      return this._dataSource.getSeriesPoints(...dataSourceArgs)
    }

    _getLegendLabels() {
      const dataSourceArgs = [this._canvasWidth]
      if (this._isChartBordered) {
        dataSourceArgs.push(this._startPercent, this._endPercent)
      }
      return this._dataSource.getLegendLabels(...dataSourceArgs)
    }

    _getPointYValuePx(dataValue) {
      const correlatedValue = (dataValue - this._minPointValue) * this._pointCorrelationCoefficient
      const chartHeight = this._getChartHeight()
      return chartHeight - correlatedValue
    }


    _initDom() {
      this._canvas = document.createElement('canvas')
      this._canvasContext = this._canvas.getContext('2d')

      this._element = document.createElement('div')
      this._element.className = 'chart-area'
      this._element.appendChild(this._canvas)

      window.addEventListener('resize', () => {
        this._resize()
        this._drawChart()
      })

      const {
        RIGHT_BORDER_CHANGED,
        LEFT_BORDER_CHANGED,
        VIEWING_AREA_CHANGED,
        SERIES_CHANGED,
        THEME_CHANGED
      } = ChartState.Events

      this._state.on(THEME_CHANGED, this._render.bind(this))
      this._state.on(SERIES_CHANGED, this._animateSeriesChanging.bind(this))

      if (this._isChartBordered) {
        this._state.on(RIGHT_BORDER_CHANGED, this._animateRightBorderChanging.bind(this))
        this._state.on(LEFT_BORDER_CHANGED, this._animateLeftBorderChanging.bind(this))
        this._state.on(VIEWING_AREA_CHANGED, this._animateViewingAreaChanging.bind(this))
      }

      if (this._isTooltipShown) {
        this._tooltipCanvas = document.createElement('canvas')
        this._tooltipCanvas.className = 'chart-area__tooltip-canvas'
        this._tooltipCanvasContext = this._tooltipCanvas.getContext('2d')
        this._tooltip = document.createElement('div')
        this._tooltip.className = 'chart-area__tooltip'

        this._element.appendChild(this._tooltipCanvas)
        this._element.appendChild(this._tooltip)

        this._tooltipCanvas.addEventListener('mousemove', this._showTooltip.bind(this))
        this._tooltipCanvas.addEventListener('touchdown', this._showTooltip.bind(this))
        this._tooltipCanvas.addEventListener('mouseleave', this._hideTooltip.bind(this))
      }

      this._resize()
    }

    _showTooltip(event) {
      event.preventDefault()
      event.stopPropagation()

      this._clearTooltipCanvas()

      const canvasBoundingRect = this._tooltipCanvas.getBoundingClientRect()
      const mouseX = event.pageX - canvasBoundingRect.x
      const pointIndex = this._getPointIndexByCanvasPosition(mouseX)

      const pointXPx = pointIndex * this._xStepPx + this._startXOffsetPx

      const theme = new Theme(this._state.theme)
      this._tooltipCanvasContext.beginPath()
      this._tooltipCanvasContext.strokeStyle = theme.legendColor
      this._tooltipCanvasContext.moveTo(pointXPx, 0)
      this._tooltipCanvasContext.lineTo(pointXPx, this._getChartHeight())
      this._tooltipCanvasContext.stroke()

      const title = DateUtils.getWeekDateString(this._labelsCache[pointIndex])
      let tooltipHtml = `
        <div class='chart-area__tooltip-title'>${title}</div>
        <div class='chart-area__tooltip-values-container'>  
      `

      this._state.visibleSeriesCodes.forEach(code => {
        const point = this._pointsCache[code][pointIndex]
        if (!point) {
          return
        }
        const pointValue = point.min || point
        const seriesColor = this._dataSource.getSeriesColor(code)
        const seriesName = this._dataSource.getSeriesName(code)

        const pointYPx = this._getPointYValuePx(pointValue)

        this._tooltipCanvasContext.beginPath();
        this._tooltipCanvasContext.strokeStyle = seriesColor
        this._tooltipCanvasContext.fillStyle = theme.backgroundColor
        this._tooltipCanvasContext.arc(pointXPx, pointYPx, TOOLTIP_CIRCLE_RADIUS, 0, 2 * Math.PI);
        this._tooltipCanvasContext.fill()
        this._tooltipCanvasContext.stroke()

        tooltipHtml += `
          <div class='chart-area__tooltip-value' style='color: ${seriesColor}'>
            <span>${pointValue}</span>
            <span>${seriesName}</span>
          </div>
        `
      })
      tooltipHtml += `</div`
      this._tooltip.style.left = null
      this._tooltip.innerHTML = tooltipHtml
      this._tooltip.style.display = 'block'

      const maxTooltipLeftValuePx = this._canvasWidth - this._tooltip.clientWidth
      const tooltipLeftPx = Math.min(Math.max(pointXPx - 30, 0), maxTooltipLeftValuePx)
      this._tooltip.style.left = tooltipLeftPx + 'px'
    }


    _hideTooltip() {
      if (this._isTooltipShown) {
        this._tooltip.innerHTML = ''
        this._tooltip.style.display = 'none'
        this._clearTooltipCanvas()
      }
    }

    _animateSeriesChanging() {
      if (this._isAnimating) {
        return
      }
      this._hideTooltip()

      let newScaleValues
      if (this._isChartBordered) {
        newScaleValues = this._getScaleValues(
          this._state.startPercent,
          this._state.endPercent
        )
      } else {
        newScaleValues = this._getScaleValues()
      }

      this._horizontalSectionStep = newScaleValues.horizontalSectionStep
      this._loadChartPoints()

      this._isAnimating = true
      Animation.animate(
        [this._minPointValue, this._maxPointValue],
        [newScaleValues.minPointValue, newScaleValues.maxPointValue],
        ANIMATION_DURATION,
        (newValues, isEnd) => {
          const [_minPointValue, _maxPointValue] = newValues
          Object.assign(this, { _minPointValue, _maxPointValue })

          this._render()

          if (!isEnd) {
            return
          }
          this._isAnimating = false
        }
      )
    }

    _animateRightBorderChanging() {
      if (this._isAnimating) {
        return
      }
      if (this._endPercent === this._state.endPercent) {
        return this._drawChart()
      }
      this._hideTooltip()

      const newScaleValues = this._getScaleValues(
        this._state.startPercent,
        this._state.endPercent,
      )
      const newEndPercent = this._state.endPercent
      this._endPercent = Math.max(newEndPercent, this._endPercent)

      const displayingScaleValues = this._getScaleValues(
        this._startPercent,
        this._endPercent,
      )
      this._pointsCount = displayingScaleValues.pointsCount
      this._horizontalSectionStep = newScaleValues.horizontalSectionStep
      this._loadChartPoints()

      this._isAnimating = true
      Animation.animate(
        [this._minPointValue, this._maxPointValue, this._xStepPx],
        [newScaleValues.minPointValue, newScaleValues.maxPointValue, newScaleValues.xStepPx],
        ANIMATION_DURATION,
        (newValues, isEnd) => {
          const [_minPointValue, _maxPointValue, _xStepPx] = newValues
          Object.assign(this, { _minPointValue, _maxPointValue, _xStepPx })

          this._render()

          if (!isEnd) {
            return
          }
          this._isAnimating = false
          this._endPercent = newEndPercent
          this._animateRightBorderChanging()
        }
      )
    }

    _animateLeftBorderChanging() {
      if (this._isAnimating) {
        return
      }
      if (this._startPercent === this._state.startPercent) {
        return this._drawChart()
      }
      this._hideTooltip()

      const newScaleValues = this._getScaleValues(
        this._state.startPercent,
        this._state.endPercent,
      )
      const newStartPercent = this._state.startPercent
      this._startPercent = Math.min(newStartPercent, this._startPercent)

      const displayingScaleValues = this._getScaleValues(
        this._startPercent,
        this._endPercent,
      )
      this._horizontalSectionStep = newScaleValues.horizontalSectionStep
      this._pointsCount = displayingScaleValues.pointsCount
      this._loadChartPoints()

      this._isAnimating = true
      Animation.animate(
        [this._minPointValue, this._maxPointValue, this._xStepPx],
        [newScaleValues.minPointValue, newScaleValues.maxPointValue, newScaleValues.xStepPx],
        ANIMATION_DURATION,
        (newValues, isEnd) => {
          const [_minPointValue, _maxPointValue, _xStepPx] = newValues
          Object.assign(this, { _minPointValue, _maxPointValue, _xStepPx })

          this._startXOffsetPx = this._canvasWidth - this._xStepPx * (this._pointsCount - 1)

          this._render()

          if (!isEnd) {
            return
          }
          this._isAnimating = false
          this._startXOffsetPx = 0
          this._startPercent = newStartPercent
          this._animateLeftBorderChanging()
        }
      )
    }

    _animateViewingAreaChanging() {
      if (this._isAnimating) {
        return
      }
      if (
        this._startPercent === this._state.startPercent &&
        this._endPercent === this._state.endPercent
      ) {
        return this._drawChart()
      }
      this._hideTooltip()

      const newScaleValues = this._getScaleValues(
        this._state.startPercent,
        this._state.endPercent,
      )
      const newStartPercent = this._state.startPercent
      const newEndPercent = this._state.endPercent
      this._startPercent = Math.min(newStartPercent, this._startPercent)
      this._endPercent = Math.max(newEndPercent, this._endPercent)

      const displayingScaleValues = this._getScaleValues(
        this._startPercent,
        this._endPercent,
      )
      this._horizontalSectionStep = newScaleValues.horizontalSectionStep
      this._pointsCount = displayingScaleValues.pointsCount
      this._loadChartPoints()

      let startXOffsetPxFrom, startXOffsetPxTo
      if (newStartPercent === this._startPercent) {
        startXOffsetPxFrom = this._canvasWidth - this._xStepPx * (this._pointsCount - 1)
        startXOffsetPxTo = 0
      } else {
        startXOffsetPxFrom = 0
        startXOffsetPxTo = this._canvasWidth - newScaleValues.xStepPx * (this._pointsCount - 1)
      }

      this._isAnimating = true
      Animation.animate(
        [this._minPointValue, this._maxPointValue, this._xStepPx, startXOffsetPxFrom],
        [newScaleValues.minPointValue, newScaleValues.maxPointValue, newScaleValues.xStepPx, startXOffsetPxTo],
        ANIMATION_DURATION,
        (newValues, isEnd) => {
          const [_minPointValue, _maxPointValue, _xStepPx, _startXOffsetPx] = newValues
          Object.assign(this, { _minPointValue, _maxPointValue, _xStepPx, _startXOffsetPx })

          this._render()

          if (!isEnd) {
            return
          }
          this._isAnimating = false
          this._startXOffsetPx = 0
          this._startPercent = newStartPercent
          this._endPercent = newEndPercent
          this._animateViewingAreaChanging()
        }
      )
    }


    _render() {
      this._clearCanvas()

      const dataValuesDelta = this._maxPointValue - this._minPointValue
      const chartHeight = this._getChartHeight()
      this._pointCorrelationCoefficient = chartHeight / dataValuesDelta

      if (this._isLegendShown) {
        this._renderLegend()
      }

      this._state.visibleSeriesCodes.forEach(code => {
        const color = this._dataSource.getSeriesColor(code)
        const points = this._pointsCache[code] || []

        this._canvasContext.beginPath()
        this._canvasContext.strokeStyle = color
        points.forEach((point, idx) => {
          let yValueMinPx, yValueMaxPx
          if(typeof point === 'object') {
            yValueMinPx = this._getPointYValuePx(point.min)
            if(point.min != point.max) {
              yValueMaxPx = this._getPointYValuePx(point.max)
            } else {
              yValueMaxPx = yValueMinPx
            }
          } else {
            yValueMinPx = yValueMaxPx = this._getPointYValuePx(point)
          }
          const xValuePx = idx * this._xStepPx + this._startXOffsetPx
          if (!idx) {
            this._canvasContext.moveTo(xValuePx, yValueMinPx)
          } else {
            this._canvasContext.lineTo(xValuePx, yValueMinPx)
          }

          if(yValueMaxPx != yValueMinPx) {
            this._canvasContext.lineTo(xValuePx, yValueMaxPx)
          }

        })

        this._canvasContext.stroke()
      })

    }

    _renderLegend() {
      const theme = new Theme(this._state.theme)

      let lineValue = this._minPointValue
      for (let i = 0; i <= HORIZONTAL_SECTIONS_COUNT; i++) {
        const lineYValuePx = this._getPointYValuePx(lineValue)

        this._canvasContext.beginPath()
        this._canvasContext.strokeStyle = theme.horizontalSectionLineColor
        this._canvasContext.moveTo(0, lineYValuePx)
        this._canvasContext.lineTo(this._canvasWidth, lineYValuePx)
        this._canvasContext.stroke()

        this._canvasContext.fillStyle = theme.legendColor
        this._canvasContext.fillText(
          this._getPrettyPointLabel(lineValue),
          HORIZONTAL_SECTION_LABEL_OFFSET,
          lineYValuePx - HORIZONTAL_SECTION_LABEL_OFFSET
        )
        lineValue += this._horizontalSectionStep
      }

      let nextLabelX = this._startXOffsetPx
      for (let idx = 0; idx < this._pointsCount; idx++) {
        const pointLabel = DateUtils.getShortDateString(this._labelsCache[idx])
        const pointXPx = idx * this._xStepPx + this._startXOffsetPx
        const labelWidth = this._canvasContext.measureText(pointLabel).width
        const labelXPx = pointXPx - labelWidth / 2
        if (labelXPx > nextLabelX) {
          this._canvasContext.fillStyle = theme.legendColor
          this._canvasContext.fillText(pointLabel, labelXPx, this._canvasHeight - BOTTOM_LEGEND_OFFSET)

          nextLabelX = labelXPx + labelWidth + 20
        }
      }
    }

    _getPrettyPointLabel(point) {
      const roundedValue = Math.round(point)
      if (roundedValue > BILLION && roundedValue % (100 * MILLION) === 0) {
        return `${roundedValue / BILLION}b`
      }
      if (roundedValue > MILLION && roundedValue % (100 * THOUSAND) === 0) {
        return `${roundedValue / MILLION}m`
      }
      if (roundedValue > THOUSAND && roundedValue % 100 === 0) {
        return `${roundedValue / THOUSAND}k`
      }

      return roundedValue
    }

    _getPointIndexByCanvasPosition(xValuePx) {
      return Math.round(xValuePx / this._xStepPx)
    }

    _resize() {
      const containerWidth = this._element.clientWidth || document.clientWidth
      this._canvas.width = this._canvasWidth = containerWidth
      this._canvas.height = this._canvasHeight

      if (this._tooltipCanvas) {
        this._tooltipCanvas.width = this._canvasWidth
        this._tooltipCanvas.height = this._canvasHeight
      }
    }

  }

  window.ChartArea = ChartArea
})()