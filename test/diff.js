import t from 'tst'
import { diff } from '../h'
import {Dommy, Nody} from './dommy.js'

t('create', t => {
  let parent = new Dommy();

  diff(parent, parent.childNodes, [1,2,3,4,5], parent.lastElementChild);
  t.is(parent.childNodes, [1,2,3,4,5], 'create')
})

t('remove', t => {
  let parent = new Dommy();
  diff(parent, parent.childNodes, [1,2,3,4,5], parent.lastElementChild);

  console.log('remove')
  diff(parent,parent.childNodes,[1,3,5],parent.lastElementChild);
  t.is(parent.childNodes, [1,3,5], 'remove')
})

t('insert', t => {
  let parent = new Dommy();
  diff(parent, parent.childNodes, [1,3,5], parent.lastElementChild);

  console.log('insert')
  diff(parent,parent.childNodes,[1,2,3,4,5],parent.lastElementChild);
  t.is(parent.childNodes,[1,2,3,4,5], 'insert')
})

t('swap', t => {
  let parent = new Dommy();
  diff(parent, parent.childNodes, [1,2,3,4,5], parent.lastElementChild);

  console.log('---swap')
  diff(parent,parent.childNodes,[1,5,3,4,2],parent.lastElementChild);
  t.is(parent.childNodes, [1,5,3,4,2])
})

t('reverse', t => {
  let parent = new Dommy();
  diff(parent,parent.childNodes,[1,2,3,4,5],parent.lastElementChild);
  t.is(parent.childNodes, [1,2,3,4,5])
  diff(parent,parent.childNodes,[5,4,3,2,1],parent.lastElementChild);
  t.is(parent.childNodes, [5,4,3,2,1])
})

t('reverse-add', t => {
  let parent = new Dommy();
  diff(parent,parent.childNodes,[5,4,3,2,1],parent.lastElementChild);

  diff(parent,parent.childNodes,[1,2,3,4,5,6],parent.lastElementChild);
  t.is(parent.childNodes, [1,2,3,4,5,6])
  console.groupEnd()
})

t('swap 10', t => {
  let parent = new Dommy();
  diff(parent,parent.childNodes,[1,2,3,4,5,6,7,8,9,10],parent.lastElementChild);
  console.log('---swap')
  diff(parent,parent.childNodes,[1,8,3,4,5,6,7,2,9,10],parent.lastElementChild);
  t.is(parent.childNodes, [1,8,3,4,5,6,7,2,9,10])
})

t('update each 3', t => {
  console.groupCollapsed('create')
  let parent = new Dommy();
  diff(parent,parent.childNodes,[1,2,3,4,5,6,7,8,9,10],parent.lastElementChild);
  console.groupEnd()
  console.log('---update')
  const _0 = Symbol(0), _1 = Symbol(1), _2 = Symbol(2)
  diff(parent,parent.childNodes,[1,2,_0,4,5,_1,7,8,_2,10],parent.lastElementChild);
  t.is(parent.childNodes, [1,2,_0,4,5,_1,7,8,_2,10])
})

t('create ops', t => {
  let parent = new Dommy()
  const N = 100

  let start = 0;
  let childNodes = [];
  for (let i = 0; i < N; i++) childNodes.push(start + i)

  parent.reset()
  diff(parent,parent.childNodes,childNodes,parent.lastElementChild)
  // console.log(parent.childNodes)
  t.is(parent.count(), N)

  // replace
  start = N
  childNodes = []
  for (let i = 0; i < N; i++) childNodes.push(start + i)

  parent.reset()
  console.log('replace')
  diff(parent,parent.childNodes,childNodes,parent.lastElementChild)
  t.is((parent.count() - N) < 100, true)
})
