import t from 'tst'
import $ from '..'

t('css: basic styling', t => {
  let $a = $`<a><span>123</span></a>`

  $a.css`
    :host {background: rgb(255, 0, 0)}
    span {color: white}
  `

  document.body.appendChild($a[0])
  t.is(getComputedStyle($a[0]).backgroundColor, 'rgb(255, 0, 0)')
  document.body.removeChild($a[0])
})
