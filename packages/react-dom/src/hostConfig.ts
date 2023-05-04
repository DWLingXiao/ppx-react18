import { FiberNode } from 'react-reconciler/src/fiber'
import { HostText } from 'react-reconciler/src/workTags'

export type Container = Element
export type Instance = Element
export type TextInstance = Text

export const createInstance = (type: string, props: any): Instance => {
	const element = document.createElement(type)
	return element
}

export const createTextInstance = (content: string) => {
	return document.createTextNode(content)
}

export const appendInitialChild = (
	parent: Instance | Container,
	child: Instance
) => {
	parent.appendChild(child)
}
let text
export function commitUpdate(fiber: FiberNode) {
	switch (fiber.tag) {
		case HostText:
			text = fiber.memoizedProps?.content
			return commitTextUpdate(fiber.stateNode, text)

		default:
			if (__DEV__) {
				console.warn('未实现的update类型', fiber)
			}
	}
}

export function commitTextUpdate(textInstance: TextInstance, content: string) {
	textInstance.textContent = content
}

export const removeChild = (child: Instance, container: Container) => {
	container.removeChild(child)
}

export const appendChildToCantainer = appendInitialChild
