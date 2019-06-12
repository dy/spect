// hyperscript cases


t('new element', t => {
  $('div', () => {

  })
})

t('new custom element', t => {
  $('custom-element', () => {

  })
})


// nested variants
t('el > el', t => {
  $('a', a,
    $('b')
  )
})

