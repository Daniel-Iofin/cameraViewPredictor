import math
from geometries.equation import Equation  # Assuming you have this file

class Camera:
    def __init__(self, camera_id, x, y, direction, view_angle):
        self.id = camera_id
        self.x = x
        self.y = y
        self.direction = direction
        self.angle = view_angle

    def equations(self):
        epsilon = 1e-10  # Small tolerance value

        # Calculate the left and right directions based on the view angle
        direction_left = self.direction + self.angle / 2
        direction_right = self.direction - self.angle / 2

        # Calculate the slopes for the left and right boundary lines
        slope_left = self._calculate_slope(direction_left, epsilon)
        slope_right = self._calculate_slope(direction_right, epsilon)

        # Calculate the intercepts for the left and right boundary lines
        intercept_left = self._calculate_intercept(slope_left, self.x, self.y, epsilon)
        intercept_right = self._calculate_intercept(slope_right, self.x, self.y, epsilon)

        # Create and return the left and right camera equations
        camera_equation_left = Equation(slope_left, intercept_left)
        camera_equation_right = Equation(slope_right, intercept_right)

        return {
            "cameraEquationLeft": camera_equation_left,
            "cameraEquationRight": camera_equation_right
        }

    def _calculate_slope(self, direction, epsilon):
        """Calculate the slope of the line based on direction."""
        if abs(direction % math.pi - math.pi / 2) < epsilon:
            return float('inf')  # Vertical line, infinite slope
        else:
            return math.tan(direction)

    def _calculate_intercept(self, slope, x, y, epsilon):
        """Calculate the y-intercept of the line based on slope and point (x, y)."""
        if slope == float('inf'):  # Vertical line
            return x  # For vertical line, intercept is the x-coordinate
        else:
            if x == 0:
                return y
            else:
                return y - slope * x
