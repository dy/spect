import t from 'tst'
import { diff } from '../h'
import {Dommy, Nody} from './dommy.js'

t.only('main', t => {
  let parent = new Dommy();

  console.group('create')
  diff(parent, parent.childNodes, [1,2,3,4,5], parent.lastElementChild);
  t.is(parent.childNodes, [1,2,3,4,5], 'create')
  console.groupEnd()

  console.group('remove')
  diff(parent,parent.childNodes,[1,3,5],parent.lastElementChild);
  t.is(parent.childNodes, [1,3,5], 'remove')
  console.groupEnd()

  console.group('insert')
  diff(parent,parent.childNodes,[1,2,3,4,5],parent.lastElementChild);
  t.is(parent.childNodes,[1,2,3,4,5], 'insert')
  console.groupEnd()

  console.group('swap')
  diff(parent,parent.childNodes,[1,5,3,4,2],parent.lastElementChild);
  t.is(parent.childNodes, [1,5,3,4,2])
  diff(parent,parent.childNodes,[1,2,3,4,5],parent.lastElementChild);
  t.is(parent.childNodes, [1,2,3,4,5])
  console.groupEnd()

  console.group('reverse')
  diff(parent,parent.childNodes,[5,4,3,2,1],parent.lastElementChild);
  t.is(parent.childNodes, [5,4,3,2,1])
  console.groupEnd()

  console.group('reverse-add')
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
  let parent = new Dommy();
  diff(parent,parent.childNodes,[1,2,3,4,5,6,7,8,9,10],parent.lastElementChild);
  console.log('---update')
  const _0 = Symbol(0), _1 = Symbol(1), _2 = Symbol(2)
  diff(parent,parent.childNodes,[1,2,_0,4,5,_1,7,8,_2,10],parent.lastElementChild);
  t.is(parent.childNodes, [1,2,_0,4,5,_1,7,8,_2,10])
})


