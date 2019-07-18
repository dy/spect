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

t.only('core: selector init, destroy', t => {
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
})



t('Same aspect different targets', async t => {})
t('Same target different aspects', async t => {})
t('Same aspect same target', async t => {})

t('core: Aspect initializes on DOM target')

t('core: Aspects remove themselves if no more match selector', async t => {
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

t.skip('core: subaspects init/destroy themselves independent of parent aspects', t => {
  // TODO: within some aspect - children should be able to mount/unmount themselves (elaborate)
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
  await(_ => _)
  t.deepEqual(log, ['a', 'b'])

  a.classList.remove('a')
  await(_ => _)
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

  await (_=>_)

  t.deepEqual(log, ['on'], 'same aspect doesn\'t cause redundant rendering')

  document.body.removeChild(target)

  await(_ => _)

  t.deepEqual(log, ['on'], 'off should not be called for direct element aspect')
})
