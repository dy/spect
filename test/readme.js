import t from 'tst'
import { $, fx, prop, html, on, use, state, cls } from '..'

t('readme: A simple aspect', async t => {
  let el = document.body.appendChild(document.createElement('div'))
  el.id = 'hello-example'
  el.name = 'xyz'

  fx(() => {
    html`<${el}>
      <div.message>
        Hello, ${ prop(el).name }!
      </div>
    </>`
  })

  await ''

  t.is(el.outerHTML, '<div id="hello-example"><div class="message">Hello, xyz!</div></div>')

  prop(el).name = 'Taylor'

  await ''

  t.is(el.outerHTML, '<div id="hello-example"><div class="message">Hello, Taylor!</div></div>')

  document.body.removeChild(el)
})

t('readme: A stateful aspect via await', async t => {
  let el = document.body.appendChild(document.createElement('div'))
  el.id = 'timer-example-1'

  await use('#timer-example-1', async el => {
    state(el, { seconds: 0 })
    await on(el, 'connected')
    let i = setInterval(() => {
      state(el).seconds++
    }, 1000)

    fx(() => {
      html`<${el}>Seconds: ${state(el).seconds}</>`
    })

    await on(el, 'disconnected')
    clearInterval(i)
  })

  await Promise.resolve().then()

  t.is(el.innerHTML, 'Seconds: 0')
  document.body.removeChild(el)
})

t('readme: A stateful aspect via event sequence', async t => {
  let el = document.body.appendChild(document.createElement('div'))
  el.id = 'timer-example'

  await use('#timer-example', async el => {
    state(el, { seconds: 0 })

    on(el, 'connected > disconnected', e => {
      let i = setInterval(() => {
        state(el).seconds++
      }, 1000)

      return () => clearInterval(i)
    })

    fx(() => {
      html`<${el}>Seconds: ${state(el).seconds}</>`
    })
  })

  await Promise.resolve().then()

  t.is(el.innerHTML, 'Seconds: 0')
  document.body.removeChild(el)
})

t('readme: An application', t => {
  let el = document.body.appendChild(document.createElement('div'))
  el.id = 'todos-example'

  use('#todos-example', el => {
    state(el, { items: [], text: '' })

    on(el, 'submit', e => {
      e.preventDefault()

      let { text, items } = state(el)

      if (!text.length) return

      const newItem = {
        text,
        id: Date.now()
      };

      state(el, {
        items: [...items, newItem],
        text: ''
      })
    })

    fx(() => {
      let s = state(el)

      html`<${el}>
        <h3>TODO</h3>
        <main#todo-list items=${ s.items }/>
        <form>
          <label for=new-todo>
            What needs to be done?
          </label>
          <br/>
          <input#new-todo onchange=${ e => s.text = e.target.value}/>
          <button>
            Add #${ s.items.length + 1}
          </button>
        </form>
      </>`
    })
  })

  use('#todo-list', el => {
    fx(() => {
      html`<${el}><ul>${prop(el).items.map(item => html`<li>${item.text}</li>`)}</ul></>`
    })
  })

  document.body.removeChild(el)
})

t('readme: A component with external plugin', async t => {
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
