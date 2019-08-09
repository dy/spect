import t from 'tst'
import $ from '../index'

t.todo('is: direct function creates component', t => {
  let $el = $($el => {
    console.log('init')
  })
})

t.skip('is: simple element with no content should  (?) be upgraded', t => {
  let $el = $`<div/>`.is($el => {
    console.log($el)
  })
})

t.todo('is: existing elements with `is` attr should be hydrated', t => {
  let $el = $`<div is="foo-bar"></div>`
  $el.is(FooBar)

  // TODO: and simple tags
  // `<div is="foo"></div>`

})

t.todo('is: existing element with `is` attr not matching the fn name should throw error', t => {
  $`<div is="xyz-abc"/>`.is(FooBar)
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
