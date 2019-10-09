import t from 'tst'
import { prop } from '..'


t('prop: walk generator', async t => {
  let o = {}
  let p = prop(o, 'x')
  ;(async () => {
  for await (const item of p()) {
    console.log('changed:', item)
  }
  })()
  o.x = 1
  o.x = 2
  console.log('after')
  await Promise.resolve().then()
  o.x = 3
  o.x = 4
  o.x = 5
})

t('prop: should update on the latest value')
t('prop: should ignore unchanged value')
t('prop: reading should shortcut new value and clear microtask')
t('prop: reconfigure descriptors')
t('prop: ignore reconfiguring sealed objects')
t('prop: keep initial property value')
t('prop: does not initialize two times')
t('prop: awaitable - waits the next update')

t.todo('legacy prop: direct get/set', t => {
  $`<div.a/>`.use(el => {
    let $el = $(el)

    $el.prop('c', 1)
    t.is($el.prop`c`, 1)
  })
})

t.todo('legacy prop: object set', t => {
  $`<div.a/>`.use(el => {
    let $el = $(el)

    $el.prop({ c: 1, d: 2 })

    t.is($el.prop`c`, 1)
  })
})

t.todo('legacy prop: functional get/set', t => {
  let $a = $`<a/>`

  $a.prop(s => s.count = 0)

  t.is($a.prop(), $a[0])

  $a.prop(s => {
    s.count++
  })
  t.is($a.prop`count`, 1)
})

t.todo('legacy prop: counter', t => {
  let stop = 0
  let $els = $`<div.a/>`.use(a => {
    let $a = $(a)
    $a.init(() => {
      $a.prop({ count: 0 })
    })

    console.log($a.prop`count`)
    $a.fx(s => {
      if (stop < 6) {
        setTimeout(() => {
          $a.prop(s => s.count++)
          stop++
        }, 1000)
      }
    }, [$a.prop`count`])
  })
})

t.todo('legacy prop: direct get/set', t => {
  spect().use(el => {
    el.prop('c', 1)
    t.is(el.c, 1)
  })
})

t.todo('legacy prop: object set', t => {
  spect().use(el => {
    el.prop({ c: 1, d: 2 })

    t.is(el.prop`c`, 1)
  })
})

t.todo('legacy prop: functional get/set', t => {
  let $a = spect()

  $a.prop(s => s.count = 0)

  t.is($a.prop(), $a)

  $a.prop(s => {
    s.count++
  })
  t.is($a.count, 1)
})

t.todo('legacy prop: counter', t => {
  let stop = 0
  spect().use($a => {
    $a.prop({ count: 0 }, [])

    console.log($a.prop('count'))
    $a.fx(s => {
      if (stop < 6) {
        setTimeout(() => {
          $a.prop(s => s.count++)
          stop++
        }, 1000)
      }
    }, [$a.prop`count`])
  })
})
