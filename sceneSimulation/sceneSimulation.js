function getVertexAngles(vertices) {
    const vertexAngles = [];
    this.vertices.forEach(vertex => {
        let vertexId = vertex.id;
        let deltaX = vertex.x - camera.x;
        let deltaY = vertexY.x - camera.y;

        let angleFromHorizontal = Math.atan(deltaX/deltaY); // Calculate complementary angle --> angle for camera facing forward
        let angleFromCameraCenter = angleFromHorizontal - camera.angle;
        vertexAngles.push({vertexId, angleFromCameraCenter})
    });
    return vertexAngles;
}

class simulate2D {
    constructor(vertices, lines) {
        this.vertices = vertices;
        this.lines = lines;
    }

    predict(camera) {
        const vertexAngles = getVertexAngles(vertices);
    }


}