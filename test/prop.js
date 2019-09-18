import t from 'tst'
import $ from '..'
import prop from '../src/prop'

$(prop)

t('prop: direct get/set', t => {
  $`<div.a/>`.use(el => {
    let $el = $(el)

    $el.prop('c', 1)
    t.is($el.prop`c`, 1)
  })
})

t('prop: object set', t => {
  $`<div.a/>`.use(el => {
    let $el = $(el)

    $el.prop({ c: 1, d: 2 })

    t.is($el.prop`c`, 1)
  })
})

t('prop: functional get/set', t => {
  let $a = $`<a/>`

  $a.prop(s => s.count = 0)

  t.is($a.prop(), $a[0])

  $a.prop(s => {
    s.count++
  })
  t.is($a.prop`count`, 1)
})

t.skip('prop: counter', t => {
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
