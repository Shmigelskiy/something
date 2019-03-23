(function () {
  class Animation {

    static animate(from, to, duration, updateCallBack) {
      const startTime = Date.now()
      const state = { isCanceled: false }
      Animation._requestAnimationFrame(startTime, from, to, duration, updateCallBack, state)
      return () => {
        state.isCanceled = true
      }
    }


    static _requestAnimationFrame(...args) {
      const [startTime, from, to, duration, updateCallBack, state] = args
      if (state.isCanceled) {
        return
      }
      window.requestAnimationFrame(() => {
        const elapsed = Date.now() - startTime

        let current
        if (Array.isArray(from) && Array.isArray(to)) {
          current = Animation._getArrayCurrent(from, to, elapsed, duration)
        } else {
          current = Animation._getCurrent(from, to, elapsed, duration)
        }

        updateCallBack(current)

        if (elapsed <= duration) {
          Animation._requestAnimationFrame(...args)
        } else {
          updateCallBack(to, true)
        }

      })
    }



    static _getArrayCurrent(from, to, elapsed, duration) {
      const current = []
      for (let i = 0; i < from.length; i++) {
        current[i] = Animation._getCurrent(from[i], to[i], elapsed, duration)
      }
      return current
    }

    static _getCurrent(from, to, elapsed, duration) {
      const delta = to - from
      const clamper = delta < 0 ? 'max' : 'min'
      return Math[clamper](
        from + (elapsed / duration) * delta,
        to,
      )
    }
  }

  window.Animation = Animation
})()