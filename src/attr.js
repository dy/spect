import {createEffect} from './util'

const cache = new WeakMap
export default createEffect(function attr (el) {
  if (!cache.has(el)) {
    let observer = new MutationObserver(records => {
      publish(tuple(el, 'attr'))
    })
    observer.observe(el, { attributes: true })
    cache.set(el, observer)
  }

  let obj = {}
  for (let attr of el.attributes) obj[attr.name] = attr.value
  return obj
})

