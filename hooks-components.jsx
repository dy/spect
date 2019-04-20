import { render } from 'react-dom'


function app((props) => {
	// essentially we bind data source/state
	let [items, fetch] = async(fetchData, [])
	
	// with a set of visual effects
	fx((title) => {
		document.title=title
	})

	css`
		.app {

		}
	`

	html(
	<main class={app} mod-store-provider mod-lang-provider>
		<header x={1} mod-header/>
		<ul>
			{items.map(item => <li {...item}/>)}
		</ul>
	</main>,
	document.body)

	raf(() => {

	})

	destroy(() => {

	})

	gsm()
}, [props])


function header ({element, children, ...props}) {

}


function provider ({element, children, ...props}) {
	// element.innerHTML = ''
	// props.store=store
	return <Provider><Lang>{ element }</Lang></Provider>
}

app({ userId: 1})
