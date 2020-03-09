import channel from './channel.js'

export default function on (scope, target, event, callback) {
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
    target = scope
  }

  const { cancel, next } = callback = callback ? channel(callback) : channel()

  const evts = Array.isArray(event) ? [event] : event.split(/\s+/)
  evts.map(event => (target.on || target.addEventListener).call(target, event, next))

  callback.cancel = () => (cancel(), evts.map(event => (target.off || target.removeEventListener).call(target, event, callback)))
  callback.next = () => {}

  return callback
}
