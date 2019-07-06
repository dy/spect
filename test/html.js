import t from 'tst'
import $, { html } from '../index.js'

t('basic', t => {
  let el = document.createElement('div')
  $(el, el => {
    html`<a>b</a>`
    t.equal(el.innerHTML, '<a>b</a>')
  })
})

t('multiple root nodes', t => {
  let el = document.createElement('div')
  $(el, el => {
    html`<a>a</><a>b</><foo><bar></bar></foo>`
    t.equal(el.innerHTML, '<a>a</a><a>b</a><foo><bar></bar></foo>')
  })
})

t('fragment', t => {
  $(document.createElement('div'), el => {
    html`<><a>a</a><b><>b<c/></></b></>`
    t.equal(el.innerHTML, '<a>a</a><b>b<c></c></b>')
  })
})

t('spread', t => {
  let el = document.createElement('div')
  el.innerHTML = '<a>b</a>'

  $(el, el => {
    html`<b><...></b>`
    t.equal(el.innerHTML, '<b><a>b</a></b>')
  })
})

t.only('two wrapping aspects', async t => {
  function b () {
    html`<div#b><...></div>`
  }

  let el = document.createElement('div')
  el.innerHTML = 'content'
  $(el, a)
  $(el, b)

  function a () {
    html`<div#a><...></div>`
    setTimeout(() => {
      t.equal(el.innerHTML, `<div id="b"><div id="a">content</div><div>`)
    }, 100)
  }

  // updating is persistent
})

t('duplicate id warning', t => {
  let el = document.createElement('div')
  el.innerHTML = '<div id="a"></div>'

  t.throws(() => {
    $(el, el => html`<div id="a"></div><...>`)
  })
})
