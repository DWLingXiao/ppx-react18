// 递归的归阶段

import {
	appendInitialChild,
	Container,
	createInstance,
	createTextInstance
} from 'hostConfig'
import { FiberNode } from './fiber'
import { NoFlags, Update } from './fiberFlags'
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags'

function markUpdate(fiber: FiberNode) {
	fiber.flags |= Update
}

export const completeWork = (wip: FiberNode) => {
	// 比较，返回子fiberNode
	const newProps = wip.pendingProps
	const current = wip.alternate

	switch (wip.tag) {
		case HostComponent:
			if (current !== null && wip.stateNode) {
				// update
			} else {
				/**
				 * 构建离屏dom
				 * 1. 构建dom
				 * 2. 插入dom树
				 */
				const instance = createInstance(wip.type, newProps)
				// 2. 插入dom树
				appendAllChildren(instance, wip)
				wip.stateNode = instance
			}
			bubbleProperties(wip)
			return null
		case HostText:
			if (current !== null && wip.stateNode) {
				// update
				const oldText = current.memoizedProps?.content
				const newText = newProps.content
				if (oldText !== newText) {
					markUpdate(wip)
				}
			} else {
				/**
				 * 构建离屏dom
				 * 1. 构建dom
				 * 2. 插入dom树
				 */
				const instance = createTextInstance(newProps.content)
				// 2. 插入dom树
				wip.stateNode = instance
			}
			bubbleProperties(wip)
			return null

		case HostRoot:
			bubbleProperties(wip)
			return null
		case FunctionComponent:
			bubbleProperties(wip)
			return null

		default:
			if (__DEV__) {
				console.warn('未处理的completeWork情况', wip)
			}
			break
	}
}

function appendAllChildren(parent: Container, wip: FiberNode) {
	let node = wip.child

	while (node !== null) {
		if (node?.tag === HostComponent || node?.tag === HostText) {
			appendInitialChild(parent, node?.stateNode)
		} else if (node.child !== null) {
			node.child.return = node
			node = node.child
			continue
		}

		if (node === wip) {
			return
		}

		while (node.sibling === null) {
			if (node.return === null || node.return === wip) {
				return
			}
			node = node?.return
		}
		node.sibling = node.return
		node = node.sibling
	}
}

function bubbleProperties(wip: FiberNode) {
	let subtreeFlag = NoFlags
	let child = wip.child

	while (child !== null) {
		subtreeFlag |= child.subtreeFlag
		subtreeFlag |= child.flags

		child.return = wip
		child = child.sibling
	}
	wip.subtreeFlag |= subtreeFlag
}
