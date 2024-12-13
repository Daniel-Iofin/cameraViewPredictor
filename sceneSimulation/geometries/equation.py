class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

class Equation:
    def __init__(self, m=None, b=None):
        self.m = m  # slope (m)
        self.b = b  # y-intercept (b)

    def generate(self, vertex1, vertex2):
        """Generates the equation of a line given two points (vertex1, vertex2)."""
        if vertex2.x == vertex1.x:
            self.m = float('inf')  # vertical line, slope is infinite
            self.b = vertex1.x    # x-intercept is the x-coordinate
        else:
            self.m = (vertex2.y - vertex1.y) / (vertex2.x - vertex1.x)  # Slope (m)
            self.b = vertex1.y - self.m * vertex1.x  # y-intercept (b)

        return self

    def intersection(self, equation):
        """Finds the intersection point of two lines."""
        # Check if both equations are identical (same slope and intercept)
        if self.m == equation.m and self.b == equation.b:
            return Equation(self.m, self.b)

        # If the slopes are equal, the lines are parallel, no intersection
        if self.m == equation.m:
            return None  # Parallel lines, no intersection

        # Case where one line is vertical (m = infinity)
        if equation.m == float('inf'):  # equation line is vertical
            intersection_x = equation.b
            intersection_y = self.m * intersection_x + self.b
            return Point(intersection_x, intersection_y)
        
        if self.m == float('inf'):  # current line is vertical
            intersection_x = self.b
            intersection_y = equation.m * intersection_x + equation.b
            return Point(intersection_x, intersection_y)

        # General case for finding the intersection
        intersection_x = (equation.b - self.b) / (self.m - equation.m)
        intersection_y = self.m * intersection_x + self.b
        return Point(intersection_x, intersection_y)
