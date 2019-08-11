import t from 'tst'
import $ from '../index.js'

t.todo('use: aspects, assigned through parent wrapper', t => {
  // some wrappers over same elements can be created in different ways
  // but effects must be bound to final elements
  let a = document.createElement('a')
  let frag = document.createDocumentFragment()
  frag.appendChild(a)

  let $a1 = $(a)
  let $a2 = $([a])
  let $a3 = $(frag)
  let $a4 = $(frag.childNodes)
  let $a5 = $(frag.querySelector('*'))
})
