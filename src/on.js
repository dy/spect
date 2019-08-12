import t from 'tst'
import $ from '../index.js'

t('on: assign / destruct listeners, basic ', t => {
  let $els = $`<div />`

  $els.use($el => {
    $el.on('click', () => {

    })
  })
})
