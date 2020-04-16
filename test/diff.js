import t from 'tst'
import { merge as diff } from '../h'
import {Dommy, Nody} from './dommy.js'

const t1 = document.createTextNode(1),
      t2 = document.createTextNode(2),
      t3 = document.createTextNode(3),
      t4 = document.createTextNode(4),
      t5 = document.createTextNode(5),
      t6 = document.createTextNode(6),
      t7 = document.createTextNode(7),
      t8 = document.createTextNode(8),
      t9 = document.createTextNode(9),
      t0 = document.createTextNode(0)


const frag = () => {
  let f = document.createDocumentFragment()
  f.count = 0
  f.reset = () => f.count = 0

  let _insertBefore = f.insertBefore
  f.insertBefore = function () {_insertBefore.apply(this, arguments), f.count++}
  let _appendChild = f.appendChild
  f.appendChild = function () {_appendChild.apply(this, arguments), f.count++}
  let _replaceChild = f.replaceChild
  f.replaceChild = function () {_replaceChild.apply(this, arguments), f.count++}
  let _removeChild = f.removeChild
  f.removeChild = function () {_removeChild.apply(this, arguments), f.count++}

  return f
}


t('create', t => {
  let parent = frag();

  diff(parent, parent.childNodes, [t1,t2,t3,t4,t5], parent.lastElementChild);
  t.is([...parent.childNodes], [t1,t2,t3,t4,t5], 'create')
})

t('remove', t => {
  let parent = frag();
  diff(parent, parent.childNodes, [t1,t2,t3,t4,t5], parent.lastElementChild);

  console.log('remove')
  diff(parent,parent.childNodes,[t1,t3,t5],parent.lastElementChild);
  t.is([...parent.childNodes], [t1,t3,t5], 'remove')
})

t('insert', t => {
  let parent = frag();
  diff(parent, parent.childNodes, [t1,t3,t5], parent.lastElementChild);

  console.log('insert')
  diff(parent,parent.childNodes,[t1,t2,t3,t4,t5],parent.lastElementChild);
  t.is([...parent.childNodes],[t1,t2,t3,t4,t5], 'insert')
})

t('swap', t => {
  let parent = frag();
  diff(parent, parent.childNodes, [t1,t2,t3,t4,t5], parent.lastElementChild);

  console.log('---swap')
  diff(parent,parent.childNodes,[t1,t5,t3,t4,t2],parent.lastElementChild);
  t.is([...parent.childNodes], [t1,t5,t3,t4,t2])
})

t('reverse', t => {
  let parent = frag();
  diff(parent,parent.childNodes,[t1,t2,t3,t4,t5],parent.lastElementChild);
  t.is([...parent.childNodes], [t1,t2,t3,t4,t5])
  console.log('---reverse')
  diff(parent,parent.childNodes,[t5,t4,t3,t2,t1],parent.lastElementChild);
  t.is([...parent.childNodes], [t5,t4,t3,t2,t1])
})

t('reverse-add', t => {
  let parent = frag();
  diff(parent,parent.childNodes,[t5,t4,t3,t2,t1],parent.lastElementChild);

  diff(parent,parent.childNodes,[t1,t2,t3,t4,t5,t6],parent.lastElementChild);
  t.is([...parent.childNodes], [t1,t2,t3,t4,t5,t6])
  console.groupEnd()
})

t('swap 10', t => {
  let parent = frag();
  diff(parent,parent.childNodes,[t1,t2,t3,t4,t5,t6,t7,t8,t9,t0],parent.lastElementChild);
  parent.reset()
  console.log('---swap')
  diff(parent,parent.childNodes,[t1,t8,t3,t4,t5,t6,t7,t2,t9,t0],parent.lastElementChild);
  t.is([...parent.childNodes], [t1,t8,t3,t4,t5,t6,t7,t2,t9,t0], 'order')
  t.is(parent.count, 2, 'ops count')
})

t('update each 3', t => {
  console.groupCollapsed('create')
  let parent = frag();
  diff(parent,parent.childNodes,[t1,t2,t3,t4,t5,t6,t7,t8,t9],parent.lastElementChild);
  console.groupEnd()
  console.log('---update')
  let x = document.createTextNode(0), y = document.createTextNode(0), z = document.createTextNode(0)
  diff(parent,parent.childNodes,[t1,t2,x,t4,t5,y,t7,t8,z],parent.lastElementChild);
  t.is([...parent.childNodes], [t1,t2,x,t4,t5,y,t7,t8,z])
})

t('create ops', t => {
  // That's fine: failed due to wrong nodes
  let parent = frag()
  const N = 100

  let start = 0;
  let childNodes = [];
  for (let i = 0; i < N; i++) childNodes.push(document.createTextNode(start + i))

  parent.reset()
  diff(parent,parent.childNodes,childNodes,parent.lastElementChild)

  t.is(parent.count, N)

  // replace
  start = N
  childNodes = []
  for (let i = 0; i < N; i++) childNodes.push(document.createTextNode(start + i))

  parent.reset()
  console.log('replace')
  diff(parent,parent.childNodes,childNodes,parent.lastElementChild)
  t.is((parent.count - N) < 100, true, 'ops count')
})
