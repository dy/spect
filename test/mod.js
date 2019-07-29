
t.only('core: subaspect init/destroy depending on parent aspect', async t => {
  let log = []

  let a = document.createElement('a')
  a.innerHTML = '<b class="b"><b>'

  $('.a', el => {
    log.push('init a')

    $('.b', el => {
      log.push('init b')

      return () => log.push('destroy b')
    })

    return () => log.push('destroy a')
  })

  t.deepEqual(log, [])

  document.body.appendChild(a)
  await (_ => _)

  t.deepEqual(log, [])

  a.classList.add('a')
  await (_ => _)

  t.deepEqual(log, ['init a', 'init b'])

  a.classList.remove('a')
  console.log('remove a')
  await (_ => _)

  t.deepEqual(log, ['init a', 'init b', 'destroy b', 'destroy a'])

  // console.log('add class')
  // a.classList.add('a')
  // await (_ => _)

  // t.deepEqual(log, ['init a', 'init b', 'destroy b', 'destroy a', 'init a', 'init b'])

  // a.classList.remove('a')
  // await (_ => _)

  // t.deepEqual(log, ['init a', 'init b', 'destroy b', 'destroy a', 'init a', 'init b', 'destroy a', 'destroy b])
})


t.skip('mod: core: Aspects remove themselves if no more match selector', async t => {
  let log = []

  let a = document.createElement('a')
  document.body.appendChild(a)

  $('.a', el => {
    log.push('init')
    return () => log.push('destroy')
  })

  await (_ => _)
  t.deepEqual(log, [])

  a.classList.add('a')
  await (_ => _)
  t.deepEqual(log, ['init'])

  a.classList.remove('a')
  await (_ => _)
  t.deepEqual(log, ['init', 'destroy'])

  document.body.removeChild(a)
})

t.skip('core: nested observers should not interfere with parent observers', async t => {
  let fn = (el) => {
    log.push('b')
  }

  $('.a', el => {
    log.push('a')
    $('.b', fn)
  })

  $('.b', fn)

  // when we turn out .a aspect, the .b aspect should keep on target, and not duplicate

  document.body.appendChild(a)
  await (_ => _)
  t.deepEqual(log, ['a', 'b'])

  a.classList.remove('a')
  await (_ => _)
  t.deepEqual(log, ['a', 'b'])
})


t.skip('Returned effect acts like destructor', t => {
  let target = document.createElement('div')

  $('#target', () => {
    log.push('create')
    return () => {
      log.push('destroy')
    }
  })
})

t.skip('Direct aspect and selector aspect should not intersect', async t => {
  let target = document.createElement('div')

  let aspect = function () {
    log.push('on')
    return () => log.push('off')
  }

  $(target, aspect)

  t.deepEqual(log, ['on'], 'direct element aspect')

  $('[x]', aspect)
  document.body.appendChild(target)
  target.setAttribute('x', true)

  await (_ => _)

  t.deepEqual(log, ['on'], 'same aspect doesn\'t cause redundant rendering')

  document.body.removeChild(target)

  await (_ => _)

  t.deepEqual(log, ['on'], 'off should not be called for direct element aspect')
})

import { t, delay } from './index.js'
import $, { mount } from '../dom.js'
import { h } from '../src/util.js'


// Selector cases
t.skip('mod: selectors basics', async t => {
  let log = []
  $('#app', el => {
    log.push('render')

    mount(() => {
      log.push('on')
      return () => log.push('off')
    })
  })

  let app = h`div#app`
  t.deepEqual(log, [])

  // should detect mount
  document.body.appendChild(app)
  await delay()
  t.deepEqual(log, ['render', 'on'], 'mount')

  document.body.removeChild(app)
  await delay()
  t.deepEqual(log, ['render', 'on', 'off'], 'unmount')
})

t.skip('mod: already mounted selector', async t => {
  let log = []


  let a = document.createElement('div')
  a.id = 'app'
  document.body.appendChild(a)

  $('#app', el => {
    mount(() => (log.push('mount'), () => log.push('unmount')))
    log.push('render')
  })

  // should be instant
  // await delay()

  t.deepEqual(log, ['render', 'mount'])

  document.body.appendChild(a)
  await delay()
  t.deepEqual(log, ['render', 'mount'])

  document.body.removeChild(a)
  t.deepEqual(log, ['render', 'mount'])
  await delay()
  t.deepEqual(log, ['render', 'mount', 'unmount'])
})

t.skip('mod: replaced nodes, instantly mounted/unmounted', async t => {
  let log = []
  $('.app', el => {
    log.push('render')
    mount(() => {
      log.push('mount')
      return () => log.push('unmount')
    })
  })

  let el = document.createElement('div')
  el.classList.add('app')
  document.body.appendChild(el)
  document.body.removeChild(el)

  await delay()
  t.deepEqual(log, ['render'])

  document.body.appendChild(el)
  await delay()
  t.deepEqual(log, ['render', 'mount'])

  let x = document.body.appendChild(document.createElement('div'))
  x.appendChild(el)
  await delay()
  t.deepEqual(log, ['render', 'mount'])
  // FIXME: this is also possible, but replace fast-on-load then
  // t.deepEqual(log, ['render', 'mount', 'unmount', 'mount'])
})

t.skip('mod: new aspect by appending attribute matching selector', async t => {
  let log = []
  $('.a', el => {
    log.push('render')
    mount(() => {
      log.push('mount')
      return () => log.push('unmount')
    })
  })

  let a = document.createElement('a')
  document.body.appendChild(a)
  await delay()
  t.deepEqual(log, [])

  a.classList.add('a')
  await delay()
  t.deepEqual(log, ['render', 'mount'])
})


// TODO: container case

