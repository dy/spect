import $, { state, html } from 'spect'

$('#counter', el => {
  let { value = 0 } = state()

  // standard delegate-it syntax for events
  on('#inc', 'click', e => state({value: value + 1}))
  on('#dec', 'click', e => state({value: value - 1}))

  // html side-effect
  html`
  <input value=${value} />
  <button id="inc">+</button>
  <button id="dec">-</button>
  `
})

let el = document.createElement('div')
el.id = 'counter'
document.body.appendChild(el)
