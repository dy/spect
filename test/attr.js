import t from 'tst'
import $ from '../index.js'


t('attr: component subscribes to attributes', t => {
  $`<div is=${C}/>`
  // $`<${C}/>`

  function C ($el) {
    console.log($el.attr)
    console.log($el.state)
  }
})
