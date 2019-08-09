import t from 'tst'
import $ from '../index.js'

t.only('html: simple component', t => {
  $(document.createElement('div')).html`<${C}/>`

  function C ($el) {
    console.log(1, $el)

    setTimeout(() => {
      console.log(2)
    }, 100);
  }
})
