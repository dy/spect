import t from 'tst'
import $ from '../index.js'


t('attr: component subscribes to attributes', t => {
  $`<a is=${C} href=/ foo bar="baz"/>`
  // $`<${C}/>`

  function C ($el) {
    $el.state.x = 11
    // console.log($el.state)
    // console.dir($el[0].attributes[1])
  }
})


t('attr: native attribute changes trigger rerendering', t => {

})
