(function () {
  const CANVAS_HEIGHT = 80

  /**
  * Resizer - component related to changing
  * chart's visible borders. 
  */
  class Resizer {

    /**
    * Create a Resizer.
    * @param {DataSource} dataSource - data source of displayed data.
    * @param {ChartState} state - current chart state object.
    */
    constructor(dataSource, state) {
      this._dataSource = dataSource
      this._state = state

      this._init()
    }

    resize() {
      this._chart.resize()
    }

    _init() {
      this._initDom()
    }

    _initDom() {
      this.element = document.createElement('DIV')
      this.element.className = 'line-chart-resizer'

      this._chart = new ChartArea(this._dataSource, this._state, {
        height: CANVAS_HEIGHT
      })

      this._control = new ResizerControl(this._state)

      this.element.appendChild(this._chart.getElement())
      this.element.appendChild(this._control.element)
    }
  }

  window.Resizer = Resizer
})()