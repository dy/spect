import $, { state, html } from 'spect'

$('#counter', el => {
  let { value = 0 } = state()

  // html side-effect
  html`<${el}>
    <input value=${value} />
    <button onclick=${e => state({value: value+1})}>+</button>
    <button onclick=${e => state({value: value-1})}>-</button>
  </>`
})

$(document.body, el => html`<div id="counter/>`)
