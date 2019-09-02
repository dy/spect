import t from 'tst'
import $ from '..'

t('readme: A simple component', async t => {
  let el = document.body.appendChild(document.createElement('div'))
  el.id = 'hello-example'

  function helloMessage(el) {
    let $el = $(el)
    $el.html`<div.message>
    Hello, ${ $el.prop('name') }!
  </div>`
  }

  $('#hello-example').use(helloMessage).prop('name', 'Taylor')

  await Promise.resolve().then()

  t.is(el.outerHTML, '<div id="hello-example"><div class="message">Hello, Taylor!</div></div>')
})
