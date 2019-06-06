import t from 'https://unpkg.com/@dy/tape-modern@latest?module'
import $, {fx} from './index.js'


// selectors
t('id observer', t => {
  $('#el', () => {

  })
})

t('class observer', t => {
  $('.hm', () => {

  })
})

t('query observer', t => {
  $('a > span', () => {

  })
})

t('new element', t => {
  $('div', () => {

  })
})

t('new custom element', t => {
  $('custom-element', () => {

  })
})


// targets
t.only('existing element', async t => {
  // init on detached new
  let div = document.createElement('div')

  let log = []

  $(div, (el) => {
    t.equal(el, div, 'Element should be the target')

    log.push('render')

    // test fx
    // should be called on any update
    fx(() => {
      log.push('fx')
      return () => log.push('unfx')
    })

    // should be called on init only
    fx(() => {
      log.push('once')
      return () => {
        log.push('destroy')
      }
    }, [])

    // TODO: test mount also
  })
  t.deepEqual(log, ['render'], 'render is called instantly')
  await (()=>{})
  t.deepEqual(log, ['render', 'fx', 'once'], 'fx is called in next tick')

  // TODO
  // init on detached known
  // init on attached new
  // init on attached known
})

t('array of elements', t => {
  $([a, b, c], () => {

  })
})

t('mixed array', t => {
  $(['.a', b, '.c'], () => {

  })
})

// edge cases
t('null target')
t('fake target')


// handlers
t('function', t => {
  // this
  // args
  $('', () => {

  })
})

t('props', t => {
  $('', {})
})

t('children', t => {
  $('', a, b, c)
})

t('props + children', t => {
  $('', {a, b, c}, a, fn, c)
})

//component tree https://github.com/scrapjs/permanent/issues/2)
t('text', t => {
  $(target, 'abc')
})
t('Element', t => {
  $(target, Element)
})
t.skip('vdom', t => {
  // DO via plugins
  $(target, react|vdom)
})
t('class', t => {
  class Component {
    constructor () {}
    mount () {}
    update () {}
    unmount () {}
    render () {} // optional
    draw () {} // optional
    destroy () {}
  }
  $(target, Component)
})
t('fake gl layers', t => {
  html`<canvas is=${GlCanvas}>
    <canvas-layer>${ gl => {} }<//>
    <canvas-layer>${ gl => {} }<//>
  </canvas>`
})
t('`is` property', t => {
  // TODO: test `is` to be possibly any aspect, an array etc
  $('div', {is: () => {

  }}, ...children)
})

// props
// apply to target
// apply to selector
// CRUD
// updating causes change


// nested variants
t('el > el', t => {
  $('a', a,
    $('b')
  )
})

t('el > selector > el', t => {
  $('a',
    $('#b',
      $('c')
    )
  )
})

t('selector > selector', t => {
  $('#',
    $('#', () => {})
  )
})

t('selector > els > selector', t => {
  $('.', {},
    $([a, b, c],
      $('.', () => {})
    )
  )
})


// hooks
t('')
