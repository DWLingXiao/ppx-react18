import {
	appendChildToCantainer,
	commitUpdate,
	Container,
	removeChild
} from 'hostConfig'
import { FiberNode, FiberRootNode } from './fiber'
import {
	ChildDeletion,
	MutationMask,
	NoFlags,
	Placement,
	Update
} from './fiberFlags'
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags'

let nextEffect: FiberNode | null = null
export const commitMutationEffects = (finishedWork: FiberNode) => {
	nextEffect = finishedWork

	while (nextEffect !== null) {
		const child: FiberNode | null = nextEffect.child

		if ((nextEffect.subtreeFlag & MutationMask) !== NoFlags && child !== null) {
			nextEffect = child
		} else {
			up: while (nextEffect !== null) {
				commitMutationEffectsOnFiber(nextEffect)
				const sibling: FiberNode | null = nextEffect.sibling

				if (sibling !== null) {
					nextEffect = sibling
					break up
				}
				nextEffect = nextEffect.return
			}
		}
	}
}

const commitMutationEffectsOnFiber = (finishedWork: FiberNode) => {
	const flags = finishedWork.flags
	if ((flags & Placement) !== NoFlags) {
		commitPlacement(finishedWork)
		finishedWork.flags &= ~Placement
	}
	if ((flags & Update) !== NoFlags) {
		commitUpdate(finishedWork)
		finishedWork.flags &= ~Update
	}
	if ((flags & ChildDeletion) !== NoFlags) {
		const deletions = finishedWork.deletions
		if (deletions !== null) {
			deletions.forEach((childToDelete) => {
				commitDeletion(childToDelete)
			})
		}
		commitUpdate(finishedWork)
		finishedWork.flags &= ~ChildDeletion
	}
}

function commitDeletion(childToDelete: FiberNode) {
	let rootHostNode: FiberNode | null = null
	// 递归子树
	commitNestedComponent(childToDelete, (unmountToFiber) => {
		switch (unmountToFiber.tag) {
			case HostComponent:
				if (rootHostNode === null) {
					rootHostNode = unmountToFiber
				}
				// 解绑ref
				return
			case HostText:
				if (rootHostNode === null) {
					rootHostNode = unmountToFiber
				}
				return
			case FunctionComponent:
				// useEffect处理
				return
			default:
				if (__DEV__) {
					console.warn('未移除的node类型', unmountToFiber)
				}
				return
		}
	})
	// 移除rootHostNode
	if (rootHostNode !== null) {
		const hostParent = getHostParent(childToDelete)
		if (hostParent !== null) {
			removeChild((rootHostNode as FiberNode).stateNode, hostParent)
		}
	}
	childToDelete.return = null
	childToDelete.child = null
}

function commitNestedComponent(
	root: FiberNode,
	onCommitUnmount: (fiber: FiberNode) => void
) {
	let node = root
	// eslint-disable-next-line no-constant-condition
	while (true) {
		onCommitUnmount(node)
		if (node.child !== null) {
			node.child.return = node
			node = node.child
			continue
		}
		if (node === root) {
			return
		}
		while (node.sibling === null) {
			if (node.return === null || node.return === root) {
				return
			}
			node = node.return
		}
		node.sibling.return = node.return
		node = node.sibling
	}
}

const commitPlacement = (finishedWork: FiberNode) => {
	if (__DEV__) {
		console.warn('执行Placement操作', finishedWork)
	}
	const hostParent = getHostParent(finishedWork)
	if (hostParent !== null) {
		appendPlacementNodeIntoContainer(finishedWork, hostParent)
	}
}

function getHostParent(fiber: FiberNode): Container | null {
	let parent = fiber.return

	while (parent) {
		const parentTag = parent.tag
		if (parentTag === HostComponent) {
			return parent.stateNode as Container
		}
		if (parentTag === HostRoot) {
			return (parent.stateNode as FiberRootNode).container
		}
		parent = parent.return
	}
	if (__DEV__) {
		console.warn('未找到HostParent', fiber)
	}
	return null
}

function appendPlacementNodeIntoContainer(
	finishedWork: FiberNode,
	hostParent: Container
) {
	if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
		appendChildToCantainer(hostParent, finishedWork.stateNode)
		return
	}
	const child = finishedWork.child
	if (child !== null) {
		appendPlacementNodeIntoContainer(child, hostParent)
		let sibling = child.sibling

		while (sibling !== null) {
			appendPlacementNodeIntoContainer(sibling, hostParent)
			sibling = sibling.sibling
		}
	}
}
