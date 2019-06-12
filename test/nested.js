
// nested variants
t('el > el', t => {
  $('a', a,
    $('b')
  )
})

t('el > selector > el', t => {
  $('a',
    $('#b',
      $('c')
    )
  )
})

t('selector > selector', t => {
  $('#',
    $('#', () => {})
  )
})

t('selector > els > selector', t => {
  $('.', {},
    $([a, b, c],
      $('.', () => {})
    )
  )
})
