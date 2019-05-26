
(function () {
  const CHARTS_CONTAINER_ID = 'charts'
  const CHANGE_MODE_ELEMENT_ID = 'mode-changer'
  const SWITCH_TO_DAY_MODE = 'Switch to Day Mode'
  const SWITCH_TO_NIGHT_MODE = 'Switch to Night Mode'
  const NIGHT_MODE_CHANGER_CLASS = 'night-theme'

  const JSON_URL = '/something/chart_data.json'

  const MS_IN_DAY = 1000 * 60 * 60 * 24
  const SERIES_COLORS = ["#73c03a", "#cb513a", "#65b9ac", "#4682b4"]
  const MAX_SERIES_VALUE = 1000

  class App {

    constructor() {
      this._chart = null
      this._isDayMode = true
      this._pointsCount = 10000000
    }

    getPointsCount() {
      return this._pointsCount
    }

    setPointsCount(pointsCount) {
      this._pointsCount = pointsCount
      this.run()
    }

    getGeneratedChartData() {
      const labels = []
      const seriesIds = [String(Math.random())] 
      const series = {}, names = {}, colors = {}
      seriesIds.forEach((id, idx) => {
        series[id] = []
        names[id] = `Series ${idx + 1}`
        colors[id] = SERIES_COLORS[idx % SERIES_COLORS.length]
      })

      let label = Date.now() - MS_IN_DAY * this._pointsCount
      for(let i = 0; i < this._pointsCount; i++) {
        labels.push(label)
        seriesIds.forEach(id => {
          const value = Math.round(Math.random() * MAX_SERIES_VALUE)
          series[id].push(value)
        })

        label += MS_IN_DAY
      }

      return {
        labels,
        series,
        names,
        colors
      }
    }

    onModeChange(event) {
      this._isDayMode = !this._isDayMode

      if (this._isDayMode) {
        this._chart.setDayTheme()
        event.target.innerText = SWITCH_TO_NIGHT_MODE
        event.target.classList.remove(NIGHT_MODE_CHANGER_CLASS)
      } else {
        this._chart.setNightTheme()
        event.target.innerText = SWITCH_TO_DAY_MODE
        event.target.classList.add(NIGHT_MODE_CHANGER_CLASS)
      }
    }

    async run() {
      const container = document.getElementById(CHARTS_CONTAINER_ID)
      if(this._chart) {
        container.removeChild(this._chart.getElement())
      }
      const chartData = this.getGeneratedChartData()

      const dataSource = new DataSource()
      dataSource.updateData(chartData)
      this._chart = new LineChart(dataSource)
      container.appendChild(this._chart.getElement())
      this._chart.resize()

      const modeChanger = document.getElementById(CHANGE_MODE_ELEMENT_ID)
      modeChanger.addEventListener('click', this.onModeChange.bind(this))
    }
  }

  window.App = App
})()