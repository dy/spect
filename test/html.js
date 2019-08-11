import t from 'tst'
import $ from '../index.js'

t.todo('html: simple component', t => {
  $(document.createElement('div')).html`<${C}/>`

  function C ($el) {
    console.log(1, $el)

    setTimeout(() => {
      console.log(2)
    }, 100);
  }
})


t.todo('html: must ignore multiple wrapping calls', t => {
  // wrapping aspect works fine with another aspect, enforcing some html
  // so that aspect acts as a wrapper
  // but if we have only wrapping aspect and no enforcing-html aspects
  // that can cause recursive thrashing
  //
})
