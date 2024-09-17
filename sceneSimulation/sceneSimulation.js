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

function getViewLines(cameraSweep, vertices, vertexAngles, lines) {
    let vertexAnglesSorted = vertexAngles.sort((a, b) => a[1] - b[1]);
    console.log(vertexAnglesSorted)
    // get active lines at each point --> which one is closest
    return -1;
}

class simulate2D {
    constructor(vertices, lines) {
        this.vertices = vertices; // {id, x, y}
        this.lines = lines; // {id, line1Id, line2Id}
    }

    predict(camera) { // {x, y, angle, sweep}  angle is rotation of camera, sweep is how wide camera sees
        const vertexAngles = getVertexAngles(this.vertices);
        const viewPartition = getViewLines(camera.sweep, this.vertices, vertexAngles, this.lines);  // Which line is seen for which angle
    }
}
