
class Theme {
  static get defaultTheme() {
    return ChartState.Themes.DAY
  }

  constructor(themeName) {
    this._theme = themeName || Theme.defaultTheme
  }

  get themeClassName() {
    const classNames = {
      [ChartState.Themes.DAY]: 'day-theme',
      [ChartState.Themes.NIGHT]: 'night-theme',
    }
    return classNames[this._theme] || classNames[Theme.defaultTheme]
  }

  get horizontalSectionLineColor() {
    const colorMap = {
      [ChartState.Themes.DAY]: 'rgba(234, 234, 234, 0.5)',
      [ChartState.Themes.NIGHT]: 'rgba(234, 234, 234, 0.2)',
    }
    return colorMap[this._theme] || colorMap[Theme.defaultTheme]
  }

  get legendColor() {
    const colorMap = {
      [ChartState.Themes.DAY]: 'grey',
      [ChartState.Themes.NIGHT]: 'grey',
    }
    return colorMap[this._theme] || colorMap[Theme.defaultTheme]
  }
}