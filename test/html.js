import t from 'tst'
import $, { html } from '../index.js'

t('basic', t => {
  let el = document.createElement('div')
  $(el, el => {
    html`<a>b</a>`
    t.equal(el.innerHTML, '<a>b</a>')
  })
})

t.only('fragment', t => {
  $(document.createElement('div'), el => {
    html`<><a>a</a><b><>b</></b></>`
    console.log(el.innerHTML)
  })
})

t('two wrapping aspects', t => {
  function a () {
    html`<div id="a"><...><div>`
  }

  function b () {
    html`<div id="b"><...></div>`
  }

  let el = document.createElement('div')
  $(el, a)
  $(el, b)

  t.deepEqual(el.innerHTML, `<div id="b"><div id="a">content</div><div>`)

  // updating is persistent
})

t('duplicate id warning', t => {
  let el = document.createElement('div')
  el.innerHTML = '<div id="a"></div>'

  t.throws(() => {
    $(el, el => html`<div id="a"></div><...>`)
  })
})
