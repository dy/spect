import t from 'tst'
import $ from '../index'

// is has very limited set of possible operations
// it can't be initialized on existing elements or custom elements with not-matching definition
t.only('is: doesn\'t init on DOM elements', t => {

})

t.todo('is: direct function creates component', t => {
  let $el = $`<${el => console.log('init')}/>`
})

t.skip('is: simple element with no content should  (?) be upgraded', t => {
  let $el = $`<div is=${$el => {
    console.log($el)
  }}/>`
})

t.todo('is: existing elements with `is` attr should be hydrated', t => {
  let $el = $`<div is="foo-bar"></div>`
  $el.is(FooBar)

  // TODO: and simple tags
  // `<div is="foo"></div>`

})

t.todo('is: existing element with `is` attr not matching the fn name should throw error', t => {
  $`<div is="xyz-abc"/>`.is(FooBar)
})
