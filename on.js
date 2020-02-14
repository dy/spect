import channel from './channel.js'

export default function on (scope, target, event, callback) {
  if (arguments.length === 3) {
    [target, event, callback] = arguments
    scope = document
  }

  if (typeof target === 'string') return delegate(scope, target, event, callback)

  const bus = channel(callback)

  const evts = event.split(/\s+/)
  evts.map(event => target.addEventListener(event, bus.emit))

  const cancel = bus.cancel
  bus.cancel = reason => {
    cancel(reason)
    evts.map(event => target.removeEventListener(event, bus.emit))
  }

  return bus
}

export function delegate (scope, selector, event, callback) {
  if (arguments.length === 3) {
    [target, event, callback] = arguments
    scope = document
  }

  const bus = channel(callback)

  const delegate = e => {
    const delegateTarget = e.target.closest(selector)
		if (delegateTarget && scope.contains(delegateTarget)) {
			e.delegateTarget = delegateTarget
      bus.emit(e)
		}
  }

  const evts = event.split(/\s+/)
  evts.map(event => scope.addEventListener(event, delegate))

  const cancel = bus.cancel
  bus.cancel = e => {
    cancel(e)
    evts.map(event => scope.removeEventListener(event, delegate))
  }
  return bus
}
