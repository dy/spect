import c from './channel.js'

export default function e (scope, target, event, callback) {
  if (arguments.length < 4) {
    [target, event, callback] = arguments
    scope = null
  }

  // delegate
  if (typeof target === 'string') {
    if (!scope) scope = document
    const selector = target, orig = callback
    callback = e => {
      const delegateTarget = e.target.closest(selector)
      if (delegateTarget && scope.contains(delegateTarget)) {
        e.delegateTarget = delegateTarget
        orig(e)
      }
    }
    target = [scope]
  }
  // list
  else if (target[Symbol.iterator] && !target.nodeType) {
    target = [...target]
  }
  else {
    target = [target]
  }

  const channel = c()

  const evts = Array.isArray(event) ? [event] : event.split(/\s+/)
  evts.map(event => target.map(target => (target.on || target.addEventListener).call(target, event, channel)))

  channel.subscribe(callback, null, () => (
    evts.map(event => target.map(target => (target.off || target.removeEventListener).call(target, event, callback)))
  ))

  return channel
}
