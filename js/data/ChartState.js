(function () {

  /**
  * Main purpose of this class is creating 
  * "single source of truth" of chart state attributes
  * and theirs changes tracking where this is necessary.
  */
  class ChartState {
    static get Events() {
      return {
        LEFT_BORDER_CHANGED: 'left-border-changed',
        RIGHT_BORDER_CHANGED: 'right-border-changed',
        VIEWING_AREA_CHANGED: 'viewing-area-changed',
        SERIES_CHANGED: 'series-changed',
        THEME_CHANGED: 'theme-changed'
      }
    }

    static get Themes() {
      return {
        DAY: 'day-theme',
        NIGHT: 'night-theme',
      }
    }

    constructor() {
      this.startPercent = 0
      this.endPercent = 20
      this.visibleSeriesCodes = []
      this.theme = ChartState.Themes.DAY

      this._eventHandlers = []
    }

    updateLeftBorder(startPercent) {
      if (startPercent && this.startPercent !== startPercent) {
        this.startPercent = startPercent
        this._fire(ChartState.Events.LEFT_BORDER_CHANGED)
      }
    }

    updateRightBorder(endPercent) {
      if (endPercent && this.endPercent !== endPercent) {
        this.endPercent = endPercent
        this._fire(ChartState.Events.RIGHT_BORDER_CHANGED)
      }
    }

    moveViewingArea(startPercent, endPercent) {
      let areChanged = false
      if (startPercent && this.startPercent !== startPercent) {
        this.startPercent = startPercent
        areChanged = true
      }
      if (endPercent && this.endPercent !== endPercent) {
        this.endPercent = endPercent
        areChanged = true
      }

      if (areChanged) {
        this._fire(ChartState.Events.VIEWING_AREA_CHANGED)
      }
    }

    setVisibleSeries(visibleSeriesCodes) {
      this.visibleSeriesCodes = visibleSeriesCodes
      this._fire(ChartState.Events.SERIES_CHANGED)
    }

    setSeriesStatus(seriesCode, isShown) {
      this.visibleSeriesCodes = this.visibleSeriesCodes.filter(code => code != seriesCode)
      if (isShown) {
        this.visibleSeriesCodes.push(seriesCode)
      }
      this._fire(ChartState.Events.SERIES_CHANGED)
    }

    setTheme(theme) {
      if (this.theme !== theme) {
        this.theme = theme
        this._fire(ChartState.Events.THEME_CHANGED)
      }
    }

    on(eventName, handler) {
      const eventData = { eventName, handler }
      this._eventHandlers.push(eventData)

      return () => {
        this._eventHandlers = this._eventHandlers.filter(e => e !== eventData)
      }
    }

    _fire(event) {
      this._eventHandlers.forEach(({ eventName, handler }) => {
        if (eventName === event) {
          handler()
        }
      });
    }
  }

  window.ChartState = ChartState
})()