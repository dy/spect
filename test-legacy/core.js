import t from 'tst'
import $ from '../src/index'
import { SPECT_CLASS } from '../src/spect';

// FYI: selector <<->> aspect;  selector <<->> target;  aspect <<unique->> target - target aspects are unique
t('core: direct element init, destroy', t => {
  let a = document.createElement('a')

  let log = []

  let fx = el => {
    log.push('create')
    return () => log.push('destroy')
  }

  $(a, fx)

  t.deepEqual(log, ['create'])
  t.ok(a.classList.contains(SPECT_CLASS), 'spect class')

  $.destroy(a, fx)

  t.deepEqual(log, ['create', 'destroy'])
  t.notOk(a.classList.contains(SPECT_CLASS), 'spect class')

  $(a, fx)
  $(a, fx)

  t.deepEqual(log, ['create', 'destroy', 'create'])
  t.ok(a.classList.contains(SPECT_CLASS), 'spect class')

  $.destroy(a)

  t.deepEqual(log, ['create', 'destroy', 'create', 'destroy'])
  t.notOk(a.classList.contains(SPECT_CLASS), 'spect class')
})

t('core: selector init, destroy', t => {
  let a = document.createElement('a')
  document.body.appendChild(a)

  let log = []

  let fx = el => {
    log.push('create')
    return () => log.push('destroy')
  }

  $('a', fx)

  t.deepEqual(log, ['create'])
  t.ok(a.classList.contains(SPECT_CLASS), 'spect class')

  $.destroy('a', fx)

  t.deepEqual(log, ['create', 'destroy'])
  t.notOk(a.classList.contains(SPECT_CLASS), 'spect class')

  $('a', fx)
  $('a', fx)

  t.deepEqual(log, ['create', 'destroy', 'create'])
  t.ok(a.classList.contains(SPECT_CLASS), 'spect class')

  $.destroy(a)

  t.deepEqual(log, ['create', 'destroy', 'create', 'destroy'])
  t.notOk(a.classList.contains(SPECT_CLASS), 'spect class')

  document.body.removeChild(a)
})

t('core: same aspect different targets', t => {
  let log = []
  function fx(el) {
    log.push(el.tagName)
    return () => log.push('destroy ' + el.tagName)
  }

  let el = $(document.createElement('a'), fx)

  t.equal(el.tagName, log[0])
  t.deepEqual(log, ['A'])

  el.innerHTML = '<span></span>'
  $(el.firstChild, fx)

  t.deepEqual(log, ['A', 'SPAN'])

  $.destroy(el)
  t.deepEqual(log, ['A', 'SPAN', 'destroy A'])

  $.destroy(el.firstChild)
  t.deepEqual(log, ['A', 'SPAN', 'destroy A', 'destroy SPAN'])
})

t('core: Same target different aspects', t => {
  let log = []

  let a = document.createElement('a')
  document.body.appendChild(a)

  let afx, bfx
  $('a', afx = () => (log.push('a'), () => log.push('de a')))
  t.deepEqual(log, ['a'])
  $('a', bfx = () => (log.push('b'), () => log.push('de b')))
  t.deepEqual(log, ['a', 'b'])
  $.destroy('a', bfx)
  t.deepEqual(log, ['a', 'b', 'de b'])
  $.destroy('a', afx)
  t.deepEqual(log, ['a', 'b', 'de b', 'de a'])
  $(a, bfx)
  t.deepEqual(log, ['a', 'b', 'de b', 'de a', 'b'])
  $(a, afx)
  t.deepEqual(log, ['a', 'b', 'de b', 'de a', 'b', 'a'])
  $.destroy(a)
  t.deepEqual(log, ['a', 'b', 'de b', 'de a', 'b', 'a', 'de b', 'de a'])

  document.body.removeChild(a)
})

t('core: same aspect same target', t => {
  let log = []
  let a = document.createElement('a')
  document.body.appendChild(a)

  let fx = () => (log.push('a'), () => log.push('z'))
  $(a, fx)
  t.deepEqual(log, ['a'])
  $(a, fx)
  t.deepEqual(log, ['a'])
  $('a', fx)
  t.deepEqual(log, ['a'])
  $.destroy(a, fx)
  t.deepEqual(log, ['a', 'z'])
  $.destroy(a, fx)
  t.deepEqual(log, ['a', 'z'])
  $.destroy('a', fx)
  t.deepEqual(log, ['a', 'z'])
  $('a', fx)
  t.deepEqual(log, ['a', 'z', 'a'])
  $('a', fx)
  t.deepEqual(log, ['a', 'z', 'a'])
  $.destroy('a', fx)
  t.deepEqual(log, ['a', 'z', 'a', 'z'])

  document.body.removeChild(a)
})

t('core: subaspects init/destroy themselves independent of parent aspects', t => {
  let log = []

  let a = document.body.appendChild(document.createElement('a'))
  let b = a.appendChild(document.createElement('b'))
  let c = b.appendChild(document.createElement('c'))

  $('a', el => {
    log.push('a')
    $('b', el => {
      log.push('b')
      $('c', el => {
        log.push('c')
        return () => log.push('-c')
      })
      return () => log.push('-b')
    })
    return () => log.push('-a')
  })

  t.deepEqual(log, ['a', 'b', 'c'])

  $.destroy(a)

  t.deepEqual(log, ['a', 'b', 'c', '-c', '-b', '-a'])

  document.body.removeChild(a)
})

t('core: external/hidden aspect fn throws error')

t('core: contextual effects', t => {
  let log = []

  let a = document.body.appendChild(document.createElement('a'))
  let b = document.body.appendChild(document.createElement('b'))
  let c = document.body.appendChild(document.createElement('c'))

  $('a', function () {
    log.push('a')
    t.equal(this, a)

    let bfx = () => {
      log.push('b')
    }
    $('b', bfx)
    t.deepEqual(log, ['a'])
    $.call(document.body, 'b', bfx)
    t.deepEqual(log, ['a', 'b'])
  })

  document.body.removeChild(a)
  document.body.removeChild(b)
  document.body.removeChild(c)
})

t('core: generators aspects')

t('core: async aspects')


// handlers
t.skip('core: function', t => {
  // this
  // args
  $('', () => {

  })
})

t.skip('core: props', t => {
  $('', {})
})

t.skip('core: children', t => {
  $('', a, b, c)
})

t.skip('core: props + children', t => {
  $('', { a, b, c }, a, fn, c)
})

// component tree https://github.com/scrapjs/permanent/issues/2)
t.skip('core: text', t => {
  $(target, 'abc')
})
t.skip('core: Element', t => {
  $(target, Element)
})
t.skip('core: vdom', t => {
  // DO via plugins
  $(target, react | vdom)
})
t.skip('core: class', t => {
  class Component {
    constructor() { }
    mount() { }
    update() { }
    unmount() { }
    render() { } // optional
    draw() { } // optional
    destroy() { }
  }
  $(target, Component)
})
t.skip('core: fake gl layers', t => {
  html`<canvas is=${GlCanvas}>
    <canvas-layer>${ gl => { }}<//>
    <canvas-layer>${ gl => { }}<//>
  </canvas>`
})
t.skip('core: `is` property', t => {
  // TODO: test `is` to be possibly any aspect, an array etc
  $('div', {
    is: () => {

    }
  }, ...children)
})
t.skip('core: promise (suspense)', t => {
  $('div', import('url'))
})

// hyperscript cases
t.skip('core: new element', t => {
  $('div', () => {

  })
})

t.skip('core: new custom element', t => {
  $('custom-element', () => {

  })
})


// nested variants
t.skip('core: el > el', t => {
  $('a', a,
    $('b')
  )
})

t.skip('core: el > el', t => {
  $('a', a,
    $('b')
  )
})

t.skip('core: el > selector > el', t => {
  $('a',
    $('#b',
      $('c')
    )
  )
})

t.skip('core: selector > selector', t => {
  $('#',
    $('#', () => { })
  )
})

t.skip('core: selector > els > selector', t => {
  $('.', {},
    $([a, b, c],
      $('.', () => { })
    )
  )
})


// targets
t.skip('core: existing element', async t => {
  // init on detached new
  let div = document.createElement('div')

  let log = []

  $(div, el => {
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
  await (() => { })
  t.deepEqual(log, ['render', 'fx', 'once'], 'fx is called in next tick')

  /*
  // TODO
  // init on detached known

  // root-level aspect should not be rerendered, it should be initialized once
  // but nested aspects should be updated in regards to root element
  $(div, el => {
    // new aspect augments element with additional behavior
  })

  // TODO: if root-level aspect is called with the same aspect function, it is ignored
  $(div, Aspect)
  $(div, Aspect)

  // TODO: How do we handle
  $(div, function aspect1 () {
    let [a, set] = state(false)

    if (!a) $(target, subaspectA)
    // at the moment of rendering, target had subaspectA caused by aspect1
    // should that replace subaspectA, or augment target with subaspectB?
    // that is classic problem of hooks - how to identify specific hook?
    // so spect is a hook, should be at the first level to be detectable
    // in this case, it will replace A with B, but as far as the order keeps
    else $(target, subaspectB)

    setTimeout(() => set(true), 1000)
  })

  // SO: the aspect is identifyable by its invocation position in parent aspect.
  // if there's no parent aspect, it is expected to be invoked once only


  // init on attached new
  // init on attached known
  */
})

t.skip('core: array of elements', t => {
  $([a, b, c], () => {

  })
})

t.skip('core: mixed array', t => {
  $(['.a', b, '.c'], () => {

  })
})

// edge cases
t.skip('core: null target')
t.skip('core: fake target')


