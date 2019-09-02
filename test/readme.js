import t from 'tst'
import $ from '..'

t.only('readme: A simple component', async t => {
  let el = document.body.appendChild(document.createElement('div'))
  el.id = 'hello-example'

  $('#hello-example').use(helloMessage)

  function helloMessage(el) {
    let $el = $(el)
    $el.html`<div.message>
      ${ $el.attr('name') ? `Hello, ${ $el.attr('name') }` : `Hello`}!
    </div>`
  }

  t.is(el.outerHTML, '<div id="hello-example"><div class="message">Hello!</div></div>')

  $(el).attr('name', 'Taylor')

  await Promise.resolve().then()
  await Promise.resolve().then()

  t.is(el.outerHTML, '<div id="hello-example" name="Taylor"><div class="message">Hello, Taylor!</div></div>')
})
