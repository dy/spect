
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
