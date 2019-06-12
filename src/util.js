export function isObject(x) {
  return  typeof obj === 'object'
    && obj !== null
    && obj.constructor === Object
    && Object.prototype.toString.call(obj) === '[object Object]';
}

export function h (str, props) {
  if (str.raw) str = String.raw.call(String, str, props)

  let [tagName, id] = str.split('#')

  let classes
  if (id) {
    classes = id.split('.')
    id = classes.shift()
  }
  else {
    classes = tagName.split('.')
    tagName = classes.shift()
  }


  let el = document.createElement(tagName)

  if (id) el.setAttribute('id', id)
  if (classes.length) el.classList.add(...classes)

  if (props) for (let name in props) el.setAttribute(name, props[name])

  return el
}
