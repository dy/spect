import t from 'tst'
import $ from '../index.js'


t.only('attr: component subscribes to attributes', t => {
  // $`<div is=${C}/>`
  $`<${C}/>`

  function C ($el) {
    console.log($el[0])
    $el.attr.foo

    console.log($el.attr.foo)
  }
})
