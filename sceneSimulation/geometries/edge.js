export default class Edge {
    constructor(id, vertex1Id, vertex2Id) {
        this.id = id;
        this.vertex1Id = vertex1Id;
        this.vertex2Id = vertex2Id;

        const r = Math.floor(0);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);

        this.color = `${r},${g},${b}`;
    }

    getLeftVertexAngle(vertices) {
        let vertex1 = vertices.find(vertex => vertex.id == this.vertex1Id);
        let vertex2 = vertices.find(vertex => vertex.id == this.vertex2Id);

        return Math.min(vertex1.cameraAngle, vertex2.cameraAngle);
    }
}