import test from './libs/tst.js'
import { h, v } from '../index.js'
import o from './libs/observable.js'

test('hyperscript: simple', function (t) {
  t.is(h('h1').outerHTML, '<h1></h1>')
  t.is(h('h1', null, 'hello world').outerHTML, '<h1>hello world</h1>')
  t.end()
})

test('hyperscript: nested', function(t) {
  t.is(h('div', null,
    h('h1', null, 'Title'),
    h('p', null, 'Paragraph')
  ).outerHTML, '<div><h1>Title</h1><p>Paragraph</p></div>')
  t.end()
})

test('hyperscript: arrays for nesting is ok', function(t){
  t.is(h('div', null,
    [h('h1', null, 'Title'), h('p', null, 'Paragraph')]
  ).outerHTML, '<div><h1>Title</h1><p>Paragraph</p></div>')
  t.end()
})

test('hyperscript: can use namespace in name', function(t){
  t.is(h('myns:mytag').outerHTML, '<myns:mytag></myns:mytag>');
  t.end()
})

test('hyperscript: can use id selector', function(t){
  t.is(h('div#frame').outerHTML, '<div id="frame"></div>')
  t.end()
})

test('hyperscript: can use class selector', function(t){
  t.is(h('div.panel').outerHTML, '<div class="panel"></div>')
  t.end()
})

test.skip('hyperscript: can default element types', function(t){
  t.is(h('.panel').outerHTML, '<div class="panel"></div>')
  t.is(h('#frame').outerHTML, '<div id="frame"></div>')
  t.end()
})

test('hyperscript: can set properties', function(t){
  var a = h('a', {href: 'http://google.com'})
  t.is(a.href, 'http://google.com/')
  var checkbox = h('input', {name: 'yes', type: 'checkbox'})
  t.is(checkbox.outerHTML, '<input name="yes" type="checkbox">')
  t.end()
})

test('hyperscript: registers event handlers', function(t){
  h('p', null, 'Paragraph') // pre-cache
  let log = []
  var onClick = () => {log.push('click')}
  var p = h('p', {onclick: onClick}, 'something')
  p.click(p)
  t.is(log, ['click'])
  t.end()
})

test('hyperscript: sets styles', function(t){
  var div = h('div', {style: {'color': 'red'}})
  t.is(div.style.color, 'red')
  t.end()
})

test('hyperscript: sets styles as text', function(t){
  var div = h('div', {style: 'color: red'})
  t.is(div.style.color, 'red')
  t.end()
})

test('hyperscript: sets data attributes', function(t){
  var div = h('div', {'data-value': 5})
  t.is(div.getAttribute('data-value'), '5') // failing for IE9
  t.end()
})

test('hyperscript: boolean, number, date, regex get to-string\'ed', function(t){
  var e = h('p', null, true, false, 4, new Date('Mon Jan 15 2001'), /hello/)
  t.ok(e.outerHTML.match(/<p>truefalse4Mon Jan 15.+2001.*\/hello\/<\/p>/))
  t.end()
})

test('hyperscript: observable content', function(t){
  var title = o()
  title('Welcome to HyperScript!')
  var h1 = h('h1', null, title)
  t.is(h1.outerHTML, '<h1>Welcome to HyperScript!</h1>')
  title('Leave, creep!')
  t.is(h1.outerHTML, '<h1>Leave, creep!</h1>')
  t.end()
})

test('hyperscript: observable property', function(t){
  var checked = o()
  checked(true)
  var checkbox = h('input', {type: 'checkbox', checked: checked})
  t.is(checkbox.checked, true)
  checked(false)
  t.is(checkbox.checked, false)
  t.end()
})

test('hyperscript: observable style', function(t){
  var color = o()
  color('red')
  var div = h('div', {style: {'color': color}})
  t.is(div.style.color, 'red')
  color('blue')
  t.is(div.style.color, 'blue')
  t.end()
})

test('hyperscript: unicode selectors', function (t) {
  // t.is(h('.⛄').outerHTML, '<div class="⛄"></div>')
  t.is(h('span#⛄').outerHTML, '<span id="⛄"></span>')
  t.end()
})
