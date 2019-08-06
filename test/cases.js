import t from 'tst'
import $ from '../index'
import { queue } from '../src/use'

t('case: readme intro', t => {
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
