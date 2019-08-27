import t from 'tst'
import $ from '../'

t.only('class: set/read', t => {
  let $a = $`<a.a.b/>`

  $a.class`a b c d`

  t.is($a[0].classList.value, 'a b c d')
})
