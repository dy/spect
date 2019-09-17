
class: createEffect('class',
  function (...args) {
    let str = String.raw(...args)
    this.forEach(el => el.className = str)
    return this
  },
  el => {
    let obj = {}
    for (let cl of el.classList) obj[cl.name] = cl.value
    return obj
  },
  (el, name) => el.classList.contains(name),
  (el, name, value) => {
    if (!value) el.classList.remove(name)
    else el.classList.add(name)
    return this
  }
)
