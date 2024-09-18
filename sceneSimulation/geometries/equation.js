import Point from '/vertex.js';

export default class Equation {
    constructor(m, b) {
        this.m = m;
        this.b = b;
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