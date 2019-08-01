import t from 'tst'
import $ from '../index'

t('readme: intro', t => {
  // main aspect
  function app($app) {
    let id = Math.random()
    // let [match, { id }] = $app.route('user/:id')
    // if (!match) return

    $app.fx(async () => {
      $app.loading = true
      // $app.user = await ky.get(`./api/user/${id}`)
      $app.user = new Promise(ok => setTimeout(() => ok({name: 'Yaddy'}), 1000))
      $app.loading = false
    }, id)

    $app.html`<div fx=${i18n}>${ $app.loading ? `Hello, ${$app.user.name}!` : `Thanks for patience...` }</div>`
  }

  // preloader aspect
  function preloader($el) {
    console.log('preloader', $el.loading)
    $el.preloadable = true
    // if ($el.loading) $el.html`${$el.children} <canvas class="spinner" />`
  }

  // i18n aspect
  function i18n($el) {
    $el.html=`${$el[0].textContent}`
    // useLocale($el.attr.lang || $(document.documentElement).attr.lang)
    // $el.html`${t`${$el.text}`}`
  }

  // run app
  let el = document.createElement('div')
  document.body.appendChild(el)
  // $('#app').fx(app)
  $(el).fx([app, preloader])

})
