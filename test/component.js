import t from 'tst'
import $ from '../index'

t('component: popup-info', t => {
  // example from MDN

  let $el = $('<div>').html`<${PopupInfo} img="img/alt.png" text="Your card validation code (CVC)
  is an extra security feature — it is the last 3 or 4 numbers on the
  back of your card."/>`

  function PopupInfo ($el) {
    $el.css`.wrapper {
      padding: 20px
    }`

    $el.html`<span.wrapper>
      <span.icon tabindex=0><img src=${ $el.img || 'img/default.png' }/></>
      <span.info>${ $el.text }</>
    </span>`
  }

  console.log($el)
})
