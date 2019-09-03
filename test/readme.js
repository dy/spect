import t from 'tst'
import $ from '..'

t('readme: A simple aspect', async t => {
  let el = document.body.appendChild(document.createElement('div'))
  el.id = 'hello-example'

  function helloMessage({ html, prop }) {
    html`<div.message>
    Hello, ${ prop('name') }!
  </div>`
  }

  $('#hello-example').use(helloMessage).prop('name', 'Taylor')

  await Promise.resolve().then()

  t.is(el.outerHTML, '<div id="hello-example"><div class="message">Hello, Taylor!</div></div>')

  document.body.removeChild(el)
})

t('readme: A stateful aspect', t => {
  let el = document.body.appendChild(document.createElement('div'))
  el.id = 'timer-example'

  $('#timer-example').use($el => {
    // init
    $el.state({ seconds: 0 }, [])

    // start timer when connected
    $el.mount(() => {
      let i = setInterval(() => $el.state(s => s.seconds++), 1000)

      // disconnected
      return () => clearInterval(i)
    })

    console.log($el)
    // html is side-effect, not aspect result
    $el.html`Seconds: ${ $el.state('seconds') }`
  })

  t.is($('#timer-example')[0].innerHTML, 'Seconds: 0')
  document.body.removeChild(el)
})

t.only('readme: An application', t => {
  let el = document.body.appendChild(document.createElement('div'))
  el.id = 'todos-example'


  $("#todos-example").use(Todo);

  function Todo($el) {
    $el.state({ items: [], text: "" }, []);

    $el.on("submit", e => {
      e.preventDefault();

      if (!$el.state("text.length")) return;

      const newItem = {
        text: $el.state("text"),
        id: Date.now()
      };

      // in-place reducer
      $el.state(state => ({
        items: [...state.items, newItem],
        text: ""
      }));
    });

    $el.on("change", "#new-todo", e => $el.state({ text: e.target.value }));

    $el.html`
      <h3>TODO</h3>
      <main is=${TodoList} items=${$el.state("items")}/>
      <form>
        <label for=new-todo>
          What needs to be done?
        </label>
        <br/>
        <input#new-todo value=${$el.state("text")}/>
        <button>
          Add #${$el.state("items.length") + 1}
        </button>
      </form>
    `;
  }

  // TodoList component
  function TodoList({ html, items }) {
    html`<ul>${prop('items').map(item => $`<li>${item.text}</li>`)}</ul>`;
  }

  document.body.removeChild(el)
})

t('readme: A component with external plugin', async t => {
  const {Remarkable} = await import('remarkable')

  let el = document.body.appendChild(document.createElement('div'))
  el.id = 'markdown-example'

  // MarkdownEditor is created as web-component
  $('#markdown-example').use(el => $(el).html`<${MarkdownEditor} content='Hello, **world**!'/>`)

  function MarkdownEditor(el) {
    let $el = $(el)

    $el.state({ value: $el.prop('content') }, [$el.prop('content')])

    $el.class`markdown-editor`

    $el.html`
      <h3>Input</h3>
      <label for="markdown-content">
        Enter some markdown
      </label>
      <textarea#markdown-content
        onchange=${e => $el.state({ value: e.target.value })}
      >${ $el.state('value') }</textarea>

      <h3>Output</h3>
      <div.content html=${ getRawMarkup($el.state('value')) }/>
    `
  }

  let getRawMarkup = content => {
    const md = new Remarkable();
    return md.render(content);
  }

  await Promise.resolve().then()

  t.is($('.content', el)[0].innerHTML, `<p>Hello, <strong>world</strong>!</p>`)
})
