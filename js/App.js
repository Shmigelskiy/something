
(function () {
  const CHARTS_CONTAINER_ID = 'charts'

  class App {

    constructor() {
      this._charts = []
      this._isDayMode = true
    }

    getChartData() {
      return JSON.parse(chartJson)
    }

    run() {
      const container = document.getElementById(CHARTS_CONTAINER_ID)
      const chartsData = this.getChartData()

      chartsData.forEach((chartData, idx) => {
        if(idx) {
          return 
        }
        const dataSource = new DataSource()
        dataSource.updateData(chartData)
        const lineChart = new LineChart(dataSource)
        lineChart.addToContainer(container)
        this._charts.push(lineChart)
      });
      
    }
  }

  window.App = App
})()