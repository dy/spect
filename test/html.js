import t from 'tst'
import $, { html } from '../index.js'

t('html: basic', t => {
  let el = document.createElement('div')
  $(el, el => {
    html`<a>b</a>`
    t.equal(el.innerHTML, '<a>b</a>')
  })
})

t('html: multiple root nodes', t => {
  let el = document.createElement('div')
  $(el, el => {
    html`<a>a</><a>b</><foo><bar></bar></foo>`
    t.equal(el.innerHTML, '<a>a</a><a>b</a><foo><bar></bar></foo>')
  })
})

t('html: fragment', t => {
  $(document.createElement('div'), el => {
    html`<><a>a</a><b><>b<c/></></b></>`
    t.equal(el.innerHTML, '<a>a</a><b>b<c></c></b>')
  })
})

t('html: spread', t => {
  let el = document.createElement('div')
  el.innerHTML = '<a>b</a>'

  $(el, el => {
    html`<b><...></b>`
    t.equal(el.innerHTML, '<b><a>b</a></b>')
  })
})

t('html: two wrapping aspects', async t => {
  function b () {
    html`<div#b><...></div>`
  }

  let el = document.createElement('div')
  el.innerHTML = 'content'
  $(el, a)
  $(el, b)

  function a () {
    html`<div#a><...></div>`
  }

  await (() => {})
  t.equal(el.innerHTML, `<div id="b"><div id="a">content</div></div>`)
})

t.skip('duplicate id warning', t => {
  let el = document.createElement('div')
  el.innerHTML = '<div id="a"></div>'

  t.throws(() => {
    $(el, el => html`<div id="a"></div><...>`)
  })
})
