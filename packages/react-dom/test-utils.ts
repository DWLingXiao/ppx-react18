import { ElementType } from 'shared/ReactTypes'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { createRoot } from 'react-dom'

export function renderIntoDocument(element: ElementType) {
	const div = document.createElement('div')

	return createRoot(div).render(element)
}
