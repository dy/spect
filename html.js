import htm from 'xhtm/index.js'
import h, { render } from './h.js'

export default (...args) => {
  let result = htm.apply(h, args)

  let container = []
  container.childNodes = container
  container.appendChild = el => container.push(el)

  render(Array.isArray(result) ? result : [result], container)

  return container.length > 1 ? container : container[0]
}
