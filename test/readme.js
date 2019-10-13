import t from 'tst'
import { $, fx, prop, html, on, use, state, cls } from '..'
import morphdom from 'morphdom'

t('readme: A simple aspect', async t => {
  let el = document.body.appendChild(document.createElement('div'))
  el.id = 'hello-example'
  el.name = 'xyz'

  fx(prop(el, 'name'), name => {
    html`<${el}>
      <div.message>
        Hello, ${ name }!
      </div>
    </>`
  })

  await Promise.resolve().then()

  t.is(el.outerHTML, '<div id="hello-example"><div class="message">Hello, xyz!</div></div>')

  el.name = 'Taylor'

  await Promise.resolve().then()

  t.is(el.outerHTML, '<div id="hello-example"><div class="message">Hello, Taylor!</div></div>')

  document.body.removeChild(el)
})

t('readme: A stateful aspect via await', async t => {
  let el = document.body.appendChild(document.createElement('div'))
  el.id = 'timer-example-1'


  await use('#timer-example-1', async el => {
    let state = { seconds: 0 }

    let i = setInterval(() => {
      state.seconds++
    }, 1000)

    fx(prop(state, 'seconds'), seconds => {
      html`<${el}>Seconds: ${seconds}</>`
    })

    await on(el, 'disconnected')
    clearInterval(i)
  })

  t.is(el.innerHTML, 'Seconds: 0')
  document.body.removeChild(el)
})

t.only('readme: A stateful aspect via event sequence', async t => {
  let frag = document.createDocumentFragment()
  morphdom(frag, document.createElement('div'))

  let el = document.body.appendChild(document.createElement('div'))
  el.id = 'timer-example'

  // for every #timer-example element
  await use('#timer-example', async el => {
    let state = { seconds: 0 }
    // start timer when connected, end when disconnected
    on(el, 'connected', e => {
      let i = setInterval(() => {
        state.seconds++
      }, 1000)

      on(el, 'disconnected', () => clearInterval(i))
    })

    // rerender when seconds change
    prop(state, 'seconds', seconds => html`<${el}>Seconds: ${seconds}</>`)
  })

  t.is(el.innerHTML, 'Seconds: 0')
  document.body.removeChild(el)
})

t.todo('readme: An application', t => {
  let el = document.body.appendChild(document.createElement('div'))
  el.id = 'todos-example'

  use('#todos-example', el => {
    let state = { items: [], text: '' }

    // run effect by submit event
    on(el, 'submit', e => {
      e.preventDefault()

      if (!state.text.length) return

      state.items.push({ text: state.text, id: Date.now() })
      state.text = ''
    })

    // rerender html when state changes
    prop(state, 'items', items => {
      html`<${el}>
      <h3>TODO</h3>
      <main#todo-list items=${ items }/>
      <form>
        <label for=new-todo>
          What needs to be done?
        </label>
        <br/>
        <input#new-todo onchange=${ e => state.text = e.target.value}/>
        <button>
          Add #${ items.length + 1}
        </button>
      </form>
    </>`
    })
  })

  use('#todo-list', el => {
    prop(el, 'items', items => html`<${el}><ul>${items.map(item => html`<li>${item.text}</li>`)}</ul></>`)
  })

  // document.body.removeChild(el)
})

t.todo('readme: A component with external plugin', async t => {
  const {Remarkable} = await import('remarkable')

  let el = document.body.appendChild(document.createElement('div'))
  el.id = 'markdown-example'

  // MarkdownEditor is created as web-component
  use('#markdown-example', el => html`<${el}><${MarkdownEditor} content='Hello, **world**!'/></el>`)

  function MarkdownEditor(el, { content }) {
    state(el, { value: content })

    cls(el).markdownEditor = true

    fx(() => {
      html`<${el}>
        <h3>Input</h3>
        <label for="markdown-content">
          Enter some markdown
        </label>
        <textarea#markdown-content
          onchange=${e => state(el, { value: e.target.value })}
        >${ state(el).value }</textarea>

        <h3>Output</h3>
        <div.content innerHTML=${ getRawMarkup(state(el).value) }/>
      </>`
    })
  }

  let getRawMarkup = content => {
    const md = new Remarkable();
    return md.render(content);
  }

  await Promise.resolve().then().then()
  t.is($('.content', el)[0].innerHTML.trim(), `<p>Hello, <strong>world</strong>!</p>`)

  document.body.removeChild(el)
})
