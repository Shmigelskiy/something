(function () {

  /**
  * VisibleSeriesBar - component what contain checkboxes 
  * for disabling or enabling series
  */
  class VisibleSeriesBar {

    /**
    * Create a ResizerControl.
    * @param {DataSource} dataSource - data source of displayed data.
    * @param {ChartState} state - current chart state object.
    */
    constructor(dataSource, state) {
      this._dataSource = dataSource
      this._state = state

      this._onSeriesStatusChanged = this._onSeriesStatusChanged.bind(this)

      this._initDom()
    }

    getElement() {
      return this._element
    }

    _onSeriesStatusChanged(seriesCode, isChecked) {
      this._state.setSeriesStatus(seriesCode, isChecked)
    }

    _initDom() {
      this._element = document.createElement('div')

      const allSeries = this._dataSource.getSeries()

      allSeries.forEach(seriesCode => {
        const label = this._dataSource.getSeriesName(seriesCode)
        const color = this._dataSource.getSeriesColor(seriesCode)
        const checkbox = new CheckBox(seriesCode, true, label, color, this._onSeriesStatusChanged)

        this._element.appendChild(checkbox.getElement())
      });
    }
  }

  window.VisibleSeriesBar = VisibleSeriesBar
})()