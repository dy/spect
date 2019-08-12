import t from 'tst'
import $ from '../index.js'


t('attr: native element attributes', async t => {
  // let $els = $`<a.a href='a'/>`
  // let $els = $`<${b} class=b href='a'/>`
  let $els = $`<a.a href='a'/><${b} class=b href='a'/><a.c is=${c} href='a'/>`

  $els.use($a => {
    $a.fx(() => {
      if ($a[0].classList.contains('a')) $a.attr.count = 0
      else if ($a[0].classList.contains('b')) $a.attr.count = 1
      else $a.attr.count = 2
    }, [])

    $a.fx(() => {
      setTimeout(() => {
        if ($a[0].classList.contains('a')) $a.attr.count++
        else if ($a[0].classList.contains('b')) $a.attr.count++
        else $a.attr.count++
      });
    }, [])

    // console.log($a[0].getAttribute('count'))
    // if (!$a[0].classList.contains('c')) return
    // $a.fx(() => {
    //   let id = setTimeout(() => {
    //     $a.attr.count++
    //   }, 1000)

    //   return () => clearTimeout(id)
    // }, Number($a.attr.count || 0))
  })

  function b () {}
  function c () {}

  t.is($($els[0]).attr.count, '0')
  t.is($($els[1]).attr.count, '1')
  t.is($($els[2]).attr.count, '2')

  await new Promise(ok => setTimeout(() => {
    t.is($($els[0]).attr.count, '1')
    t.is($($els[1]).attr.count, '2')
    t.is($($els[2]).attr.count, '3')
    ok()
  }, 10));
})

t.todo('attr: multiple attr listeners shouldnt cause multiple updates')

t.todo('attr: setting attribute directly on class')
t.todo('attr: setting attribute directly on element')
