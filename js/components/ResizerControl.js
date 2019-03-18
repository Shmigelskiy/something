// (function () {
  const RESIZER_WIDTH = 2

  class ResizerControl {
    constructor(state) {
      this._state = state

      this._init()
    }

    _setElementsPosition() {
      const { startPercent, endPercent} = this._state

      const leftBorderOffset = startPercent
      const rightBorderOffset = 100 - endPercent

      this._leftDimmer.style.width = `${leftBorderOffset}%`
      this._rightDimmer.style.width = `${rightBorderOffset}%`

      this._leftResizer.style.left = `${leftBorderOffset}%`
      this._rightResizer.style.right = `${rightBorderOffset}%`

      this._centerArea.style.left = `${leftBorderOffset}%`
      this._centerArea.style.right = `${rightBorderOffset}%`
    }

    _init() {
      this._initDom()
      this._setElementsPosition()
    }

    _initDom() {
      this.element = document.createElement('DIV')
      this.element.className = 'line-chart-resizer__control'

      this._leftDimmer = document.createElement('DIV')
      this._leftDimmer.className = 'line-chart-resizer__left-dimmer'
      this._rightDimmer = document.createElement('DIV')
      this._rightDimmer.className = 'line-chart-resizer__right-dimmer'

      this._leftResizer = document.createElement('DIV')
      this._leftResizer.className = 'line-chart-resizer__left-resizer'
      this._rightResizer = document.createElement('DIV')
      this._rightResizer.className = 'line-chart-resizer__right-resizer'

      this._centerArea = document.createElement('DIV')
      this._centerArea.className = 'line-chart-resizer__center-area'

      this.element.appendChild(this._leftDimmer)
      this.element.appendChild(this._rightDimmer)
      this.element.appendChild(this._leftResizer)
      this.element.appendChild(this._rightResizer)
      this.element.appendChild(this._centerArea)

      this._leftResizer.addEventListener('mousedown', this._leftResizerDragStarted)
      this._leftResizer.addEventListener('touchstart', this._leftResizerDragStarted)

      this._rightResizer.addEventListener('mousedown', this._rightResizerDragStarted)
      this._rightResizer.addEventListener('touchstart', this._rightResizerDragStarted)

      this._centerArea.addEventListener('mousedown', this._centerAreaDragStarted)
      this._centerArea.addEventListener('touchstart', this._centerAreaDragStarted)

      document.addEventListener('mousemove', this._documentDragged)
      document.addEventListener('touchmove', this._documentDragged)

      document.addEventListener('mouseup', this._documentDragEnd)
      document.addEventListener('touchend', this._documentDragEnd)
    }

    _leftResizerDragStarted = event => {
      this._startDragging(event)
      this._isLeftResizerDragging = true
    }

    _rightResizerDragStarted = event => {
      this._startDragging(event)
      this._isRightResizerDragging = true
    }

    _centerAreaDragStarted = event => {
      this._startDragging(event)
      this._isCenterAreaDragging = true
    }

    _startDragging(event) {
      event.stopPropagation()
      event.preventDefault()

      const { pageX } = event.touches ? event.touches[0] : event
      this._initialPageX = pageX
      this._initialStartPercent = this._state.startPercent
      this._initialEndPercent = this._state.endPercent
    }

    _documentDragged = event => {
      event.stopPropagation()

      if (
        !this._isCenterAreaDragging && 
        !this._isLeftResizerDragging &&
        !this._isRightResizerDragging
      ) {
          return
      }

      const resizerWidth = this.element.clientWidth
      const { pageX } = event.touches ? event.touches[0] : event
      const movementDeltaPx = pageX - this._initialPageX
      const movementDeltaPercent = movementDeltaPx / resizerWidth * 100


      if (this._isCenterAreaDragging) {
        const newStartPercent = this._initialStartPercent + movementDeltaPercent
        const newEndPercent = this._initialEndPercent + movementDeltaPercent

        const initialDelta = this._initialEndPercent - this._initialStartPercent
        this._state.moveViewingArea(
          this._validatePercent(newStartPercent, 0, 100 - initialDelta),
          this._validatePercent(newEndPercent, initialDelta, 100)
        )
      }

      if (this._isLeftResizerDragging) {
        const newStartPercent = this._initialStartPercent + movementDeltaPercent
        this._state.updateLeftBorder(
          this._validatePercent(newStartPercent, 0, this._initialEndPercent - RESIZER_WIDTH * 2)
        )
      }

      if (this._isRightResizerDragging) {
        const newEndPercent = this._initialEndPercent + movementDeltaPercent
        this._state.updateRightBorder(
          this._validatePercent(newEndPercent, this._initialStartPercent + RESIZER_WIDTH * 2, 100)
        )
      }

      this._setElementsPosition()
    }

    _documentDragEnd = event => {
      event.stopPropagation()

      this._isCenterAreaDragging = false
      this._isLeftResizerDragging = false
      this._isRightResizerDragging = false
    }

    _validatePercent(value, minValue = 0, maxValue = 100) {
      if (value < minValue) {
        return minValue
      }
      if (value > maxValue) {
        return maxValue
      }
      return value
    }
  }

  window.ResizerControl = ResizerControl
// })()