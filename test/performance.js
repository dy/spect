import t from 'tst'
import h, { h as sh } from '../h.js'
import { tick, frame, idle, time } from 'wait-please'
import hs from './libs/hyperscript.js'
import {html as lhtml, render as lrender} from 'lit-html'
import {default as HTM} from './libs/htm.js'
// import htm from 'xhtm'

let htm = HTM.bind(hs)

t('h: <30 creation performance should be faster than hyperscript/lit-html', async t => {
  let N = 30
  const container = document.createElement('div')

  container.innerHTML = ''
  // const hStart = performance.now()
  // for (let i = 0; i < N; i++) {
  //   container.appendChild(h`<a>a<b><c>${i}</c></b></a>`)
  // }
  // const hTime = performance.now() - hStart

  container.innerHTML = ''
  const hsStart = performance.now()
  for (let i = 0; i < N; i++) {
    container.appendChild(hs('a', null, 'a',
      hs('b', null,
        hs('c', null, i)
      )
    ))
  }
  const hsTime = performance.now() - hsStart

  container.innerHTML = ''
  const shStart = performance.now()
  for (let i = 0; i < N; i++) {
    container.appendChild(sh('a', null, 'a',
      sh('b', null,
        sh('c', null, i)
      )
    ))
  }
  const shTime = performance.now() - shStart


  container.innerHTML = ''
  const ihtmlStart = performance.now()
  for (let i = 0; i < N; i++) {
    let a = document.createElement('a')
    a.innerHTML = `a<b><c>${i}</c></b>`
    container.appendChild(a)
  }
  const ihtmlTime = performance.now() - ihtmlStart


  console.log('spect/hyperscript', shTime,  'ihtml', ihtmlTime, 'hyperscript', hsTime)
  t.ok(shTime < hsTime * 1.08, 'h faster than hyperscript')
  t.ok(shTime < ihtmlTime, 'h faster than innerHTML')
})

t('html: first call should be nearly htm + hyperscript or close to possible minimum', async t => {
  const N = 1000

  let arr = ['<a>a<b><c>','</c></b></a>']

  let htmStart = performance.now()
  for (let i = 0; i < N; i++) {
    htm((arr = arr.slice()).raw = arr, i)
  }
  const htmTime = performance.now() - htmStart


  const hStart = performance.now()
  for (let i = 0; i < N; i++) {
    h((arr = arr.slice()).raw = arr, i)
  }
  const hTime = performance.now() - hStart


  let x = document.createElement('x')
  function ihtml () {
    x.innerHTML = String.raw.apply(this, arguments)
    return x.firstChild
  }
  const ihtmlStart = performance.now()
  for (let i = 0; i < N; i++) {
    ihtml((arr = arr.slice()).raw = arr, i)
  }
  const ihtmlTime = performance.now() - ihtmlStart


  const lStart = performance.now()
  for (let i = 0; i < N; i++) {
    ihtml((arr = arr.slice()).raw = arr, i)
  }
  const lTime = performance.now() - lStart


  console.log( 'h', hTime, 'ihtml', ihtmlTime, 'hs + htm', htmTime, 'lit', lTime)
  t.ok(hTime < ihtmlTime * 1.2, '<20% from direct innerHTML')
  t.ok(hTime < htmTime * 1.08, 'faster than htm')
})

t.only('html: cached primitive tpl should be close to DOM', async t => {
  const N = 50
  const container = document.createElement('div')

  let domFrag = document.createDocumentFragment()
  const domStart = performance.now()
  for (let i = 0, b; i < N; i++) {
    domFrag.appendChild(document.createElement('a')).append(document.createTextNode('a'), b = document.createElement('b'))
    b.appendChild(document.createElement('c')).appendChild(document.createTextNode(i))
    container.appendChild(domFrag)
  }
  const domTime = performance.now() - domStart

  container.innerHTML = ''
  let frag = document.createDocumentFragment(), b
  frag.appendChild(document.createElement('a')).append(document.createTextNode('a'), b = document.createElement('b'))
  b.appendChild(document.createElement('c')).appendChild(document.createTextNode(0))
  const cloneStart = performance.now()
  for (let i = 0; i < N; i++) {
    let node = frag.cloneNode(true)
    node.querySelector('c').childNodes[0].data = i
    container.appendChild(node)
  }
  const cloneTime = performance.now() - cloneStart

  container.innerHTML = ''
  let htmStart
  for (let i = -1; i < N; i++) {
    // first run warms up cache
    if (!i) htmStart = performance.now()
    container.appendChild(htm`<a>a<b><c>${i}</c></b></a>`)
  }
  const htmTime = performance.now() - htmStart


  container.innerHTML = ''
  // warmup
  let hStart
  for (let i = -1; i < N; i++) {
      // first run warms up cache
    if (!i) hStart = performance.now()
    container.appendChild(h`<a>a<b><c>${i}</c></b></a>`)
  }
  const hTime = performance.now() - hStart


  container.innerHTML = ''
  let x = document.createElement('x')
  const ihtmlStart = performance.now()
  for (let i = 0; i < N; i++) {
    x.innerHTML = `<a>a<b><c>${i}</c></b></a>`
    container.appendChild(x.firstChild)
  }
  const ihtmlTime = performance.now() - ihtmlStart

  container.innerHTML = ''
  let nodes = []
  lrender(nodes, container)
  for (let i = 0; i < N; i++) nodes.push(lhtml`<a>a<b><c>${i}</c></b></a>`)
  const lStart = performance.now()
  lrender(nodes, container)
  const lTime = performance.now() - lStart

  console.log( 'h', hTime, 'dom', domTime, 'clone', cloneTime, 'ihtml', ihtmlTime, 'hs + htm', htmTime, 'lit', lTime)
  // t.ok(hTime < domTime, 'creation is fast')
  // t.ok(hTime < htmTime * 1.08, 'single node is fast')
})

t.todo('html: 10k creation performance should be faster than direct DOM', async t => {
  const N = 1
  const container = document.createElement('div')

  const domStart = performance.now()
  for (let i = 0; i < N; i++) {
    let frag = document.createDocumentFragment(), b
    frag.appendChild(document.createElement('a')).append(document.createTextNode('a'), b = document.createElement('b'))
    b.appendChild(document.createElement('c')).appendChild(document.createTextNode(i))
    container.appendChild(frag)
  }
  const domTime = performance.now() - domStart


  container.innerHTML = ''
  const cloneStart = performance.now()
  let frag = document.createDocumentFragment(), b
  frag.appendChild(document.createElement('a')).append(document.createTextNode('a'), b = document.createElement('b'))
  b.appendChild(document.createElement('c')).appendChild(document.createTextNode(0))
  for (let i = 0; i < N; i++) {
    let node = frag.cloneNode(true)
    node.querySelector('c').childNodes[0].data = i
    container.appendChild(node)
  }
  const cloneTime = performance.now() - cloneStart


  container.innerHTML = ''
  htm`<a>a<b><c>${0}</c></b></a>` //pre-heat cache
  const htmStart = performance.now()
  for (let i = 0; i < N; i++) {
    container.appendChild(htm`<a>a<b><c>${i}</c></b></a>`)
  }
  const htmTime = performance.now() - htmStart


  container.innerHTML = ''
  const hStart = performance.now()
  for (let i = 0; i < N; i++) {
    container.appendChild(h`<a>a<b><c>${i}</c></b></a>`)
  }
  const hTime = performance.now() - hStart


  container.innerHTML = ''
  const ihtmlStart = performance.now()
  let x = document.createElement('x')
  for (let i = 0; i < N; i++) {
    x.innerHTML = `<a>a<b><c>${i}</c></b></a>`
    container.appendChild(x.firstChild)
  }
  const ihtmlTime = performance.now() - ihtmlStart


  container.innerHTML = ''
  let nodes = []
  lrender(nodes, container)
  for (let i = 0; i < N; i++) nodes.push(lhtml`<a>a<b><c>${i}</c></b></a>`)
  const lStart = performance.now()
  lrender(nodes, container)
  const lTime = performance.now() - lStart


  console.log( 'h', hTime, 'dom', domTime, 'clone', cloneTime, 'ihtml', ihtmlTime, 'hs + htm', htmTime, 'lit', lTime)
  t.ok(hTime < domTime, 'creation is fast')
})

t.todo('update performance should be faster than direct DOM', async t => {
  const N = 10000

  const container = document.createElement('div')
  const domStart = performance.now()
  for (let i = 0; i < N; i++) {
    let frag = document.createDocumentFragment(), b
    frag.appendChild(document.createElement('a')).append(document.createTextNode('a'), b = document.createElement('b'))
    b.appendChild(document.createElement('c')).appendChild(document.createTextNode(i))
    container.appendChild(frag)
  }
  const domTime = performance.now() - domStart

  container.innerHTML = ''
  const hStart = performance.now()
  for (let i = 0; i < N; i++) {
    container.appendChild(h`<${a} ${x} ${y}=${z} ...${w}>a<b><c>${i}</c></b></>`)
  }
  const hTime = performance.now() - hStart
  container.innerHTML = ''

  console.log('hTime', hTime, 'domTime', domTime)
  t.ok(hTime < domTime, 'creation is fast')
})

t.todo('updating only props must not create performance penality', async t => {
  let el = h`<a x=1 y=2><b/><c/><d/></a>`

  h`<${el} ...${{...el}}>${el.childNodes}</>`

  // same as doing nothing
})

t.todo('js-framework creating 1000 nodes via h footprint should be 0')

t.todo('js-framework creating 1000 nodes via $ should be as fast as just iterating over 1000 nodes')
