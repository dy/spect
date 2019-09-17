

text: createEffect('text', function (...args) {
  let str = String.raw(...args)
  this.forEach(el => el.textContent = str)
}, el => el.textContent, (el, value) => el.textContent = value)
