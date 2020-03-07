import state from '../core/state.js'

wrapHistory('push')
wrapHistory('replace')
enableNavigateEvent()

const CANCEL = null

export default function location(key) {
  let params = new URLSearchParams(window.location.search)
  let curr = state(params.get(key))

  const update = (e) => {
    let params = new URLSearchParams(window.location.search)
    curr(params.get(key))
  }

  window.addEventListener('popstate', update)
  window.addEventListener('pushstate', update)
  window.addEventListener('replacestate', update)
  window.addEventListener('navigate', update)

  return (...args) => {
    if (!args.length) return curr()
    if (typeof args[0] === 'function') return curr(...args)

    if (args[0] === CANCEL) {
      window.removeEventListener('popstate', update)
      window.removeEventListener('pushstate', update)
      window.removeEventListener('replacestate', update)
      window.removeEventListener('navigate', update)
    }

    let [value] = args
    curr(value)
    let params = new URLSearchParams(window.location.search)
    params.set(key, value)
    let str = params.toString()
    window.history.replaceState(null, '', str ? '?' + str : window.location.href.split('?')[0])
  }
}

// https://stackoverflow.com/a/25673946/1052640
// https://github.com/lukeed/navaid/blob/master/src/index.js#L80-L90
function wrapHistory(type) {
  type += 'State'
  const fn = history[type]
  history[type] = function (uri) {
    let result = fn.apply(this, arguments)
    let ev = new Event(type.toLowerCase())
    ev.uri = uri
    ev.arguments = arguments
    window.dispatchEvent(ev)
    return result
  }
  return () => {
    history[type] = fn
  }
}
// https://github.com/WebReflection/onpushstate
// https://github.com/lukeed/navaid/blob/master/src/index.js#L52-L60
function enableNavigateEvent() {
  const handleNavigate = (e) => {
    // find the link node (even if inside an opened Shadow DOM)
    var target = e.target.shadowRoot ? e.path[0] : e.target;
    // find the anchor
    var anchor = target.closest('A')

    // if found
    if (!anchor) return

    // it's not a click with ctrl/shift/alt keys pressed
    // => (let the browser do it's job instead)
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && !e.button && !e.defaultPrevented) return

    // it's for the current page
    if (!/^(?:_self)?$/i.test(anchor.target)) return

    // same origin
    if (anchor.host !== location.host) return

    // it's not a download
    if (anchor.hasAttribute('download')) return

    // it's not a resource handled externally
    if (anchor.getAttribute('rel') === 'external') return

    // let empty links be (see issue #5)
    if (!anchor.href) return

    var e = new Event('navigate');
    window.dispatchEvent(e);
  }
  document.addEventListener('click', handleNavigate, true)
  return () => document.removeEventListener('click', handleNavigate)
}
