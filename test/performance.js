import t from 'tst'
// import { $, v, h } from '../index.js'
import { h as sh } from '../h.js'
import { tick, frame, idle, time } from 'wait-please'
import hs from './libs/hyperscript.js'
import {html as lhtml, render as lrender} from 'lit-html'
import htm from './libs/htm.js'
// import htm from 'xhtm'

let hsHTM = htm.bind(hs)

t.only('<30 creation performance should be faster than hyperscript/lit-html', async t => {
  let N = 30
  const container = document.createElement('div')

  container.innerHTML = ''
  const ihtmlStart = performance.now()
  for (let i = 0; i < N; i++) {
    let a = document.createElement('a')
    a.innerHTML = `a<b><c>${i}</c></b>`
    container.appendChild(a)
  }
  const ihtmlTime = performance.now() - ihtmlStart

  container.innerHTML = ''
  // const hStart = performance.now()
  // for (let i = 0; i < N; i++) {
  //   container.appendChild(h`<a>a<b><c>${i}</c></b></a>`)
  // }
  // const hTime = performance.now() - hStart


  container.innerHTML = ''
  hsHTM`<a>a<b><c>${0}</c></b></a>` //pre-heat cache
  const hsHTMStart = performance.now()
  for (let i = 0; i < N; i++) {
    container.appendChild(hsHTM`<a>a<b><c>${i}</c></b></a>`)
  }
  const hsHTMTime = performance.now() - hsHTMStart


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
  let nodes = []
  lrender(nodes, container)
  const lStart = performance.now()
  for (let i = 0; i < N; i++) nodes.push(lhtml`<a>a<b><c>${i}</c></b></a>`)
  lrender(nodes, container)
  const lTime = performance.now() - lStart

  console.log(
    // 'h', hTime,
    's/hs', shTime,  'ihtml', ihtmlTime, 'hs', hsTime, 'hs + htm', hsHTMTime, 'lit', lTime)
  t.ok(shTime < hsTime * 1.08, 'h faster than hyperscript')
  t.ok(shTime < ihtmlTime, 'h faster than innerHTML')
})

t('10k creation performance should be faster than direct DOM', async t => {
  const N = 20
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
  const hStart = performance.now()
  for (let i = 0; i < N; i++) {
    container.appendChild(h`<a>a<b><c>${i}</c></b></a>`)
  }
  const hTime = performance.now() - hStart

  console.log( 'h', hTime, 'dom', domTime, 'clone', cloneTime)
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
