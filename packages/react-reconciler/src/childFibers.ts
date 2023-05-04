import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols'
import { ElementType, Props } from 'shared/ReactTypes'
import {
	createFiberFromElement,
	createWorkInProgress,
	FiberNode
} from './fiber'
import { ChildDeletion, Placement } from './fiberFlags'
import { HostText } from './workTags'

function ChildReconciler(shouldTrackEffects: boolean) {
	function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
		if (!shouldTrackEffects) {
			return
		}
		const deletions = returnFiber.deletions
		if (deletions === null) {
			returnFiber.deletions = [childToDelete]
			returnFiber.flags |= ChildDeletion
		} else {
			deletions.push(childToDelete)
		}
	}

	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ElementType
	) {
		const key = element.key
		work: if (currentFiber !== null) {
			if (currentFiber.key === key) {
				// key相同，比较type
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (currentFiber.type === element.type) {
						const existing = useFiber(currentFiber, element.props)
						existing.return = returnFiber
						return existing
					}
					// key相同，type不同也删除
					deleteChild(returnFiber, currentFiber)
					break work
				} else {
					if (__DEV__) {
						console.warn('还未实现的react类型', currentFiber)
						break work
					}
				}
			} else {
				// key不同，删除旧节点
				deleteChild(returnFiber, currentFiber)
			}
		}
		// 根据reactElement创建fiber
		const fiber = createFiberFromElement(element)
		fiber.return = returnFiber

		return fiber
	}

	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		content: string | number
	) {
		if (currentFiber !== null) {
			// update
			if (currentFiber.tag === HostText) {
				const existing = useFiber(currentFiber, { content })
				existing.return = returnFiber
				return existing
			}
			deleteChild(returnFiber, currentFiber)
		}
		// 根据reactElement创建fiber
		const fiber = new FiberNode(HostText, { content }, null)
		fiber.return = returnFiber

		return fiber
	}

	function placeSingleChild(fiber: FiberNode) {
		if (shouldTrackEffects && fiber.alternate === null) {
			fiber.flags |= Placement
		}
		return fiber
	}

	return function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: ElementType
	) {
		// return fiberNode
		// 单节点
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(
						reconcileSingleElement(
							returnFiber,
							currentFiber,
							newChild
						) as FiberNode
					)
				default:
					if (__DEV__) {
						console.warn('未实现的reconcile类型', newChild)
					}
					break
			}
		}

		// 多节点 ul ? li*3

		// 文本节点
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFiber, newChild)
			)
		}

		if (currentFiber !== null) {
			// 兜底删除
			deleteChild(returnFiber, currentFiber)
		}

		if (__DEV__) {
			console.warn('未实现的reconcile类型', newChild)
		}
		return null
	}

	function useFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
		const clone = createWorkInProgress(fiber, pendingProps)
		clone.index = 0
		clone.sibling = null
		return clone
	}
}

export const reconcileChildFibers = ChildReconciler(true)
export const mountChildFibers = ChildReconciler(false)
