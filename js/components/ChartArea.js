// (function() {
  const DEFAULT_OPTIONS = {
    height: 400,
    isLegendShown: false,
    isBordered: false
  }
  const ANIMATION_DURATION = 150
  const HORIZONTAL_SECTIONS_COUNT = 6
  const HORIZONTAL_SECTION_LABEL_OFFSET = 5
  const BOTTOM_LEGEND_HEIGHT = 25
  const BOTTOM_LEGEND_OFFSET = 10

  class ChartArea {

    constructor(dataSource, state, options = {}) {
      this._dataSource = dataSource
      this._state = state

      const {
        height,
        isBordered,
        isLegendShown
      } = options
      this._canvasHeight = height || DEFAULT_OPTIONS.height
      this._isChartBordered = isBordered || DEFAULT_OPTIONS.isBordered
      this._isLegendShown = isLegendShown || DEFAULT_OPTIONS.isLegendShown
      
      this._startPercent = this._state.startPercent
      this._endPercent = this._state.endPercent

      this._pointsCache = {}

      this._isAnimating = false

      this._startXOffsetPx = 0
      this._pointsCount = 0
      this._xStepPx = 0
      this._minPointValue = 0;
      this._maxPointValue = 0;

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
      if(this._isChartBordered) {
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
      this._startXOffsetPx = 0

      this._loadChartPoints()
      this._render()
    }

    _getChartHeight() {
      if(!this._isLegendShown) {
        return this._canvasHeight
      }
      return this._canvasHeight - BOTTOM_LEGEND_HEIGHT
    }

    _getScaleValues(startPercent, endPercent) {
      let pointsCount = 0;
      let minPointValue = null;
      let maxPointValue = null;
       
      this._state.visibleSeriesCodes.forEach(code => {
        const points = this._dataSource.getSeriesPoints(code, this._canvasWidth, startPercent, endPercent)
  
        const pointsLength = points.length
        if(pointsLength > pointsCount) {
          pointsCount = pointsLength
        }

        points.forEach(point => {
          if(!maxPointValue || point > maxPointValue) {
            maxPointValue = point
          }
          if(!minPointValue || point < minPointValue) {
            minPointValue = point
          }
        })
      })

      const xStepPx = this._canvasWidth / (pointsCount - 1)

      const pointValuesDelta = maxPointValue - minPointValue
      const horizontalSectionStep = Math.floor(pointValuesDelta / HORIZONTAL_SECTIONS_COUNT)
      minPointValue = Math.floor(minPointValue / horizontalSectionStep) * horizontalSectionStep
      maxPointValue = Math.ceil(maxPointValue / horizontalSectionStep) * horizontalSectionStep

      return {
        pointsCount,
        xStepPx,
        minPointValue,
        maxPointValue,
      }
    }

    _loadChartPoints() {
      this._pointsCache = {}
      this._state.visibleSeriesCodes.forEach(code => {
        this._pointsCache[code] = this._getSeriesPoints(code)
      })
    }

    _clearCanvas() {
      this._canvasContext.clearRect(0, 0, this._canvasWidth, this._canvasHeight)
    }

    _getSeriesPoints(code) {
      const dataSourceArgs = [code, this._canvasWidth]
      if(this._isChartBordered) {
        dataSourceArgs.push(this._startPercent, this._endPercent)
      }
      return this._dataSource.getSeriesPoints(...dataSourceArgs)
    }

    _getLegendLabels() {
      const dataSourceArgs = [this._canvasWidth]
      if(this._isChartBordered) {
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
      this._element.appendChild(this._canvas)

      this._resize()

      window.addEventListener('resize', ()=> {
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
      if(this._isChartBordered) {
        this._state.on(RIGHT_BORDER_CHANGED, this._animateRightBorderChanging.bind(this))
        this._state.on(LEFT_BORDER_CHANGED, this._animateLeftBorderChanging.bind(this))
        this._state.on(VIEWING_AREA_CHANGED, this._animateViewingAreaChanging.bind(this))
      }
    }

    _animateSeriesChanging() {
      if(this._isAnimating) {
        return
      }
      let newScaleValues
      if(this._isChartBordered) {
        newScaleValues = this._getScaleValues(
          this._state.startPercent,
          this._state.endPercent
        ) 
      } else {
        newScaleValues = this._getScaleValues() 
      }

      this._loadChartPoints()

      this._isAnimating = true
      Animation.animate(
        [this._minPointValue, this._maxPointValue],
        [newScaleValues.minPointValue, newScaleValues.maxPointValue],
        ANIMATION_DURATION,
        (newValues, isEnd) => {
          const [_minPointValue, _maxPointValue] = newValues
          Object.assign(this, {_minPointValue, _maxPointValue})
          
          this._render()

          if(!isEnd){
            return
          }
          this._isAnimating = false
        }
      )
    }

    _animateRightBorderChanging() {
      if(this._isAnimating) {
        return
      }
      if( this._endPercent === this._state.endPercent){
        return this._drawChart()
      }
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
      this._loadChartPoints()
      
      this._isAnimating = true
      Animation.animate(
        [this._minPointValue, this._maxPointValue, this._xStepPx],
        [newScaleValues.minPointValue, newScaleValues.maxPointValue, newScaleValues.xStepPx],
        ANIMATION_DURATION,
        (newValues, isEnd) => {
          const [_minPointValue, _maxPointValue, _xStepPx] = newValues
          Object.assign(this, {_minPointValue, _maxPointValue, _xStepPx})

          this._render()

          if(!isEnd){
            return
          }
          this._isAnimating = false
          this._endPercent = newEndPercent
          this._animateRightBorderChanging()
        }
      )
    }

    _animateLeftBorderChanging() {
      if(this._isAnimating) {
        return
      }
      if(this._startPercent === this._state.startPercent){
        return this._drawChart()
      }
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
      this._pointsCount = displayingScaleValues.pointsCount
      this._loadChartPoints()

      this._isAnimating = true
      Animation.animate(
        [this._minPointValue, this._maxPointValue, this._xStepPx],
        [newScaleValues.minPointValue, newScaleValues.maxPointValue, newScaleValues.xStepPx],
        ANIMATION_DURATION,
        (newValues, isEnd) => {
          const [_minPointValue, _maxPointValue, _xStepPx] = newValues
          Object.assign(this, {_minPointValue, _maxPointValue, _xStepPx})
     
          this._startXOffsetPx = this._canvasWidth - this._xStepPx * (this._pointsCount - 1)
          
          this._render()

          if(!isEnd){
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
      if(this._isAnimating) {
        return
      }
      if(
        this._startPercent === this._state.startPercent &&
        this._endPercent === this._state.endPercent
      ){
        return this._drawChart()
      }

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
      this._pointsCount = displayingScaleValues.pointsCount
      this._loadChartPoints()

      let startXOffsetPxFrom, startXOffsetPxTo
      if(newStartPercent === this._startPercent) {
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
          Object.assign(this, {_minPointValue, _maxPointValue, _xStepPx, _startXOffsetPx})
      
          this._render()

          if(!isEnd){   
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

      if(this._isLegendShown) {
        this._renderLegend()
      }

      this._state.visibleSeriesCodes.forEach(code => {
        const color = this._dataSource.getSeriesColor(code)
        const points = this._pointsCache[code] || []
       
        this._canvasContext.beginPath()
        this._canvasContext.strokeStyle = color
        points.forEach((point, idx) => {
          const yValuePx = this._getPointYValuePx(point)
          const xValuePx = idx * this._xStepPx + this._startXOffsetPx
          if(!idx) {
            this._canvasContext.moveTo(xValuePx, yValuePx)
          } else {
            this._canvasContext.lineTo(xValuePx, yValuePx)
          }

        })

        this._canvasContext.stroke()
      })
      
    }

    _renderLegend() {
      const theme = new Theme(this._state.theme)

      const pointValuesDelta = this._maxPointValue - this._minPointValue
      const lineStep = Math.floor(pointValuesDelta / HORIZONTAL_SECTIONS_COUNT)
      let lineValue = Math.round(this._minPointValue)
      for(let i = 0; i <= 6; i++) {
        const lineYValuePx = this._getPointYValuePx(lineValue)

        this._canvasContext.beginPath()
        this._canvasContext.strokeStyle = theme.horizontalSectionLineColor
        this._canvasContext.moveTo(0, lineYValuePx)
        this._canvasContext.lineTo(this._canvasWidth, lineYValuePx)
        this._canvasContext.stroke()
        
        this._canvasContext.fillStyle = theme.legendColor
        this._canvasContext.fillText(
          lineValue, 
          HORIZONTAL_SECTION_LABEL_OFFSET, 
          lineYValuePx - HORIZONTAL_SECTION_LABEL_OFFSET
        )
        lineValue += lineStep
      }

      const legendLabels = this._getLegendLabels()
      let nextLabelX = 0
      for(let idx = 0; idx < this._pointsCount; idx++) {
        const pointLabel = legendLabels[idx]
        const pointXPx = idx * this._xStepPx + this._startXOffsetPx
        const labelWidth = this._canvasContext.measureText(pointLabel).width
        const labelXPx = pointXPx - labelWidth / 2
        if(labelXPx > nextLabelX) {
          this._canvasContext.fillStyle = theme.legendColor
          this._canvasContext.fillText(pointLabel, labelXPx, this._canvasHeight - BOTTOM_LEGEND_OFFSET)

          nextLabelX = labelXPx + labelWidth + 20
        }
      }
    }

    _getPointIndexByCanvasPosition(xValuePx) {
      return Math.round(xValuePx / this._xStepPx)
    }

    _resize() {
      const containerWidth = this._element.clientWidth || document.clientWidth
      this._canvas.width = this._canvasWidth = containerWidth
      this._canvas.height = this._canvasHeight
    }
  
  }

  window.ChartArea = ChartArea
// })()