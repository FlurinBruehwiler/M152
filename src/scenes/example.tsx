import {Circle, Rect, Layout, makeScene2D, View2D, getPointAtDistance, Txt} from '@motion-canvas/2d';
import {all, createRef, makeRef, makeRefs, range, Reference, useLogger, waitFor} from '@motion-canvas/core';

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
    ref:  Reference<Rect>,
    gRef: Reference<Txt>,
    hRef: Reference<Txt>,
    fRef: Reference<Txt>,
}

type Grid = {
    width: number,
    height: number,
    nodes: Node[],
    openNodes: Node[],
    closedNodes: Node[]
}

export default makeScene2D(function* (view) {

    console.time('initialization')
    const logger = useLogger();

    const gridTemplate = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ]

    const nodes = gridTemplate.flatMap((row, y) => row.map<Node>((num, x) => {
        return {
            isBlocked: num == 1,
            isStart: num == 2,
            isEnd: num == 3,
            x: x,
            y: y,
            ref: createRef<Rect>(),
            gRef: createRef<Txt>(),
            hRef: createRef<Txt>(),
            fRef: createRef<Txt>(),
        };
    }))

    const grid: Grid = {
        width: gridTemplate[0].length,
        height: gridTemplate.length,
        nodes: nodes,
        openNodes: [],
        closedNodes: []
    }

    let start = nodes.find(x => x.isStart);
    let end = nodes.find(x => x.isEnd);

    start.gCost = 0;
    start.hCost = GetDistance(start, end);
    start.fCost = start.gCost + start.hCost;

    grid.openNodes = [start];

    let current = start;
    let counter = 0;

    const gap = 10;
    const width = 100;

    const offsetX = ((grid.width - 1) * width + (grid.width - 1) * gap) / 2
    const offsetY = ((grid.height - 1) * width + (grid.height - 1) * gap) / 2

    const test = grid.nodes.map(node => {
        const x = node.x * (width + gap) - offsetX;
        const y = node.y * (width + gap) - offsetY;

        return (
            <Rect
                ref={node.ref}
                width={width}
                height={width}
                x={x}
                y={y}
                fill={"#ffffff"}>
                <Txt
                    ref={node.gRef}
                    fill={"#ffffff"}
                    fontSize={20}
                    y={-33}
                ></Txt>
                <Txt
                    ref={node.fRef}
                    fill={"#ffffff"}
                    fontSize={20}
                    y={0}

                ></Txt>
                <Txt
                    ref={node.hRef}
                    fill={"#ffffff"}
                    fontSize={20}
                    y={33}

                ></Txt>
            </Rect>
        );
    });

    view.add(test);

    console.timeEnd('initialization')

    while (counter < 30) {
        console.time('execution')
        counter++;
        const dup = [...grid.openNodes]
        dup.sort((x, y) => x.fCost > y.fCost ? 1 : -1);
        current = dup[0];

        grid.openNodes.splice(grid.openNodes.indexOf(current), 1)
        grid.closedNodes.push(current)

        if (current == end)
            break;

        const neighbours = GetNeighbours(current, nodes);


        neighbours.forEach(neighbour => {
            if (neighbour.isBlocked || grid.closedNodes.includes(neighbour))
                return

            const newGCost = current.gCost + GetDistance(current, neighbour);

            if (!grid.openNodes.includes(neighbour) || newGCost < neighbour.gCost) {
                neighbour.gCost = newGCost;
                neighbour.hCost = GetDistance(neighbour, end);
                neighbour.fCost = neighbour.gCost + neighbour.hCost;
                neighbour.parent = current;
                if (!grid.openNodes.includes(neighbour)) {
                    grid.openNodes.push(neighbour)
                }
            }
        });

        grid.nodes.forEach(x => {
            x.ref().fill(GetColor(x, grid, current))
            x.gRef().text("g: " + x.gCost?.toString()?.slice(0, 4) ?? "")
            x.hRef().text("h: " + x.hCost?.toString()?.slice(0, 4) ?? "")
            x.fRef().text("f: " + x.fCost?.toString()?.slice(0, 4) ?? "")
        })
        console.timeEnd('execution')
        yield;
    }
});

function GetNeighbours(node: Node, nodes: Node[]): Node[] {
    const neighbours = [
        GetNodeAtPosition(node.x, node.y - 1),
        GetNodeAtPosition(node.x, node.y + 1),

        GetNodeAtPosition(node.x - 1, node.y - 1),
        GetNodeAtPosition(node.x - 1, node.y),
        GetNodeAtPosition(node.x - 1, node.y + 1),

        GetNodeAtPosition(node.x + 1, node.y - 1),
        GetNodeAtPosition(node.x + 1, node.y),
        GetNodeAtPosition(node.x + 1, node.y + 1),
    ];

    function GetNodeAtPosition(x: number, y: number): Node | undefined {
        return nodes.find(node => node.x == x && node.y == y);
    }

    return neighbours.filter(x => x);
}

function GetDistance(start: Node, end: Node): number {
    const xDistance = Math.abs(start.x - end.x)
    const yDistance = Math.abs(start.y - end.y)

    const straightDistance = Math.abs(xDistance - yDistance);
    const diagonalDistance = (Math.max(xDistance, yDistance) - straightDistance) * 1.4;

    return straightDistance + diagonalDistance;
}

function GetColor(node: Node, grid: Grid, current: Node): string {
    if (node === current)
        return "#000000"

    if (node.isBlocked)
        return "#d0888e"

    if (node.isStart)
        return "#412352"

    if (node.isEnd)
        return "#ffaa22"

    if (grid.openNodes.includes(node))
        return "#22aaff"

    if (grid.closedNodes.includes(node))
        return "#aa22ff"

    return "#ffffff"

}
