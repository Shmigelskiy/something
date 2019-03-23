const MONTH_SHORT_NAME_MAP = [
  "Jan", 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]
const WEEK_SHORT_NAME_MAP = [
  "Sun", 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
]

class DateUtils {

  // Apr 21
  static getShortDateString(source) {
    const date = new Date(source)
    const shortMonth = MONTH_SHORT_NAME_MAP[date.getMonth()]
    const day = date.getDate()
    return `${shortMonth} ${day}`
  }

  // Sat, Apr 21
  static getWeekDateString(source) {
    const date = new Date(source)
    const shortWeek = WEEK_SHORT_NAME_MAP[date.getDay()]
    const shortMonth = MONTH_SHORT_NAME_MAP[date.getMonth()]
    const day = date.getDate()
    return `${shortWeek},&nbsp;${shortMonth}&nbsp;${day}`
  }
}