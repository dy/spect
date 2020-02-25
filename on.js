import bus from './src/bus.js'

export default function on (scope, target, event, callback = ()=>{}) {
  if (arguments.length < 4) {
    [target, event, callback = ()=>{}] = arguments
    scope = document
  }

  if (typeof target === 'string') return delegate(scope, target, event, callback)

  const channel = bus(null, callback, () => evts.map(event => target.removeEventListener(event, channel)))

  const evts = Array.isArray(event) ? event : event.split(/\s+/)
  evts.map(event => target.addEventListener(event, channel))

  return channel
}


export function delegate (scope, selector, event, callback = ()=>{}) {
  if (arguments.length < 4) {
    [target, event, callback = ()=>{}] = arguments
    scope = document
  }


  const delegate = e => {
    const delegateTarget = e.target.closest(selector)
		if (delegateTarget && scope.contains(delegateTarget)) {
			e.delegateTarget = delegateTarget
      delegateChannel(e)
		}
  }

  const evts = Array.isArray(event) ? event : event.split(/\s+/)
  evts.map(event => scope.addEventListener(event, delegate))

  const delegateChannel = bus(null, callback, () => evts.map(event => scope.removeEventListener(event, delegate)))

  return delegateChannel
}
