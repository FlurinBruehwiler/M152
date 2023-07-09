import {Reference} from "@motion-canvas/core";
import {Rect, Txt} from "@motion-canvas/2d";

type Node = {
    x: number,
    y: number,
    isStart: boolean,
    isEnd: boolean
    isBlocked: boolean,
    gCost?: number,
    hCost?: number
    fCost?: number,
    parent?: Node,
    ref: Reference<Rect>,
    gRef: Reference<Txt>,
    hRef: Reference<Txt>,
    fRef: Reference<Txt>,
    isPath: boolean
}

type Grid = {
    width: number,
    height: number,
    nodes: Node[],
    openNodes: Node[],
    closedNodes: Node[]
}

export { Node, Grid }
