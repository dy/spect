// init/render/update effect
// triggered when aspect is attached to element or on any update
// destroyed when element stops matching aspect or parent element loses its aspect
import { currentTarget, callFx, beforeFx } from './spect.js'
import { MultikeyMap, noop } from './util'

const tracking = new MultikeyMap()

export default function render (target, selector, listener=noop) {
  if (selector && !tracking.has(target, listener)) {
    // register single-instance observer to match element
    const observer = new MutationObserver((mutations) => {
      // TODO: check if no multations

      // dispose element if it doesn't match selector anymore
      if (!target.matches(selector)) {
        let {destroy} = tracking.get(target, listener)
        destroy()
        tracking.delete(target, listener)
        observer.disconnect()
      }
    })

    observer.observe(target, {
      attributes: true,
      // FIXME: add correct attribute filter matching the selector
      // attributeFilter: ['id', 'class']
    })

    tracking.set(target, listener, {
      observer
    })
  }

  // rerender
  let state = tracking.get(target, listener)
  state.destroy = callFx('render', listener, target) || noop
}
