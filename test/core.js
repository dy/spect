import t from 'tst'
import $, { mount } from '../src/index'
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

t('Same aspect different targets', t => {
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
t.only('Same target different aspects', t => {

})
t('Same aspect same target', async t => {})


t.skip('core: subaspects init/destroy themselves independent of parent aspects', t => {
  // TODO: within some aspect - children should be able to mount/unmount themselves (elaborate)
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

  await (_=>_)

  t.deepEqual(log, ['on'], 'same aspect doesn\'t cause redundant rendering')

  document.body.removeChild(target)

  await(_ => _)

  t.deepEqual(log, ['on'], 'off should not be called for direct element aspect')
})
