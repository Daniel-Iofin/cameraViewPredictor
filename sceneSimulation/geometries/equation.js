import Point from './point.js';

export default class Equation {
    constructor(m, b) {
        this.m = m;
        this.b = b;
    }

    generate(vertex1, vertex2) {
        this.m = (vertex2.y-vertex1.y)/(vertex2.x-vertex1.x);
        
        if (this.m==Infinity) {
            this.b = vertex1.x;
        } else {
            this.b = vertex1.y-m*vertex1.x;
        }

        return this;
    }

    intersection(equation) {
        if (JSON.stringify(equation)==JSON.stringify(this)) {
            return new Equation(this.m, this.b);
        } else if (equation.m==this.m) {
            return NaN;
        } else if (equation.m==Infinity) { // when m=Infinity, b is the x-coordinate
            let intersectionX = equation.b;
            let intersectionY = this.m*intersectionX+this.b;
            return Point(intersectionX, intersectionY);
        } else if (this.m==Infinity) { // when m=Infinity, b is the x-coordinate
            let intersectionX = this.b;
            let intersectionY = equation.m*intersectionX+equation.b;
            return Point(intersectionX, intersectionY);
        }

        let intersectionX = (equation.b-this.b)/(this.m-equation.m);
        let intersectionY = this.m*intersectionX+this.b;
        return Point(intersectionX, intersectionY);
    }
}