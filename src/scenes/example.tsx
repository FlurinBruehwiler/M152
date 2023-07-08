import {Rect, makeScene2D, Txt} from '@motion-canvas/2d';
import {createRef, Reference} from '@motion-canvas/core';

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

function MarkParentAsPath(node: Node) {
    if(node.parent){
        node.parent.isPath = true;
        MarkParentAsPath(node.parent)
    }
}

export default makeScene2D(function* (view) {
    console.time('initialization')
    view.fill("#3d3d3d")

    const gridTemplate = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
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
            isPath: false
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
                    y={-30}
                    x={-30}
                ></Txt>
                <Txt
                    ref={node.hRef}
                    fill={"#ffffff"}
                    fontSize={20}
                    y={-30}
                    x={30}
                ></Txt>
                <Txt
                    ref={node.fRef}
                    fill={"#ffffff"}
                    fontSize={35}
                    y={10}
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

        if (current == end){
            MarkParentAsPath(current)
            UpdateGrid(grid, current)

            break;
        }

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

        UpdateGrid(grid, current)

        console.timeEnd('execution')
        yield;
    }
});

function UpdateGrid(grid: Grid, current: Node) {
    grid.nodes.forEach(x => {
        x.ref().fill(GetColor(x, grid, current))

        if(x.isStart){
            x.fRef().text("A")
            return
        }

        if(x.isEnd){
            x.fRef().text("B")
            return
        }

        if (x.gCost) {
            x.gRef().text(x.gCost?.toString() ?? "TEST")
        } else {
            x.gRef().text("")
        }
        if (x.hCost) {
            x.hRef().text(x.hCost?.toString() ?? "test")
        } else {
            x.hRef().text("")
        }
        if (x.fCost) {
            x.fRef().text(x.fCost?.toString() ?? "test")
        } else {
            x.fRef().text("")
        }
    })
}

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
    const diagonalDistance = (Math.max(xDistance, yDistance) - straightDistance);

    return straightDistance * 10 + diagonalDistance * 14;
}

function GetColor(node: Node, grid: Grid, current: Node): string {
    
    if (node === current || node.isPath)
        return "#1dcd5b"

    if (node.isBlocked)
        return "#000000"

    if (node.isStart)
        return "#f16470"

    if (node.isEnd)
        return "#f16470"

    if (grid.openNodes.includes(node))
        return "#1c2f3d"

    if (grid.closedNodes.includes(node))
        return "#22aaff"

    return "#242424"
}
