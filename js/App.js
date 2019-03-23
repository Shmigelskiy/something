
(function () {
  const CHARTS_CONTAINER_ID = 'charts'
  const CHANGE_MODE_ELEMENT_ID = 'mode-changer'
  const SWITCH_TO_DAY_MODE = 'Switch to Day Mode' 
  const SWITCH_TO_NIGHT_MODE = 'Switch to Night Mode'
  const NIGHT_MODE_CHANGER_CLASS = 'night-theme'

  class App {
    
    constructor() {
      this._charts = []
      this._isDayMode = true
    }

    getChartData() {
      return JSON.parse(chartJson)
    }

    resizeCharts() {
      this._charts.forEach(chart => {
        chart.resize()
      })
    }

    onModeChange(event) {
      this._isDayMode = !this._isDayMode

      if(this._isDayMode) {
        this._charts.forEach(chart => {
          chart.setDayTheme()
        })
        event.target.innerText = SWITCH_TO_NIGHT_MODE
        event.target.classList.remove(NIGHT_MODE_CHANGER_CLASS)
      } else {
        this._charts.forEach(chart => {
          chart.setNightTheme()
        })
        event.target.innerText = SWITCH_TO_DAY_MODE
        event.target.classList.add(NIGHT_MODE_CHANGER_CLASS)
      }
    }

    run() {
      const container = document.getElementById(CHARTS_CONTAINER_ID)
      const chartsData = this.getChartData()

      chartsData.forEach((chartData) => {
        const dataSource = new DataSource()
        dataSource.updateData(chartData)
        const chart = new LineChart(dataSource)
        container.appendChild(chart.getElement())
        this._charts.push(chart)
      });     

      this.resizeCharts()

      const modeChanger = document.getElementById(CHANGE_MODE_ELEMENT_ID)
      modeChanger.addEventListener('click', this.onModeChange.bind(this))
     
    }
  }

  window.App = App
})()