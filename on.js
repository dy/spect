import channel from './channel.js'

const CANCEL = null

export default function on (scope, target, event, callback) {
  if (arguments.length < 4) {
    [target, event, callback] = arguments
    scope = document
  }

  // delegate
  if (typeof target === 'string') {
    const selector = target, orig = callback
    callback = e => {
      const delegateTarget = e.target.closest(selector)
      if (delegateTarget && scope.contains(delegateTarget)) {
        e.delegateTarget = delegateTarget
        orig(e)
      }
    }
    target = scope
  }

  callback = callback ? channel(callback) : channel()

  const evts = Array.isArray(event) ? [event] : event.split(/\s+/)
  evts.map(event => (target.on || target.addEventListener).call(target, event, callback))

  return (...args) => (
    args[0] === CANCEL ? evts.map(event => (target.off || target.removeEventListener).call(target, event, callback)) : null,
    callback(...args)
  )
}
