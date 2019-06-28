

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
t('vdom', t => {
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
t('promise (suspense)', t => {
  $('div', import('url'))
})

// hyperscript cases
t('new element', t => {
  $('div', () => {

  })
})

t('new custom element', t => {
  $('custom-element', () => {

  })
})


// nested variants
t('el > el', t => {
  $('a', a,
    $('b')
  )
})
