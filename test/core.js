import t from 'tst'
import $, { mount } from '../src/index'
import { SPECT_CLASS, currentTarget } from '../src/spect';

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
  function fx (el) {
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
  $('a', afx = () => (log.push('a'), () => log.push('de a')) )
  t.deepEqual(log, ['a'])
  $('a', bfx = () => (log.push('b'), () => log.push('de b')) )
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
