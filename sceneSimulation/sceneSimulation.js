function getVertexAngles(vertices, camera) {
    const vertexAngles = [];
    vertices.forEach(vertex => {
        let vertexId = vertex.id;
        let deltaX = vertex.x - camera.x;
        let deltaY = vertexY.y - camera.y;

        let angleFromHorizontal = Math.atan(deltaX/deltaY); // Calculate complementary angle --> angle for camera facing forward
        let angleFromCameraCenter = angleFromHorizontal - camera.angle;

        vertexAngles.push([vertexId, angleFromCameraCenter])
    });
    return vertexAngles;
}

function orderLines(vertexAngles, lines) {
    let orderedLines = [];

    lines.forEach(line => {
        let vertex1Id = line.vertex1Id;
        let vertex2Id = line.vertex2Id;

        if (vertexAngles.get(vertex1Id)<vertexAngles.get(vertex2Id)) {
            orderedLines.push(line);
        } else {
            line.vertex1Id = vertex2Id;
            line.vertex2Id = vertex1Id;
            orderedLines.push(line);
        }
    })
    
    return orderedLines;
}

function getViewLines(cameraSweep, vertices, vertexAngles, lines) {
    // Have to order the lines
    let vertexAnglesSorted = new Map(vertexAngles.sort((a, b) => a[1] - b[1]));
    // get active lines at each point --> which one is closest
    const orderedLines = orderLines(vertexAnglesSorted, lines);
    console.log(orderedLines);
    return -1;
}

class simulate2D {
    constructor(vertices, lines) {
        this.vertices = vertices; // {id, x, y}
        this.lines = lines; // {id: {vertex1Id:_, vertex2Id:_}}
    }

    predict(camera) { // {x, y, angle, sweep}  angle is rotation of camera, sweep is how wide camera sees
        const vertexAngles = getVertexAngles(this.vertices);
        const viewPartition = getViewLines(camera.sweep, this.vertices, vertexAngles, this.lines);  // Which line is seen for which angle
    }
}
getViewLines(0, 0, [[5, 4], [7, 10], [9, 5]], [{"vertex1Id": 7, "vertex2Id": 9},{"vertex1Id": 5, "vertex2Id": 9}])