import t from 'tst'
import $, {h} from '..'

t('html: should destroy replaced new internal nodes', async t => {
  let log = []

  let $app = $`<div#content/>`
  document.body.appendChild($app[0])

  let data = Array(2).fill(0).map(_ => ({name: 'foo'}))

  await $app.use(({ html }) => {
    log.push('app')
    html`${data.map(data => $`<${Card} title=${data.name}/>`)}`
  })

  function Card({ html, title }) {
    log.push(title)
    html`
    <div.card>
    <div.card-title>${ title }</div>
    </div>
    `
    return () => log.push('-' + title)
  }

  t.is(log, ['app', 'foo', 'foo'])

  data[1].name = 'bar'
  await $app.update()

  t.is(log, ['app', 'foo', 'foo', 'app', '-foo', '-foo', 'foo', 'bar'])

  document.body.removeChild($app[0])
})


t.todo('case: readme intro', t => {
  let el = document.createElement('div')
  el.id = 'app'
  document.body.appendChild(el)

  // main aspect
  function app($app) {
    console.log('APP')
    let id = 1
    // let [match, { id }] = $app.route('user/:id')
    // if (!match) return

    $app.fx(async function load () {
      console.log('LOAD')
      $app.state.loading = true
      // $app.user = await ky.get(`./api/user/${id}`)
      $app.state.user = await new Promise(ok => setTimeout(() => ok({name: 'Yaddy'}), 1000))
      $app.state.loading = false
      console.log('LOADED')
    }, id)

    $app.html`<div use=${i18n}>${!$app.state.loading ? `Hello, ${$app.state.user && $app.state.user.name}!` : `Thanks for patience...` }</div>`
  }

  // preloader aspect
  function preloader($el) {
    console.log('PRELOADER')
    // if ($el.state.loading) $el.html`${$el.children} <canvas class="spinner" />`
  }

  // i18n aspect
  function i18n($el) {
    console.log('I18N')
    // $el.html=`${$el[0].textContent}`
    // useLocale($el.attr.lang || $(document.documentElement).attr.lang)
    // $el.html`${t`${$el.text}`}`
  }

  // run app
  $('#app').use(app, preloader)

  // t.deepEqual(log, [])

  setTimeout(() => {
    console.log(el.outerHTML)
  })
})


t.todo('is: popup-info direct html', t => {

  let $el = $('<div/>')

    .html`<${PopupInfo} img="img/alt.png" text="Your card validation code (CVC)
  is an extra security feature — it is the last 3 or 4 numbers on the
  back of your card."/>`

  console.log($el)
})

// example from MDN https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements
function PopupInfo($el) {
  $el.css`
      .wrapper {
        position: relative;
      }

      .info {
        font-size: 0.8rem;
        width: 200px;
        display: inline-block;
        border: 1px solid black;
        padding: 10px;
        background: white;
        border-radius: 10px;
        opacity: 0;
        transition: 0.6s all;
        position: absolute;
        bottom: 20px;
        left: 10px;
        z-index: 3;
      }

      img {
        width: 1.2rem
      }

      .icon:hover + .info, .icon:focus + .info {
        opacity: 1;
      }`;

  $el.html`<span.wrapper>
      <span.icon tabindex=0><img src=${ $el.img || 'img/default.png'}/></>
      <span.info>${ $el.text}</>
    </span>`
}
