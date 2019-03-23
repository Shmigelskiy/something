(function () {
  const CHECKBOX_CLASS_NAME = 'checkbox'
  const INPUT_TYPE = 'checkbox'

  /**
  * CheckBox - simple checkbox component
  */
  class CheckBox {

    /**
     * Create a CheckBox.
     * @param {string} id - identifier for checkbox data.
     * @param {boolean} value - initial value.
     * @param {string} label - text label.
     * @param {string} color - checkbox icon color.
     * @param {Function} onChange - callback what fires on checkbox change.
     *  Passed params are id and current value
     */
    constructor(id, value, label, color, onChange) {
      this._id = id
      this._label = label
      this._value = value
      this._color = color
      this._onChange = onChange

      this._initDom()
    }

    getElement() {
      return this._element
    }

    _generateCheckboxId() {
      return String(Math.random() + this._id + Math.random())
    }

    _initDom() {
      this._element = document.createElement('div')
      this._element.className = CHECKBOX_CLASS_NAME

      const checkboxId = this._generateCheckboxId()
      const checkbox = document.createElement('INPUT')
      checkbox.type = INPUT_TYPE
      checkbox.checked = this._value
      checkbox.id = checkboxId

      checkbox.addEventListener('change', (event) => {
        this._onChange(this._id, event.target.checked)
      })

      const label = document.createElement('LABEL')
      label.className = CHECKBOX_CLASS_NAME + '__label'
      label.htmlFor = checkboxId

      const icon = document.createElement('SPAN')
      icon.className = CHECKBOX_CLASS_NAME + '__icon'
      icon.style.borderColor = this._color

      const text = document.createElement('SPAN')
      text.innerText = this._label
      label.appendChild(icon)
      label.appendChild(text)

      this._element.appendChild(checkbox)
      this._element.appendChild(label)
    }
  }

  window.CheckBox = CheckBox
})()