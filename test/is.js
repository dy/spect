import t from 'tst'
import $ from '../index'

// `is` is valid html prop, therefore we don't expose an effect
// besides, we can't upgrade an element

// ? how do we hydrate?
// $('foo-bar, [is=foo-bar]') - too complex
// $.define('foo-bar', FooBar)
// customElements.define('foo-bar', customElement(FooBar))

// ? mb we have to separate creation method ?
// Because ideally we should be able to
// create(tagName, { is: fn|name })
t.skip('is: doesn\'t init on DOM elements', t => {

})

t.skip('is: direct function creates component', t => {
  let $el = $`<${el => console.log('init')}/>`
})

t.skip('is: simple element with no content should  (?) be upgraded', t => {
  let $el = $`<div is=${$el => {
    console.log($el)
  }}/>`
})

t.skip('is: existing elements with `is` attr should be hydrated', t => {
  let $el = $`<div is="foo-bar"></div>`
  $el.is(FooBar)

  // TODO: and simple tags
  // `<div is="foo"></div>`

})

t.skip('is: existing element with `is` attr not matching the fn name should throw error', t => {
  $`<div is="xyz-abc"/>`.is(FooBar)
})
