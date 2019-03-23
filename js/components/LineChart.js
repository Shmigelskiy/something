(function () {
  const CHART_HEIGHT = 400

  /**
  * LineChart - base chart class, where all chart parts
  * are initiated. Also this class provide interaction 
  * with chart from outside
  */
  class LineChart {

    /**
    * Create a LineChart.
    * @param {DataSource} dataSource - data source of displayed data.
    * @param {ChartState} state - current chart state object.
    */
    constructor(dataSource) {
      this._dataSource = dataSource
      this._init()
    }

    getElement() {
      return this._containerElement
    }

    resize() {
      this._chart.resize()
      this._resizer.resize()
    }

    setDayTheme() {
      this._state.setTheme(ChartState.Themes.DAY)
    }

    setNightTheme() {
      this._state.setTheme(ChartState.Themes.NIGHT)
    }

    _init() {
      this._state = new ChartState()

      const series = this._dataSource.getSeries()
      this._state.setVisibleSeries(series)

      this._initDom()

      this._state.on(ChartState.Events.THEME_CHANGED, this._setThemeClass.bind(this))
    }

    _setThemeClass() {
      const theme = new Theme(this._state.theme)
      this._containerElement.className = `line-chart ${theme.themeClassName}`
    }

    _initDom() {
      this._chart = new ChartArea(this._dataSource, this._state, {
        height: CHART_HEIGHT,
        isBordered: true,
        isLegendShown: true,
        isTooltipShown: true
      })
      this._resizer = new Resizer(this._dataSource, this._state)
      const visibleSeriesBar = new VisibleSeriesBar(this._dataSource, this._state)

      this._containerElement = document.createElement('DIV')
      this._setThemeClass()
      this._containerElement.appendChild(this._chart.getElement())
      this._containerElement.appendChild(this._resizer.element)
      this._containerElement.appendChild(visibleSeriesBar.getElement())
    }
  }

  window.LineChart = LineChart
})()