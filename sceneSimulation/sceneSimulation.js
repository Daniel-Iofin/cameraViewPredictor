import { writeFile } from 'fs';
import Vertex from './geometries/vertex.js';
import Edge from './geometries/edge.js';
import Equation from './geometries/equation.js';
import Camera from './camera/camera.js';

let vertices = [new Vertex(0, 10, 40), new Vertex(1, 20, 50), new Vertex(2, 40, 40), new Vertex(3, 50, 40)];
let edges = [new Edge(0, 0, 2), new Edge(1, 1, 3)];
let camera = new Camera(0, 9, 10, Math.PI*1/4, Math.PI*1/2);
let camera2 = new Camera(0, 4, 5, Math.PI*1/4+0.1, Math.PI*1/2);
let cameratest = new Camera(0, 20, 15, Math.PI*1/4+0.5, Math.PI*1/2);

let nextVertexId = 4;
let nextEdgeId = 2;

class Simulate2D {
    constructor(vertices, edges, cameras) {
        this.vertices = vertices;
        this.edges = edges;
        this.cameras = Array.isArray(cameras) ? cameras : [cameras];
        this.content = [];
        this.viewingLines = new Map();
    }

    mod(n, m) {
        return ((n % m) + m) % m;
    }

    getVertexAngles(vertices, camera) {
        vertices.forEach(vertex => {
            let deltaX = vertex.x - camera.x;
            let deltaY = vertex.y - camera.y;

            let angleFromHorizontal = Math.atan(deltaY/deltaX);
            let angleFromCameraCenter = camera.direction-Math.abs(angleFromHorizontal);

            vertex.setCameraAngle(angleFromCameraCenter)
        });
        return vertices;
    }

    orderEdges(vertices, edges) {
        edges.sort((a, b) => a.getLeftVertexAngle(vertices) - b.getLeftVertexAngle(vertices));
        return edges;
    }

    findFrontEdge(camera, angle, vertices, edges) {
        const cameraX = camera.x;
        const cameraY = camera.y;
        const m = 1/Math.atan(angle);
        let b = cameraY-m*cameraX;
        if (m==Infinity) {
            b = camera.x;
        }
        const cameraEquation = new Equation(m, b)

        const edgeProjections = edges.map(edge => {
            const vertex1 = vertices.find(v => v.id === edge.vertex1Id);
            const vertex2 = vertices.find(v => v.id === edge.vertex2Id); 

            const edgeEquation = new Equation().generate(vertex1, vertex2);
            const intersection = cameraEquation.intersection(edgeEquation);
            const distance = Math.pow(Math.pow((intersection.x-cameraX), 2)+Math.pow((intersection.y-cameraY), 2), 0.5)
            return {
                id: edge.id,
                projection: distance
            };
        });

        if (edgeProjections.length === 0) {
            return null;
        }

        const frontEdge = edgeProjections.reduce((front, edge) => {
            return edge.projection < front.projection ? edge : front;
        });

        return frontEdge;
    }

    getView(edges, vertices, camera) {
        let view = [];

        vertices.forEach((vertex) => {
            let cameraAngle = vertex.cameraAngle;
            let activeEdges = [];
            
            edges.forEach((edge) => {
                let vertex1 = vertices.find(v => v.id === edge.vertex1Id);
                let vertex2 = vertices.find(v => v.id === edge.vertex2Id); 

                if (vertex1.cameraAngle <= cameraAngle && vertex2.cameraAngle >= cameraAngle) {
                    activeEdges.push(edge);
                }
            });

            let trueAngle = camera.direction + cameraAngle;
            
            let frontEdge = this.findFrontEdge(camera, trueAngle, vertices, activeEdges);
            
            view.push([cameraAngle, frontEdge ? frontEdge.id : null]);
        });

        return view;
    }

    getViewEdges(vertices, edges, camera) {
        vertices = vertices.sort((a, b) => a.cameraAngle - b.cameraAngle);
        edges = this.orderEdges(vertices, edges);
        let view = this.getView(edges, vertices, camera)

        let colorView = []
        view.forEach((element) => {
            let edgeId = element[1];
            let adjustedView = (element[0]+camera.angle/2)/camera.angle;

            if (adjustedView<0) {adjustedView=0}
            if (adjustedView>1) {adjustedView=1}

            colorView.push([adjustedView, edges.find(e => e.id === edgeId).color])
        })
        
        return colorView
    }

    getViewText(view) {
        let result = [];
        if (view.length === 0) return "\n";
        
        if (view[0][0] > 0) {
            result.push([0, view[0][0], '0,0,0']);
        }
        
        for (let i = 0; i < view.length - 1; i++) {
            let endIndex = i + 1;
            while (endIndex < view.length - 1 && view[endIndex][1] === view[endIndex + 1][1]) {
                endIndex++;
            }
            
            result.push([view[i][0], view[endIndex][0], view[endIndex][1]]);
            i = endIndex - 1;
        }
        
        if (view[view.length - 1][0] < 1) {
            result.push([view[view.length - 1][0], 1, '0,0,0']);
        }
        return result;
    }

    getCameraContent(camera) {
        let {cameraEquationLeft, cameraEquationRight} = camera.equations();
        let equationTop = new Equation(0, 64);
        let equationBottom = new Equation(0, 0);
        let equationLeft = new Equation(Infinity, 0);
        let equationRight = new Equation(Infinity, 64);

        function intersectionWithBound(quadrant, cameraEquation, cameraEquation_equationTop_intersection, cameraEquation_equationBottom_intersection, cameraEquation_equationLeft_intersection, cameraEquation_equationRight_intersection) {
            const isLeftIntersectionValid = !Number.isNaN(cameraEquation_equationLeft_intersection);
            const isRightIntersectionValid = !Number.isNaN(cameraEquation_equationRight_intersection);
            const isTopIntersectionValid = !Number.isNaN(cameraEquation_equationTop_intersection);
            const isBottomIntersectionValid = !Number.isNaN(cameraEquation_equationBottom_intersection);

            let cameraSlope = cameraEquation.m
            if (cameraSlope === Infinity || cameraSlope === -Infinity) {
                if (quadrant==1 || quadrant==2) {
                    return cameraEquation_equationTop_intersection; 
                }
                return cameraEquation_equationBottom_intersection;
            }

            if (cameraSlope === 0) {
                if (quadrant==1) {
                    return cameraEquation_equationRight_intersection;
                }
                return cameraEquation_equationLeft_intersection;
            }

            if (quadrant === 1) {
                if (isLeftIntersectionValid && isTopIntersectionValid) {
                    return (cameraEquation_equationLeft_intersection.y <= 64) ? cameraEquation_equationLeft_intersection : cameraEquation_equationTop_intersection;
                }
            } else if (quadrant === 2) {
                if (isLeftIntersectionValid && isBottomIntersectionValid) {
                    return (cameraEquation_equationLeft_intersection.y >=0) ? cameraEquation_equationLeft_intersection : cameraEquation_equationBottom_intersection;
                }
            } else if (quadrant === 3) {
                if (isRightIntersectionValid && isBottomIntersectionValid) {
                    return (cameraEquation_equationRight_intersection.y >= 0) ? cameraEquation_equationRight_intersection : cameraEquation_equationBottom_intersection;
                }
            } else if (quadrant === 4) {
                if (isRightIntersectionValid && isTopIntersectionValid) {
                    return (cameraEquation_equationRight_intersection.y <= 64) ? cameraEquation_equationRight_intersection : cameraEquation_equationTop_intersection;
                }
            }

            if (Number.isNaN(cameraEquation_equationLeft_intersection) && Number.isNaN(cameraEquation_equationRight_intersection)) {
                if (cameraEquation.m === Infinity || cameraEquation.m > 0) {
                    return cameraEquation_equationTop_intersection;
                }
                return cameraEquation_equationBottom_intersection;
            }

            if (isBottomIntersectionValid && isTopIntersectionValid) {
                return (cameraEquation_equationBottom_intersection.y >= 0) ? cameraEquation_equationBottom_intersection : cameraEquation_equationTop_intersection;
            }

            return null;
        }

        function getQuadrant(cameraSlope) {
            let normalizedSlope = cameraSlope % (2 * Math.PI);
            if (normalizedSlope < 0) {
                normalizedSlope += 2 * Math.PI;
            }

            if (normalizedSlope >= 0 && normalizedSlope < Math.PI / 2) {
                return 4;
            } else if (normalizedSlope >= Math.PI / 2 && normalizedSlope < Math.PI) {
                return 1;
            } else if (normalizedSlope >= Math.PI && normalizedSlope < 3 * Math.PI / 2) {
                return 2;
            } else if (normalizedSlope >= 3 * Math.PI / 2 && normalizedSlope < 2 * Math.PI) {
                return 3;
            } else {
                return 'Undefined';
            }
        }

        let cameraAngleLeft = camera.direction+camera.angle/2;
        let cameraAngleRight = camera.direction-camera.angle/2;

        let cameraEquationLeft_equationTop_intersection = cameraEquationLeft.intersection(equationTop);
        let cameraEquationLeft_equationBottom_intersection = cameraEquationLeft.intersection(equationBottom);
        let cameraEquationLeft_equationLeft_intersection = cameraEquationLeft.intersection(equationLeft);
        let cameraEquationLeft_equationRight_intersection = cameraEquationLeft.intersection(equationRight);

        let intersectionCameraLeft = intersectionWithBound(getQuadrant(cameraAngleLeft), cameraEquationLeft, cameraEquationLeft_equationTop_intersection, cameraEquationLeft_equationBottom_intersection, cameraEquationLeft_equationLeft_intersection, cameraEquationLeft_equationRight_intersection)

        let cameraEquationRight_equationTop_intersection = cameraEquationRight.intersection(equationTop);
        let cameraEquationRight_equationBottom_intersection = cameraEquationRight.intersection(equationBottom);
        let cameraEquationRight_equationLeft_intersection = cameraEquationRight.intersection(equationLeft);
        let cameraEquationRight_equationRight_intersection = cameraEquationRight.intersection(equationRight);

        let intersectionCameraRight = intersectionWithBound(getQuadrant(cameraAngleRight), cameraEquationRight, cameraEquationRight_equationTop_intersection, cameraEquationRight_equationBottom_intersection, cameraEquationRight_equationLeft_intersection, cameraEquationRight_equationRight_intersection)

        let cameraContent = [[[camera.x, camera.y], [intersectionCameraLeft.x, intersectionCameraLeft.y], '255,0,0'], [[camera.x, camera.y], [intersectionCameraRight.x, intersectionCameraRight.y], '255,0,0']]
        this.content.push(cameraContent);
    }

    predict() {
        // Store edge arrays
        const edgeArrays = []
        this.edges.forEach((edge) => {
            try {
                let x1Vertex = this.vertices.find(vertex => vertex.id == edge.vertex1Id)
                let y1Vertex = this.vertices.find(vertex => vertex.id == edge.vertex1Id);
                let x2Vertex = this.vertices.find(vertex => vertex.id == edge.vertex2Id);
                let y2Vertex = this.vertices.find(vertex => vertex.id == edge.vertex2Id);
                let edgeArray = [[x1Vertex.x, y1Vertex.y], [x2Vertex.x, y2Vertex.y], edge.color]
                edgeArrays.push(edgeArray)
            } catch {}
        })
        this.content.push(edgeArrays);

        // Process each camera
        let views = this.cameras.map(camera => {
            this.vertices = this.getVertexAngles(this.vertices, camera);
            const view = this.getViewEdges(this.vertices, this.edges, camera);
            this.getCameraContent(camera);
            const viewText = this.getViewText(view);
            
            // Store viewing lines for this camera
            let viewingLines = new Map();
            viewText.forEach(segment => {
                if (segment[2]!='0,0,0') {
                    let BaseAngle = camera.direction+camera.angle/2
                    let segmentAngles = [BaseAngle-segment[0]*camera.angle, BaseAngle-segment[1]*camera.angle]
                    let segmentSlopes = segmentAngles.map(angle => Math.tan(angle))
                    let boundaries = segmentSlopes.map(slope => {
                        return new Equation(slope, camera.y-slope*camera.x);
                    });
                    viewingLines.set(segment[2], boundaries);
                }
            });
            this.viewingLines.set(camera, viewingLines);
            
            return viewText;
        });

        this.content.push(views);
        return this.content;
    }

    getPredictedGeometry() {
        let predictedVertices = [];
        let predictedEdges = [];
        
        // Only process first two cameras for predictions
        if (this.cameras.length < 2) return {predictedVertices, predictedEdges};
        
        const camera1Lines = this.viewingLines.get(this.cameras[0]);
        const camera2Lines = this.viewingLines.get(this.cameras[1]);

        for (let [key, value] of camera1Lines) {
            if (camera2Lines.has(key)) {
                let camera1Boundaries = value;
                let camera2Boundaries = camera2Lines.get(key);

                let leftIntersect = camera1Boundaries[0].intersection(camera2Boundaries[0]);
                let rightIntersect = camera1Boundaries[1].intersection(camera2Boundaries[1]);
                
                predictedVertices.push(new Vertex(nextVertexId, leftIntersect.x, leftIntersect.y));
                predictedVertices.push(new Vertex(nextVertexId+1, rightIntersect.x, rightIntersect.y));
                predictedEdges.push(new Edge(nextEdgeId, nextVertexId, nextVertexId+1, key));
                nextVertexId+=2;
                nextEdgeId++;
            }
        }

        return {predictedVertices, predictedEdges};
    }
}

// Initialize simulation
const simulation = new Simulate2D(vertices, edges, [camera, camera2, cameratest]);

// Run simulation and get results
const content = simulation.predict();
console.log(JSON.stringify(content));

// Write results to file
writeFile('scene.txt', JSON.stringify(content), (err) => {
    if (err) {
        console.error('An error occurred while writing to the file:', err);
    } else {
        console.log('File has been written successfully.');
    }
});

// Get predicted geometry
const {predictedVertices, predictedEdges} = simulation.getPredictedGeometry();
console.log(predictedVertices, predictedEdges);