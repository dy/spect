import $, { html, update, prop } from '../src/index.js'


t('two wrapping aspects', t => {
  function a () {
    html`<div id="a"><...><div>`
  }

  function b () {
    html`<div id="b"><...></div>`
  }

  let el = html`content`
  $(el, el => {
    prop({ update })
    a()
    b()
  })

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
